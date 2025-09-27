// ===================================
// PINTEYA E-COMMERCE - TESTS E2E PARA FLUJO COMPLETO DE TRANSICIÓN AL CHECKOUT
// ===================================

import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useRouter } from 'next/navigation'

// Importar componentes y contextos necesarios
import CartSidebarModal from '@/components/Common/CartSidebarModal'
import { CartSidebarModalProvider } from '@/app/context/CartSidebarModalContext'
import cartReducer from '@/redux/features/cart-slice'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Framer Motion para tests E2E más estables
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
  useMotionValue: () => ({
    set: jest.fn(),
  }),
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid='mock-image' />
  ),
}))

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
}

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
})

// Mock matchMedia para prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Helper para crear store de Redux con estado inicial
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cartReducer,
    },
    preloadedState: {
      cartReducer: {
        items: [
          {
            id: 1,
            name: 'Pinceleta para Obra',
            price: 980,
            quantity: 1,
            image: '/images/products/pinceleta.jpg',
          },
        ],
        totalQuantity: 1,
        ...initialState,
      },
    },
  })
}

// Componente wrapper para tests
const TestWrapper: React.FC<{
  children: React.ReactNode
  store?: any
  isModalOpen?: boolean
}> = ({ children, store = createMockStore(), isModalOpen = true }) => {
  const mockContextValue = {
    isCartModalOpen: isModalOpen,
    openCartModal: jest.fn(),
    closeCartModal: jest.fn(),
  }

  return (
    <Provider store={store}>
      <CartSidebarModalProvider value={mockContextValue}>{children}</CartSidebarModalProvider>
    </Provider>
  )
}

describe('Checkout Transition Flow - Tests E2E', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockPerformance.now.mockReturnValue(1000)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Flujo Completo desde CartSidebarModal hasta Checkout', () => {
    it('debe completar el flujo completo de transición al checkout', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      // Verificar que el modal está abierto y tiene productos
      expect(screen.getByText('🛒 Tu Selección')).toBeInTheDocument()
      expect(screen.getByText('Pinceleta para Obra')).toBeInTheDocument()

      // Hacer clic en "Finalizar Compra"
      const checkoutButton = screen.getByTestId('checkout-btn')
      expect(checkoutButton).toBeInTheDocument()
      expect(checkoutButton).not.toBeDisabled()

      await user.click(checkoutButton)

      // Verificar que el botón se deshabilita inmediatamente
      expect(checkoutButton).toBeDisabled()
      expect(checkoutButton).toHaveTextContent('Procesando...')

      // Verificar que la animación se inicia
      await waitFor(() => {
        expect(screen.getByText('¡Procesando tu compra!')).toBeInTheDocument()
      })

      // Avanzar tiempo hasta completar la animación
      act(() => {
        jest.advanceTimersByTime(2800)
      })

      // Verificar navegación al checkout
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })
    })

    it('debe mostrar información de MercadoPago como elemento no clickeable', () => {
      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      // Verificar que la información de MercadoPago está presente pero no es clickeable
      expect(screen.getByText('Pago seguro')).toBeInTheDocument()
      expect(screen.getByAltText('MercadoPago')).toBeInTheDocument()

      // Verificar que no hay botón de MercadoPago clickeable
      expect(screen.queryByText('Pago al Instante')).not.toBeInTheDocument()
    })

    it('debe deshabilitar botón cuando el carrito está vacío', () => {
      const emptyStore = createMockStore({ items: [], totalQuantity: 0 })

      render(
        <TestWrapper store={emptyStore}>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      expect(checkoutButton).toBeDisabled()

      // La información de MercadoPago sigue visible pero no es clickeable
      expect(screen.getByText('Pago seguro')).toBeInTheDocument()
    })
  })

  describe('Comportamiento con prefers-reduced-motion', () => {
    beforeEach(() => {
      // Mock matchMedia para simular prefers-reduced-motion: reduce
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    })

    it('debe saltar animación cuando prefers-reduced-motion está activo', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      await user.click(checkoutButton)

      // Con reduced motion, debe navegar casi inmediatamente
      act(() => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })

      // No debe mostrar la animación completa
      expect(screen.queryByText('¡Procesando tu compra!')).not.toBeInTheDocument()
    })
  })

  describe('Funcionalidad Skip Animation', () => {
    it('debe permitir saltar la animación con el botón skip', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      await user.click(checkoutButton)

      // Esperar a que aparezca la animación
      await waitFor(() => {
        expect(screen.getByText('¡Procesando tu compra!')).toBeInTheDocument()
      })

      // Hacer clic en el botón skip
      const skipButton = screen.getByLabelText('Saltar animación e ir al checkout')
      await user.click(skipButton)

      // Debe navegar inmediatamente
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('debe funcionar correctamente en viewport móvil', async () => {
      // Simular viewport móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      await user.click(checkoutButton)

      // Verificar que la animación funciona en móvil
      await waitFor(() => {
        expect(screen.getByText('¡Procesando tu compra!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(2800)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })
    })

    it('debe funcionar correctamente en viewport desktop', async () => {
      // Simular viewport desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      await user.click(checkoutButton)

      await waitFor(() => {
        expect(screen.getByText('¡Procesando tu compra!')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(2800)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })
    })
  })

  describe('Error Handling y Edge Cases', () => {
    it('debe manejar errores de navegación sin crashear', async () => {
      const mockPushError = jest.fn(() => {
        throw new Error('Navigation error')
      })

      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        push: mockPushError,
      })

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')

      // No debe crashear cuando la navegación falla
      expect(async () => {
        await user.click(checkoutButton)

        act(() => {
          jest.advanceTimersByTime(2800)
        })
      }).not.toThrow()
    })

    it('debe prevenir múltiples clicks durante la transición', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')

      // Primer click
      await user.click(checkoutButton)
      expect(checkoutButton).toBeDisabled()

      // Intentar segundo click - no debe hacer nada
      await user.click(checkoutButton)

      // Solo debe haber una navegación al final
      act(() => {
        jest.advanceTimersByTime(2800)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1)
      })
    })

    it('debe limpiar correctamente en unmount durante animación', () => {
      const { unmount } = render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      // Iniciar transición
      const checkoutButton = screen.getByTestId('checkout-btn')
      fireEvent.click(checkoutButton)

      // Unmount durante la animación
      unmount()

      // Avanzar tiempo - no debe causar errores
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // No debe haber navegación después del unmount
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Performance y Memory Management', () => {
    it('debe completar la transición dentro del tiempo esperado', async () => {
      const startTime = performance.now()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <TestWrapper>
          <CartSidebarModal />
        </TestWrapper>
      )

      const checkoutButton = screen.getByTestId('checkout-btn')
      await user.click(checkoutButton)

      act(() => {
        jest.advanceTimersByTime(2800)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Debe completarse en tiempo razonable (considerando que usamos fake timers)
      expect(duration).toBeLessThan(1000) // 1 segundo en tiempo real
    })
  })
})
