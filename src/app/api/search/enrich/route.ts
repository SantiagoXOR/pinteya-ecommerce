/**
 * API: /api/search/enrich
 * Enriquece búsquedas con Gemini para refinar términos y sugerir categorías.
 * Usado cuando hay pocos o ningún resultado.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_MODEL_URLS = [
  `${BASE}/v1beta/models/gemini-2.5-flash:generateContent`,
  `${BASE}/v1beta/models/gemini-2.0-flash:generateContent`,
  `${BASE}/v1beta/models/gemini-flash-latest:generateContent`,
]

const ENRICH_SCHEMA = {
  type: 'object',
  properties: {
    refinedQuery: { type: 'string', description: 'Término de búsqueda refinado o expandido' },
    categorySlug: { type: ['string', 'null'], description: 'Slug de categoría si aplica (metales-y-maderas, techos, etc.)' },
    alternativeTerms: {
      type: 'array',
      items: { type: 'string' },
      description: 'Términos alternativos para buscar (ej: esmalte, impregnante)',
    },
  },
  required: ['refinedQuery', 'alternativeTerms'],
  propertyOrdering: ['refinedQuery', 'categorySlug', 'alternativeTerms'],
} as const

export async function GET(request: NextRequest) {
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.aiChat, async () => {
    const apiKey = GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API no configurada' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Parámetro q requerido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    const systemPrompt = `Eres un asistente de una tienda de pinturería. El usuario buscó "${q}" y obtuvo pocos o ningún resultado.
Tu tarea: devolver un JSON con:
1. refinedQuery: término de búsqueda mejorado (sinónimos, variantes ortográficas, términos técnicos de pinturería).
2. categorySlug: slug de categoría si la búsqueda corresponde a una (metales-y-maderas, techos, paredes, complementos, antihumedad, piscinas, reparaciones, pisos). null si no aplica.
3. alternativeTerms: array de 2-5 términos alternativos para buscar productos (ej: "metales y maderas" → ["esmalte metal", "impregnante", "barniz"]).

Categorías válidas: metales-y-maderas, techos, paredes, complementos, antihumedad, piscinas, reparaciones, pisos.
Responde SOLO con el JSON válido, sin markdown ni texto extra.`

    const payload = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: 'application/json' as const,
        responseJsonSchema: ENRICH_SCHEMA,
      },
    }

    let responseText = ''
    for (const url of GEMINI_MODEL_URLS) {
      try {
        const res = await fetch(`${url}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        responseText = await res.text()
        if (res.ok) break
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Search Enrich] Gemini error:', e)
        }
      }
    }

    try {
      const parsed = JSON.parse(responseText)
      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Sin respuesta de Gemini')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON no encontrado')
      const data = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        refinedQuery: data.refinedQuery || q,
        categorySlug: data.categorySlug ?? null,
        alternativeTerms: Array.isArray(data.alternativeTerms) ? data.alternativeTerms : [],
      })
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Search Enrich] Parse error:', e)
      }
      return NextResponse.json(
        {
          success: false,
          refinedQuery: q,
          categorySlug: null,
          alternativeTerms: [],
          error: 'No se pudo enriquecer la búsqueda',
        },
        { status: 200 }
      )
    }
  })

  if (rateLimitResult instanceof NextResponse) return rateLimitResult
  return rateLimitResult
}
