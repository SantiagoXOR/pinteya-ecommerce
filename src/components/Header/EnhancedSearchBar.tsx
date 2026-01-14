'use client'

import React, { useState, useCallback } from 'react'
import {
  Search,
  ChevronDown,
  Palette,
  Brush,
  Wrench,
  Package,
  Sparkles,
} from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchAutocompleteIntegrated } from '@/components/ui/SearchAutocompleteIntegrated'
import { type SearchSuggestion } from '@/hooks/useSearch'

// Definición de categorías con iconos y placeholders profesionales
// Orden de visualización: Paredes, Metales y Maderas, Techos, Complementos, Antihumedad, Piscinas, Reparaciones, Pisos
const categories = [
  {
    id: 'all',
    name: 'Todas las Categorías',
    icon: Package,
    placeholder: 'Látex interior blanco 20lts, rodillos, pinceles...',
  },
  {
    id: 'paredes',
    name: 'Paredes',
    icon: Palette,
    placeholder: 'Látex interior, frentes, muros...',
  },
  {
    id: 'metales-y-maderas',
    name: 'Metales y Maderas',
    icon: Brush,
    placeholder: 'Impregnantes, sintéticos, protectores...',
  },
  {
    id: 'techos',
    name: 'Techos',
    icon: Sparkles,
    placeholder: 'Membranas, cielorrasos, impermeabilizantes...',
  },
  {
    id: 'complementos',
    name: 'Complementos',
    icon: Wrench,
    placeholder: 'Rodillos, pinceles, cintas, lijas...',
  },
  {
    id: 'antihumedad',
    name: 'Antihumedad',
    icon: Package,
    placeholder: 'Productos para baños y cocinas...',
  },
  {
    id: 'piscinas',
    name: 'Piscinas',
    icon: Package,
    placeholder: 'Productos para piscinas...',
  },
  {
    id: 'reparaciones',
    name: 'Reparaciones',
    icon: Package,
    placeholder: 'Poximix, masillas, rellenos...',
  },
  {
    id: 'pisos',
    name: 'Pisos',
    icon: Sparkles,
    placeholder: 'Barnices para pisos, protectores...',
  },
]

interface EnhancedSearchBarProps {
  className?: string
  onSearch?: (query: string, category?: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  size?: 'sm' | 'md' | 'lg'
  'data-testid'?: string
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  className,
  onSearch,
  onSuggestionSelect,
  size = 'md',
  'data-testid': testId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0])

  const handleCategorySelect = useCallback((category: (typeof categories)[0]) => {
    setSelectedCategory(category)
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      // Llamar al callback externo (que manejará la búsqueda)
      onSearch?.(query, selectedCategory.id !== 'all' ? selectedCategory.id : undefined)
    },
    [onSearch, selectedCategory.id]
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      // Llamar al callback externo (que manejará la selección)
      onSuggestionSelect?.(suggestion)
    },
    [onSuggestionSelect]
  )

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
  }

  const buttonSizeClasses = {
    sm: 'h-10 px-4',
    md: 'h-12 px-6',
    lg: 'h-14 px-8',
  }

  const categorySizeClasses = {
    sm: 'h-10 px-3 text-xs',
    md: 'h-12 px-4 text-sm',
    lg: 'h-14 px-5 text-base',
  }

  return (
    <div className={cn('w-full max-w-2xl', className)}>
      {/* Formulario de búsqueda con selector de categorías */}
      <div className='flex items-center bg-white border-2 border-white/20 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-white focus-within:border-white shadow-lg search-focus-ring'>
        {/* Selector de categorías */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className={cn(
                'flex-shrink-0 border-0 rounded-none border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 gap-2',
                categorySizeClasses[size]
              )}
              aria-expanded='false'
              aria-haspopup='menu'
              data-testid='category-selector'
            >
              <selectedCategory.icon className='w-4 h-4' />
              <span className='hidden sm:inline font-medium'>{selectedCategory.name}</span>
              <span className='sm:hidden font-medium'>
                {selectedCategory.id === 'all' ? 'Todo' : selectedCategory.name}
              </span>
              <ChevronDown className='w-3 h-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56' data-testid='category-dropdown'>
            {categories.map(category => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  'flex items-center gap-3 py-2',
                  selectedCategory.id === category.id && 'bg-accent'
                )}
                data-testid={`category-${category.id}`}
              >
                <category.icon className='w-4 h-4' />
                <span>{category.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Campo de búsqueda con autocompletado */}
        <div className='flex-1 relative'>
          <SearchAutocompleteIntegrated
            // Props de configuración
            placeholder={selectedCategory.placeholder}
            onSearch={handleSearch}
            onSuggestionSelected={handleSuggestionSelect}
            size={size}
            className='w-full [&>div>div>input]:border-0 [&>div>div>input]:rounded-none [&>div>div>input]:bg-white [&>div>div>input]:focus:ring-0 [&>div>div>input]:focus:border-gray-300'
            debounceMs={150}
            showRecentSearches={true}
            showTrendingSearches={true}
            data-testid={testId || 'search-input'}
            categoryId={selectedCategory.id !== 'all' ? selectedCategory.id : undefined}
            formId='search-autocomplete-form'
          />
        </div>

        {/* Botón de búsqueda - SIN ícono duplicado */}
        <Button
          type='submit'
          className={cn(
            'rounded-l-none bg-bright-sun dark:bg-blaze-orange-600 hover:bg-bright-sun-600 dark:hover:bg-blaze-orange-500 text-black dark:text-gray-200 border-bright-sun dark:border-blaze-orange-600 hover:border-bright-sun-600 dark:hover:border-blaze-orange-500 flex-shrink-0 button-hover-lift font-bold transition-all duration-200',
            buttonSizeClasses[size]
          )}
          form='search-autocomplete-form'
        >
          <span className='font-medium'>Buscar</span>
        </Button>
      </div>
    </div>
  )
}

export default EnhancedSearchBar
