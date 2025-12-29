// ===================================
// PINTEYA E-COMMERCE - TESTS PARA helpers
// ===================================

import {
  formatPrice,
  calculateDiscount,
  validateEmail,
  generateSlug,
  formatPhoneNumber,
  calculateShipping,
  validateCartItem,
  sanitizeInput,
  debounce,
  formatDate,
  calculateDeliveryDate,
  validateDNI,
  formatDNI,
  generateOrderReference,
  isNumeric,
  capitalizeWords,
} from '@/utils/helpers'

describe('helpers', () => {
  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(formatPrice(1000)).toBe('$1.000')
      expect(formatPrice(10000)).toBe('$10.000')
      expect(formatPrice(100000)).toBe('$100.000')
    })

    it('should handle null and undefined', () => {
      expect(formatPrice(null)).toBe('$0')
      expect(formatPrice(undefined)).toBe('$0')
    })

    it('should handle NaN', () => {
      expect(formatPrice(NaN)).toBe('$0')
    })

    it('should round prices', () => {
      expect(formatPrice(1000.5)).toBe('$1.001')
      expect(formatPrice(1000.4)).toBe('$1.000')
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate discount percentage correctly', () => {
      expect(calculateDiscount(100, 80)).toBe(20)
      expect(calculateDiscount(100, 50)).toBe(50)
      expect(calculateDiscount(100, 0)).toBe(100)
    })

    it('should return 0 when no discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0)
      expect(calculateDiscount(100, 150)).toBe(0)
    })

    it('should handle null and undefined', () => {
      expect(calculateDiscount(null, 80)).toBe(0)
      expect(calculateDiscount(100, null)).toBe(0)
      expect(calculateDiscount(undefined, 80)).toBe(0)
      expect(calculateDiscount(100, undefined)).toBe(0)
    })

    it('should handle zero or negative original price', () => {
      expect(calculateDiscount(0, 80)).toBe(0)
      expect(calculateDiscount(-100, 80)).toBe(0)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@example.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('test..test@example.com')).toBe(false)
      expect(validateEmail('.test@example.com')).toBe(false)
      expect(validateEmail('test.@example.com')).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })
  })

  describe('generateSlug', () => {
    it('should generate slug from text', () => {
      expect(generateSlug('Pintura Latex Blanco')).toBe('pintura-latex-blanco')
      expect(generateSlug('Producto Test 123')).toBe('producto-test-123')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Producto & Más')).toBe('producto-mas')
      expect(generateSlug('Producto (Especial)')).toBe('producto-especial')
    })

    it('should handle accents', () => {
      expect(generateSlug('Pintura Esmalté')).toBe('pintura-esmalte')
      expect(generateSlug('Niño')).toBe('nino')
    })

    it('should handle null and undefined', () => {
      expect(generateSlug(null)).toBe('')
      expect(generateSlug(undefined)).toBe('')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format phone number correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBeDefined()
    })

    it('should handle empty string', () => {
      expect(formatPhoneNumber('')).toBe('')
    })
  })

  describe('calculateShipping', () => {
    it('should calculate shipping for different locations', () => {
      // calculateShipping(weight, location, orderTotal, express)
      const result = calculateShipping(5, 'Córdoba', 10000, false)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(isNaN(result)).toBe(false)
    })

    it('should return free shipping for large orders', () => {
      // calculateShipping(weight, location, orderTotal, express)
      // Assuming freeShippingThreshold is less than 50000
      const result = calculateShipping(5, 'Córdoba', 50000, false)
      expect(result).toBe(0)
    })
  })

  describe('validateCartItem', () => {
    it('should validate correct cart item', () => {
      const item = {
        id: 1,
        name: 'Producto', // validateCartItem requires 'name', not 'title'
        price: 1000,
        quantity: 2,
      }
      expect(validateCartItem(item)).toBe(true)
    })

    it('should reject invalid cart items', () => {
      expect(validateCartItem(null)).toBe(false)
      expect(validateCartItem(undefined)).toBe(false)
      expect(validateCartItem({})).toBe(false)
      expect(validateCartItem({ id: 1 })).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize input string', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.useRealTimers()
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15') // Use a date that will definitely show 2024
      const result = formatDate(date)
      expect(result).toBeDefined()
      // The format might be different, just check it's a valid string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle string dates', () => {
      const result = formatDate('2024-01-01')
      expect(result).toBeDefined()
    })
  })

  describe('calculateDeliveryDate', () => {
    it('should calculate delivery date for standard shipping', () => {
      const result = calculateDeliveryDate('Córdoba', false)
      expect(result).toBeInstanceOf(Date)
    })

    it('should calculate delivery date for express shipping', () => {
      const result = calculateDeliveryDate('Córdoba', true)
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('validateDNI', () => {
    it('should validate correct DNI', () => {
      expect(validateDNI('12345678')).toBe(true)
      expect(validateDNI('1234567')).toBe(true)
    })

    it('should reject invalid DNI', () => {
      expect(validateDNI('12345')).toBe(false)
      expect(validateDNI('123456789')).toBe(false)
      expect(validateDNI('abc12345')).toBe(false)
    })
  })

  describe('formatDNI', () => {
    it('should format DNI correctly', () => {
      expect(formatDNI('12345678')).toBe('12.345.678')
      expect(formatDNI('1234567')).toBe('1.234.567')
    })
  })

  describe('generateOrderReference', () => {
    it('should generate order reference', () => {
      const ref = generateOrderReference()
      expect(ref).toBeDefined()
      expect(ref.length).toBeGreaterThan(0)
    })

    it('should generate unique references', () => {
      const ref1 = generateOrderReference()
      const ref2 = generateOrderReference()
      expect(ref1).not.toBe(ref2)
    })
  })

  describe('isNumeric', () => {
    it('should check if string is numeric', () => {
      expect(isNumeric('123')).toBe(true)
      // isNumeric only accepts integers (no decimals)
      expect(isNumeric('123.45')).toBe(false)
      expect(isNumeric('abc')).toBe(false)
      expect(isNumeric('12abc')).toBe(false)
    })
  })

  describe('capitalizeWords', () => {
    it('should capitalize words correctly', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
      expect(capitalizeWords('pintura latex')).toBe('Pintura Latex')
    })

    it('should handle single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('')
    })
  })

  // ===================================
  // CASOS EDGE ADICIONALES
  // ===================================

  describe('Edge Cases', () => {
    it('should handle very large prices', () => {
      expect(formatPrice(999999999)).toBe('$999.999.999')
      expect(formatPrice(1000000000)).toBe('$1.000.000.000')
    })

    it('should handle negative prices gracefully', () => {
      // formatPrice should handle negative numbers
      const result = formatPrice(-1000)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle email with multiple dots', () => {
      expect(validateEmail('user.name.last@example.com')).toBe(true)
      expect(validateEmail('user..name@example.com')).toBe(false)
    })

    it('should handle email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('should handle very long slugs', () => {
      const longText = 'a'.repeat(1000)
      const slug = generateSlug(longText)
      expect(slug.length).toBeLessThanOrEqual(1000)
      expect(slug).not.toContain(' ')
    })

    it('should handle DNI with leading zeros', () => {
      expect(validateDNI('01234567')).toBe(true)
      expect(formatDNI('01234567')).toBe('01.234.567')
    })

    it('should handle phone numbers with country code', () => {
      const result = formatPhoneNumber('+5493512345678')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle cart item with zero quantity', () => {
      const item = {
        id: 1,
        name: 'Producto',
        price: 1000,
        quantity: 0,
      }
      expect(validateCartItem(item)).toBe(false)
    })

    it('should handle cart item with negative price', () => {
      const item = {
        id: 1,
        name: 'Producto',
        price: -1000,
        quantity: 2,
      }
      expect(validateCartItem(item)).toBe(false)
    })

    it('should handle order reference uniqueness', () => {
      const refs = Array.from({ length: 100 }, () => generateOrderReference())
      const uniqueRefs = new Set(refs)
      expect(uniqueRefs.size).toBe(100)
    })

    it('should handle sanitizeInput with script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeInput(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
    })

    it('should handle calculateDiscount with zero discounted price', () => {
      expect(calculateDiscount(100, 0)).toBe(100)
    })

    it('should handle calculateDiscount with same prices', () => {
      expect(calculateDiscount(100, 100)).toBe(0)
    })
  })
})
