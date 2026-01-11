import { CategoryTogglePillsWithSearch } from '../CategoryTogglePillsWithSearch'
import type { Category } from '@/types/category'

interface CategorySectionProps {
  categories: Category[]
  className?: string
}

/**
 * CategorySection - Server Component wrapper
 * Pasa categorías pre-fetched al componente Client Component para interactividad
 */
export function CategorySection({ categories, className }: CategorySectionProps) {
  // Las categorías se pasan al contexto o se usan directamente en CategoryTogglePillsWithSearch
  // Este componente actúa como wrapper Server Component
  return (
    <section className={`mt-1 sm:mt-1.5 ${className || ''}`}>
      <CategoryTogglePillsWithSearch />
    </section>
  )
}
