'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Tag, Loader2 } from 'lucide-react'

interface CategoryItemProps {
  category: {
    name: string
    products: number
    isRefined?: boolean
    slug?: string
    id?: string | number
  }
  onCategorySelect: (categorySlug: string) => void
  isSelected: boolean
}

const CategoryItem = ({ category, onCategorySelect, isSelected }: CategoryItemProps) => {
  const handleClick = () => {
    if (category.slug) {
      onCategorySelect(category.slug)
    }
  }

  return (
    <div
      className='flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-md transition-colors'
      data-testid='category-filter'
    >
      <Checkbox
        id={`category-${category.id || category.slug}`}
        checked={isSelected}
        onCheckedChange={handleClick}
        label={category.name}
        className='flex-1'
      />

      <Badge variant={isSelected ? 'default' : 'secondary'} size='sm' className='ml-2'>
        {category.products}
      </Badge>
    </div>
  )
}

interface CategoryDropdownProps {
  categories: Array<{
    name: string
    products: number
    isRefined?: boolean
    slug?: string
    id?: string | number
  }>
  onCategorySelect: (categorySlug: string) => void
  selectedCategory?: string
  loading?: boolean
}

const CategoryDropdown = ({
  categories,
  onCategorySelect,
  selectedCategory,
  loading = false,
}: CategoryDropdownProps) => {
  const [toggleDropdown, setToggleDropdown] = useState(true)

  return (
    <Card>
      <CardContent className='p-0'>
        <button
          onClick={e => {
            e.preventDefault()
            setToggleDropdown(!toggleDropdown)
          }}
          className='w-full flex items-center justify-between py-4 px-5 hover:bg-gray-50 transition-colors'
        >
          <div className='flex items-center gap-2'>
            <Tag className='w-4 h-4 text-primary' />
            <span className='font-medium text-gray-900'>Categorías</span>
            {loading && <Loader2 className='w-4 h-4 animate-spin text-gray-400' />}
          </div>

          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
              toggleDropdown ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Content */}
        {toggleDropdown && (
          <div className='border-t border-gray-200 p-4 space-y-2'>
            {loading ? (
              <div className='flex items-center justify-center py-8 text-gray-500'>
                <Loader2 className='w-5 h-5 animate-spin mr-2' />
                Cargando categorías...
              </div>
            ) : categories.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-gray-500'>
                <Tag className='w-8 h-8 mb-2 text-gray-300' />
                <p className='text-sm'>No hay categorías disponibles</p>
              </div>
            ) : (
              categories.map((category, key) => (
                <CategoryItem
                  key={category.id || key}
                  category={category}
                  onCategorySelect={onCategorySelect}
                  isSelected={selectedCategory === category.slug}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CategoryDropdown
