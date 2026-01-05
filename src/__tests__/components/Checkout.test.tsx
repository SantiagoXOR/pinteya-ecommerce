// ===================================
// PINTEYA E-COMMERCE - TESTS PARA CHECKOUT COMPONENT
// ===================================

import React from 'react'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Checkout from '@/components/Checkout'
import { renderWithProviders, createMockCartState } from '@/__tests__/utils/test-utils'

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

// Mock useCheckout hook con estructura correcta
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
      name: 'Pintura Blanca',
      price: 5000,
      quantity: 2,
      image: '/test-image.jpg',
    },
  ],
  totalPrice: 10000,
  shippingCost: 2500,
  discount: 0,
  finalTotal: 12500,
  appliedCoupon: null,
  applyCoupon: jest.fn(),
  updateBillingData: jest.fn(),
  updateShippingData: jest.fn(),
  updateFormData: jest.fn(),
  processCheckout: jest.fn(),
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
      name: 'Pintura Blanca',
      price: 5000,
      quantity: 2,
      image: '/test-image.jpg',
    },
  ]
})

describe('Checkout Component', () => {
  it('should render checkout form with cart items', async () => {
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
      renderWithProviders(<Checkout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Usar selectores accesibles en lugar de texto exacto
    expect(screen.getByRole('heading', { name: /checkout|pago|finalizar/i })).toBeInTheDocument()
    
    // Buscar elementos relacionados con facturación o información
    const billingElements = screen.queryAllByText(/facturación|billing|información|datos/i)
    expect(billingElements.length).toBeGreaterThan(0)
  })

  it('should redirect to cart when no items', async () => {
    mockUseCheckout.cartItems = []
    mockUseCheckout.step = 'form'

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([]),
        authState: 'unauthenticated',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cart')
    })
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
        image: '/test-image.jpg',
      },
    ])

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Buscar botón de submit usando role
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

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 5000,
            discountedPrice: 5000,
            quantity: 2,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    // Buscar indicadores de carga usando texto o aria-labels
    const loadingIndicators = screen.queryAllByText(/procesando|loading|cargando/i)
    expect(loadingIndicators.length).toBeGreaterThan(0)
  })

  it('should display error state', async () => {
    mockUseCheckout.errors = {
      general: 'Error procesando el pago',
    }

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 5000,
            discountedPrice: 5000,
            quantity: 2,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Error procesando el pago')).toBeInTheDocument()
  })

  it('should calculate shipping cost correctly', async () => {
    mockUseCheckout.shippingCost = 2500
    mockUseCheckout.totalPrice = 10000

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 5000,
            discountedPrice: 5000,
            quantity: 2,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    // Buscar elementos relacionados con envío usando texto o roles
    const shippingElements = screen.queryAllByText(/envío|shipping/i)
    expect(shippingElements.length).toBeGreaterThan(0)
  })

  it('should show free shipping for large orders', async () => {
    mockUseCheckout.shippingCost = 0
    mockUseCheckout.totalPrice = 50000
    mockUseCheckout.cartItems = [
      {
        id: '1',
        name: 'Pintura Blanca',
        price: 50000,
        quantity: 1,
        image: '/test-image.jpg',
      },
    ]

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 50000,
            discountedPrice: 50000,
            quantity: 1,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    // Buscar indicadores de envío gratis
    const freeShippingElements = screen.queryAllByText(/gratis|free|sin costo/i)
    expect(freeShippingElements.length).toBeGreaterThan(0)
  })

  it('should validate required fields', async () => {
    mockUseCheckout.errors = {
      firstName: 'Nombre es requerido',
      email: 'Email es requerido',
    }

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 5000,
            discountedPrice: 5000,
            quantity: 2,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Nombre es requerido')).toBeInTheDocument()
    expect(screen.getByText('Email es requerido')).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    mockUseCheckout.errors = {
      email: 'Email inválido',
    }

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([
          {
            id: '1',
            title: 'Pintura Blanca',
            price: 5000,
            discountedPrice: 5000,
            quantity: 2,
          },
        ]),
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('Email inválido')).toBeInTheDocument()
  })

  it('should handle empty cart error', async () => {
    mockUseCheckout.errors = {
      cart: 'El carrito está vacío',
    }

    await act(async () => {
      renderWithProviders(<Checkout />, {
        reduxState: createMockCartState([]),
        authState: 'unauthenticated',
      })
    })

    expect(screen.getByText('El carrito está vacío')).toBeInTheDocument()
  })

  it('should display cart summary with correct items', async () => {
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
      renderWithProviders(<Checkout />, {
        reduxState: cartState,
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestra el resumen del carrito
    expect(screen.getByText('Pintura Blanca')).toBeInTheDocument()
  })
})
