// ===================================
// EJEMPLO DE USO DE MOCKS CENTRALIZADOS - PINTEYA E-COMMERCE
// ===================================

/**
 * Test de ejemplo que demuestra el uso de los mocks centralizados
 * Este archivo sirve como referencia para futuros tests
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useProducts } from '@/hooks/useProducts'
import { setupApiMocks, mockApiResponses, mockConfigurations } from '../__mocks__/api-mocks'
import { createMockUseProducts, mockUseProductsState } from '../__mocks__/hooks-mocks'

describe('Ejemplo de Mocks Centralizados', () => {
  // Setup de mocks usando helper centralizado
  const { mockFetch, resetMocks, mockSuccess, mockError, mockHttpError } = setupApiMocks()

  beforeEach(() => {
    resetMocks()
  })

  describe('API Mocks Centralizados', () => {
    it('debe usar respuesta exitosa por defecto', async () => {
      // El mock ya está configurado con respuesta exitosa por defecto
      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toHaveLength(3) // mockProducts tiene 3 items
      expect(result.current.error).toBeNull()
    })

    it('debe manejar errores usando helper mockError', async () => {
      mockError('Network connection failed')

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Error obteniendo productos')
      expect(result.current.products).toEqual([])
    })

    it('debe manejar errores HTTP usando helper mockHttpError', async () => {
      mockHttpError(500, 'Internal Server Error')

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Error obteniendo productos')
      expect(result.current.products).toEqual([])
    })

    it('debe usar respuestas predefinidas', async () => {
      // Usar respuesta vacía predefinida
      mockSuccess(mockApiResponses.products.empty)

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toEqual([])
      expect(result.current.pagination.total).toBe(0)
    })

    it('debe usar configuraciones mock comunes', async () => {
      // Usar configuración de error 404
      mockFetch.mockResolvedValueOnce(mockConfigurations.notFound())

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Error obteniendo productos')
    })
  })

  describe('Hook Mocks Centralizados', () => {
    it('debe crear mock de useProducts con estado por defecto', () => {
      const mockHook = createMockUseProducts()

      expect(mockHook.products).toHaveLength(3)
      expect(mockHook.loading).toBe(false)
      expect(mockHook.error).toBeNull()
      expect(mockHook.hasProducts).toBe(true)
      expect(typeof mockHook.fetchProducts).toBe('function')
    })

    it('debe crear mock de useProducts con estado personalizado', () => {
      const mockHook = createMockUseProducts(mockUseProductsState.loading)

      expect(mockHook.products).toEqual([])
      expect(mockHook.loading).toBe(true)
      expect(mockHook.error).toBeNull()
      expect(mockHook.hasProducts).toBe(false)
    })

    it('debe crear mock de useProducts con estado de error', () => {
      const mockHook = createMockUseProducts(mockUseProductsState.error)

      expect(mockHook.products).toEqual([])
      expect(mockHook.loading).toBe(false)
      expect(mockHook.error).toBe('Error obteniendo productos')
      expect(mockHook.hasError).toBe(true)
    })
  })

  describe('Ventajas de Mocks Centralizados', () => {
    it('debe proporcionar datos consistentes entre tests', async () => {
      // Primer test
      const { result: result1 } = renderHook(() => useProducts())
      await waitFor(() => expect(result1.current.loading).toBe(false))

      // Segundo test con reset
      resetMocks()
      const { result: result2 } = renderHook(() => useProducts())
      await waitFor(() => expect(result2.current.loading).toBe(false))

      // Ambos deben tener los mismos datos mock
      expect(result1.current.products).toEqual(result2.current.products)
    })

    it('debe facilitar testing de casos edge', async () => {
      // Caso: respuesta con delay para testing de loading states
      mockFetch.mockResolvedValueOnce(
        mockConfigurations.delayed(mockApiResponses.products.success, 100)
      )

      const { result } = renderHook(() => useProducts())

      // Inicialmente debe estar cargando
      expect(result.current.loading).toBe(true)

      // Después del delay debe tener datos
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toHaveLength(3)
    })

    it('debe permitir testing de múltiples llamadas API', async () => {
      // Primera llamada: éxito
      mockSuccess(mockApiResponses.products.success)

      // Segunda llamada: error
      mockError('Second call failed')

      const { result } = renderHook(() => useProducts())

      // Primera llamada exitosa
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.products).toHaveLength(3)

      // Simular segunda llamada (ej: refresh)
      result.current.fetchProducts()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.error).toBe('Error obteniendo productos')
    })
  })

  describe('Reutilización de Mocks', () => {
    it('debe reutilizar mocks entre diferentes hooks', () => {
      // Los mismos datos mock pueden usarse para diferentes hooks
      const productsData = mockApiResponses.products.success.data

      expect(productsData).toHaveLength(3)
      expect(productsData[0]).toHaveProperty('name')
      expect(productsData[0]).toHaveProperty('price')
      expect(productsData[0]).toHaveProperty('category')
    })

    it('debe mantener estructura consistente de respuestas', () => {
      const responses = [
        mockApiResponses.products.success,
        mockApiResponses.products.empty,
        mockApiResponses.products.error,
      ]

      responses.forEach(response => {
        expect(response).toHaveProperty('success')
        expect(response).toHaveProperty('data')
        expect(response).toHaveProperty('pagination')
      })
    })
  })
})

// ===================================
// DOCUMENTACIÓN DE MEJORES PRÁCTICAS
// ===================================

/**
 * MEJORES PRÁCTICAS PARA USAR MOCKS CENTRALIZADOS:
 *
 * 1. SETUP CONSISTENTE:
 *    - Usar setupApiMocks() en beforeEach
 *    - Llamar resetMocks() para limpiar estado
 *
 * 2. HELPERS ESPECÍFICOS:
 *    - mockSuccess() para respuestas exitosas
 *    - mockError() para errores de red
 *    - mockHttpError() para errores HTTP específicos
 *
 * 3. DATOS REALISTAS:
 *    - Usar mockApiResponses.* para datos predefinidos
 *    - Mantener estructura consistente con API real
 *
 * 4. CASOS EDGE:
 *    - Usar mockConfigurations.* para casos especiales
 *    - Testing de loading states con delayed responses
 *
 * 5. REUTILIZACIÓN:
 *    - Importar mocks desde archivos centralizados
 *    - Evitar duplicar datos mock en cada test
 *
 * 6. MANTENIMIENTO:
 *    - Actualizar mocks cuando cambie la API
 *    - Mantener sincronizados con tipos TypeScript
 */
