// ===================================
// TESTS DE INTEGRACIÓN - FLUJO DE CHECKOUT
// Tests completos del proceso de compra
// ===================================

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CheckoutPage } from '@/app/checkout/page'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/integrations/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import React from 'react'

// Mocks
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock MercadoPago
jest.mock('@/lib/mercadopago', () => ({
  createPreference: jest.fn(),
  processPayment: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
}

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Datos de prueba
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
}

const mockCartItems = [
  {
    id: 1,
    name: 'Producto Test 1',
    price: 100,
    quantity: 2,
    image: 'https://example.com/image1.jpg',
    stock: 10,
  },
  {
    id: 2,
    name: 'Producto Test 2',
    price: 50,
    quantity: 1,
    image: 'https://example.com/image2.jpg',
    stock: 5,
  },
]

const mockShippingAddress = {
  street: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  state: 'CABA',
  postal_code: '1043',
  country: 'Argentina',
}

// Wrapper de providers
const createWrapper = (initialCartItems = mockCartItems) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  // Configurar localStorage con items del carrito
  localStorageMock.setItem('cart-items', JSON.stringify(initialCartItems))

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Flujo de Checkout - Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Inicialización del Checkout', () => {
    it('debe mostrar los productos del carrito correctamente', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Verificar que se muestran los productos
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument()
      expect(screen.getByText('Producto Test 2')).toBeInTheDocument()

      // Verificar cantidades
      expect(screen.getByText('Cantidad: 2')).toBeInTheDocument()
      expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()

      // Verificar total
      expect(screen.getByText('Total: $250')).toBeInTheDocument()
    })

    it('debe redirigir si el carrito está vacío', async () => {
      render(<CheckoutPage />, { wrapper: createWrapper([]) })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/cart')
      })

      expect(toast.error).toHaveBeenCalledWith(
        'Tu carrito está vacío. Agrega productos antes de continuar.'
      )
    })

    it('debe mostrar formulario de login si no está autenticado', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    })
  })

  describe('Autenticación en Checkout', () => {
    it('debe permitir login durante el checkout', async () => {
      const user = userEvent.setup()

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Llenar formulario de login
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Contraseña'), 'password123')

      // Hacer click en login
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      // Debe mostrar el formulario de checkout después del login
      await waitFor(() => {
        expect(screen.getByText('Información de Envío')).toBeInTheDocument()
      })
    })

    it('debe manejar errores de login', async () => {
      const user = userEvent.setup()

      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas')
      })
    })
  })

  describe('Formulario de Información de Envío', () => {
    beforeEach(() => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('debe validar campos requeridos', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Intentar continuar sin llenar campos
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      await user.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText('La dirección es requerida')).toBeInTheDocument()
        expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument()
        expect(screen.getByText('El código postal es requerido')).toBeInTheDocument()
      })
    })

    it('debe llenar y validar el formulario correctamente', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Llenar formulario de envío
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)

      // Seleccionar país
      const countrySelect = screen.getByLabelText('País')
      await user.selectOptions(countrySelect, mockShippingAddress.country)

      // Continuar al siguiente paso
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      await waitFor(() => {
        expect(screen.getByText('Método de Pago')).toBeInTheDocument()
      })
    })

    it('debe validar formato de código postal', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText('Código Postal'), 'invalid')
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      await waitFor(() => {
        expect(screen.getByText('Formato de código postal inválido')).toBeInTheDocument()
      })
    })
  })

  describe('Selección de Método de Pago', () => {
    beforeEach(async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    const fillShippingForm = async (user: any) => {
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)
      await user.selectOptions(screen.getByLabelText('País'), mockShippingAddress.country)
      await user.click(screen.getByRole('button', { name: /continuar/i }))
    }

    it('debe mostrar opciones de pago disponibles', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await fillShippingForm(user)

      await waitFor(() => {
        expect(screen.getByText('MercadoPago')).toBeInTheDocument()
        expect(screen.getByText('Pago al recibir el producto')).toBeInTheDocument()
        // Verificar que la transferencia bancaria ya no esté disponible
        expect(screen.queryByText('Transferencia Bancaria')).not.toBeInTheDocument()
      })
    })

    it('debe seleccionar método de pago', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await fillShippingForm(user)

      // Seleccionar MercadoPago
      const mercadopagoOption = screen.getByLabelText('MercadoPago')
      await user.click(mercadopagoOption)

      expect(mercadopagoOption).toBeChecked()

      // Debe mostrar información adicional de MercadoPago
      expect(screen.getByText('Paga con tarjeta de crédito, débito o efectivo')).toBeInTheDocument()
    })

    it('debe validar selección de método de pago', async () => {
      const user = userEvent.setup()

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await fillShippingForm(user)

      // Intentar continuar sin seleccionar método de pago
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(screen.getByText('Selecciona un método de pago')).toBeInTheDocument()
      })
    })
  })

  describe('Finalización de Compra', () => {
    beforeEach(() => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    const completeCheckoutForm = async (user: any) => {
      // Llenar información de envío
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)
      await user.selectOptions(screen.getByLabelText('País'), mockShippingAddress.country)
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      // Seleccionar método de pago
      await waitFor(() => {
        expect(screen.getByLabelText('MercadoPago')).toBeInTheDocument()
      })
      await user.click(screen.getByLabelText('MercadoPago'))
    }

    it('debe crear la orden exitosamente', async () => {
      const user = userEvent.setup()

      // Mock de creación de orden
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'order-123' }],
          error: null,
        }),
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await completeCheckoutForm(user)

      // Finalizar compra
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('orders')
        expect(toast.success).toHaveBeenCalledWith('¡Compra realizada exitosamente!')
        expect(mockRouter.push).toHaveBeenCalledWith('/mis-ordenes/order-123')
      })
    })

    it('debe manejar errores al crear la orden', async () => {
      const user = userEvent.setup()

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await completeCheckoutForm(user)
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al procesar la compra. Intenta nuevamente.')
      })
    })

    it('debe validar stock antes de crear la orden', async () => {
      const user = userEvent.setup()

      // Mock de productos con stock insuficiente
      const itemsWithLowStock = [
        { ...mockCartItems[0], quantity: 15, stock: 10 }, // Más cantidad que stock
      ]

      render(<CheckoutPage />, { wrapper: createWrapper(itemsWithLowStock) })

      await completeCheckoutForm(user)
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Algunos productos no tienen stock suficiente')
      })
    })

    it('debe limpiar el carrito después de compra exitosa', async () => {
      const user = userEvent.setup()

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'order-123' }],
          error: null,
        }),
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      await completeCheckoutForm(user)
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        // Verificar que el localStorage se limpió
        const cartItems = JSON.parse(localStorageMock.getItem('cart-items') || '[]')
        expect(cartItems).toEqual([])
      })
    })
  })

  describe('Integración con MercadoPago', () => {
    beforeEach(() => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('debe crear preferencia de MercadoPago', async () => {
      const user = userEvent.setup()
      const { createPreference } = require('@/lib/mercadopago')

      createPreference.mockResolvedValue({
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'order-123' }],
          error: null,
        }),
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Completar formulario
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)
      await user.selectOptions(screen.getByLabelText('País'), mockShippingAddress.country)
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('MercadoPago')).toBeInTheDocument()
      })
      await user.click(screen.getByLabelText('MercadoPago'))
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(createPreference).toHaveBeenCalledWith({
          items: expect.arrayContaining([
            expect.objectContaining({
              title: 'Producto Test 1',
              unit_price: 100,
              quantity: 2,
            }),
          ]),
          payer: {
            email: mockUser.email,
          },
          external_reference: 'order-123',
        })
      })
    })
  })

  describe('Casos Edge y Errores', () => {
    it('debe manejar pérdida de conexión', async () => {
      const user = userEvent.setup()

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Network error')),
      })
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Completar formulario rápidamente
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)
      await user.selectOptions(screen.getByLabelText('País'), mockShippingAddress.country)
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('MercadoPago')).toBeInTheDocument()
      })
      await user.click(screen.getByLabelText('MercadoPago'))
      await user.click(screen.getByRole('button', { name: /finalizar compra/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Error de conexión. Verifica tu internet e intenta nuevamente.'
        )
      })
    })

    it('debe prevenir doble envío de formulario', async () => {
      const user = userEvent.setup()

      let resolveInsert: (value: any) => void
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(insertPromise),
      })
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<CheckoutPage />, { wrapper: createWrapper() })

      // Completar formulario
      await user.type(screen.getByLabelText('Dirección'), mockShippingAddress.street)
      await user.type(screen.getByLabelText('Ciudad'), mockShippingAddress.city)
      await user.type(screen.getByLabelText('Provincia/Estado'), mockShippingAddress.state)
      await user.type(screen.getByLabelText('Código Postal'), mockShippingAddress.postal_code)
      await user.selectOptions(screen.getByLabelText('País'), mockShippingAddress.country)
      await user.click(screen.getByRole('button', { name: /continuar/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('MercadoPago')).toBeInTheDocument()
      })
      await user.click(screen.getByLabelText('MercadoPago'))

      const submitButton = screen.getByRole('button', { name: /finalizar compra/i })

      // Hacer doble click rápido
      await user.click(submitButton)
      await user.click(submitButton)

      // El botón debe estar deshabilitado después del primer click
      expect(submitButton).toBeDisabled()

      // Resolver la promesa
      resolveInsert!({
        data: [{ id: 'order-123' }],
        error: null,
      })

      // Solo debe haberse llamado una vez
      await waitFor(() => {
        expect(supabase.from().insert).toHaveBeenCalledTimes(1)
      })
    })
  })
})
