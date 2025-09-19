// ===================================
// PINTEYA E-COMMERCE - FUNCIONES DE API PARA MARCAS
// ===================================

import { ApiResponse } from '@/types/api';
import { Brand, BrandFilters } from '@/app/api/brands/route';
import { safeApiResponseJson } from '@/lib/json-utils';

// Re-exportar tipos para uso en el frontend
export type { Brand, BrandFilters };

// ===================================
// FUNCIONES PARA EL FRONTEND
// ===================================

/**
 * Obtiene todas las marcas disponibles desde la API
 * @param filters - Filtros de marcas
 * @returns Promise<ApiResponse<Brand[]>>
 */
export async function getBrands(filters?: BrandFilters): Promise<ApiResponse<Brand[]>> {
  try {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`/api/brands?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Usar parsing seguro de JSON
    const result = await safeApiResponseJson<ApiResponse<Brand[]>>(response);

    if (!result || !result.success || !result.data) {
      throw new Error(result?.error || 'Error parsing API response');
    }

    return result.data;
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas detalladas de marcas
 * @returns Promise<ApiResponse<BrandStats[]>>
 */
export async function getBrandStats(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Usar parsing seguro de JSON
    const result = await safeApiResponseJson<ApiResponse<any[]>>(response);

    if (!result || !result.success || !result.data) {
      throw new Error(result?.error || 'Error parsing API response');
    }

    return result.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas de marcas:', error);
    throw error;
  }
}

/**
 * Busca marcas por término de búsqueda
 * @param searchTerm - Término de búsqueda
 * @returns Promise<ApiResponse<Brand[]>>
 */
export async function searchBrands(searchTerm: string): Promise<ApiResponse<Brand[]>> {
  return getBrands({
    search: searchTerm,
  });
}

/**
 * Obtiene marcas populares (con más productos)
 * @param minProducts - Mínimo número de productos
 * @returns Promise<ApiResponse<Brand[]>>
 */
export async function getPopularBrands(minProducts: number = 3): Promise<ApiResponse<Brand[]>> {
  return getBrands({
    minProducts,
  });
}

// ===================================
// FUNCIONES HELPER
// ===================================

/**
 * Obtiene productos por marca usando la API de productos
 * @param brandName - Nombre de la marca
 * @param page - Página
 * @param limit - Límite de resultados
 */
export async function getProductsByBrand(
  brandName: string,
  page: number = 1,
  limit: number = 12
) {
  const searchParams = new URLSearchParams({
    brand: brandName,
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/products?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Usar parsing seguro de JSON
  const result = await safeApiResponseJson(response);

  if (!result || !result.success || !result.data) {
    throw new Error(result?.error || 'Error parsing API response');
  }

  return result.data;
}

/**
 * Formatea el nombre de marca para mostrar
 * @param brandName - Nombre de la marca
 * @returns string - Nombre formateado
 */
export function formatBrandName(brandName: string): string {
  // Casos especiales de formato
  const specialCases: Record<string, string> = {
    'el galgo': 'El Galgo',
    'sherwin williams': 'Sherwin Williams',
    'genérico': 'Genérico',
    'akapol': 'Akapol',
    'plavicon': 'Plavicon',
    'sinteplast': 'Sinteplast',
    'petrilac': 'Petrilac',
  };

  const lowerCase = brandName.toLowerCase();
  return specialCases[lowerCase] || brandName;
}

/**
 * Obtiene el color asociado a una marca (para UI)
 * @param brandName - Nombre de la marca
 * @returns string - Color en formato CSS
 */
export function getBrandColor(brandName: string): string {
  const brandColors: Record<string, string> = {
    'El Galgo': '#FF6B35',
    'Sherwin Williams': '#0066CC',
    'Akapol': '#FF8C00',
    'Plavicon': '#228B22',
    'Sinteplast': '#8B4513',
    'Petrilac': '#4169E1',
    'Genérico': '#708090',
  };

  return brandColors[formatBrandName(brandName)] || '#6B7280';
}

/**
 * Obtiene el logo/icono de una marca
 * @param brandName - Nombre de la marca
 * @returns string - Ruta del logo o icono por defecto
 */
export function getBrandLogo(brandName: string): string {
  const brandLogos: Record<string, string> = {
    'El Galgo': '/images/brands/el-galgo.png',
    'Sherwin Williams': '/images/brands/sherwin-williams.png',
    'Akapol': '/images/brands/akapol.png',
    'Plavicon': '/images/brands/plavicon.png',
    'Sinteplast': '/images/brands/sinteplast.png',
    'Petrilac': '/images/brands/petrilac.png',
    'Genérico': '/images/brands/generic.png',
  };

  return brandLogos[formatBrandName(brandName)] || '/images/brands/default.png';
}









