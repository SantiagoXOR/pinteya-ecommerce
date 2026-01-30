/**
 * GET /api/admin/ai-chat/logs
 * Devuelve los últimos logs del AI Chat (debug/admin).
 * Requiere autenticación de administrador.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/server-auth-guard'
import { getAIChatLogs } from '@/lib/ai-chat/ai-chat-logs'

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const limit = Math.min(
    Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 50),
    100
  )
  const logs = getAIChatLogs(limit)
  return NextResponse.json({ logs })
}
