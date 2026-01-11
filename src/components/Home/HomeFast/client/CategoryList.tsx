'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategorySearch } from './CategorySearch'
import type { Category } from '@/types/category'

interface CategoryListProps {
  categories: Category[]
  selectedCategory?: string
}

/**
 * CategoryList - Client Component mínimo
 * Solo para búsqueda interactiva y renderizado de categorías
 */
export function CategoryList({ categories, selectedCategory }: CategoryListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar categorías según búsqueda
  const filteredCategories = searchQuery
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories

  if (filteredCategories.length === 0) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <CategorySearch categories={categories} onSearchChange={setSearchQuery} />
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron categorías.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <CategorySearch categories={categories} onSearchChange={setSearchQuery} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCategories.map((category) => {
          const imageUrl = category.image_url || '/images/placeholder-category.webp'
          const isSelected = selectedCategory === category.slug

          return (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`
                flex flex-col items-center p-4 rounded-lg transition-all
                ${isSelected 
                  ? 'bg-blaze-orange-100 border-2 border-blaze-orange-500' 
                  : 'bg-white hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              <div className="relative w-16 h-16 mb-2">
                <Image
                  src={imageUrl}
                  alt={category.name}
                  width={64}
                  height={64}
                  className="object-cover rounded-full"
                />
              </div>
              <span className="text-sm font-medium text-center text-gray-900 line-clamp-2">
                {category.name}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
