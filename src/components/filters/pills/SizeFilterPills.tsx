'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Check } from '@/lib/optimized-imports'
import { parseMeasure } from '@/components/ui/product-card-commercial/utils/measure-utils'

interface SizeFilterPillProps {
  size: string
  isSelected: boolean
  onToggle: (size: string) => void
}

const SizeFilterPill: React.FC<SizeFilterPillProps> = React.memo(({ size, isSelected, onToggle }) => {
  const { number, unit } = React.useMemo(() => parseMeasure(size), [size])
  
  const displayUnit = React.useMemo(() => {
    if (unit === 'L' || unit === 'LT' || unit === 'LITRO' || unit === 'LITROS') {
      return number === '1' ? 'LITRO' : 'L'
    }
    return unit.toUpperCase()
  }, [unit, number])

  const handleClick = React.useCallback(() => {
    onToggle(size)
  }, [onToggle, size])

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
        {number}{displayUnit ? ` ${displayUnit}` : ''}
      </span>
      
      {isSelected && (
        <Check className='relative z-10 w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-white' strokeWidth={3} />
      )}
    </button>
  )
})

SizeFilterPill.displayName = 'SizeFilterPill'

interface SizeFilterPillsProps {
  options: string[]
  selected: string[]
  onChange: (sizes: string[]) => void
  groupedBy?: Record<string, string[]>
}

/**
 * Componente de pills para filtros de medidas/tamaños
 * Mobile-first con scroll horizontal
 */
export const SizeFilterPills: React.FC<SizeFilterPillsProps> = ({ 
  options, 
  selected, 
  onChange,
  groupedBy 
}) => {
  const handleToggle = React.useCallback((size: string) => {
    const isSelected = selected.includes(size)
    if (isSelected) {
      onChange(selected.filter(s => s !== size))
    } else {
      onChange([...selected, size])
    }
  }, [selected, onChange])

  // Si hay agrupación, mostrar por grupos
  if (groupedBy) {
    return (
      <div className='space-y-3'>
        {Object.entries(groupedBy).map(([groupName, groupSizes]) => {
          if (groupSizes.length === 0) return null
          
          return (
            <div key={groupName} className='space-y-2'>
              <h4 className='text-xs sm:text-xs font-semibold text-white/70 px-1'>{groupName}</h4>
              <div className='overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide'>
                <div className='flex gap-1.5 pb-1'>
                  {groupSizes.map(size => (
                    <SizeFilterPill
                      key={size}
                      size={size}
                      isSelected={selected.includes(size)}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Sin agrupación, mostrar todos en una fila
  return (
    <div className='overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-hide'>
      <div className='flex gap-1.5 pb-1'>
        {options.map(size => (
          <SizeFilterPill
            key={size}
            size={size}
            isSelected={selected.includes(size)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
