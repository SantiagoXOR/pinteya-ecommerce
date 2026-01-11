/**
 * Tipos TypeScript específicos para home-fast
 */

import type { Product } from '@/types/product'
import type { Category } from '@/types/category'

export interface HomeFastProps {
  categories: Category[]
  bestSellerProducts: Product[]
}

export interface SectionProps {
  className?: string
}

export interface BestSellerSectionProps extends SectionProps {
  products: Product[]
  limit?: number
}

export interface CategorySectionProps extends SectionProps {
  categories: Category[]
  selectedCategory?: string
}

export interface HeroSectionProps extends SectionProps {
  imageUrl: string
  alt: string
  title?: string
  subtitle?: string
}

export interface ProductGridProps {
  products: Product[]
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export interface ProductCardProps {
  product: Product
  priority?: boolean
  actions?: React.ReactNode
}
