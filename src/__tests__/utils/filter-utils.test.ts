// ===================================
// PINTEYA E-COMMERCE - TESTS PARA filter-utils
// ===================================

import { buildFilterBadgesFromProducts } from '@/utils/filter-utils'

describe('filter-utils', () => {
  describe('buildFilterBadgesFromProducts', () => {
    it('should return empty arrays for undefined products', () => {
      const result = buildFilterBadgesFromProducts(undefined)
      expect(result.measures).toEqual([])
      expect(result.colors).toEqual([])
    })

    it('should return empty arrays for empty products array', () => {
      const result = buildFilterBadgesFromProducts([])
      expect(result.measures).toEqual([])
      expect(result.colors).toEqual([])
    })

    it('should extract measures from variants', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
            { measure: '1L', color_name: 'NEGRO', color_hex: '#000000' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toContain('4L')
      expect(result.measures).toContain('1L')
    })

    it('should extract colors from variants', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
            { measure: '1L', color_name: 'NEGRO', color_hex: '#000000' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.colors.length).toBe(2)
      expect(result.colors.find(c => c.name === 'BLANCO')).toBeDefined()
      expect(result.colors.find(c => c.name === 'NEGRO')).toBeDefined()
    })

    it('should exclude INCOLORO from colors', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
            { measure: '1L', color_name: 'INCOLORO', color_hex: '#FFFFFF' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.colors.find(c => c.name === 'INCOLORO')).toBeUndefined()
      expect(result.colors.length).toBe(1)
    })

    it('should extract measures from legacy medida field when no variants', () => {
      const products = [
        {
          title: 'Pintura Test',
          medida: '4L',
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toContain('4L')
    })

    it('should extract colors from legacy color field when no variants', () => {
      const products = [
        {
          title: 'Pintura Test',
          color: 'BLANCO, NEGRO',
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.colors.length).toBe(2)
      expect(result.colors.find(c => c.name === 'BLANCO')).toBeDefined()
      expect(result.colors.find(c => c.name === 'NEGRO')).toBeDefined()
    })

    it('should handle products with both variants and legacy fields', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
          ],
          medida: '1L', // Should be ignored when variants exist
          color: 'NEGRO', // Should be ignored when variants exist
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      // Should only use variants
      expect(result.measures).toContain('4L')
      expect(result.measures).not.toContain('1L')
      expect(result.colors.find(c => c.name === 'BLANCO')).toBeDefined()
      expect(result.colors.find(c => c.name === 'NEGRO')).toBeUndefined()
    })

    it('should handle products with name field instead of title', () => {
      const products = [
        {
          name: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toContain('4L')
      expect(result.colors.length).toBe(1)
    })

    it('should deduplicate measures', () => {
      const products = [
        {
          title: 'Pintura Test 1',
          variants: [{ measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' }],
        },
        {
          title: 'Pintura Test 2',
          variants: [{ measure: '4L', color_name: 'NEGRO', color_hex: '#000000' }],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures.filter(m => m === '4L').length).toBe(1)
    })

    it('should deduplicate colors', () => {
      const products = [
        {
          title: 'Pintura Test 1',
          variants: [{ measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' }],
        },
        {
          title: 'Pintura Test 2',
          variants: [{ measure: '1L', color_name: 'BLANCO', color_hex: '#FFFFFF' }],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.colors.filter(c => c.name === 'BLANCO').length).toBe(1)
    })

    it('should handle products without variants or legacy fields', () => {
      const products = [
        {
          title: 'Producto Sin Variantes',
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toEqual([])
      expect(result.colors).toEqual([])
    })

    it('should use default hex color when color_hex is missing', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'BLANCO' }, // No color_hex
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      const blancoColor = result.colors.find(c => c.name === 'BLANCO')
      expect(blancoColor).toBeDefined()
      expect(blancoColor?.hex).toBe('#FFFFFF')
    })

    // ===================================
    // CASOS EDGE ADICIONALES
    // ===================================

    it('should handle products with null values', () => {
      const products = [
        {
          title: null,
          variants: null,
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toEqual([])
      expect(result.colors).toEqual([])
    })

    it('should handle products with undefined fields', () => {
      const products = [
        {
          title: undefined,
          variants: undefined,
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toEqual([])
      expect(result.colors).toEqual([])
    })

    it('should handle very large product arrays', () => {
      const products = Array.from({ length: 1000 }, (_, i) => ({
        title: `Producto ${i}`,
        variants: [
          { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
        ],
      }))

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toContain('4L')
      expect(result.colors.length).toBeGreaterThan(0)
    })

    it('should handle products with empty variant arrays', () => {
      const products = [
        {
          title: 'Producto Test',
          variants: [],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      // Should fallback to legacy fields or return empty
      expect(result).toBeDefined()
    })

    it('should handle color names with special characters', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4L', color_name: 'ROJO TEJA', color_hex: '#A63A2B' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.colors.find(c => c.name === 'ROJO TEJA')).toBeDefined()
    })

    it('should handle measure values with units', () => {
      const products = [
        {
          title: 'Pintura Test',
          variants: [
            { measure: '4 L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
            { measure: '1L', color_name: 'NEGRO', color_hex: '#000000' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures.length).toBeGreaterThan(0)
    })

    it('should handle products with both title and name fields', () => {
      const products = [
        {
          title: 'Producto Title',
          name: 'Producto Name',
          variants: [
            { measure: '4L', color_name: 'BLANCO', color_hex: '#FFFFFF' },
          ],
        },
      ]

      const result = buildFilterBadgesFromProducts(products)
      expect(result.measures).toContain('4L')
    })
  })
})

