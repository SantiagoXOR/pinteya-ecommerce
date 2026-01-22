/**
 * Fixtures de Datos para Tests Multitenant
 * Datos de prueba predefinidos para cada tenant
 */

import { mockTenants } from './setup'

/**
 * Fixtures de órdenes por tenant
 */
export const orderFixtures = {
  pinteya: [
    {
      id: 'order-pinteya-1',
      tenant_id: mockTenants.pinteya.id,
      order_number: 'ORD-001',
      user_id: 'user-pinteya-1',
      total: 15000,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'mercadopago',
      created_at: '2024-01-15T10:00:00Z',
      shipping_address: {
        street: 'Av. Colón 123',
        city: 'Córdoba',
        province: 'Córdoba',
        postal_code: '5000',
      },
    },
    {
      id: 'order-pinteya-2',
      tenant_id: mockTenants.pinteya.id,
      order_number: 'ORD-002',
      user_id: 'user-pinteya-2',
      total: 25000,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'cash',
      created_at: '2024-01-16T14:30:00Z',
      shipping_address: {
        street: 'Av. Vélez Sarsfield 456',
        city: 'Córdoba',
        province: 'Córdoba',
        postal_code: '5000',
      },
    },
  ],
  pintemas: [
    {
      id: 'order-pintemas-1',
      tenant_id: mockTenants.pintemas.id,
      order_number: 'ORD-101',
      user_id: 'user-pintemas-1',
      total: 18000,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'mercadopago',
      created_at: '2024-01-15T11:00:00Z',
      shipping_address: {
        street: 'Av. Libertador 789',
        city: 'Córdoba',
        province: 'Córdoba',
        postal_code: '5000',
      },
    },
  ],
}

/**
 * Fixtures de productos por tenant
 */
export const productFixtures = {
  pinteya: [
    {
      id: 1,
      name: 'Pintura Látex Interior',
      description: 'Pintura látex de alta calidad para interiores',
      price: 5000,
      stock: 50,
      brand: 'Alba',
      category_id: 1,
      tenant_products: [
        {
          tenant_id: mockTenants.pinteya.id,
          product_id: 1,
          price: 5000,
          stock: 50,
          is_visible: true,
          is_featured: true,
        },
      ],
    },
    {
      id: 2,
      name: 'Pintura Esmalte Exterior',
      description: 'Pintura esmalte resistente para exteriores',
      price: 8000,
      stock: 30,
      brand: 'Sintético',
      category_id: 2,
      tenant_products: [
        {
          tenant_id: mockTenants.pinteya.id,
          product_id: 2,
          price: 8000,
          stock: 30,
          is_visible: true,
          is_featured: false,
        },
      ],
    },
  ],
  pintemas: [
    {
      id: 1,
      name: 'Pintura Látex Interior',
      description: 'Pintura látex de alta calidad para interiores',
      price: 5500, // Precio diferente
      stock: 40, // Stock diferente
      brand: 'Alba',
      category_id: 1,
      tenant_products: [
        {
          tenant_id: mockTenants.pintemas.id,
          product_id: 1,
          price: 5500,
          stock: 40,
          is_visible: true,
          is_featured: true,
        },
      ],
    },
    {
      id: 3,
      name: 'Pintura Acrílica Premium',
      description: 'Pintura acrílica premium para interiores y exteriores',
      price: 12000,
      stock: 20,
      brand: 'Premium',
      category_id: 1,
      tenant_products: [
        {
          tenant_id: mockTenants.pintemas.id,
          product_id: 3,
          price: 12000,
          stock: 20,
          is_visible: true,
          is_featured: false,
        },
      ],
    },
  ],
}

/**
 * Fixtures de usuarios por tenant
 */
export const userFixtures = {
  pinteya: [
    {
      id: 'user-pinteya-1',
      tenant_id: mockTenants.pinteya.id,
      email: 'cliente1@pinteya.com',
      first_name: 'Juan',
      last_name: 'Pérez',
      phone: '5493511234567',
      is_active: true,
    },
    {
      id: 'user-pinteya-2',
      tenant_id: mockTenants.pinteya.id,
      email: 'cliente2@pinteya.com',
      first_name: 'María',
      last_name: 'González',
      phone: '5493511234568',
      is_active: true,
    },
  ],
  pintemas: [
    {
      id: 'user-pintemas-1',
      tenant_id: mockTenants.pintemas.id,
      email: 'cliente1@pintemas.com',
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      phone: '5493511234569',
      is_active: true,
    },
  ],
}

/**
 * Fixtures de items de carrito por tenant
 */
export const cartItemFixtures = {
  pinteya: [
    {
      id: 'cart-pinteya-1',
      tenant_id: mockTenants.pinteya.id,
      user_id: 'user-pinteya-1',
      product_id: 1,
      quantity: 2,
      variant_id: null,
    },
    {
      id: 'cart-pinteya-2',
      tenant_id: mockTenants.pinteya.id,
      user_id: 'user-pinteya-1',
      product_id: 2,
      quantity: 1,
      variant_id: null,
    },
  ],
  pintemas: [
    {
      id: 'cart-pintemas-1',
      tenant_id: mockTenants.pintemas.id,
      user_id: 'user-pintemas-1',
      product_id: 1,
      quantity: 3,
      variant_id: null,
    },
  ],
}

/**
 * Fixtures de eventos de analytics por tenant
 */
export const analyticsEventFixtures = {
  pinteya: [
    {
      id: 'event-pinteya-1',
      tenant_id: mockTenants.pinteya.id,
      event_type: 'page_view',
      page_path: '/',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'event-pinteya-2',
      tenant_id: mockTenants.pinteya.id,
      event_type: 'product_view',
      product_id: 1,
      created_at: '2024-01-15T10:05:00Z',
    },
    {
      id: 'event-pinteya-3',
      tenant_id: mockTenants.pinteya.id,
      event_type: 'add_to_cart',
      product_id: 1,
      quantity: 2,
      created_at: '2024-01-15T10:10:00Z',
    },
  ],
  pintemas: [
    {
      id: 'event-pintemas-1',
      tenant_id: mockTenants.pintemas.id,
      event_type: 'page_view',
      page_path: '/',
      created_at: '2024-01-15T11:00:00Z',
    },
    {
      id: 'event-pintemas-2',
      tenant_id: mockTenants.pintemas.id,
      event_type: 'product_view',
      product_id: 1,
      created_at: '2024-01-15T11:05:00Z',
    },
  ],
}

/**
 * Fixtures de categorías por tenant
 */
export const categoryFixtures = {
  pinteya: [
    {
      id: 1,
      tenant_id: mockTenants.pinteya.id,
      name: 'Pinturas',
      slug: 'pinturas',
      is_active: true,
    },
    {
      id: 2,
      tenant_id: mockTenants.pinteya.id,
      name: 'Herramientas',
      slug: 'herramientas',
      is_active: true,
    },
  ],
  pintemas: [
    {
      id: 1,
      tenant_id: mockTenants.pintemas.id,
      name: 'Pinturas',
      slug: 'pinturas',
      is_active: true,
    },
    {
      id: 3,
      tenant_id: mockTenants.pintemas.id,
      name: 'Accesorios',
      slug: 'accesorios',
      is_active: true,
    },
  ],
}

/**
 * Obtiene todos los fixtures para un tenant específico
 */
export function getTenantFixtures(tenantSlug: 'pinteya' | 'pintemas') {
  return {
    orders: orderFixtures[tenantSlug],
    products: productFixtures[tenantSlug],
    users: userFixtures[tenantSlug],
    cartItems: cartItemFixtures[tenantSlug],
    analyticsEvents: analyticsEventFixtures[tenantSlug],
    categories: categoryFixtures[tenantSlug],
  }
}
