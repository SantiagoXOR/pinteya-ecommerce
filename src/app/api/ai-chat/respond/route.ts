/**
 * API Route: AI Chat (Gemini)
 * Responde en el chat contextual del asistente de la tienda.
 * Devuelve reply + suggestedCategory/suggestedSearch para que el frontend muestre productos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { getTenantConfig } from '@/lib/tenant'
import { AI_CHAT_KNOWLEDGE_BASE } from '@/lib/ai-chat/knowledge-base'
import { getProductCatalogSummaryForPrompt } from '@/lib/ai-chat/get-product-catalog-summary'
import {
  getFallbackSuggestedSearch,
  normalizeSuggestedSearch,
} from '@/lib/ai-chat/search-intent-config'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BASE = 'https://generativelanguage.googleapis.com'
// Modelos disponibles con tu clave (según /api/ai-chat/models); se prueba en orden.
const GEMINI_MODEL_URLS = [
  `${BASE}/v1beta/models/gemini-2.5-flash:generateContent`,
  `${BASE}/v1beta/models/gemini-2.0-flash:generateContent`,
  `${BASE}/v1beta/models/gemini-flash-latest:generateContent`,
  `${BASE}/v1beta/models/gemini-pro-latest:generateContent`,
  `${BASE}/v1beta/models/gemini-2.5-pro:generateContent`,
]

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

/** Schema para Structured Output: respuesta siempre JSON válido (documentación Gemini). */
const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'Respuesta amigable al usuario en una o dos oraciones.',
    },
    suggestedCategory: {
      type: ['string', 'null'],
      description: 'Slug de categoría si aplica; null si no.',
    },
    suggestedSearch: {
      type: ['string', 'null'],
      description: 'Término de búsqueda para productos (ej. aerosol, látex interior, pintura madera).',
    },
  },
  required: ['reply'],
  // Gemini 2.0 puede requerir propertyOrdering explícito para orden predecible
  propertyOrdering: ['reply', 'suggestedCategory', 'suggestedSearch'],
} as const

function buildSystemPrompt(tenantName: string, tenantSlug: string): string {
  const agentName = tenantSlug === 'pintemas' ? 'Luis' : `asistente de ${tenantName}`
  const storeName = tenantSlug === 'pintemas' ? 'Pintemas' : tenantName
  return `Eres ${agentName}, asistente de la tienda de pinturería ${storeName}. Ayudás al cliente a elegir pinturas y productos (látex, esmalte, barnices, impregnantes, AEROSOLES cuando los pidan). NO ofrezcas reparadores ni masillas.
IDENTIDAD (obligatorio): Presentate siempre como "Luis" (o "${agentName}"), NUNCA digas "Luis de Pintemas" ni "Como Luis de Pintemas". Decí "soy Luis" o "te ayudo desde Pintemas"; la tienda es ${storeName}.
AEROSOLES: La tienda SÍ trabaja con aerosoles/spray. Si el usuario pide aerosol, spray, pintar maceta/maseta con aerosol, detalles con spray, etc., respondé que tenemos y usá suggestedSearch "aerosol" o "spray" para mostrar productos.

CONTEXTO DE LA CONVERSACIÓN (obligatorio):
- Tenés acceso a TODO el historial del chat. Usalo SIEMPRE para recordar qué está consultando el usuario (interior, exterior, madera, aerosol, pinceles, etc.).
- Si el usuario hizo una pregunta de seguimiento, respondé EN ESE CONTEXTO. NUNCA respondas genérico tipo "Decime qué querés pintar" si en la conversación ya dijo qué quiere.

IMPORTANTE - SIEMPRE MOSTRAR PRODUCTOS EN ASESORAMIENTO:
- Cuando el usuario pregunte qué necesita, qué hace falta, o describa una superficie a pintar (pared exterior, interior, revoque, madera, frente, fachada, etc.), SIEMPRE devolvé suggestedSearch con el término correspondiente. NUNCA devolvas suggestedSearch null en una consulta de asesoramiento.
- Ejemplos que DEBEN tener suggestedSearch: "qué hace falta para pintar una pared exterior", "necesito pintar revoque", "pared sin mano de pintura", "mesa de madera exterior", "quiero pintar interior" → en todos estos casos devolvé suggestedSearch (látex exterior, látex interior, pintura madera, etc.) para que se muestren productos en el carrusel.

REGLAS DE suggestedSearch (críticas para que los resultados sean correctos):
- Si el usuario pide AEROSOL, SPRAY, maceta/maseta con aerosol, detalles con spray: usá suggestedSearch "aerosol" o "spray".
- Si quiere pintar INTERIOR o paredes interiores: usá suggestedSearch "látex interior".
- Si quiere pintar EXTERIOR, frente o fachada: usá suggestedSearch "látex exterior".
- Si quiere pintar MADERA o muebles (mesa, exterior): usá "pintura madera", "barniz" o "impregnante".
- Si quiere METAL: usá "esmalte metal".
- Si quiere TECHOS: usá "pintura techo".
- Si pide COMPLEMENTOS (rodillos, pinceles, brochas, cintas, bandejas): usá "rodillo", "pincel", "brocha", etc. según corresponda.
- NUNCA uses suggestedSearch: "reparador", "reparador de paredes", "masilla", "enduido".

Respondé SIEMPRE únicamente con un objeto JSON válido, sin markdown ni texto extra:
{"reply": "tu respuesta amigable en una o dos oraciones", "suggestedCategory": "slug-categoria o null", "suggestedSearch": "término de búsqueda o null"}

Reglas:
- reply: mensaje breve, USANDO EL CONTEXTO. NUNCA digas que no trabajamos con aerosoles; si piden aerosol, confirmá que tenemos y sugerí productos.
- suggestedCategory: slug de categoría si lo conocés; si no, null.
- suggestedSearch: según lo que pida (aerosol/spray cuando pidan eso; látex interior/exterior; pintura madera/barniz; etc.). En consultas de asesoramiento (qué hace falta, qué necesito, describir superficie) SIEMPRE indicá un término.
- Solo si el mensaje no es sobre pintar ni complementos (saludo, despedida, tema ajeno), respondé con suggestedCategory/suggestedSearch en null.`
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

      // Base de conocimiento (asesor pinturería + pintor) y catálogo de productos (XML)
      const catalogSummary = await getProductCatalogSummaryForPrompt(tenant.id)
      const knowledgeSection = `\n\nBASE DE CONOCIMIENTO (asesor de pinturería y pintor - usá esto para responder con criterio técnico):\n${AI_CHAT_KNOWLEDGE_BASE}`
      const catalogSection = catalogSummary
        ? `\n\nCATÁLOGO DE PRODUCTOS (productos disponibles en la tienda - podés nombrar marcas y productos reales del XML):\n${catalogSummary}`
        : ''

      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      }))

      // Construir prompt: system + base de conocimiento + catálogo XML + conversación
      const fullPrompt = `${systemPrompt}${knowledgeSection}${catalogSection}\n\n---\nConversación:\n${messages
        .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
        .join('\n')}\n\nResponde solo con el JSON (reply, suggestedCategory, suggestedSearch).`

      const payload = {
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
          responseMimeType: 'application/json' as const,
          responseJsonSchema: RESPONSE_JSON_SCHEMA,
        },
      }

      let responseText = ''
      let lastStatus = 0
      const urlsToTry = GEMINI_MODEL_URLS

      for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i]
        const geminiResponse = await fetch(
          `${url}?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )
        responseText = await geminiResponse.text().catch(() => '')
        lastStatus = geminiResponse.status

        if (geminiResponse.ok) break

        const isModelNotFound =
          geminiResponse.status === 404 ||
          (responseText.includes('is not found') && geminiResponse.status >= 400)
        const isLast = i === urlsToTry.length - 1
        if (isModelNotFound && !isLast) {
          const modelName = url.split('/models/')[1]?.split(':')[0] ?? url
          console.warn('[AI Chat] Modelo no disponible:', modelName, '- probando siguiente')
          continue
        }

        console.error('[AI Chat] Error de Gemini API:', {
          status: geminiResponse.status,
          error: responseText,
        })
        let userMessage = 'No pude procesar tu mensaje. Intentá de nuevo.'
        if (process.env.NODE_ENV === 'development') {
          try {
            const errJson = JSON.parse(responseText)
            const reason =
              errJson?.error?.message ??
              errJson?.error?.status ??
              responseText.slice(0, 200)
            userMessage = `Error (dev): ${reason}`
          } catch {
            userMessage = `Error (dev): ${responseText.slice(0, 200)}`
          }
        }
        return NextResponse.json(
          {
            success: false,
            error: userMessage,
          },
          { status: 500 }
        )
      }

      if (lastStatus !== 200) {
        return NextResponse.json(
          {
            success: false,
            error: 'No pude procesar tu mensaje. Intentá de nuevo.',
          },
          { status: 500 }
        )
      }

      let geminiData: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      try {
        geminiData = JSON.parse(responseText)
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'No pude procesar la respuesta. Intentá de nuevo.',
          },
          { status: 500 }
        )
      }
      const rawText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

      const result = parseGeminiJson(rawText)

      // Construir contexto para fallback de intención (igual que en frontend)
      const lastUserContents = messages
        .filter((m) => m.role === 'user')
        .slice(-3)
        .map((m) => m.content)
      const lastAssistantContents = messages
        .filter((m) => m.role === 'assistant')
        .slice(-2)
        .map((m) => m.content)
      const contextText = [...lastUserContents, ...lastAssistantContents]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const currentLower = lastUserContents[lastUserContents.length - 1] ?? ''

      if (!result) {
        // Parse falló: intentar derivar búsqueda del mensaje para igual mostrar productos
        const fallbackSearch = getFallbackSuggestedSearch(contextText, currentLower)
        return NextResponse.json(
          {
            success: true,
            reply:
              'Te puedo ayudar a elegir productos. Decime qué querés pintar (interior, exterior, madera, etc.).',
            suggestedCategory: null,
            suggestedSearch: fallbackSearch ?? null,
          },
          { status: 200 }
        )
      }

      // Si la IA no devolvió suggestedSearch pero el mensaje es de asesoramiento, rellenar con fallback
      let suggestedSearch = result.suggestedSearch ?? null
      if (!suggestedSearch) {
        const fallbackSearch = getFallbackSuggestedSearch(contextText, currentLower)
        if (fallbackSearch) suggestedSearch = normalizeSuggestedSearch(fallbackSearch) ?? fallbackSearch
      } else {
        suggestedSearch = normalizeSuggestedSearch(suggestedSearch) ?? suggestedSearch
      }

      return NextResponse.json(
        {
          success: true,
          reply: result.reply,
          suggestedCategory: result.suggestedCategory ?? null,
          suggestedSearch,
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
