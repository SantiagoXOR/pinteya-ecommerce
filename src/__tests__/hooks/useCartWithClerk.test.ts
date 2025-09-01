/**
 * Test simplificado para useCartWithClerk
 * Enfocado en validar la funcionalidad core sin complejidades
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useAuth } from '@/hooks/useAuth'
import cartReducer, { addItemToCart } from '@/redux/features/cart-slice'
import { useCartWithClerk } from '@/hooks/useCartWithClerk'

// Mock para evitar problemas de dependencias
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock user data
const mockUser = {
  id: 'user_123',
  name: 'Juan Pérez',
  email: 'juan@example.com'
}

// Mock product data
const mockProduct = {
  id: 1,
  name: 'Pintura Latex Interior',
  price: 5000,
  category: 'Pinturas'
}

describe('useCartWithClerk Hook - Simplified', () => {
  let store: any
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  const renderHookWithStore = () => {
    store = configureStore({
      reducer: {
        cartReducer
      }
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children)

    return renderHook(() => useCartWithClerk(), { wrapper })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        session: null,
        status: 'unauthenticated'
      } as any)
    })

    it('should handle unauthenticated user correctly', () => {
      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.userId).toBeUndefined()
      expect(Array.isArray(result.current.cartItems)).toBe(true)
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        session: { user: mockUser },
        status: 'authenticated'
      } as any)
    })

    it('should identify authenticated user correctly', () => {
      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.userId).toBe(mockUser.id)
      expect(Array.isArray(result.current.cartItems)).toBe(true)
    })

    it('should handle cart changes for authenticated user', () => {
      const { result } = renderHookWithStore()

      // Verificar estado inicial
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.cartItems).toHaveLength(0)

      // Agregar item al carrito usando Redux dispatch
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      // Verificar que el item se agregó correctamente
      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.cartItems[0]).toEqual(expect.objectContaining({
        id: mockProduct.id,
        price: mockProduct.price
      }))
    })
  })

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        session: null,
        status: 'loading'
      } as any)
    })

    it('should handle loading state correctly', () => {
      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(false)
      expect(Array.isArray(result.current.cartItems)).toBe(true)
    })
  })
})
