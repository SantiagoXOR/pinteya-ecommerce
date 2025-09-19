"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface CategoryFiltersState {
  selectedCategories: string[];
  isFiltering: boolean;
}

export const useCategoryFilters = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Inicializar desde URL al cargar
  useEffect(() => {
    const categoriesFromUrl = searchParams.get('categories');
    if (categoriesFromUrl) {
      const categories = categoriesFromUrl.split(',').filter(Boolean);
      setSelectedCategories(categories);
      setIsFiltering(categories.length > 0);
    }
  }, [searchParams]);

  // Actualizar URL cuando cambian las categorías
  const updateUrl = useCallback((categories: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (categories.length > 0) {
      params.set('categories', categories.join(','));
    } else {
      params.delete('categories');
    }

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Cambiar categorías seleccionadas
  const handleCategoryChange = useCallback((categories: string[]) => {
    setSelectedCategories(categories);
    setIsFiltering(categories.length > 0);
    updateUrl(categories);
  }, [updateUrl]);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setIsFiltering(false);
    updateUrl([]);
  }, [updateUrl]);

  // Verificar si una categoría está seleccionada
  const isCategorySelected = useCallback((categorySlug: string) => {
    return selectedCategories.includes(categorySlug);
  }, [selectedCategories]);

  // Toggle de una categoría específica
  const toggleCategory = useCallback((categorySlug: string) => {
    const isSelected = selectedCategories.includes(categorySlug);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedCategories.filter(slug => slug !== categorySlug);
    } else {
      newSelection = [...selectedCategories, categorySlug];
    }

    handleCategoryChange(newSelection);
  }, [selectedCategories, handleCategoryChange]);

  return {
    selectedCategories,
    isFiltering,
    handleCategoryChange,
    clearFilters,
    isCategorySelected,
    toggleCategory,
  };
};









