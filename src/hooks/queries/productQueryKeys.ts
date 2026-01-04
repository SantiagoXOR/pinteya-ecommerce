// ===================================
// QUERY KEYS PARA PRODUCTOS
// ===================================
// Centraliza todas las keys para facilitar invalidación y mantenimiento

// ⚡ OPTIMIZACIÓN: Función para normalizar filtros y generar queryKeys consistentes
// Esto permite que React Query comparta el cache entre componentes con filtros equivalentes
export function normalizeProductFilters(filters: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {}
  
  // Ordenar claves para que filtros equivalentes generen la misma key
  const sortedKeys = Object.keys(filters).sort()
  
  for (const key of sortedKeys) {
    const value = filters[key]
    
    // Ignorar valores undefined, null o vacíos
    if (value === undefined || value === null || value === '') {
      continue
    }
    
    // Normalizar arrays: ordenar y filtrar vacíos
    if (Array.isArray(value)) {
      if (value.length > 0) {
        normalized[key] = [...value].sort()
      }
      continue
    }
    
    // Normalizar valores primitivos
    normalized[key] = value
  }
  
  return normalized
}

export const productQueryKeys = {
  // Base key para todos los productos
  all: ['products'] as const,
  
  // Listas de productos
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...productQueryKeys.lists(), filters] as const,
  
  // Productos por categoría (para productos filtrados por categoría)
  categories: () => [...productQueryKeys.all, 'categories'] as const,
  category: (categorySlug: string | null, limit?: number) => 
    [...productQueryKeys.categories(), categorySlug, limit] as const,
  
  // Categorías (lista de categorías disponibles)
  categoryList: () => ['categories'] as const,
  categoryListWithFilters: (filters?: Record<string, any>) => 
    [...productQueryKeys.categoryList(), 'list', filters] as const,
  categoryBySlug: (slug: string) => 
    [...productQueryKeys.categoryList(), 'slug', slug] as const,
  
  // Best sellers
  bestsellers: () => [...productQueryKeys.all, 'bestsellers'] as const,
  bestseller: (categorySlug: string | null) => 
    [...productQueryKeys.bestsellers(), categorySlug] as const,
  
  // Productos con envío gratis
  freeShipping: () => [...productQueryKeys.all, 'free-shipping'] as const,
  
  // Nuevos productos
  newArrivals: (filters?: Record<string, any>) => 
    [...productQueryKeys.all, 'new-arrivals', filters] as const,
  
  // Productos individuales
  detail: (id: number | string) => [...productQueryKeys.all, 'detail', id] as const,
  detailBySlug: (slug: string) => [...productQueryKeys.all, 'detail', 'slug', slug] as const,
  
  // Búsqueda
  search: (query: string, filters?: Record<string, any>) => 
    [...productQueryKeys.all, 'search', query, filters] as const,
} as const

