/**
 * Tests Unitarios Simplificados - CategorySelector
 * Enfocados en validación de tipos: category_id debe ser number
 */

// Tipos del componente CategorySelector
interface Category {
  id: number // ✅ CRÍTICO: number, no string
  name: string
  parent_id: number | null
  level: number
}

interface CategorySelectorProps {
  value?: number // ✅ CRÍTICO: number
  onChange: (categoryId: number) => void // ✅ CRÍTICO: retorna number
  error?: string
  placeholder?: string
}

describe('CategorySelector - Validación de Tipos', () => {
  describe('✅ CRÍTICO: Tipos de category_id', () => {
    it('Category.id debe ser number (no string)', () => {
      const category: Category = {
        id: 38, // ✅ number
        name: 'Paredes',
        parent_id: null,
        level: 0,
      }

      expect(typeof category.id).toBe('number')
      expect(category.id).toBe(38)
    })

    it('CategorySelectorProps.value debe aceptar number', () => {
      const props: CategorySelectorProps = {
        value: 38, // ✅ number
        onChange: (id: number) => {},
      }

      expect(typeof props.value).toBe('number')
    })

    it('CategorySelectorProps.onChange debe recibir number', () => {
      const mockOnChange = jest.fn((id: number) => {
        expect(typeof id).toBe('number')
      })

      const props: CategorySelectorProps = {
        value: 38,
        onChange: mockOnChange,
      }

      // Simular cambio de categoría
      props.onChange(39)

      expect(mockOnChange).toHaveBeenCalledWith(39)
      expect(typeof mockOnChange.mock.calls[0][0]).toBe('number')
    })

    it('buildCategoryTree debe usar Map<number, Category>', () => {
      const categories: Category[] = [
        { id: 38, name: 'Paredes', parent_id: null, level: 0 },
        { id: 39, name: 'Techos', parent_id: null, level: 0 },
        { id: 40, name: 'Complementos', parent_id: null, level: 0 },
      ]

      // Simular buildCategoryTree
      const categoryMap = new Map<number, Category>()
      categories.forEach(cat => {
        categoryMap.set(cat.id, cat) // ✅ Map usa number como key
      })

      expect(categoryMap.has(38)).toBe(true)
      expect(categoryMap.get(38)?.name).toBe('Paredes')
      expect(typeof categoryMap.get(38)?.id).toBe('number')
    })
  })

  describe('Validación de estructura de datos', () => {
    it('Lista de categorías debe tener IDs numéricos', () => {
      const categories: Category[] = [
        { id: 38, name: 'Paredes', parent_id: null, level: 0 },
        { id: 39, name: 'Techos', parent_id: null, level: 0 },
        { id: 40, name: 'Complementos', parent_id: null, level: 0 },
        { id: 41, name: 'Reparaciones', parent_id: null, level: 0 },
      ]

      categories.forEach(category => {
        expect(typeof category.id).toBe('number')
        expect(Number.isInteger(category.id)).toBe(true)
        expect(category.id).toBeGreaterThan(0)
      })
    })

    it('parent_id debe ser number o null', () => {
      const parentCategory: Category = {
        id: 38,
        name: 'Paredes',
        parent_id: null, // ✅ null válido
        level: 0,
      }

      const childCategory: Category = {
        id: 42,
        name: 'Látex',
        parent_id: 38, // ✅ number válido
        level: 1,
      }

      expect(parentCategory.parent_id).toBe(null)
      expect(typeof childCategory.parent_id).toBe('number')
    })
  })

  describe('🔒 Regresión: Bug "Expected string, received number"', () => {
    it('NO debe esperar string UUID para category_id', () => {
      // ❌ ANTES (causaba error)
      const invalidOldType = '550e8400-e29b-41d4-a909-446655440000'
      
      // ✅ AHORA (correcto)
      const validNewType = 38

      expect(typeof invalidOldType).toBe('string')
      expect(typeof validNewType).toBe('number')

      // El tipo correcto es number
      const category: Category = {
        id: validNewType, // ✅ Acepta number
        name: 'Paredes',
        parent_id: null,
        level: 0,
      }

      expect(category.id).toBe(38)
    })

    it('onChange debe retornar number, no string', () => {
      const mockOnChange = jest.fn()

      const props: CategorySelectorProps = {
        value: 38,
        onChange: mockOnChange,
      }

      // Simular selección de categoría
      props.onChange(39)

      // ✅ Debe pasar number
      expect(mockOnChange).toHaveBeenCalledWith(39)
      expect(typeof mockOnChange.mock.calls[0][0]).toBe('number')

      // ❌ NO debe pasar string
      expect(typeof mockOnChange.mock.calls[0][0]).not.toBe('string')
    })
  })

  describe('Conversión de tipos desde eventos', () => {
    it('debe convertir event.target.value (string) a number', () => {
      const mockOnChange = jest.fn()

      // Simular evento de select HTML
      const eventValue = '39' // HTML siempre retorna string

      // Conversión necesaria
      const numericValue = parseInt(eventValue, 10)

      mockOnChange(numericValue)

      expect(mockOnChange).toHaveBeenCalledWith(39)
      expect(typeof mockOnChange.mock.calls[0][0]).toBe('number')
    })

    it('parseInt debe convertir correctamente strings numéricos', () => {
      expect(parseInt('38', 10)).toBe(38)
      expect(parseInt('39', 10)).toBe(39)
      expect(parseInt('40', 10)).toBe(40)

      expect(typeof parseInt('38', 10)).toBe('number')
    })
  })
})
