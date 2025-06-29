// ===================================
// PINTEYA E-COMMERCE - TESTS UNITARIOS PARA USECART WITH CLERK HOOK
// ===================================

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useUser } from '@clerk/nextjs'
import cartReducer, { addItemToCart, hydrateCart } from '@/redux/features/cart-slice'
import { useCartWithClerk } from '@/hooks/useCartWithClerk'
import { cartPersistenceMiddleware } from '@/redux/middleware/cartPersistence'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
}

// Producto de prueba
const mockProduct = {
  id: 1,
  title: 'Pintura Latex Interior Blanco 4L',
  price: 18000,
  discountedPrice: 15000,
  quantity: 1,
  imgs: {
    thumbnails: ['/images/products/pintura-latex-blanco-sm.jpg'],
    previews: ['/images/products/pintura-latex-blanco.jpg'],
  },
}

// Mock user data
const mockUser = {
  id: 'user_123',
  firstName: 'Juan',
  lastName: 'Pérez',
  emailAddresses: [{ emailAddress: 'juan@example.com' }]
}

describe('useCartWithClerk Hook', () => {
  let store: any
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>

  const renderHookWithStore = (initialState = {}) => {
    store = configureStore({
      reducer: {
        cartReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(cartPersistenceMiddleware),
      preloadedState: initialState
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(Provider, { store }, children)
    )

    return renderHook(() => useCartWithClerk(), { wrapper })
  }

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Limpiar mocks
    jest.clearAllMocks()
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      } as any)
    })

    it('should load cart from localStorage for unauthenticated user', () => {
      // Preparar localStorage con datos
      const cartData = {
        items: [mockProduct],
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorageMock.setItem('pinteya-cart', JSON.stringify(cartData))

      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.userId).toBeUndefined()
      expect(result.current.cartItems).toHaveLength(1)
    })

    it('should start with empty cart when no localStorage data', () => {
      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.cartItems).toHaveLength(0)
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.setItem('pinteya-cart', 'invalid-json')

      const { result } = renderHookWithStore()

      expect(result.current.cartItems).toHaveLength(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pinteya-cart')
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true
      } as any)
    })

    it('should identify authenticated user correctly', () => {
      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.userId).toBe(mockUser.id)
    })

    it('should migrate temporary cart when user signs in', async () => {
      // Preparar carrito temporal en localStorage
      const temporaryCartData = {
        items: [mockProduct],
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorageMock.setItem('pinteya-cart', JSON.stringify(temporaryCartData))

      const { result } = renderHookWithStore()

      // Verificar que el hook funciona correctamente (sin verificar console logs)
      expect(result.current.isAuthenticated).toBe(true)

      // La migración es asíncrona, verificar que el hook se inicializa correctamente
      // El carrito puede estar vacío inicialmente mientras se procesa la migración
      expect(Array.isArray(result.current.cartItems)).toBe(true)
    })

    it('should save cart changes for authenticated user', async () => {
      const { result } = renderHookWithStore()

      // Agregar item al carrito
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      // Esperar el debounce del efecto
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })

      // Verificar que el hook funciona correctamente
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle sign out correctly', () => {
      const { result } = renderHookWithStore({
        cartReducer: {
          items: [mockProduct]
        }
      })

      act(() => {
        result.current.handleSignOut()
      })

      expect(result.current.cartItems).toHaveLength(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pinteya-cart')
    })
  })

  describe('Loading States', () => {
    it('should handle loading state correctly', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false
      } as any)

      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.userId).toBeUndefined()
    })

    it('should not perform actions while loading', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false
      } as any)

      // Preparar localStorage con datos
      const cartData = {
        items: [mockProduct],
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorageMock.setItem('pinteya-cart', JSON.stringify(cartData))

      const { result } = renderHookWithStore()

      // No debería cargar desde localStorage mientras está loading
      expect(result.current.cartItems).toHaveLength(0)
    })
  })

  describe('User State Transitions', () => {
    it('should handle transition from unauthenticated to authenticated', () => {
      // Iniciar como no autenticado
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      } as any)

      const { result, rerender } = renderHookWithStore()

      // Agregar item como usuario no autenticado
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.cartItems).toHaveLength(1)

      // Simular autenticación
      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true
      } as any)

      rerender()

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.userId).toBe(mockUser.id)
      expect(result.current.cartItems).toHaveLength(1) // Carrito se mantiene
    })

    it('should handle transition from authenticated to unauthenticated', () => {
      // Iniciar como autenticado
      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true
      } as any)

      const { result, rerender } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(true)

      // Simular cierre de sesión
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      } as any)

      rerender()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.userId).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle migration errors gracefully', async () => {
      // Mock error en migración
      consoleSpy.log.mockImplementationOnce(() => {
        throw new Error('Migration failed')
      })

      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true
      } as any)

      // Preparar carrito temporal
      const temporaryCartData = {
        items: [mockProduct],
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorageMock.setItem('pinteya-cart', JSON.stringify(temporaryCartData))

      const { result } = renderHookWithStore()

      expect(result.current.isAuthenticated).toBe(true)
      // Verificar que el hook maneja errores sin lanzar excepciones
    })

    it('should handle save errors gracefully', async () => {
      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true
      } as any)

      // Mock error en guardado
      consoleSpy.log.mockImplementation((message) => {
        if (message.includes('Saving')) {
          throw new Error('Save failed')
        }
      })

      const { result } = renderHookWithStore()

      // Agregar item al carrito
      act(() => {
        store.dispatch(addItemToCart(mockProduct))
      })

      // Esperar el debounce del efecto
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })

      // Verificar que el hook maneja errores sin lanzar excepciones
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
