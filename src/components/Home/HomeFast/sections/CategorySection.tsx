import Link from 'next/link'
import Image from 'next/image'
import { CategoryList } from '../client/CategoryList'
import type { CategorySectionProps } from '../types'

/**
 * CategorySection - Server Component
 * Renderiza lista de categorías sin skeleton
 */
export function CategorySection({ categories, selectedCategory, className }: CategorySectionProps) {

  return (
    <section className={`py-6 bg-gray-50 ${className || ''}`}>
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
        </div>
        <CategoryList categories={categories} selectedCategory={selectedCategory} />
      </div>
    </section>
  )
}
