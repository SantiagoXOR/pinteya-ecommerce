// =====================================================
// UTILIDADES CONSOLIDADAS - PINTEYA E-COMMERCE
// Descripción: Funciones unificadas de formateo, validación y utilidades
// Basado en: Intl API + Zod + patrones enterprise
// =====================================================

import { z } from 'zod'

// =====================================================
// FORMATEO DE FECHAS - VERSIÓN CONSOLIDADA
// =====================================================

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions | string
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida'
    }

    // Si options es un string (patrón legacy), convertir a formato nativo
    if (typeof options === 'string') {
      const day = dateObj.getDate().toString().padStart(2, '0')
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
      const year = dateObj.getFullYear()
      const hours = dateObj.getHours().toString().padStart(2, '0')
      const minutes = dateObj.getMinutes().toString().padStart(2, '0')

      if (options === 'dd/MM/yyyy hh:mm') {
        return `${day}/${month}/${year} ${hours}:${minutes}`
      }
      return `${day}/${month}/${year}`
    }

    // Usar Intl.DateTimeFormat para mejor internacionalización
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }

    return dateObj.toLocaleDateString('es-AR', defaultOptions)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha inválida'
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeAgo(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida'
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'hace menos de un minuto'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`
    }

    return formatDate(dateObj, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (error) {
    console.error('Error formatting time ago:', error)
    return 'Fecha inválida'
  }
}

// Alias para compatibilidad
export const formatDateRelative = formatTimeAgo
export const formatRelativeTime = formatTimeAgo

// =====================================================
// FORMATEO DE MONEDAS - VERSIÓN CONSOLIDADA
// =====================================================

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'ARS',
  options?: Intl.NumberFormatOptions
): string {
  try {
    // Normalizar el amount a número
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

    return new Intl.NumberFormat('es-AR', defaultOptions).format(safeAmount)
  } catch (error) {
    console.error('Error formatting currency:', error)
    return `$${amount || 0}`
  }
}

export function formatPrice(amount: number | string): string {
  return formatCurrency(amount)
}

export function formatNumber(value: number | string, options?: Intl.NumberFormatOptions): string {
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(numValue)) {
      return '0'
    }

    return new Intl.NumberFormat('es-AR', options).format(numValue)
  } catch (error) {
    console.error('Error formatting number:', error)
    return String(value || 0)
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  } catch (error) {
    console.error('Error formatting percentage:', error)
    return `${value}%`
  }
}

// =====================================================
// VALIDACIÓN - VERSIÓN CONSOLIDADA
// =====================================================

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email)
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  // Formato argentino: +54 9 351 123 4567, +54 351 123-4567, 351 123 4567, etc.
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  const phoneRegex = /^(\+54(9)?)?\d{10}$|^\d{10}$/

  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10
}

export function validateDNI(dni: string): boolean {
  if (!dni || typeof dni !== 'string') {
    return false
  }

  const cleanDNI = dni.replace(/[\s\-\.]/g, '')
  const dniRegex = /^\d{8}$/
  const cuitRegex = /^\d{11}$/

  return dniRegex.test(cleanDNI) || cuitRegex.test(cleanDNI)
}

// =====================================================
// UTILIDADES DE TEXTO
// =====================================================

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres peligrosos básicos
    .substring(0, 1000) // Limitar longitud
}

export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') // Solo letras y espacios
    .replace(/\s+/g, ' ') // Normalizar espacios
    .substring(0, 100) // Limitar longitud
}

export function slugify(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// =====================================================
// UTILIDADES DE PERFORMANCE
// =====================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

export const addressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  apartment: z.string().optional(),
  neighborhood: z.string().min(1, 'El barrio es requerido'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'La provincia es requerida'),
  postal_code: z.string().min(4, 'El código postal debe tener al menos 4 dígitos'),
  country: z.string().default('AR'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reference: z.string().optional(),
})

export const emailSchema = z.string().email('Email inválido')
export const phoneSchema = z.string().refine(validatePhoneNumber, 'Teléfono inválido')
export const dniSchema = z.string().refine(validateDNI, 'DNI/CUIT inválido')

// =====================================================
// FORMATEO DE ESTADOS Y BADGES
// =====================================================

export function formatShipmentStatus(status: string): {
  label: string
  color: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  const statusMap: Record<string, { label: string; color: any }> = {
    pending: { label: 'Pendiente', color: 'secondary' },
    confirmed: { label: 'Confirmado', color: 'default' },
    picked_up: { label: 'Retirado', color: 'default' },
    in_transit: { label: 'En Tránsito', color: 'default' },
    out_for_delivery: { label: 'En Reparto', color: 'default' },
    delivered: { label: 'Entregado', color: 'default' },
    exception: { label: 'Excepción', color: 'destructive' },
    cancelled: { label: 'Cancelado', color: 'destructive' },
    returned: { label: 'Devuelto', color: 'outline' },
  }

  return statusMap[status] || { label: status, color: 'outline' }
}

export function formatOrderStatus(status: string): {
  label: string
  color: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  const statusMap: Record<string, { label: string; color: any }> = {
    pending: { label: 'Pendiente', color: 'secondary' },
    confirmed: { label: 'Confirmado', color: 'default' },
    processing: { label: 'Procesando', color: 'default' },
    shipped: { label: 'Enviado', color: 'default' },
    delivered: { label: 'Entregado', color: 'default' },
    cancelled: { label: 'Cancelado', color: 'destructive' },
    refunded: { label: 'Reembolsado', color: 'outline' },
    returned: { label: 'Devuelto', color: 'outline' },
  }

  return statusMap[status] || { label: status, color: 'outline' }
}

// =====================================================
// TIPOS TYPESCRIPT
// =====================================================

export type Address = z.infer<typeof addressSchema>
export type FormatDateOptions = Intl.DateTimeFormatOptions | string
export type FormatCurrencyOptions = Intl.NumberFormatOptions
