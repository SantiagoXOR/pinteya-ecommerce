// ===================================
// PRODUCTS FIXTURE
// Fixtures y datos de prueba para productos y variantes
// ===================================

import { test as baseTest } from '@playwright/test'

/**
 * Tipos para datos de producto y variante
 */
export interface ProductFixture {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url?: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
}

export interface VariantFixture {
  id: string
  product_id: string
  color_name: string
  measure: string
  finish: string
  aikon_id: string
  price_list: number
  price_sale: number
  stock: number
  image_url?: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

/**
 * Productos de prueba
 */
export const testProducts: ProductFixture[] = [
  {
    id: 'test-product-1',
    name: 'Test Product 1',
    description: 'Producto de prueba 1',
    price: 10000,
    stock: 50,
    category_id: '1',
    image_url: 'https://via.placeholder.com/400x400?text=Product1',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'test-product-2',
    name: 'Test Product 2',
    description: 'Producto de prueba 2',
    price: 15000,
    stock: 30,
    category_id: '1',
    image_url: 'https://via.placeholder.com/400x400?text=Product2',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Variantes de prueba
 */
export const testVariants: VariantFixture[] = [
  {
    id: 'test-variant-1',
    product_id: 'test-product-1',
    color_name: 'Blanco',
    measure: '4L',
    finish: 'Mate',
    aikon_id: 'TEST-WHITE-4L-MATE',
    price_list: 10000,
    price_sale: 8000,
    stock: 50,
    image_url: 'https://via.placeholder.com/200x200?text=Variant1',
    is_active: true,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'test-variant-2',
    product_id: 'test-product-1',
    color_name: 'Rojo',
    measure: '4L',
    finish: 'Brillante',
    aikon_id: 'TEST-RED-4L-BRILLANTE',
    price_list: 11000,
    price_sale: 9000,
    stock: 30,
    image_url: 'https://via.placeholder.com/200x200?text=Variant2',
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Crea un producto de prueba en la base de datos
 * (Por ahora solo retorna datos, en un setup real haría POST a API)
 */
export async function createTestProduct(
  productData: Partial<ProductFixture>
): Promise<ProductFixture> {
  const product: ProductFixture = {
    id: `test-${Date.now()}`,
    name: productData.name || 'Test Product',
    description: productData.description || 'Test Description',
    price: productData.price || 10000,
    stock: productData.stock || 50,
    category_id: productData.category_id || '1',
    image_url: productData.image_url,
    status: productData.status || 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  console.log(`📦 Producto de prueba creado: ${product.name}`)
  return product
}

/**
 * Limpia datos de prueba (productos con IDs que empiecen con "test-")
 */
export async function cleanupTestData() {
  console.log('🧹 Limpiando datos de prueba...')
  // En un setup real, aquí haríamos DELETE a la API para productos de test
  console.log('✅ Datos de prueba limpiados')
}

/**
 * Fixture extendido con productos de prueba
 */
export const test = baseTest.extend({
  // Fixture para crear producto temporal
  testProduct: async ({ page }, use) => {
    const product = await createTestProduct({
      name: `Test Product E2E ${Date.now()}`,
    })
    await use(product)
    await cleanupTestData()
  },
})

export { test }

