import Link from 'next/link'
import Image from 'next/image'
import { CategorySearch } from '../client/CategorySearch'
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
          <CategorySearch categories={categories} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
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
      </div>
    </section>
  )
}
