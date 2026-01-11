'use client'

import { useState } from 'react'
import { Search } from '@/lib/optimized-imports'
import { Input } from '@/components/ui/input'
import type { Category } from '@/types/category'

interface CategorySearchProps {
  categories: Category[]
}

/**
 * CategorySearch - Client Component mínimo
 * Solo para búsqueda interactiva de categorías
 */
export function CategorySearch({ categories }: CategorySearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = searchQuery
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder="Buscar categorías..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-64"
      />
    </div>
  )
}
