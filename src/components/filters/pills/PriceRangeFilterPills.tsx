'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'

interface PriceRangeFilterPillProps {
  range: string
  isSelected: boolean
  onToggle: (range: string) => void
}

const PriceRangeFilterPill: React.FC<PriceRangeFilterPillProps> = React.memo(({ range, isSelected, onToggle }) => {
  const handleClick = React.useCallback(() => {
    onToggle(range)
  }, [onToggle, range])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'relative flex-shrink-0 rounded-full flex items-center gap-1.5',
        'min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1',
        'transform-gpu transition-all duration-200',
        'border-2',
        isSelected
          ? 'bg-[#EA5A17] border-[#EA5A17] text-white shadow-lg'
          : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40'
      )}
    >
      <span className={cn(
        'relative z-10 font-medium leading-none whitespace-nowrap text-sm sm:text-xs',
      )}>
        {range}
      </span>
      
      {isSelected && (
        <Check className='relative z-10 w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-white' strokeWidth={3} />
      )}
    </button>
  )
})

PriceRangeFilterPill.displayName = 'PriceRangeFilterPill'

interface PriceRangeFilterPillsProps {
  options: string[]
  selected: string[]
  onChange: (ranges: string[]) => void
}

/**
 * Componente de pills para filtros de rangos de precio
 * Mobile-first con scroll horizontal
 */
export const PriceRangeFilterPills: React.FC<PriceRangeFilterPillsProps> = ({ 
  options, 
  selected, 
  onChange 
}) => {
  const handleToggle = React.useCallback((range: string) => {
    const isSelected = selected.includes(range)
    if (isSelected) {
      onChange(selected.filter(r => r !== range))
    } else {
      onChange([...selected, range])
    }
  }, [selected, onChange])

  return (
    <div className='overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide'>
      <div className='flex gap-1.5 pb-1'>
        {options.map(range => (
          <PriceRangeFilterPill
            key={range}
            range={range}
            isSelected={selected.includes(range)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
