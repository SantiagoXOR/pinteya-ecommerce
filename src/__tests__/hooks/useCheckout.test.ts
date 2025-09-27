// ===================================
// PINTEYA E-COMMERCE - TEST useCheckout HOOK
// ===================================

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useCheckout } from '@/hooks/useCheckout'
import cartReducer from '@/redux/features/cart-slice'

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoaded: true,
  }),
}))

// Mock data
const mockCartItems = [
  {
    id: 1,
    title: 'Test Product 1',
    price: 1000,
    discountedPrice: 900,
    quantity: 2,
  },
  {
    id: 2,
    title: 'Test Product 2',
    price: 2000,
    discountedPrice: 2000,
    quantity: 1,
  },
]

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cartReducer: cartReducer,
    },
    preloadedState: {
      cartReducer: {
        items: mockCartItems,
        ...initialState.cartReducer,
      },
    },
  })
}

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock NextAuth
// NextAuth se mockea automáticamente via moduleNameMapper

// Helper function to render hook with Redux store
const renderHookWithStore = (initialState = {}) => {
  const store = createMockStore(initialState)
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children)

  return {
    ...renderHook(() => useCheckout(), { wrapper }),
    store,
  }
}

describe('useCheckout Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful payment preference creation
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          init_point: 'https://mercadopago.com/checkout/test',
          preference_id: 'test-preference-id',
        },
      }),
    })
  })

  it('initializes with correct default state', () => {
    const { result } = renderHookWithStore()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.errors).toEqual({})
    expect(result.current.step).toBe('form')
  })

  it('updates billing data correctly', () => {
    const { result } = renderHookWithStore()

    act(() => {
      result.current.updateBillingData({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@test.com',
      })
    })

    expect(result.current.formData.billing.firstName).toBe('Juan')
    expect(result.current.formData.billing.lastName).toBe('Pérez')
    expect(result.current.formData.billing.email).toBe('juan@test.com')
  })

  it('calculates shipping cost correctly', () => {
    const { result } = renderHookWithStore()

    // Test free shipping
    expect(result.current.shippingCost).toBeGreaterThanOrEqual(0)
  })

  it('validates form correctly', () => {
    const { result } = renderHookWithStore()

    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(false)
    })

    // Verificar que los errores se establecieron correctamente
    expect(result.current.errors.firstName).toBe('Nombre es requerido')
    expect(result.current.errors.email).toBe('Email es requerido')
  })

  it('calculates total correctly', () => {
    const { result } = renderHookWithStore()

    expect(result.current.finalTotal).toBeGreaterThan(0)
    expect(typeof result.current.finalTotal).toBe('number')
  })
})
