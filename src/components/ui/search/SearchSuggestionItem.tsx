'use client'

import React from 'react'
import { Clock, TrendingUp, Package, Tag, Search } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import type { SearchSuggestion } from '../SearchAutocompleteIntegrated'

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

const getSuggestionIcon = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'product':
      return <Package className='w-4 h-4 text-gray-500 dark:text-gray-400' />
    case 'category':
      return <Tag className='w-4 h-4 text-gray-500 dark:text-gray-400' />
    case 'recent':
      return <Clock className='w-4 h-4 text-gray-400 dark:text-gray-500' />
    case 'trending':
      return <TrendingUp className='w-4 h-4 text-orange-500 dark:text-blaze-orange-400' />
    default:
      return <Search className='w-4 h-4 text-gray-500 dark:text-gray-400' />
  }
}

export const SearchSuggestionItem = React.memo<SearchSuggestionItemProps>(
  ({ suggestion, index, isSelected, onSelect, onMouseEnter }) => {
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
          getSuggestionIcon(suggestion.type)
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
        </div>
      </div>
    )
  }
)

SearchSuggestionItem.displayName = 'SearchSuggestionItem'
