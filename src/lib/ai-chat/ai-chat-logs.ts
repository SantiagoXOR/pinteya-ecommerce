/**
 * Logs en memoria para el AI Chat (debug/admin).
 * Últimas N solicitudes/respuestas para inspección en el panel de admin.
 * No persiste entre reinicios del servidor.
 */

const MAX_LOGS = 100

export interface AIChatLogEntry {
  id: string
  timestamp: string // ISO
  messageCount: number
  lastUserMessage: string
  reply: string
  suggestedSearch: string | null
  suggestedCategory: string | null
  success: boolean
  durationMs: number
  modelUsed?: string | null
  error?: string | null
}

const logs: AIChatLogEntry[] = []
let idCounter = 0

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

/**
 * Añade una entrada al log (últimas MAX_LOGS).
 */
export function pushAIChatLog(entry: Omit<AIChatLogEntry, 'id' | 'timestamp'>): void {
  const id = `log-${++idCounter}-${Date.now()}`
  const timestamp = new Date().toISOString()
  logs.unshift({
    id,
    timestamp,
    lastUserMessage: truncate(entry.lastUserMessage, 300),
    reply: truncate(entry.reply, 500),
    suggestedSearch: entry.suggestedSearch ?? null,
    suggestedCategory: entry.suggestedCategory ?? null,
    success: entry.success,
    durationMs: entry.durationMs,
    messageCount: entry.messageCount,
    modelUsed: entry.modelUsed ?? null,
    error: entry.error ?? null,
  })
  if (logs.length > MAX_LOGS) logs.pop()
}

/**
 * Devuelve las últimas entradas del log (para el panel de admin).
 */
export function getAIChatLogs(limit = 50): AIChatLogEntry[] {
  return logs.slice(0, Math.min(limit, logs.length))
}
