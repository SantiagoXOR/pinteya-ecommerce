"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCategoriesWithDynamicCounts } from "@/hooks/useCategoriesWithDynamicCounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, X, Tag, Loader2 } from "lucide-react";
import Image from "next/image";

interface CategoryTogglePillsProps {
  onCategoryChange: (selectedCategories: string[]) => void;
  selectedCategories: string[];
  searchTerm?: string;
  otherFilters?: any;
}

const CategoryTogglePills: React.FC<CategoryTogglePillsProps> = ({
  onCategoryChange,
  selectedCategories,
  searchTerm,
  otherFilters = {}
}) => {
  const { categories, loading, error, stats } = useCategoriesWithDynamicCounts({
    baseFilters: {
      ...(searchTerm && { search: searchTerm }),
      ...otherFilters,
    },
    selectedCategories,
    enableDynamicCounts: true,
  });

  // Referencia para el contenedor del carrusel
  const carouselRef = useRef<HTMLDivElement>(null);

  // Estados para el drag scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Manejador para scroll horizontal con rueda del mouse
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (e: WheelEvent) => {
      // Solo aplicar scroll horizontal si hay contenido que se desborda
      if (carousel.scrollWidth > carousel.clientWidth) {
        e.preventDefault();
        carousel.scrollLeft += e.deltaY;
      }
    };

    carousel.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      carousel.removeEventListener('wheel', handleWheel);
    };
  }, [categories]);

  // Manejadores para drag scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setIsDragging(true);
    setStartX(e.pageX - carousel.offsetLeft);
    setScrollLeft(carousel.scrollLeft);
    carousel.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const carousel = carouselRef.current;
    if (!carousel) return;

    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 2; // Multiplicador para velocidad de scroll
    carousel.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryToggle = (categorySlug: string) => {
    // Prevenir click si se está arrastrando
    if (isDragging) return;

    const isSelected = selectedCategories.includes(categorySlug);
    let newSelection: string[];

    if (isSelected) {
      // Remover categoría
      newSelection = selectedCategories.filter(slug => slug !== categorySlug);
    } else {
      // Agregar categoría
      newSelection = [...selectedCategories, categorySlug];
    }

    onCategoryChange(newSelection);
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
  };

  if (loading) {
    return (
      <section className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex-shrink-0 animate-pulse">
                <div className="h-10 w-24 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || categories.length === 0) {
    return null; // No mostrar nada si hay error o no hay categorías
  }

  return (
    <section className="bg-white border-b border-gray-200 py-3 sticky top-[110px] lg:top-[120px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenedor con degradados en los bordes */}
        <div className="relative">
          {/* Degradado izquierdo */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>

          {/* Degradado derecho */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          {/* Pills de categorías */}
          <div
            ref={carouselRef}
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-1 cursor-grab select-none"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.slug);
              
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category.slug)}
                  className={`
                    group flex-shrink-0 transition-all duration-200 border-2 rounded-full
                    h-8 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm
                    ${isSelected
                      ? 'bg-[#009e44] text-white border-[#eb6313]'
                      : 'bg-[#007639] hover:bg-[#009e44] text-white border-[#007639]'
                    }
                  `}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    {category.image_url && (
                      <div className={`
                        rounded-full overflow-hidden bg-white/30 transition-all duration-200
                        ${isSelected
                          ? 'w-3 h-3 sm:w-5 sm:h-5'
                          : 'w-3 h-3 group-hover:w-4 group-hover:h-4 sm:w-4 sm:h-4 sm:group-hover:w-5 sm:group-hover:h-5'
                        }
                      `}>
                        <Image
                          src={category.image_url}
                          alt=""
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs font-medium sm:text-sm">
                      {category.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`
                        text-xs px-1 py-0.5 ml-0.5 flex items-center gap-1 sm:px-1.5 sm:ml-1
                        ${isSelected
                          ? 'bg-white/30 text-white'
                          : 'bg-white/30 text-white'
                        }
                      `}
                    >
                      {category.isLoading ? (
                        <Loader2 className="w-2 h-2 sm:w-3 sm:h-3 animate-spin" />
                      ) : (
                        category.products_count || 0
                      )}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Botón limpiar filtros e indicador de filtros activos en la misma línea */}
          {selectedCategories.length > 0 && (
            <div className="mt-3 flex items-center gap-3 flex-nowrap overflow-x-auto">
              {/* Botón limpiar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>

              {/* Indicador de filtros */}
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                Filtrando por:
              </span>

              {/* Badges de categorías */}
              <div className="flex items-center gap-1 flex-nowrap">
                {selectedCategories.map((slug) => {
                  const category = categories.find(cat => cat.slug === slug);
                  return category ? (
                    <Badge
                      key={slug}
                      variant="secondary"
                      className="text-xs bg-blaze-orange-100 text-blaze-orange-800 flex-shrink-0"
                    >
                      {category.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryTogglePills;
