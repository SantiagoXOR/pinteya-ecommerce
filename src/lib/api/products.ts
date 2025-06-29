// ===================================
// PINTEYA E-COMMERCE - FUNCIONES DE API PARA PRODUCTOS
// ===================================

import { ProductFilters, ProductWithCategory, ApiResponse, PaginatedResponse } from '@/types/api';

// ===================================
// FUNCIONES PARA EL FRONTEND
// ===================================

/**
 * Obtiene productos con filtros desde la API
 * @param filters - Filtros de productos
 * @returns Promise<PaginatedResponse<ProductWithCategory>>
 */
export async function getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductWithCategory>> {
  try {
    const searchParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`/api/products?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw error;
  }
}

/**
 * Obtiene un producto por ID desde la API
 * @param id - ID del producto
 * @returns Promise<ApiResponse<ProductWithCategory>>
 */
export async function getProductById(id: number): Promise<ApiResponse<ProductWithCategory>> {
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error obteniendo producto ${id}:`, error);
    throw error;
  }
}

/**
 * Busca productos por término de búsqueda
 * @param searchTerm - Término de búsqueda
 * @param limit - Límite de resultados
 * @returns Promise<PaginatedResponse<ProductWithCategory>>
 */
export async function searchProducts(
  searchTerm: string, 
  limit: number = 12
): Promise<PaginatedResponse<ProductWithCategory>> {
  return getProducts({
    search: searchTerm,
    limit,
    page: 1,
  });
}

/**
 * Obtiene productos por categoría
 * @param categorySlug - Slug de la categoría
 * @param page - Página
 * @param limit - Límite de resultados
 * @returns Promise<PaginatedResponse<ProductWithCategory>>
 */
export async function getProductsByCategory(
  categorySlug: string,
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<ProductWithCategory>> {
  return getProducts({
    category: categorySlug,
    page,
    limit,
  });
}

/**
 * Obtiene productos con descuento
 * @param page - Página
 * @param limit - Límite de resultados
 * @returns Promise<PaginatedResponse<ProductWithCategory>>
 */
export async function getDiscountedProducts(
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<ProductWithCategory>> {
  // Nota: Esto requeriría un filtro adicional en la API
  // Por ahora, obtenemos todos los productos y filtramos en el frontend
  const response = await getProducts({ page, limit });

  // Filtrar productos con descuento
  const discountedProducts = response.data.filter(
    product => product.discounted_price && product.discounted_price < product.price
  );

  return {
    ...response,
    data: discountedProducts,
  };
}

/**
 * Obtiene productos por marca
 * @param brandName - Nombre de la marca
 * @param page - Página
 * @param limit - Límite de resultados
 * @returns Promise<PaginatedResponse<ProductWithCategory>>
 */
export async function getProductsByBrand(
  brandName: string,
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<ProductWithCategory>> {
  return getProducts({
    brand: brandName,
    page,
    limit,
  });
}

/**
 * Obtiene productos relacionados (misma categoría)
 * @param productId - ID del producto actual
 * @param categoryId - ID de la categoría
 * @param limit - Límite de resultados
 * @returns Promise<ProductWithCategory[]>
 */
export async function getRelatedProducts(
  productId: number,
  categoryId: number,
  limit: number = 4
): Promise<ProductWithCategory[]> {
  try {
    // Obtener productos de la misma categoría
    const response = await fetch(`/api/products?category_id=${categoryId}&limit=${limit + 1}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data: PaginatedResponse<ProductWithCategory> = await response.json();
    
    // Filtrar el producto actual y limitar resultados
    return data.data
      .filter(product => product.id !== productId)
      .slice(0, limit);

  } catch (error) {
    console.error('Error obteniendo productos relacionados:', error);
    return [];
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Convierte un producto del formato antiguo al nuevo
 * @param oldProduct - Producto en formato antiguo
 * @returns ProductWithCategory
 */
export function convertLegacyProduct(oldProduct: any): ProductWithCategory {
  return {
    id: oldProduct.id,
    name: oldProduct.title,
    slug: oldProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `Producto ${oldProduct.title}`,
    price: oldProduct.price,
    discounted_price: oldProduct.discountedPrice,
    stock: 50, // Stock por defecto
    category_id: 1, // Categoría por defecto
    images: oldProduct.imgs,
    created_at: new Date().toISOString(),
  };
}

/**
 * Calcula el porcentaje de descuento
 * @param originalPrice - Precio original
 * @param discountedPrice - Precio con descuento
 * @returns number
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (!discountedPrice || discountedPrice >= originalPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Formatea el precio para mostrar
 * @param price - Precio
 * @param currency - Moneda
 * @returns string
 */
export function formatPrice(price: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Verifica si un producto está en stock
 * @param product - Producto
 * @returns boolean
 */
export function isProductInStock(product: ProductWithCategory): boolean {
  return product.stock > 0;
}

/**
 * Obtiene la URL de la imagen principal del producto
 * @param product - Producto
 * @returns string
 */
export function getProductMainImage(product: ProductWithCategory): string {
  if (product.images?.previews?.[0]) {
    return product.images.previews[0];
  }
  
  if (product.images?.thumbnails?.[0]) {
    return product.images.thumbnails[0];
  }
  
  return '/images/products/placeholder.jpg';
}
