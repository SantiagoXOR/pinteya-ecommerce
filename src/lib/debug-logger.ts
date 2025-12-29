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

  try {
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail in development
    })
  } catch (error) {
    // Silently fail
  }
}

