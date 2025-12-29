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
  })
})

