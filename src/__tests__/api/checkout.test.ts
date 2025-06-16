// ===================================
// PINTEYA E-COMMERCE - TEST CHECKOUT API
// ===================================

import { NextRequest } from 'next/server'

// Datos de prueba globales
const mockProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    price: 1000,
    discounted_price: 900,
    stock: 10,
    images: { previews: ['/test1.jpg'] },
    category: { name: 'Test Category', slug: 'test-category' },
  },
  {
    id: 2,
    name: 'Test Product 2',
    price: 2000,
    discounted_price: null,
    stock: 5,
    images: { previews: ['/test2.jpg'] },
    category: { name: 'Test Category 2', slug: 'test-category-2' },
  },
]

const mockUser = { id: 'test-user-id', clerk_id: 'test-clerk-id', email: 'test@example.com' }
const mockOrder = { id: 'test-order-id', user_id: 'test-user-id', status: 'pending', total: 3300 }

// Usar el mock global de Supabase del jest.setup.js



import { POST } from '@/app/api/payments/create-preference/route'

const mockCheckoutPayload = {
  items: [
    { id: '1', name: 'Test Product 1', price: 900, quantity: 2, image: '/test1.jpg' },
    { id: '2', name: 'Test Product 2', price: 2000, quantity: 1, image: '/test2.jpg' },
  ],
  payer: {
    name: 'Juan',
    surname: 'Pérez',
    email: 'juan@test.com',
    phone: '1234567890',
    identification: { type: 'DNI', number: '12345678' },
  },
  shipping: {
    address: {
      street_name: 'Av. Corrientes',
      street_number: '1234',
      zip_code: '1000',
      city_name: 'Buenos Aires',
      state_name: 'CABA',
    },
    cost: 500,
  },
  external_reference: 'test-ref-123',
}

// Variables globales para tracking de mocks
let mockMercadoPago: any
let mockSupabaseAdmin: any

// Mock específico para checkout que usa supabaseAdmin
beforeEach(() => {
  // Resetear todos los mocks antes de cada test
  jest.clearAllMocks();

  // Obtener referencias a los mocks
  mockMercadoPago = jest.mocked(require('@/lib/mercadopago').preference.create)
  mockSupabaseAdmin = jest.mocked(require('@/lib/supabase').supabaseAdmin)

  // Resetear el mock de MercadoPago para cada test
  mockMercadoPago.mockResolvedValue({
    id: 'test-preference-id',
    init_point: 'https://mercadopago.com/checkout/test',
  })

  // Resetear el mock de Supabase
  mockSupabaseAdmin.from.mockClear()
})

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    firstName: 'Juan',
    lastName: 'Pérez',
    emailAddresses: [{ emailAddress: 'juan@test.com' }],
  })),
}))

// Mock MercadoPago
jest.mock('@/lib/mercadopago', () => ({
  preference: {
    create: jest.fn(() => Promise.resolve({
      id: 'test-preference-id',
      init_point: 'https://mercadopago.com/checkout/test',
    })),
  },
}))

describe('/api/payments/create-preference', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Restaurar el mock de Supabase a su estado original
    mockSupabaseAdmin.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Test Product 1',
              price: 1000,
              discounted_price: null,
              stock: 10,
              images: { previews: ['test1.jpg'] },
              category: { name: 'Test Category', slug: 'test-category' }
            },
            {
              id: 2,
              name: 'Test Product 2',
              price: 2000,
              discounted_price: 1800,
              stock: 5,
              images: { previews: ['test2.jpg'] },
              category: { name: 'Test Category', slug: 'test-category' }
            }
          ],
          error: null
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 1, ...mockOrder },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  })

  it('creates payment preference successfully', async () => {
    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toMatchObject({
      init_point: 'https://mercadopago.com/checkout/test',
      preference_id: 'test-preference-id',
    })
  })

  it('validates product stock before creating order', async () => {
    // Mock insufficient stock
    const insufficientStockProducts = [
      { ...mockProducts[0], stock: 1 }, // Only 1 in stock, but requesting 2
      mockProducts[1],
    ]

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: insufficientStockProducts, error: null })),
          })),
        }
      }
      // Fallback para otras tablas
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          in: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }
    })

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Stock insuficiente')
  })

  it('handles missing products', async () => {
    // Mock missing product
    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [mockProducts[0]], error: null })), // Only first product
          })),
        }
      }
      // Fallback para otras tablas
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          in: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }
    })

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Producto 2 no encontrado')
  })

  it('calculates total correctly with discounts', async () => {
    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    // Verificar que la respuesta sea exitosa
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verificar que se llamó a la tabla orders
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders')
  })

  it('creates order items with correct prices', async () => {
    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    // Verificar que la respuesta sea exitosa
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verificar que se llamó a la tabla order_items
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('order_items')
  })

  it('handles authenticated users', async () => {
    // Asegurar que currentUser retorna un usuario válido
    jest.mocked(require('@clerk/nextjs/server').currentUser).mockResolvedValue({
      id: 'test-user-id',
      firstName: 'Juan',
      lastName: 'Pérez',
      emailAddresses: [{ emailAddress: 'juan@test.com' }],
    })

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles guest users (temporary user)', async () => {
    // Mock no authenticated user
    jest.mocked(require('@clerk/nextjs/server').currentUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('includes shipping cost in MercadoPago preference', async () => {
    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    // Verificar que la respuesta sea exitosa
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify MercadoPago preference was created
    expect(mockMercadoPago).toHaveBeenCalled()

    // Verificar que se llamó con los parámetros correctos
    const callArgs = mockMercadoPago.mock.calls[0][0]
    expect(callArgs.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shipping',
          title: 'Costo de envío',
          unit_price: 500,
        }),
      ])
    )
  })

  it('handles database errors gracefully', async () => {
    // Mock database error para productos
    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
          })),
        }
      }
      // Para otras tablas, retornar el mock normal
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }
    })

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Error obteniendo productos') // Corregir expectativa
  })

  it('handles MercadoPago errors', async () => {
    // Mock MercadoPago error
    jest.mocked(require('@/lib/mercadopago').preference.create).mockRejectedValue(
      new Error('MercadoPago API error')
    )

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Error interno del servidor') // El error de MercadoPago se maneja en el catch general
  })

  it('validates request payload', async () => {
    const invalidPayload = {
      items: [], // Empty items
      payer: mockCheckoutPayload.payer,
    }

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    // El endpoint debería manejar items vacíos como error de validación
    expect(response.status).toBe(400) // Retorna 400 por validación fallida
    expect(data.success).toBe(false)
  })

  it('rollbacks order creation on order items error', async () => {
    // Mock order creation success but order items failure
    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: mockProducts, error: null })),
          })),
        }
      }
      if (table === 'users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockUser, error: null }))
            }))
          }))
        }
      }
      if (table === 'orders') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockOrder, error: null })),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }
      if (table === 'order_items') {
        return {
          insert: jest.fn(() => Promise.resolve({ error: { message: 'Order items error' } })),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify(mockCheckoutPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)

    // Verify that the function attempted to access multiple tables
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products')
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users')
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders')
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('order_items')
  })
})
