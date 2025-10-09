// ===================================
// PINTEYA E-COMMERCE - UTILITY HELPERS
// ===================================

/**
 * Formats a price in Argentine peso format
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return '$0'
  }

  const roundedPrice = Math.round(price)
  // Simple format without spaces for consistency
  const formatted = roundedPrice.toLocaleString('es-AR')
  return `$${formatted}`
}

/**
 * Calculates discount percentage
 */
export function calculateDiscount(
  originalPrice: number | null,
  discountedPrice: number | null
): number {
  // Handle null/undefined cases
  if (originalPrice === null || originalPrice === undefined || originalPrice <= 0) {
    return 0
  }

  if (discountedPrice === null || discountedPrice === undefined) {
    return 0
  }

  if (discountedPrice >= originalPrice) {
    return 0
  }

  // Special case: if discounted price is 0, it's 100% discount
  if (discountedPrice === 0 && originalPrice > 0) {
    return 100
  }

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100
  return Math.round(discount)
}

/**
 * Validates email format
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/

  // Additional checks
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false
  }

  if (email.includes('@.') || email.includes('.@')) {
    return false
  }

  return emailRegex.test(email)
}

/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(text: string | null | undefined): string {
  if (!text) {
    return ''
  }

  return String(text)
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

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) {
    return ''
  }

  // If already formatted, return as is
  if (phone.includes('(') && phone.includes(')') && phone.includes('-')) {
    return phone
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  // Return original if doesn't match expected format
  return phone
}

/**
 * Calculates shipping cost based on weight, location, and order total
 */
export function calculateShipping(
  weight: number,
  location: string,
  orderTotal: number = 0,
  express: boolean = false
): number {
  // Free shipping threshold (global, from design system config)
  // Import lazily to avoid circular dependencies in some environments
  const { useDesignSystemConfig } = require('@/lib/design-system-config')
  const config = useDesignSystemConfig()
  const freeShippingThreshold = config.ecommerce.shippingInfo.freeShippingThreshold

  if (orderTotal >= freeShippingThreshold) {
    return 0
  }

  // Base rates by location
  const locationRates: { [key: string]: number } = {
    CABA: 500,
    'Buenos Aires': 800,
    Córdoba: 1200,
    'Santa Fe': 1100,
    Mendoza: 1400,
  }

  const baseRate = locationRates[location] || 1500

  // Weight multiplier (every 5kg adds 50% to base rate)
  const weightMultiplier = 1 + Math.floor(weight / 5) * 0.5

  // Express shipping doubles the cost
  const expressMultiplier = express ? 2 : 1

  return Math.round(baseRate * weightMultiplier * expressMultiplier)
}

/**
 * Validates cart item structure
 */
export function validateCartItem(item: unknown): boolean {
  if (!item || typeof item !== 'object') {
    return false
  }

  const cartItem = item as Record<string, unknown>

  // Required fields
  if (!cartItem.id || !cartItem.name || !cartItem.price || !cartItem.quantity) {
    return false
  }

  // Validate types
  if (typeof cartItem.price !== 'number' || cartItem.price <= 0) {
    return false
  }

  if (typeof cartItem.quantity !== 'number' || cartItem.quantity <= 0) {
    return false
  }

  // Validate stock if provided
  if (
    cartItem.stock !== undefined &&
    typeof cartItem.stock === 'number' &&
    cartItem.quantity > cartItem.stock
  ) {
    return false
  }

  return true
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) {
    return ''
  }

  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Formats date for display
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Calculates estimated delivery date
 */
export function calculateDeliveryDate(location: string, express: boolean = false): Date {
  const now = new Date()
  let daysToAdd = 3 // Default delivery time

  // Location-based delivery times
  const deliveryTimes: { [key: string]: number } = {
    CABA: 1,
    'Buenos Aires': 2,
    Córdoba: 4,
    'Santa Fe': 3,
    Mendoza: 5,
  }

  daysToAdd = deliveryTimes[location] || 7

  // Express shipping halves delivery time (minimum 1 day)
  if (express) {
    daysToAdd = Math.max(1, Math.floor(daysToAdd / 2))
  }

  const deliveryDate = new Date(now)
  deliveryDate.setDate(now.getDate() + daysToAdd)

  return deliveryDate
}

/**
 * Validates Argentine DNI format
 */
export function validateDNI(dni: string): boolean {
  if (!dni) {
    return false
  }

  // Remove dots and spaces
  const cleaned = dni.replace(/[.\s]/g, '')

  // Check if it's 7-8 digits
  return /^\d{7,8}$/.test(cleaned)
}

/**
 * Formats DNI for display
 */
export function formatDNI(dni: string): string {
  if (!dni) {
    return ''
  }

  const cleaned = dni.replace(/[.\s]/g, '')

  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  }

  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 1)}.${cleaned.slice(1, 4)}.${cleaned.slice(4)}`
  }

  return dni
}

/**
 * Generates a random order reference
 */
export function generateOrderReference(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `PINTEYA-${timestamp}-${random.toUpperCase()}`
}

/**
 * Checks if a string contains only numbers
 */
export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str)
}

/**
 * Capitalizes first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}
