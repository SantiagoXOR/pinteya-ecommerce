// ===================================
// PINTEYA E-COMMERCE - HOOK FILTER METADATA
// ===================================

import { useQuery } from '@tanstack/react-query';

// ===================================
// TIPOS
// ===================================

export interface CategoryWithSubs {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    parent_id: number;
    image_url: string | null;
  }[];
}

export interface FilterMetadata {
  categories: CategoryWithSubs[];
  brands: string[];
  paintTypes: string[];
  finishes: string[];
  priceRange: {
    min: number;
    max: number;
  };
  stats: {
    totalCategories: number;
    totalSubcategories: number;
    totalBrands: number;
    totalProducts: number;
  };
}

export interface FilterMetadataResponse {
  success: boolean;
  data: FilterMetadata;
  error?: string;
}

// ===================================
// FUNCIÓN DE FETCH
// ===================================

const fetchFilterMetadata = async (): Promise<FilterMetadata> => {
  
  const response = await fetch('/api/filters/metadata', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ useFilterMetadata: API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Failed to fetch filter metadata: ${response.status} ${response.statusText}`);
  }

  const result: FilterMetadataResponse = await response.json();
  
  if (!result.success) {
    console.error('❌ useFilterMetadata: API returned error:', result.error);
    throw new Error(result.error || 'Failed to fetch filter metadata');
  }

  console.log('✅ useFilterMetadata: Metadata fetched successfully:', {
    categories: result.data.categories.length,
    brands: result.data.brands.length,
    paintTypes: result.data.paintTypes.length,
    finishes: result.data.finishes.length,
    priceRange: result.data.priceRange
  });

  return result.data;
};

// ===================================
// HOOK PRINCIPAL
// ===================================

export const useFilterMetadata = () => {
  return useQuery({
    queryKey: ['filterMetadata'],
    queryFn: fetchFilterMetadata,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// ===================================
// HOOKS AUXILIARES
// ===================================

/**
 * Hook para obtener solo las categorías principales
 */
export const useMainCategories = () => {
  const { data, isLoading, error } = useFilterMetadata();
  
  return {
    categories: data?.categories || [],
    isLoading,
    error
  };
};

/**
 * Hook para obtener solo las marcas
 */
export const useBrands = () => {
  const { data, isLoading, error } = useFilterMetadata();
  
  return {
    brands: data?.brands || [],
    isLoading,
    error
  };
};

/**
 * Hook para obtener tipos de pintura y acabados
 */
export const usePaintOptions = () => {
  const { data, isLoading, error } = useFilterMetadata();
  
  return {
    paintTypes: data?.paintTypes || [],
    finishes: data?.finishes || [],
    isLoading,
    error
  };
};

/**
 * Hook para obtener rango de precios
 */
export const usePriceRange = () => {
  const { data, isLoading, error } = useFilterMetadata();
  
  return {
    priceRange: data?.priceRange || { min: 0, max: 100000 },
    isLoading,
    error
  };
};
