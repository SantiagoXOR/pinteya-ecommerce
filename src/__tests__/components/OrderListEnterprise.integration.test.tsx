// ===================================
// PINTEYA E-COMMERCE - INTEGRATION TESTS
// Pruebas de integración para OrderListEnterprise
// ===================================

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { jest } from '@jest/globals'
import { OrderListEnterprise } from '@/components/admin/orders/OrderListEnterprise'
import { OrderEnterprise, OrderStatus } from '@/types/orders-enterprise'
import { ApiResponse } from '@/types/api-strict'

// ===================================
// MOCKS
// ===================================

// Mock del fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock de toast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock de performance para monitoreo
const mockPerformanceNow = jest.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    },
  },
  writable: true,
})

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock de console
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

// ===================================
// DATOS DE PRUEBA
// ===================================

const mockOrders: OrderEnterprise[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2024-001',
    status: 'pending' as OrderStatus,
    previousStatus: null,
    statusHistory: [
      {
        status: 'pending' as OrderStatus,
        timestamp: new Date().toISOString(),
        reason: 'Order created',
        userId: 'user-1',
      },
    ],
    customerId: 'customer-1',
    customerEmail: 'customer1@example.com',
    customerPhone: '+1234567890',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Test Product 1',
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98,
        sku: 'TEST-SKU-001',
      },
    ],
    subtotal: 59.98,
    taxAmount: 4.8,
    shippingAmount: 9.99,
    discountAmount: 0,
    totalAmount: 74.77,
    currency: 'USD',
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
    },
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    shippingMethod: 'standard',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Test order notes',
    tags: ['test'],
    metadata: {
      source: 'web',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2024-002',
    status: 'processing' as OrderStatus,
    previousStatus: 'pending' as OrderStatus,
    statusHistory: [
      {
        status: 'pending' as OrderStatus,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reason: 'Order created',
        userId: 'user-1',
      },
      {
        status: 'processing' as OrderStatus,
        timestamp: new Date().toISOString(),
        reason: 'Payment confirmed',
        userId: 'user-1',
      },
    ],
    customerId: 'customer-2',
    customerEmail: 'customer2@example.com',
    customerPhone: '+1234567891',
    items: [
      {
        id: 'item-2',
        productId: 'product-2',
        productName: 'Test Product 2',
        quantity: 1,
        unitPrice: 49.99,
        totalPrice: 49.99,
        sku: 'TEST-SKU-002',
      },
    ],
    subtotal: 49.99,
    taxAmount: 4.0,
    shippingAmount: 9.99,
    discountAmount: 5.0,
    totalAmount: 58.98,
    currency: 'USD',
    shippingAddress: {
      street: '456 Test Ave',
      city: 'Test City',
      state: 'TS',
      zipCode: '12346',
      country: 'US',
    },
    billingAddress: {
      street: '456 Test Ave',
      city: 'Test City',
      state: 'TS',
      zipCode: '12346',
      country: 'US',
    },
    paymentMethod: 'paypal',
    paymentStatus: 'paid',
    shippingMethod: 'express',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Express delivery requested',
    tags: ['express', 'vip'],
    metadata: {
      source: 'mobile',
      campaign: 'summer-sale',
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockApiResponse: ApiResponse<OrderEnterprise[]> = {
  success: true,
  data: mockOrders,
  message: 'Orders retrieved successfully',
  timestamp: new Date().toISOString(),
  requestId: 'req-123',
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
}

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks()
  mockPerformanceNow.mockReturnValue(1000)
  mockLocalStorage.getItem.mockReturnValue(null)

  // Mock exitoso por defecto
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => mockApiResponse,
  })
})

afterEach(() => {
  jest.clearAllTimers()
})

// ===================================
// TESTS DE INTEGRACIÓN
// ===================================

describe('OrderListEnterprise - Integración', () => {
  describe('Renderizado inicial', () => {
    it('debe renderizar correctamente con datos', async () => {
      render(<OrderListEnterprise />)

      // Verificar que se muestra el loading inicialmente
      expect(screen.getByText(/cargando/i)).toBeInTheDocument()

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
        expect(screen.getByText('ORD-2024-002')).toBeInTheDocument()
      })

      // Verificar que se muestran los estados correctos
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
      expect(screen.getByText('Procesando')).toBeInTheDocument()
    })

    it('debe mostrar mensaje de error cuando falla la carga', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            variant: 'destructive',
          })
        )
      })
    })

    it('debe mostrar mensaje cuando no hay órdenes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockApiResponse,
          data: [],
          pagination: {
            ...mockApiResponse.pagination,
            total: 0,
          },
        }),
      })

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText(/no se encontraron órdenes/i)).toBeInTheDocument()
      })
    })
  })

  describe('Sistema de filtros', () => {
    it('debe filtrar por estado correctamente', async () => {
      render(<OrderListEnterprise />)

      // Esperar a que se carguen los datos iniciales
      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Aplicar filtro por estado
      const statusFilter = screen.getByLabelText(/estado/i)
      fireEvent.change(statusFilter, { target: { value: 'pending' } })

      // Verificar que se hace la petición con el filtro
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending'),
          expect.any(Object)
        )
      })
    })

    it('debe filtrar por rango de fechas', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Aplicar filtro de fecha
      const dateFromInput = screen.getByLabelText(/fecha desde/i)
      fireEvent.change(dateFromInput, {
        target: { value: '2024-01-01' },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('dateFrom=2024-01-01'),
          expect.any(Object)
        )
      })
    })

    it('debe manejar errores en filtros', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Simular error en filtro
      mockFetch.mockRejectedValueOnce(new Error('Filter error'))

      const statusFilter = screen.getByLabelText(/estado/i)
      fireEvent.change(statusFilter, { target: { value: 'invalid' } })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            variant: 'destructive',
          })
        )
      })
    })
  })

  describe('Sistema de paginación', () => {
    it('debe cambiar de página correctamente', async () => {
      // Mock con múltiples páginas
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockApiResponse,
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        }),
      })

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Cambiar a página 2
      const nextPageButton = screen.getByLabelText(/página siguiente/i)
      fireEvent.click(nextPageButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        )
      })
    })

    it('debe manejar errores en paginación', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Simular error en cambio de página
      mockFetch.mockRejectedValueOnce(new Error('Pagination error'))

      const nextPageButton = screen.getByLabelText(/página siguiente/i)
      fireEvent.click(nextPageButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            variant: 'destructive',
          })
        )
      })
    })
  })

  describe('Selección de órdenes', () => {
    it('debe permitir seleccionar órdenes individuales', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Seleccionar primera orden
      const firstCheckbox = screen.getAllByRole('checkbox')[1] // [0] es "select all"
      fireEvent.click(firstCheckbox)

      expect(firstCheckbox).toBeChecked()
    })

    it('debe permitir seleccionar todas las órdenes', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Seleccionar todas
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(selectAllCheckbox)

      // Verificar que todas las órdenes están seleccionadas
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.slice(1).forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })
  })

  describe('Sistema de monitoreo', () => {
    it('debe trackear renders correctamente', async () => {
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1010) // 10ms render

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Verificar que se está loggeando el monitoreo
      expect(mockConsoleLog).toHaveBeenCalled()
    })

    it('debe detectar renders lentos', async () => {
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1100) // 100ms render (lento)

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Verificar que se detecta el render lento
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Slow render detected'))
    })

    it('debe trackear errores en el monitoreo', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })

      // Verificar que el error se trackea en el monitoreo
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error tracked'))
    })
  })

  describe('Validación de tipos estricta', () => {
    it('debe manejar datos inválidos correctamente', async () => {
      const invalidResponse = {
        success: true,
        data: [
          {
            id: 'order-invalid',
            // Faltan campos requeridos
          },
        ],
        message: 'Success',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidResponse,
      })

      render(<OrderListEnterprise />)

      await waitFor(() => {
        // Debería mostrar mensaje de error por datos inválidos
        expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Invalid data'))
      })
    })

    it('debe validar estructura de respuesta API', async () => {
      const malformedResponse = {
        // Falta campo 'success'
        data: mockOrders,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => malformedResponse,
      })

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('API response validation failed')
        )
      })
    })
  })

  describe('Acciones masivas', () => {
    it('debe permitir acciones en órdenes seleccionadas', async () => {
      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Seleccionar órdenes
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1]) // Seleccionar primera orden
      fireEvent.click(checkboxes[2]) // Seleccionar segunda orden

      // Verificar que aparecen las acciones masivas
      expect(screen.getByText(/acciones seleccionadas/i)).toBeInTheDocument()
    })
  })

  describe('Actualización en tiempo real', () => {
    it('debe refrescar datos automáticamente', async () => {
      jest.useFakeTimers()

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      const initialCallCount = mockFetch.mock.calls.length

      // Avanzar tiempo para trigger refresh automático
      act(() => {
        jest.advanceTimersByTime(30000) // 30 segundos
      })

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount)
      })

      jest.useRealTimers()
    })
  })

  describe('Responsive design', () => {
    it('debe adaptarse a pantallas móviles', async () => {
      // Simular viewport móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<OrderListEnterprise />)

      await waitFor(() => {
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
      })

      // Verificar que se muestra la vista móvil
      expect(screen.getByTestId('mobile-order-list')).toBeInTheDocument()
    })
  })
})
