/**
 * Visitor ID para sesiones de AI Chat (visitantes anónimos).
 * Se persiste en cookie ai_chat_visitor_id (1 año) para asociar conversaciones.
 * Solo se ejecuta en el cliente (document.cookie).
 */

const COOKIE_NAME = 'ai_chat_visitor_id'
const MAX_AGE_YEAR = 365 * 24 * 60 * 60

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getAIChatVisitorId(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]).trim() : ''
  if (value) return value
  const newId = generateUUID()
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(newId)}; path=/; max-age=${MAX_AGE_YEAR}; SameSite=Lax`
  return newId
}
