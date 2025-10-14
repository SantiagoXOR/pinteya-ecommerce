// Desarrollo: datos y utilidades mock para APIs cuando Supabase no está configurado
// Estos mocks solo se usan en desarrollo y no afectan producción

/* eslint-disable @typescript-eslint/no-explicit-any */

type Product = any
type Category = any

export const devMockProducts: Product[] = [
  {
    id: 1,
    name: 'Pintura Látex Interior Blanco 4L',
    slug: 'pintura-latex-interior-blanco-4l',
    description: 'Pintura látex de alta calidad para interiores, acabado mate',
    price: 2500,
    discounted_price: 2200,
    stock: 15,
    brand: 'Sherwin Williams',
    category_id: 1,
    images: {
      previews: ['/images/products/pintura-latex-blanco.jpg'],
      main: '/images/products/pintura-latex-blanco-main.jpg',
    },
    category: { id: 1, name: 'Pinturas', slug: 'pinturas' },
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Taladro Percutor 650W',
    slug: 'taladro-percutor-650w',
    description: 'Taladro percutor profesional con mandril de 13mm',
    price: 8500,
    discounted_price: null,
    stock: 8,
    brand: 'Bosch',
    category_id: 2,
    images: {
      previews: ['/images/products/taladro-bosch.jpg'],
      main: '/images/products/taladro-bosch-main.jpg',
    },
    category: { id: 2, name: 'Herramientas', slug: 'herramientas' },
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 3,
    name: 'Cemento Portland 50kg',
    slug: 'cemento-portland-50kg',
    description: 'Cemento Portland tipo I para construcción general',
    price: 1200,
    discounted_price: 1100,
    stock: 25,
    brand: 'Loma Negra',
    category_id: 3,
    images: {
      previews: ['/images/products/cemento-portland.jpg'],
      main: '/images/products/cemento-portland-main.jpg',
    },
    category: { id: 3, name: 'Materiales', slug: 'materiales' },
    created_at: '2024-01-05T09:00:00Z',
  },
]

export const devMockCategories: Category[] = [
  { id: 1, name: 'Pinturas', slug: 'pinturas', description: 'Pinturas para interior y exterior' },
  { id: 2, name: 'Herramientas', slug: 'herramientas', description: 'Herramientas manuales y eléctricas' },
  { id: 3, name: 'Materiales', slug: 'materiales', description: 'Materiales de construcción' },
  { id: 4, name: 'Ferretería', slug: 'ferreteria', description: 'Artículos de ferretería general' },
]

export type ProductFilters = {
  category?: string
  categories?: string[]
  brand?: string
  brands?: string[]
  paintType?: string
  paintTypes?: string[]
  priceMin?: number
  priceMax?: number
  search?: string
  page?: number
  limit?: number
  sortBy?: 'price' | 'name' | 'created_at' | 'brand'
  sortOrder?: 'asc' | 'desc'
  hasDiscount?: boolean
}

export function filterAndPaginateProducts(products: Product[], filters: ProductFilters) {
  let result = [...products]

  if (filters.category) {
    result = result.filter(p => p.category?.slug === filters.category)
  }
  if (filters.categories && filters.categories.length) {
    const set = new Set(filters.categories)
    result = result.filter(p => set.has(p.category?.slug))
  }
  if (filters.brand) {
    result = result.filter(p => (p.brand || '').toLowerCase() === filters.brand?.toLowerCase())
  }
  if (filters.brands && filters.brands.length) {
    const set = new Set(filters.brands.map(b => b.toLowerCase()))
    result = result.filter(p => set.has((p.brand || '').toLowerCase()))
  }
  if (filters.priceMin != null) {
    result = result.filter(p => (p.price ?? 0) >= (filters.priceMin as number))
  }
  if (filters.priceMax != null) {
    result = result.filter(p => (p.price ?? 0) <= (filters.priceMax as number))
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
    )
  }
  if (filters.hasDiscount) {
    result = result.filter(p => p.discounted_price != null && p.discounted_price < p.price)
  }

  // Ordenamiento simple
  const order = filters.sortOrder === 'asc' ? 1 : -1
  const sortBy = filters.sortBy || 'created_at'
  result.sort((a, b) => {
    const va = a[sortBy] ?? ''
    const vb = b[sortBy] ?? ''
    if (va < vb) return -1 * order
    if (va > vb) return 1 * order
    return 0
  })

  // Paginación
  const page = Math.max(1, filters.page || 1)
  const limit = Math.max(1, filters.limit || 12)
  const total = result.length
  const totalPages = Math.ceil(total / limit)
  const from = (page - 1) * limit
  const to = from + limit
  const pageItems = result.slice(from, to)

  return { items: pageItems, total, totalPages, page, limit }
}