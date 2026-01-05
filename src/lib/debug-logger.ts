/**
 * Debug logger utility
 * Solo ejecuta en desarrollo, nunca en producción
 */

const DEBUG_ENABLED = process.env.NODE_ENV === 'development' && typeof window !== 'undefined'

export function debugLog(data: {
  location: string
  message: string
  data?: any
  sessionId?: string
  runId?: string
  hypothesisId?: string
}) {
  if (!DEBUG_ENABLED) return

  // ⚡ FASE 11-16: Debugging deshabilitado en producción
  // El código de fetch fue removido para evitar timeouts que bloqueaban LCP
  // En desarrollo, este código se puede habilitar si es necesario
}

