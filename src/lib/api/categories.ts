// ===================================
// PINTEYA E-COMMERCE - FUNCIONES DE API PARA CATEGORÍAS
// ===================================

import { CategoryFilters, ApiResponse } from '@/types/api'
import { Category } from '@/types/database'

// ===================================
// FUNCIONES PARA EL FRONTEND
// ===================================

/**
 * Obtiene todas las categorías desde la API
 * @param filters - Filtros de categorías
 * @returns Promise<ApiResponse<Category[]>>
 */
export async function getCategories(filters?: CategoryFilters): Promise<ApiResponse<Category[]>> {
  try {
    const searchParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`/api/categories?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error obteniendo categorías:', error)
    throw error
  }
}

/**
 * Obtiene todas las categorías (simplificado para la estructura actual)
 * @returns Promise<Category[]>
 */
export async function getMainCategories(): Promise<Category[]> {
  try {
    const response = await getCategories()
    return response.data || []
  } catch (error) {
    console.error('Error obteniendo categorías:', error)
    return []
  }
}

/**
 * Obtiene subcategorías de una categoría padre
 * @param parentId - ID de la categoría padre
 * @returns Promise<Category[]>
 */
export async function getSubcategories(parentId: number): Promise<Category[]> {
  // Nota: La tabla categories actual no soporta jerarquías (no tiene parent_id)
  // Retornamos array vacío por ahora
  console.warn('getSubcategories: La tabla categories no soporta jerarquías')
  return []
}

/**
 * Busca categorías por nombre
 * @param searchTerm - Término de búsqueda
 * @returns Promise<Category[]>
 */
export async function searchCategories(searchTerm: string): Promise<Category[]> {
  try {
    const response = await getCategories({ search: searchTerm })
    return response.data || []
  } catch (error) {
    console.error('Error buscando categorías:', error)
    return []
  }
}

/**
 * Obtiene la jerarquía completa de categorías
 * @returns Promise<CategoryHierarchy[]>
 */
export async function getCategoriesHierarchy(): Promise<CategoryHierarchy[]> {
  try {
    const response = await fetch('/api/categories/hierarchy', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Si no existe el endpoint de jerarquía, construirla manualmente
      return await buildCategoriesHierarchy()
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error obteniendo jerarquía de categorías:', error)
    return await buildCategoriesHierarchy()
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

export interface CategoryHierarchy extends Category {
  children: CategoryHierarchy[]
}

/**
 * Construye la jerarquía de categorías manualmente
 * @returns Promise<CategoryHierarchy[]>
 */
async function buildCategoriesHierarchy(): Promise<CategoryHierarchy[]> {
  try {
    const response = await getCategories()
    const categories = response.data || []

    // Como no hay parent_id, todas las categorías son de nivel raíz
    const rootCategories: CategoryHierarchy[] = categories.map(category => ({
      ...category,
      children: [],
    }))

    return rootCategories
  } catch (error) {
    console.error('Error construyendo jerarquía de categorías:', error)
    return []
  }
}

/**
 * Encuentra una categoría por slug
 * @param slug - Slug de la categoría
 * @param categories - Lista de categorías (opcional)
 * @returns Promise<Category | null>
 */
export async function getCategoryBySlug(
  slug: string,
  categories?: Category[]
): Promise<Category | null> {
  try {
    if (!categories) {
      const response = await getCategories()
      categories = response.data || []
    }

    return categories.find(category => category.slug === slug) || null
  } catch (error) {
    console.error(`Error obteniendo categoría por slug ${slug}:`, error)
    return null
  }
}

/**
 * Obtiene el breadcrumb de una categoría
 * @param categoryId - ID de la categoría
 * @param categories - Lista de categorías (opcional)
 * @returns Promise<Category[]>
 */
export async function getCategoryBreadcrumb(
  categoryId: number,
  categories?: Category[]
): Promise<Category[]> {
  try {
    if (!categories) {
      const response = await getCategories()
      categories = response.data || []
    }

    // Como no hay jerarquías, el breadcrumb solo incluye la categoría actual
    const currentCategory = categories.find(cat => cat.id === categoryId)
    return currentCategory ? [currentCategory] : []
  } catch (error) {
    console.error(`Error obteniendo breadcrumb de categoría ${categoryId}:`, error)
    return []
  }
}

/**
 * Verifica si una categoría tiene subcategorías
 * @param categoryId - ID de la categoría
 * @param categories - Lista de categorías (opcional)
 * @returns Promise<boolean>
 */
export async function hasSubcategories(
  categoryId: number,
  categories?: Category[]
): Promise<boolean> {
  // Como no hay jerarquías, ninguna categoría tiene subcategorías
  return false
}

/**
 * Formatea el nombre de la categoría para mostrar
 * @param category - Categoría
 * @returns string
 */
export function formatCategoryName(category: Category): string {
  return category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase()
}

/**
 * Genera la URL de la categoría
 * @param category - Categoría
 * @returns string
 */
export function getCategoryUrl(category: Category): string {
  return `/shop?category=${category.slug}`
}

/**
 * Obtiene la imagen de la categoría o una por defecto
 * @param category - Categoría
 * @returns string
 */
export function getCategoryImage(category: Category): string {
  return category && category.icon ? category.icon : '/images/categories/default.jpg'
}
