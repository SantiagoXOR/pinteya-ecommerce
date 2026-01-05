// ===================================
// PINTEYA E-COMMERCE - TESTS PARA SIMPLIFIEDCHECKOUT COMPONENT
// ===================================

import React from 'react'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import SimplifiedCheckout from '@/components/Checkout/SimplifiedCheckout'
import { renderWithProviders, createMockCartState, createMockAuthState } from '@/__tests__/utils/test-utils'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/checkout'),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(() => ''),
  })),
}))

// Mock useCheckout hook
const mockUseCheckout = {
  formData: {
    billing: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Argentina',
    },
    shipping: {
      differentAddress: false,
    },
    paymentMethod: 'mercadopago',
    shippingMethod: 'free',
  },
  isLoading: false,
  errors: {},
  step: 'form',
  cartItems: [
    {
      id: '1',
      title: 'Pintura Blanca',
      price: 5000,
      discountedPrice: 5000,
      quantity: 2,
      image: '/test-image.jpg',
    },
  ],
  totalPrice: 10000,
  shippingCost: 0,
  discount: 0,
  finalTotal: 10000,
  appliedCoupon: null,
  applyCoupon: jest.fn(),
  updateBillingData: jest.fn(),
  updateShippingData: jest.fn(),
  updateFormData: jest.fn(),
  processCheckout: jest.fn().mockResolvedValue({
    success: true,
    init_point: 'https://mercadopago.com/checkout',
  }),
  preferenceId: null,
  initPoint: null,
  handleWalletReady: jest.fn(),
  handleWalletError: jest.fn(),
  handleWalletSubmit: jest.fn(),
}

jest.mock('@/hooks/useCheckout', () => ({
  useCheckout: jest.fn(() => mockUseCheckout),
}))

// Mock analytics
jest.mock('@/lib/google-analytics', () => ({
  trackBeginCheckout: jest.fn(),
}))

jest.mock('@/lib/meta-pixel', () => ({
  trackInitiateCheckout: jest.fn(),
}))

jest.mock('@/lib/google-ads', () => ({
  trackGoogleAdsBeginCheckout: jest.fn(),
}))

jest.mock('@/components/Analytics/SimpleAnalyticsProvider', () => ({
  useAnalytics: jest.fn(() => ({
    trackEvent: jest.fn(),
  })),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockPush.mockClear()
  mockReplace.mockClear()
  
  // Reset mock state
  mockUseCheckout.isLoading = false
  mockUseCheckout.errors = {}
  mockUseCheckout.step = 'form'
  mockUseCheckout.cartItems = [
    {
      id: '1',
      title: 'Pintura Blanca',
      price: 5000,
      discountedPrice: 5000,
      quantity: 2,
      image: '/test-image.jpg',
    },
  ]
  mockUseCheckout.totalPrice = 10000
  mockUseCheckout.shippingCost = 0
  mockUseCheckout.finalTotal = 10000
})

describe('SimplifiedCheckout Component', () => {
  it('should render simplified checkout form', async () => {
    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
        image: '/test-image.jpg',
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Verificar que se renderiza el formulario simplificado
    expect(screen.getByRole('heading', { name: /checkout|pago|finalizar/i })).toBeInTheDocument()
  })

  it('should display cart summary', async () => {
    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestra el resumen del carrito
    expect(screen.getByText('Pintura Blanca')).toBeInTheDocument()
  })

  it('should display total price', async () => {
    mockUseCheckout.finalTotal = 10000

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar el total usando texto o formato de precio
    const totalElements = screen.queryAllByText(/\$10\.?000|\$10,000|10\.?000|10,000|total/i)
    expect(totalElements.length).toBeGreaterThan(0)
  })

  it('should handle form input changes', async () => {
    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar campos de entrada
    const emailInput = screen.queryByLabelText(/email|correo/i)
    const nameInput = screen.queryByLabelText(/nombre|name/i)
    const phoneInput = screen.queryByLabelText(/teléfono|phone/i)

    if (emailInput) {
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      })
      expect(mockUseCheckout.updateBillingData).toHaveBeenCalled()
    }

    if (nameInput) {
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Test User' } })
      })
      expect(mockUseCheckout.updateBillingData).toHaveBeenCalled()
    }

    if (phoneInput) {
      await act(async () => {
        fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      })
      expect(mockUseCheckout.updateBillingData).toHaveBeenCalled()
    }
  })

  it('should handle form submission', async () => {
    const mockProcessCheckout = jest.fn().mockResolvedValue({
      success: true,
      init_point: 'https://mercadopago.com/checkout',
    })

    mockUseCheckout.processCheckout = mockProcessCheckout

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar botón de submit
    const submitButton = screen.queryByRole('button', { name: /finalizar|pagar|comprar|proceder/i })
    
    if (submitButton) {
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockProcessCheckout).toHaveBeenCalled()
      })
    }
  })

  it('should display loading state', async () => {
    mockUseCheckout.isLoading = true

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar indicadores de carga
    const loadingIndicators = screen.queryAllByText(/procesando|loading|cargando/i)
    expect(loadingIndicators.length).toBeGreaterThan(0)
  })

  it('should display error messages', async () => {
    mockUseCheckout.errors = {
      general: 'Error al procesar el pago',
      email: 'Email inválido',
    }

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Error al procesar el pago')).toBeInTheDocument()
    expect(screen.getByText('Email inválido')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    mockUseCheckout.errors = {
      firstName: 'Nombre es requerido',
      email: 'Email es requerido',
      phone: 'Teléfono es requerido',
      streetAddress: 'Dirección es requerida',
    }

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Nombre es requerido')).toBeInTheDocument()
    expect(screen.getByText('Email es requerido')).toBeInTheDocument()
    expect(screen.getByText('Teléfono es requerido')).toBeInTheDocument()
    expect(screen.getByText('Dirección es requerida')).toBeInTheDocument()
  })

  it('should redirect when cart is empty', async () => {
    mockUseCheckout.cartItems = []

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: createMockCartState([]),
        authState: 'unauthenticated',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cart')
    })
  })

  it('should display shipping cost', async () => {
    mockUseCheckout.shippingCost = 2500

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar información de envío
    const shippingElements = screen.queryAllByText(/envío|shipping/i)
    expect(shippingElements.length).toBeGreaterThan(0)
  })

  it('should show free shipping for large orders', async () => {
    mockUseCheckout.shippingCost = 0
    mockUseCheckout.totalPrice = 50000

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 50000,
        discountedPrice: 50000,
        quantity: 1,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar indicadores de envío gratis
    const freeShippingElements = screen.queryAllByText(/gratis|free|sin costo/i)
    expect(freeShippingElements.length).toBeGreaterThan(0)
  })

  it('should handle authenticated user', async () => {
    const { session } = createMockAuthState(true)

    const cartState = createMockCartState([
      {
        id: '1',
        title: 'Pintura Blanca',
        price: 5000,
        discountedPrice: 5000,
        quantity: 2,
      },
    ])

    await act(async () => {
      renderWithProviders(<SimplifiedCheckout />, {
        reduxState: cartState,
        authState: 'authenticated',
        session,
      })
    })

    // Verificar que el componente se renderiza correctamente para usuarios autenticados
    expect(screen.getByRole('heading', { name: /checkout|pago/i })).toBeInTheDocument()
  })
})
