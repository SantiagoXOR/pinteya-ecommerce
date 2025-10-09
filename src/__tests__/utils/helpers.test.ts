// ===================================
// PINTEYA E-COMMERCE - TEST UTILITY HELPERS
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
} from '@/utils/helpers'

describe('Utility Helpers', () => {
  describe('formatPrice', () => {
    it('formats prices correctly for Argentine pesos', () => {
      expect(formatPrice(1000)).toBe('$1.000')
      expect(formatPrice(1500.5)).toBe('$1.501') // Rounded
      expect(formatPrice(10000)).toBe('$10.000')
      expect(formatPrice(0)).toBe('$0')
    })

    it('handles negative prices', () => {
      expect(formatPrice(-1000)).toBe('$-1.000')
    })

    it('handles very large numbers', () => {
      expect(formatPrice(1000000)).toBe('$1.000.000')
    })
  })

  describe('calculateDiscount', () => {
    it('calculates discount percentage correctly', () => {
      expect(calculateDiscount(1000, 800)).toBe(20)
      expect(calculateDiscount(2000, 1500)).toBe(25)
      expect(calculateDiscount(100, 90)).toBe(10)
    })

    it('returns 0 when no discount', () => {
      expect(calculateDiscount(1000, 1000)).toBe(0)
      expect(calculateDiscount(1000, 1100)).toBe(0) // Higher discounted price
    })

    it('handles edge cases', () => {
      expect(calculateDiscount(0, 0)).toBe(0)
      expect(calculateDiscount(100, 0)).toBe(100)
      expect(calculateDiscount(null, 50)).toBe(0)
      expect(calculateDiscount(100, null)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      expect(calculateDiscount(1000, 666)).toBe(33) // 33.4% rounded
      expect(calculateDiscount(1000, 667)).toBe(33) // 33.3% rounded
    })
  })

  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.ar')).toBe(true)
      expect(validateEmail('test+tag@gmail.com')).toBe(true)
    })

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('test..test@domain.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test@domain')).toBe(false) // No TLD
      expect(validateEmail('test@.com')).toBe(false) // Invalid domain
    })

    it('handles edge cases', () => {
      expect(validateEmail('a@bb.co')).toBe(true) // Minimal valid email with 2-char domain
    })
  })

  describe('generateSlug', () => {
    it('generates slugs from product names', () => {
      expect(generateSlug('Sherwin Williams ProClassic Blanco 4L')).toBe(
        'sherwin-williams-proclassic-blanco-4l'
      )
      expect(generateSlug('Pintura Látex Interior')).toBe('pintura-latex-interior')
      expect(generateSlug('Set 3 Pinceles Profesionales')).toBe('set-3-pinceles-profesionales')
    })

    it('handles special characters', () => {
      expect(generateSlug('Esmalte Sintético Ñandú')).toBe('esmalte-sintetico-nandu')
      expect(generateSlug('Antióxido Rojo')).toBe('antioxido-rojo')
      expect(generateSlug('Rodillo 23cm (Pack x2)')).toBe('rodillo-23cm-pack-x2')
    })

    it('handles multiple spaces and special cases', () => {
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
      expect(generateSlug('UPPERCASE TEXT')).toBe('uppercase-text')
      expect(generateSlug('123 Numbers 456')).toBe('123-numbers-456')
    })

    it('handles empty or invalid input', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug('!!!')).toBe('')
    })
  })

  describe('formatPhoneNumber', () => {
    it('formats Argentine phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('01112345678')).toBe('(011) 1234-5678')
    })

    it('handles different input formats', () => {
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('+54 11 1234-5678')).toBe('+54 11 1234-5678') // Keep original if not standard format
    })

    it('handles invalid phone numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123') // Too short
      expect(formatPhoneNumber('')).toBe('')
      expect(formatPhoneNumber('abc')).toBe('abc') // Non-numeric
    })
  })

  describe('calculateShipping', () => {
    it('calculates shipping based on weight and distance', () => {
      expect(calculateShipping(1, 'CABA')).toBe(500) // Base rate
      expect(calculateShipping(5, 'Buenos Aires')).toBe(1200) // Higher weight (800 * 1.5)
      expect(calculateShipping(1, 'Córdoba')).toBe(1200) // Different province
    })

    it('applies free shipping threshold', () => {
      expect(calculateShipping(1, 'CABA', 50000)).toBe(0) // Free shipping over threshold
      expect(calculateShipping(1, 'CABA', 40000)).toBe(500) // Below threshold
    })

    it('handles express shipping', () => {
      expect(calculateShipping(1, 'CABA', 0, true)).toBe(1000) // Express shipping
      expect(calculateShipping(1, 'Buenos Aires', 0, true)).toBe(1600) // Express + distance
    })
  })

  describe('validateCartItem', () => {
    const validItem = {
      id: 1,
      name: 'Test Product',
      price: 1000,
      quantity: 2,
      stock: 10,
    }

    it('validates correct cart items', () => {
      expect(validateCartItem(validItem)).toBe(true)
    })

    it('rejects items with missing required fields', () => {
      expect(validateCartItem({ ...validItem, id: undefined })).toBe(false)
      expect(validateCartItem({ ...validItem, name: '' })).toBe(false)
      expect(validateCartItem({ ...validItem, price: 0 })).toBe(false)
    })

    it('rejects items with invalid quantities', () => {
      expect(validateCartItem({ ...validItem, quantity: 0 })).toBe(false)
      expect(validateCartItem({ ...validItem, quantity: -1 })).toBe(false)
      expect(validateCartItem({ ...validItem, quantity: 11 })).toBe(false) // Exceeds stock
    })

    it('rejects items with invalid prices', () => {
      expect(validateCartItem({ ...validItem, price: -100 })).toBe(false)
      expect(validateCartItem({ ...validItem, price: 'invalid' })).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('removes potentially dangerous HTML', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('')
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World')
    })

    it('preserves safe text', () => {
      expect(sanitizeInput('Normal text')).toBe('Normal text')
      expect(sanitizeInput('Text with números 123')).toBe('Text with números 123')
      expect(sanitizeInput('Email: test@example.com')).toBe('Email: test@example.com')
    })

    it('handles special characters safely', () => {
      expect(sanitizeInput('Price: $1,000 & more')).toBe('Price: $1,000 & more')
      expect(sanitizeInput('Ñandú & Cóndor')).toBe('Ñandú & Cóndor')
    })

    it('handles empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles null and undefined inputs gracefully', () => {
      expect(formatPrice(null)).toBe('$0')
      expect(formatPrice(undefined)).toBe('$0')
      expect(calculateDiscount(null, 100)).toBe(0)
      expect(validateEmail(null)).toBe(false)
      expect(generateSlug(null)).toBe('')
    })

    it('handles extreme values', () => {
      expect(formatPrice(Number.MAX_SAFE_INTEGER)).toBeDefined()
      expect(calculateDiscount(Number.MAX_SAFE_INTEGER, 1)).toBe(100)
    })

    it('handles non-string inputs for string functions', () => {
      expect(generateSlug(123)).toBe('123')
      expect(validateEmail(123)).toBe(false)
      expect(sanitizeInput(123)).toBe('123')
    })
  })
})
