'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'

interface BrandFilterPillProps {
  brand: { name: string; slug: string; logo?: string }
  isSelected: boolean
  onToggle: (brandSlug: string) => void
}

const BrandFilterPill: React.FC<BrandFilterPillProps> = React.memo(({ brand, isSelected, onToggle }) => {
  const handleClick = React.useCallback(() => {
    onToggle(brand.slug)
  }, [onToggle, brand.slug])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'relative flex-shrink-0 rounded-full flex items-center gap-2',
        'min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1',
        'transform-gpu transition-all duration-200',
        'border-2',
        isSelected
          ? 'bg-[#EA5A17] border-[#EA5A17] text-white shadow-lg'
          : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40'
      )}
    >
      {brand.logo && (
        <img 
          src={brand.logo} 
          alt={brand.name}
          className='w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 object-contain'
        />
      )}
      <span className={cn(
        'relative z-10 font-medium leading-none whitespace-nowrap text-sm sm:text-xs',
      )}>
        {brand.name}
      </span>
      
      {isSelected && (
        <Check className='relative z-10 w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-white' strokeWidth={3} />
      )}
    </button>
  )
})

BrandFilterPill.displayName = 'BrandFilterPill'

interface BrandFilterPillsProps {
  options: { name: string; slug: string; logo?: string }[]
  selected: string[]
  onChange: (brands: string[]) => void
}

/**
 * Componente de pills para filtros de marcas
 * Mobile-first con scroll horizontal
 */
export const BrandFilterPills: React.FC<BrandFilterPillsProps> = ({ 
  options, 
  selected, 
  onChange 
}) => {
  const handleToggle = React.useCallback((brandSlug: string) => {
    const isSelected = selected.includes(brandSlug)
    if (isSelected) {
      onChange(selected.filter(b => b !== brandSlug))
    } else {
      onChange([...selected, brandSlug])
    }
  }, [selected, onChange])

  return (
    <div className='overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide'>
      <div className='flex gap-1.5 pb-1'>
        {options.map(brand => (
          <BrandFilterPill
            key={brand.slug}
            brand={brand}
            isSelected={selected.includes(brand.slug)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
