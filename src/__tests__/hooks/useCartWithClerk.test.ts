/**
 * Tests completos para useCartWithClerk
 * Cubre funcionalidades de migración, persistencia y autenticación
 */

import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useAuth } from '@/hooks/useAuth'
import cartReducer, { addItemToCart } from '@/redux/features/cart-slice'
import { useCartWithClerk } from '@/hooks/useCartWithClerk'
import * as cartPersistence from '@/redux/middleware/cartPersistence'

// Mock para evitar problemas de dependencias
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

// Mock cart persistence functions
jest.mock('@/redux/middleware/cartPersistence', () => ({
  loadCartFromStorage: jest.fn(() => []),
  clearCartFromStorage: jest.fn(),
  migrateTemporaryCart: jest.fn(() => Promise.resolve(true)),
  loadUserCart: jest.fn(() => Promise.resolve([])),
  saveUserCart: jest.fn(() => Promise.resolve()),
  cartPersistenceMiddleware: jest.fn(() => (next) => (action) => next(action))
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

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

describe('useCartWithClerk Hook', () => {
  let store: any
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
  const mockCartPersistence = cartPersistence as jest.Mocked<typeof cartPersistence>

  const renderHookWithStore = () => {
    store = configureStore({
      reducer: {
        cartReducer
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children)

    return renderHook(() => useCartWithClerk(), { wrapper })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockCartPersistence.loadCartFromStorage.mockReturnValue([])
    mockCartPersistence.migrateTemporaryCart.mockResolvedValue(true)
    mockCartPersistence.loadUserCart.mockResolvedValue([])
    mockCartPersistence.saveUserCart.mockResolvedValue()
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

    it('should not trigger effects during loading', () => {
      renderHookWithStore()

      expect(mockCartPersistence.loadCartFromStorage).not.toHaveBeenCalled()
      expect(mockCartPersistence.migrateTemporaryCart).not.toHaveBeenCalled()
    })
  })

  describe('Cart Migration', () => {
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

    it('should migrate temporary cart when user logs in', async () => {
      const temporaryItems = [mockProduct]
      mockCartPersistence.loadCartFromStorage.mockReturnValue(temporaryItems)
      mockCartPersistence.loadUserCart.mockResolvedValue([])

      const { result } = renderHookWithStore()

      await waitFor(() => {
        expect(mockCartPersistence.migrateTemporaryCart).toHaveBeenCalledWith(
          temporaryItems,
          mockUser.id
        )
      })

      expect(mockCartPersistence.clearCartFromStorage).toHaveBeenCalled()
      expect(mockCartPersistence.loadUserCart).toHaveBeenCalledWith(mockUser.id)
    })

    it('should load user cart after migration', async () => {
      const userCartItems = [{ ...mockProduct, id: 2 }]
      mockCartPersistence.loadUserCart.mockResolvedValue(userCartItems)

      const { result } = renderHookWithStore()

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
        expect(result.current.cartItems[0].id).toBe(2)
      })
    })

    it('should handle migration errors gracefully', async () => {
      mockCartPersistence.migrateTemporaryCart.mockRejectedValue(new Error('Migration failed'))
      mockCartPersistence.loadCartFromStorage.mockReturnValue([mockProduct])

      const { result } = renderHookWithStore()

      // Wait for the effect to run
      await waitFor(() => {
        expect(mockCartPersistence.migrateTemporaryCart).toHaveBeenCalled()
      })

      // Verify console.error was called
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error during cart migration:',
          expect.any(Error)
        )
      })

      // Hook should still work despite migration error
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('Cart Persistence', () => {
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

    it('should save cart when items change', async () => {
      const { result } = renderHookWithStore()

      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      await waitFor(() => {
        expect(mockCartPersistence.saveUserCart).toHaveBeenCalledWith(
          mockUser.id,
          expect.arrayContaining([expect.objectContaining({ id: mockProduct.id })])
        )
      }, { timeout: 2000 })
    })

    it('should handle save errors gracefully', async () => {
      mockCartPersistence.saveUserCart.mockRejectedValue(new Error('Save failed'))

      const { result } = renderHookWithStore()

      // Add item to trigger save
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      // Wait for the debounced save to be called
      await waitFor(() => {
        expect(mockCartPersistence.saveUserCart).toHaveBeenCalled()
      }, { timeout: 2000 })

      // Wait for error to be logged
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error saving user cart:',
          expect.any(Error)
        )
      }, { timeout: 2000 })
    })
  })

  describe('Sign Out Handling', () => {
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

    it('should clear cart and storage on sign out', () => {
      const { result } = renderHookWithStore()

      // Add item first
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      expect(result.current.cartItems).toHaveLength(1)

      // Sign out
      act(() => {
        result.current.handleSignOut()
      })

      expect(result.current.cartItems).toHaveLength(0)
      expect(mockCartPersistence.clearCartFromStorage).toHaveBeenCalled()
    })
  })

  describe('Hook Functions', () => {
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

    it('should provide migrateCart function', async () => {
      const { result } = renderHookWithStore()

      expect(typeof result.current.migrateCart).toBe('function')

      await act(async () => {
        await result.current.migrateCart('test-user-id')
      })

      expect(mockCartPersistence.loadCartFromStorage).toHaveBeenCalled()
      expect(mockCartPersistence.loadUserCart).toHaveBeenCalledWith('test-user-id')
    })

    it('should provide saveCart function', async () => {
      const { result } = renderHookWithStore()

      expect(typeof result.current.saveCart).toBe('function')

      // Add item to cart first
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      await act(async () => {
        await result.current.saveCart('test-user-id')
      })

      expect(mockCartPersistence.saveUserCart).toHaveBeenCalledWith(
        'test-user-id',
        expect.arrayContaining([expect.objectContaining({ id: mockProduct.id })])
      )
    })
  })
})
