/**
 * API Route: AI Chat (Gemini)
 * Responde en el chat contextual del asistente de la tienda.
 * Devuelve reply + suggestedCategory/suggestedSearch para que el frontend muestre productos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { getTenantConfig } from '@/lib/tenant'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const MAX_MESSAGES = 20

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRespondBody {
  messages?: Message[]
}

interface GeminiRespondPayload {
  reply: string
  suggestedCategory?: string | null
  suggestedSearch?: string | null
}

function buildSystemPrompt(tenantName: string, tenantSlug: string): string {
  const agentName =
    tenantSlug === 'pintemas' ? 'Luis de Pintemas' : `asistente de ${tenantName}`
  return `Eres el ${agentName} de una tienda de pinturería. Ayudás al cliente a elegir productos según lo que quiera pintar (interior, exterior, madera, metal, paredes, techos, muebles, automotor, etc.).

Respondé SIEMPRE únicamente con un objeto JSON válido, sin markdown ni texto extra, con esta forma exacta:
{"reply": "tu respuesta amigable en una o dos oraciones", "suggestedCategory": "slug-categoria o null", "suggestedSearch": "término de búsqueda o null"}

Reglas:
- reply: mensaje breve y amigable para el usuario. Si el usuario dijo qué quiere pintar, sugerí que le mostramos productos y usá suggestedCategory o suggestedSearch.
- suggestedCategory: si podés mapear a una categoría de productos (ej: interior, exterior, madera, metal, paredes), usá un slug corto en minúsculas; si no, null.
- suggestedSearch: si conviene buscar por texto (ej: "esmalte sintético", "látex"), poné el término; si no, null.
- Si el mensaje no es sobre pintar algo, respondé con reply amigable y suggestedCategory/suggestedSearch en null.`
}

function parseGeminiJson(text: string): GeminiRespondPayload | null {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as GeminiRespondPayload
    return {
      reply:
        typeof parsed.reply === 'string'
          ? parsed.reply
          : 'Te puedo ayudar a elegir productos de pinturería.',
      suggestedCategory:
        parsed.suggestedCategory === undefined ||
        parsed.suggestedCategory === null
          ? null
          : String(parsed.suggestedCategory).trim() || null,
      suggestedSearch:
        parsed.suggestedSearch === undefined ||
        parsed.suggestedSearch === null
          ? null
          : String(parsed.suggestedSearch).trim() || null,
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.aiChat, async () => {
    try {
      if (!GEMINI_API_KEY) {
        console.error('[AI Chat] GEMINI_API_KEY no configurada')
        return NextResponse.json(
          {
            success: false,
            error: 'Servicio de chat no disponible. Contacte al administrador.',
          },
          { status: 500 }
        )
      }

      const tenant = await getTenantConfig()
      const tenantName = tenant.name ?? 'Tienda'
      const tenantSlug = tenant.slug ?? ''

      let body: ChatRespondBody
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          { success: false, error: 'Formato de solicitud no válido' },
          { status: 400 }
        )
      }

      const rawMessages = Array.isArray(body.messages) ? body.messages : []
      const messages: Message[] = rawMessages
        .slice(-MAX_MESSAGES)
        .filter(
          (m: unknown) =>
            m &&
            typeof m === 'object' &&
            'role' in m &&
            'content' in m &&
            (m as Message).role in { user: 1, assistant: 1 } &&
            typeof (m as Message).content === 'string'
        ) as Message[]

      const systemPrompt = buildSystemPrompt(tenantName, tenantSlug)

      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      }))

      const payload = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: contents.length
          ? contents
          : [{ role: 'user' as const, parts: [{ text: 'Hola' }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }

      const geminiResponse = await fetch(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => 'Unknown error')
        console.error('[AI Chat] Error de Gemini API:', {
          status: geminiResponse.status,
          error: errorText,
        })
        return NextResponse.json(
          {
            success: false,
            error: 'No pude procesar tu mensaje. Intentá de nuevo.',
          },
          { status: 500 }
        )
      }

      const geminiData = await geminiResponse.json()
      const rawText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

      const result = parseGeminiJson(rawText)
      if (!result) {
        return NextResponse.json(
          {
            success: true,
            reply:
              'Te puedo ayudar a elegir productos. Decime qué querés pintar (interior, exterior, madera, etc.).',
            suggestedCategory: null,
            suggestedSearch: null,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          reply: result.reply,
          suggestedCategory: result.suggestedCategory ?? null,
          suggestedSearch: result.suggestedSearch ?? null,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('[AI Chat] Error interno:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error interno. Intentá de nuevo o escribinos por WhatsApp.',
        },
        { status: 500 }
      )
    }
  })
}
