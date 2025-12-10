"use client"

import React from 'react'
import CategoryTogglePills from '@/components/Home/CategoryTogglePills'
import { BrandTogglePills } from '@/components/ShopWithSidebar/BrandTogglePills'
import { ColorTogglePills } from '@/components/ShopWithSidebar/ColorTogglePills'

export interface UnifiedFiltersProps {
  variant?: 'horizontal' | 'sidebar'
  // Categorías
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
  // Medidas / tamaños
  sizeOptions: string[]
  selectedSizes: string[]
  onSizesChange: (sizes: string[]) => void
  // Colores
  colorOptions?: { name: string; hex: string }[]
  selectedColors: string[]
  onColorsChange: (colors: string[]) => void
  // Marcas
  brands?: { name: string; slug: string; logo?: string }[]
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
  // Acciones
  onClearAll?: () => void
}

/**
 * Componente unificado de filtros para desktop y mobile.
 * Agrupa categorías, medidas, colores y marcas en una sola UI consistente.
 */
export const UnifiedFilters: React.FC<UnifiedFiltersProps> = ({
  variant = 'horizontal',
  selectedCategories,
  onCategoryChange,
  sizeOptions,
  selectedSizes,
  onSizesChange,
  colorOptions,
  selectedColors,
  onColorsChange,
  brands,
  selectedBrands,
  onBrandsChange,
  onClearAll,
}) => {
  const isHorizontal = variant === 'horizontal'

  // Estilos base del contenedor según variante
  const containerClass = isHorizontal
    ? 'relative bg-[#FFF5CC] rounded-2xl px-3 py-3 shadow-1 flex flex-col gap-2'
    : 'bg-white shadow-1 rounded-lg py-4 px-5 flex flex-col gap-5'

  return (
    <div className={containerClass}>
      {/* Header solo en sidebar */}
      {!isHorizontal && (
        <div className='flex items-center justify-between'>
          <p className='font-medium'>Filtros</p>
          {onClearAll && (
            <button
              className='text-blue hover:text-blue-dark transition-colors text-sm'
              onClick={onClearAll}
            >
              Limpiar Todo
            </button>
          )}
        </div>
      )}

      {/* Categorías */}
      <div>
        <div className='overflow-x-auto no-scrollbar flex flex-nowrap items-start md:items-center gap-2 pr-6'>
          <CategoryTogglePills
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            variant={isHorizontal ? 'bare' : 'default'}
          />
        </div>
      </div>

      {/* Medidas + Colores */}
      <div>
        <div className='overflow-x-auto no-scrollbar flex flex-nowrap items-center gap-2 pr-6'>
          {sizeOptions.map(vol => {
            const active = selectedSizes.includes(vol)
            return (
              <button
                key={`uf-${vol}`}
                type='button'
                onClick={() => {
                  const next = active
                    ? selectedSizes.filter(s => s !== vol)
                    : [...selectedSizes, vol]
                  onSizesChange(next)
                }}
                className={`${
                  active
                    ? 'bg-[#EB6313] text-white shadow-sm'
                    : 'bg-[#EB6313] text-white opacity-80 hover:opacity-100'
                } rounded-full px-3 py-1 text-sm whitespace-nowrap flex-shrink-0`}
                aria-pressed={active}
              >
                {vol}
              </button>
            )
          })}

          {/* Botón indicativo de más medidas (opcional en horizontal) */}
          {isHorizontal && (
            <button
              type='button'
              aria-label='Más medidas'
              className='bg-[#EB6313] text-white rounded-full px-3 py-1 text-sm flex-shrink-0'
            >
              +
            </button>
          )}

          {/* Selector de colores */}
          <div className='flex items-center gap-2 pl-1'>
            <ColorTogglePills
              colors={colorOptions && colorOptions.length ? colorOptions : undefined}
              selectedColors={selectedColors}
              onChange={onColorsChange}
            />
          </div>
        </div>
      </div>

      {/* Marcas */}
      <div>
        <div className='overflow-x-auto no-scrollbar flex flex-nowrap items-center gap-2 pr-6'>
          <BrandTogglePills
            brands={brands}
            selectedBrands={selectedBrands}
            onChange={onBrandsChange}
          />
        </div>
      </div>

      {/* Degradados laterales en horizontal */}
      {isHorizontal && (
        <>
          <div className='pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#FFF5CC] to-transparent rounded-r-2xl' />
          <div className='pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#FFF5CC] to-transparent rounded-l-2xl' />
        </>
      )}
    </div>
  )
}

export default UnifiedFilters