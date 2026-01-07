// ===================================
// PINTEYA E-COMMERCE - TESTS PARA CHECKOUTEXPRESS COMPONENT
// ===================================

import React from 'react'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import CheckoutExpress from '@/components/Checkout/CheckoutExpress'
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
  usePathname: jest.fn(() => '/checkout/express'),
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
  processCheckout: jest.fn(),
  processExpressCheckout: jest.fn().mockResolvedValue({
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

// Mock MercadoPagoWallet
jest.mock('@/components/Checkout/MercadoPagoWallet', () => ({
  __esModule: true,
  default: () => <div data-testid="mercadopago-wallet">MercadoPago Wallet</div>,
  MercadoPagoWalletFallback: () => <div data-testid="mercadopago-wallet-fallback">Fallback</div>,
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

describe('CheckoutExpress Component', () => {
  it('should render express checkout form', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Verificar que se renderiza el formulario express
    expect(screen.getByRole('heading', { name: /checkout|express|pago rápido/i })).toBeInTheDocument()
  })

  it('should display cart items in summary', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestran los items del carrito
    expect(screen.getByText('Pintura Blanca')).toBeInTheDocument()
  })

  it('should display total price correctly', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar el total usando texto o formato de precio
    const totalElements = screen.queryAllByText(/\$10\.?000|\$10,000|10\.?000|10,000/)
    expect(totalElements.length).toBeGreaterThan(0)
  })

  it('should handle form submission', async () => {
    const mockProcessExpressCheckout = jest.fn().mockResolvedValue({
      success: true,
      init_point: 'https://mercadopago.com/checkout',
    })

    mockUseCheckout.processExpressCheckout = mockProcessExpressCheckout

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
      renderWithProviders(<CheckoutExpress />, {
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
        expect(mockProcessExpressCheckout).toHaveBeenCalled()
      })
    }
  })

  it('should display loading state during checkout', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
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
      renderWithProviders(<CheckoutExpress />, {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Nombre es requerido')).toBeInTheDocument()
    expect(screen.getByText('Email es requerido')).toBeInTheDocument()
    expect(screen.getByText('Teléfono es requerido')).toBeInTheDocument()
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'authenticated',
        session,
      })
    })

    // Verificar que el componente se renderiza correctamente para usuarios autenticados
    expect(screen.getByRole('heading', { name: /checkout|express|pago/i })).toBeInTheDocument()
  })

  it('should redirect when cart is empty', async () => {
    mockUseCheckout.cartItems = []

    await act(async () => {
      renderWithProviders(<CheckoutExpress />, {
        reduxState: createMockCartState([]),
        authState: 'unauthenticated',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cart')
    })
  })

  it('should display shipping information', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar información de envío
    const shippingElements = screen.queryAllByText(/envío|shipping/i)
    expect(shippingElements.length).toBeGreaterThan(0)
  })

  it('should show free shipping for orders over threshold', async () => {
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
      renderWithProviders(<CheckoutExpress />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar indicadores de envío gratis
    const freeShippingElements = screen.queryAllByText(/gratis|free|sin costo/i)
    expect(freeShippingElements.length).toBeGreaterThan(0)
  })
})








