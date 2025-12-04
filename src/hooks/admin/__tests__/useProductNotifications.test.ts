/**
 * Tests Unitarios - useProductNotifications Hook
 * Validación de que NO existen métodos genéricos showSuccess/showInfo/showError
 */

import { renderHook } from '@testing-library/react'
import { useProductNotifications } from '../useProductNotifications'

// Mock de toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn((config) => ({
    id: 'test-toast-id',
    dismiss: jest.fn(),
    update: jest.fn(),
  })),
}))

import { toast } from '@/components/ui/use-toast'

describe('useProductNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Métodos CRUD de Productos', () => {
    it('debe tener método showProductCreated', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProductCreated).toBeDefined()
      expect(typeof result.current.showProductCreated).toBe('function')
    })

    it('showProductCreated debe llamar toast con configuración correcta', () => {
      const { result } = renderHook(() => useProductNotifications())

      result.current.showProductCreated({
        productName: 'Látex Eco Painting',
        sku: '3099',
        price: 4975,
      })

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
          title: '✅ Producto creado exitosamente',
        })
      )
    })

    it('debe tener método showProductUpdated', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProductUpdated).toBeDefined()
      expect(typeof result.current.showProductUpdated).toBe('function')
    })

    it('showProductUpdated debe llamar toast correctamente', () => {
      const { result } = renderHook(() => useProductNotifications())

      result.current.showProductUpdated({
        productName: 'Látex Eco Painting',
        productId: 92,
      })

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
          title: '✅ Producto actualizado',
        })
      )
    })

    it('debe tener método showProductDeleted', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProductDeleted).toBeDefined()
    })
  })

  describe('Métodos de Error', () => {
    it('debe tener método showProductCreationError', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProductCreationError).toBeDefined()
      expect(typeof result.current.showProductCreationError).toBe('function')
    })

    it('showProductCreationError debe llamar toast con variant destructive', () => {
      const { result } = renderHook(() => useProductNotifications())

      result.current.showProductCreationError('Error al crear')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: '❌ Error al crear producto',
        })
      )
    })

    it('debe tener método showProductUpdateError', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProductUpdateError).toBeDefined()
    })

    it('showProductUpdateError debe incluir nombre del producto', () => {
      const { result } = renderHook(() => useProductNotifications())

      result.current.showProductUpdateError('Error de validación', 'Látex Eco Painting')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: '❌ Error al actualizar producto',
          description: expect.stringContaining('Látex Eco Painting'),
        })
      )
    })
  })

  describe('Métodos de Información', () => {
    it('debe tener método showInfoMessage', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showInfoMessage).toBeDefined()
      expect(typeof result.current.showInfoMessage).toBe('function')
    })

    it('showInfoMessage debe aceptar título y mensaje personalizados', () => {
      const { result } = renderHook(() => useProductNotifications())

      result.current.showInfoMessage('Variante actualizada', 'La variante se actualizó exitosamente')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'info',
          title: 'ℹ️ Variante actualizada',
          description: 'La variante se actualizó exitosamente',
        })
      )
    })

    it('debe tener método showProcessingInfo', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showProcessingInfo).toBeDefined()
    })
  })

  describe('Métodos de Inventario', () => {
    it('debe tener método showInventoryUpdated', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showInventoryUpdated).toBeDefined()
    })

    it('debe tener método showLowStockAlert', () => {
      const { result } = renderHook(() => useProductNotifications())

      expect(result.current.showLowStockAlert).toBeDefined()
    })
  })

  describe('Métodos NO Deben Existir (Bug Corregido)', () => {
    it('NO debe tener método genérico showSuccess', () => {
      const { result } = renderHook(() => useProductNotifications())

      // @ts-expect-error - Verificamos que NO existe
      expect(result.current.showSuccess).toBeUndefined()
    })

    it('NO debe tener método genérico showInfo', () => {
      const { result } = renderHook(() => useProductNotifications())

      // @ts-expect-error - Verificamos que NO existe
      expect(result.current.showInfo).toBeUndefined()
    })

    it('NO debe tener método genérico showError', () => {
      const { result } = renderHook(() => useProductNotifications())

      // @ts-expect-error - Verificamos que NO existe
      expect(result.current.showError).toBeUndefined()
    })
  })

  describe('Todos los Métodos Disponibles', () => {
    it('debe exportar todos los métodos esperados', () => {
      const { result } = renderHook(() => useProductNotifications())

      const expectedMethods = [
        'showProductCreated',
        'showProductUpdated',
        'showProductDeleted',
        'showProductDuplicated',
        'showProductStatusChanged',
        'showInventoryUpdated',
        'showLowStockAlert',
        'showOutOfStockAlert',
        'showRestockedAlert',
        'showBulkActionSuccess',
        'showBulkActionPartial',
        'showExportSuccess',
        'showImportSuccess',
        'showProcessingInfo',
        'showDataRefreshed',
        'showProductCreationError',
        'showProductUpdateError',
        'showProductDeleteError',
        'showBulkActionError',
        'showExportError',
        'showImportError',
        'showNetworkError',
        'showValidationWarning',
        'showDuplicateSkuWarning',
        'showImageUploadWarning',
        'showVariantWarning',
        'showInfoMessage',
      ]

      expectedMethods.forEach((method) => {
        expect(result.current[method]).toBeDefined()
        expect(typeof result.current[method]).toBe('function')
      })
    })
  })
})

