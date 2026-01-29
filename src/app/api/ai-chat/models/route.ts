/**
 * GET /api/ai-chat/models
 * Lista los modelos Gemini disponibles con la clave configurada (útil para depurar).
 */
import { NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function GET() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no configurada' },
      { status: 500 }
    )
  }
  try {
    const res = await fetch(`${MODELS_URL}?key=${GEMINI_API_KEY}&pageSize=50`)
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? 'Error al listar modelos' },
        { status: res.status }
      )
    }
    const models =
      data.models?.map((m: { name: string; displayName?: string }) => ({
        name: m.name,
        displayName: m.displayName,
      })) ?? []
    return NextResponse.json({ models })
  } catch (e) {
    console.error('[AI Chat] Error listando modelos:', e)
    return NextResponse.json(
      { error: 'Error al listar modelos' },
      { status: 500 }
    )
  }
}
