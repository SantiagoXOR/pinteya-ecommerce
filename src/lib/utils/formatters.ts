// =====================================================
// UTILIDADES: Formatters
// Descripción: Funciones de formateo para datos enterprise
// =====================================================

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }

  return dateObj.toLocaleDateString('es-AR', defaultOptions)
}

/**
 * Formatea una fecha en formato corto
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formatea una fecha relativa (hace X tiempo)
 */
export function formatDateRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Hace unos segundos'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`
  }

  return formatDate(dateObj, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Formatea un valor monetario
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'ARS',
  options?: Intl.NumberFormatOptions
): string {
  // PROTECCIÓN TOTAL: Verificar que amount es válido
  let safeAmount: number

  if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
    safeAmount = amount
  } else if (typeof amount === 'string') {
    const parsed = parseFloat(amount)
    if (!isNaN(parsed) && isFinite(parsed)) {
      safeAmount = parsed
    } else {
      safeAmount = 0
    }
  } else {
    safeAmount = 0
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }

  // Configuración específica para pesos argentinos
  if (currency.toUpperCase() === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      ...defaultOptions,
      currency: 'ARS',
    }).format(safeAmount)
  }

  return new Intl.NumberFormat('es-AR', defaultOptions).format(safeAmount)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }

  return new Intl.NumberFormat('es-AR', defaultOptions).format(number)
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }

  return new Intl.NumberFormat('es-AR', defaultOptions).format(value / 100)
}

/**
 * Formatea el tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formatea un número de teléfono argentino
 */
export function formatPhoneNumber(phone: string): string {
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '')

  // Formato para números argentinos
  if (cleaned.length === 10) {
    // Formato: (011) 1234-5678
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  if (cleaned.length === 11 && cleaned.startsWith('54')) {
    // Formato internacional: +54 (011) 1234-5678
    return `+54 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 9)}-${cleaned.slice(9)}`
  }

  return phone // Retornar original si no coincide con formatos conocidos
}

/**
 * Formatea un CUIT/CUIL argentino
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`
  }

  return cuit
}

/**
 * Formatea una dirección
 */
export function formatAddress(address: {
  street_name?: string
  street_number?: string
  city_name?: string
  state_name?: string
  zip_code?: string
}): string {
  const parts = []

  if (address.street_name && address.street_number) {
    parts.push(`${address.street_name} ${address.street_number}`)
  }

  if (address.city_name) {
    parts.push(address.city_name)
  }

  if (address.state_name) {
    parts.push(address.state_name)
  }

  if (address.zip_code) {
    parts.push(`(${address.zip_code})`)
  }

  return parts.join(', ')
}

/**
 * Trunca un texto a una longitud específica
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

/**
 * Formatea un slug para URL
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones duplicados
}

/**
 * Formatea un tiempo de duración
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

/**
 * Formatea un estado de orden para mostrar
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    processing: 'Procesando',
    shipped: 'Enviada',
    delivered: 'Entregada',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  }

  return statusMap[status] || capitalizeWords(status)
}

/**
 * Formatea un estado de pago para mostrar
 */
export function formatPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    failed: 'Fallido',
    refunded: 'Reembolsado',
    partial: 'Parcial',
  }

  return statusMap[status] || capitalizeWords(status)
}
