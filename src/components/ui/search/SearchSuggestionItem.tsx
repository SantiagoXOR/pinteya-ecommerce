'use client'

import React from 'react'
import { Clock, TrendingUp, Package, Tag, Search } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import type { SearchSuggestion } from '../SearchAutocompleteIntegrated'
import { ColorPill } from '@/components/ui/product-card-commercial/components/ColorPill'
import { MeasurePill } from '@/components/ui/product-card-commercial/components/MeasurePill'
import { FinishPill } from '@/components/ui/product-card-commercial/components/FinishPill'
import { useTenantSafe } from '@/contexts/TenantContext'

// ===================================
// COMPONENTE: SearchSuggestionItem
// ===================================
// Componente para renderizar cada item de sugerencia de forma consistente y reutilizable

export interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion
  index: number
  isSelected: boolean
  onSelect: (suggestion: SearchSuggestion) => void
  onMouseEnter: (index: number) => void
}

const getSuggestionIcon = (type: SearchSuggestion['type'], primaryColor?: string) => {
  const iconColor = primaryColor || '#f27a1d'
  switch (type) {
    case 'product':
      return <Package className='w-4 h-4 text-gray-500 dark:text-gray-400' />
    case 'category':
      return <Tag className='w-4 h-4 text-gray-500 dark:text-gray-400' />
    case 'recent':
      return <Clock className='w-4 h-4 text-gray-400 dark:text-gray-500' />
    case 'trending':
      return <TrendingUp className='w-4 h-4' style={{ color: iconColor }} />
    default:
      return <Search className='w-4 h-4 text-gray-500 dark:text-gray-400' />
  }
}

export const SearchSuggestionItem = React.memo<SearchSuggestionItemProps>(
  ({ suggestion, index, isSelected, onSelect, onMouseEnter }) => {
    // ⚡ MULTITENANT: Colores del tenant para iconos del dropdown
    const tenant = useTenantSafe()
    const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto
    
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800',
          isSelected && 'bg-gray-50 dark:bg-gray-800'
        )}
        onClick={() => onSelect(suggestion)}
        onMouseEnter={() => onMouseEnter(index)}
        role='option'
        id={`option-${suggestion.id}`}
        aria-selected={isSelected}
      >
        {/* Thumbnail o icono */}
        {suggestion.image ? (
          <img
            src={suggestion.image}
            alt={suggestion.title}
            className='w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0'
          />
        ) : (
          getSuggestionIcon(suggestion.type, primaryColor)
        )}

        {/* Texto */}
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-gray-900 dark:text-gray-200 truncate'>
            {suggestion.title}
          </div>
          {suggestion.subtitle && (
            <div className='text-sm text-gray-500 dark:text-gray-400 truncate'>
              {suggestion.subtitle}
            </div>
          )}
          
          {/* Pills de variantes (solo para productos) */}
          {suggestion.type === 'product' && (
            <div className='flex items-center gap-1.5 mt-1.5 flex-wrap'>
              {/* Pills de colores (máximo 3) */}
              {suggestion.colors && suggestion.colors.length > 0 && (
                <>
                  {suggestion.colors.slice(0, 3).map((color, idx) => (
                    <div key={`color-${idx}`} className='pointer-events-none'>
                      <ColorPill
                        colorData={{
                          name: color.name,
                          hex: color.hex,
                          textureType: color.textureType
                        }}
                        isSelected={false}
                        onSelect={() => {}}
                        isImpregnante={false}
                      />
                    </div>
                  ))}
                  {suggestion.colors.length > 3 && (
                    <span className='text-xs text-gray-400 dark:text-gray-500'>
                      +{suggestion.colors.length - 3}
                    </span>
                  )}
                </>
              )}
              
              {/* Pills de medidas (máximo 2) */}
              {suggestion.measures && suggestion.measures.length > 0 && (
                <>
                  {suggestion.measures.slice(0, 2).map((measure, idx) => (
                    <div key={`measure-${idx}`} className='pointer-events-none'>
                      <MeasurePill
                        measure={measure}
                        isSelected={false}
                        onSelect={() => {}}
                      />
                    </div>
                  ))}
                  {suggestion.measures.length > 2 && (
                    <span className='text-xs text-gray-400 dark:text-gray-500'>
                      +{suggestion.measures.length - 2}
                    </span>
                  )}
                </>
              )}
              
              {/* Pills de finishes (máximo 1) */}
              {suggestion.finishes && suggestion.finishes.length > 0 && (
                <>
                  {suggestion.finishes.slice(0, 1).map((finish, idx) => (
                    <div key={`finish-${idx}`} className='pointer-events-none'>
                      <FinishPill
                        finish={finish}
                        isSelected={false}
                        isAvailable={true}
                        onSelect={() => {}}
                      />
                    </div>
                  ))}
                  {suggestion.finishes.length > 1 && (
                    <span className='text-xs text-gray-400 dark:text-gray-500'>
                      +{suggestion.finishes.length - 1}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

SearchSuggestionItem.displayName = 'SearchSuggestionItem'
