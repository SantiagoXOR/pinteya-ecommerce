/**
 * Generador de selectores únicos para elementos del DOM
 * Usado para tracking de interacciones con elementos específicos
 */

/**
 * Genera un selector único y estable para un elemento
 * Prioriza: data-analytics-id > id > data-testid > clases + posición
 */
export function generateElementSelector(element: HTMLElement): string {
  // Prioridad 1: data-analytics-id (más estable)
  const analyticsId = element.getAttribute('data-analytics-id')
  if (analyticsId) {
    return `[data-analytics-id="${analyticsId}"]`
  }

  // Prioridad 2: ID único
  if (element.id) {
    return `#${element.id}`
  }

  // Prioridad 3: data-testid
  const testId = element.getAttribute('data-testid')
  if (testId) {
    return `[data-testid="${testId}"]`
  }

  // Prioridad 4: Combinación de tag + clases + posición
  const tag = element.tagName.toLowerCase()
  const classes = Array.from(element.classList)
    .filter(cls => !cls.startsWith('css-') && !cls.startsWith('_')) // Ignorar clases generadas
    .slice(0, 3) // Máximo 3 clases
    .join('.')

  // Si tiene clases, usar tag.classes
  if (classes) {
    return `${tag}.${classes}`
  }

  // Prioridad 5: Tag + posición relativa al padre
  const parent = element.parentElement
  if (parent) {
    const siblings = Array.from(parent.children)
    const index = siblings.indexOf(element)
    if (index >= 0) {
      return `${tag}:nth-child(${index + 1})`
    }
  }

  // Fallback: tag solamente
  return tag
}

/**
 * Detecta el tipo de dispositivo desde el user agent
 */
export function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop'
  }

  const userAgent = navigator.userAgent.toLowerCase()

  if (
    userAgent.includes('mobile') ||
    userAgent.includes('android') ||
    userAgent.includes('iphone')
  ) {
    return 'mobile'
  }

  if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    return 'tablet'
  }

  return 'desktop'
}

/**
 * Obtiene la posición y dimensiones de un elemento
 */
export function getElementPosition(element: HTMLElement): {
  x: number
  y: number
  width: number
  height: number
} {
  const rect = element.getBoundingClientRect()
  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}
