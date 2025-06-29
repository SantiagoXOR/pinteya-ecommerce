// ===================================
// HOOK: useBrandFilter
// ===================================

import { useState, useEffect, useCallback } from 'react';
import { getBrands, Brand } from '@/lib/api/brands';
import { useRouter, useSearchParams } from 'next/navigation';

// ===================================
// TIPOS
// ===================================

export interface UseBrandFilterOptions {
  /** Cargar marcas automáticamente al montar */
  autoLoad?: boolean;
  /** Sincronizar con URL search params */
  syncWithUrl?: boolean;
  /** Parámetro de URL para las marcas */
  urlParam?: string;
  /** Mínimo número de productos por marca */
  minProducts?: number;
  /** Callback cuando cambian las marcas seleccionadas */
  onBrandsChange?: (brands: string[]) => void;
}

export interface UseBrandFilterReturn {
  /** Lista de marcas disponibles */
  brands: Brand[];
  /** Marcas seleccionadas */
  selectedBrands: string[];
  /** Estado de carga */
  isLoading: boolean;
  /** Error si ocurre */
  error: string | null;
  /** Función para cambiar marcas seleccionadas */
  setSelectedBrands: (brands: string[]) => void;
  /** Función para alternar una marca */
  toggleBrand: (brandName: string) => void;
  /** Función para limpiar todas las marcas */
  clearBrands: () => void;
  /** Función para recargar marcas */
  refetch: () => Promise<void>;
  /** Función para buscar marcas */
  searchBrands: (searchTerm: string) => void;
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useBrandFilter(options: UseBrandFilterOptions = {}): UseBrandFilterReturn {
  const {
    autoLoad = true,
    syncWithUrl = false,
    urlParam = 'brands',
    minProducts = 1,
    onBrandsChange,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrandsState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar marcas seleccionadas desde URL
  useEffect(() => {
    if (syncWithUrl && searchParams) {
      const urlBrands = searchParams.get(urlParam);
      if (urlBrands) {
        const brandsArray = urlBrands.split(',').filter(Boolean);
        setSelectedBrandsState(brandsArray);
      }
    }
  }, [syncWithUrl, urlParam, searchParams]);

  // Cargar marcas
  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getBrands({ minProducts });
      
      if (response.success && response.data) {
        setBrands(response.data);
      } else {
        setError(response.error || 'Error cargando marcas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [minProducts]);

  // Cargar marcas automáticamente
  useEffect(() => {
    if (autoLoad) {
      fetchBrands();
    }
  }, [autoLoad, fetchBrands]);

  // Actualizar URL cuando cambian las marcas seleccionadas
  const updateUrl = useCallback((newBrands: string[]) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams?.toString());
    
    if (newBrands.length > 0) {
      params.set(urlParam, newBrands.join(','));
    } else {
      params.delete(urlParam);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [syncWithUrl, urlParam, searchParams, router]);

  // Función para cambiar marcas seleccionadas
  const setSelectedBrands = useCallback((newBrands: string[]) => {
    setSelectedBrandsState(newBrands);
    updateUrl(newBrands);
    onBrandsChange?.(newBrands);
  }, [updateUrl, onBrandsChange]);

  // Función para alternar una marca
  const toggleBrand = useCallback((brandName: string) => {
    const newBrands = selectedBrands.includes(brandName)
      ? selectedBrands.filter(b => b !== brandName)
      : [...selectedBrands, brandName];
    
    setSelectedBrands(newBrands);
  }, [selectedBrands, setSelectedBrands]);

  // Función para limpiar todas las marcas
  const clearBrands = useCallback(() => {
    setSelectedBrands([]);
  }, [setSelectedBrands]);

  // Función para buscar marcas
  const searchBrands = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getBrands({ 
        search: searchTerm,
        minProducts 
      });
      
      if (response.success && response.data) {
        setBrands(response.data);
      } else {
        setError(response.error || 'Error buscando marcas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [minProducts]);

  return {
    brands,
    selectedBrands,
    isLoading,
    error,
    setSelectedBrands,
    toggleBrand,
    clearBrands,
    refetch: fetchBrands,
    searchBrands,
  };
}

// ===================================
// HOOK SIMPLIFICADO
// ===================================

export function useSimpleBrandFilter() {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const toggleBrand = useCallback((brandName: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  }, []);

  const clearBrands = useCallback(() => {
    setSelectedBrands([]);
  }, []);

  return {
    selectedBrands,
    setSelectedBrands,
    toggleBrand,
    clearBrands,
  };
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Convierte array de marcas a string para URL
 */
export function brandsToUrlString(brands: string[]): string {
  return brands.join(',');
}

/**
 * Convierte string de URL a array de marcas
 */
export function urlStringToBrands(urlString: string): string[] {
  return urlString.split(',').filter(Boolean);
}

/**
 * Valida si una marca existe en la lista
 */
export function validateBrand(brandName: string, availableBrands: Brand[]): boolean {
  return availableBrands.some(brand => brand.name === brandName);
}

/**
 * Filtra marcas válidas de una lista
 */
export function filterValidBrands(brandNames: string[], availableBrands: Brand[]): string[] {
  return brandNames.filter(name => validateBrand(name, availableBrands));
}
