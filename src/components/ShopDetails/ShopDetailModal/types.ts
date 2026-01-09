/**
 * Tipos e interfaces para ShopDetailModal
 */

import { ColorOption } from '@/components/ui/advanced-color-picker'
import { ProductVariant } from '@/lib/api/product-variants'
import { ProductGroup, RelatedProduct } from '@/lib/api/related-products'
import { ProductWithCategory } from '@/types/api'

export interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  stock: number
  description?: string
  colors?: ColorOption[]
  capacities?: string[]
  slug?: string
  technical_sheet_url?: string | null
  technical_sheet?: {
    id?: string
    url: string
    title?: string
    original_filename?: string
    file_size?: number
  } | null
}

export interface ShopDetailModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart?: (product: Product, variants: any) => void
  onAddToWishlist?: (product: Product) => void
}

// Interfaces de selectores
export interface ColorSelectorProps {
  colors: string[]
  selectedColor: string
  onColorChange: (color: string) => void
}

export interface CapacitySelectorProps {
  capacities: string[]
  selectedCapacity: string
  onCapacityChange: (capacity: string) => void
}

export interface FinishSelectorProps {
  finishes: string[]
  selectedFinish: string
  onFinishChange: (finish: string) => void
}

export interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onIncrement: () => void
  onDecrement: () => void
  maxQuantity?: number
  stock: number
}

export interface GrainSelectorProps {
  grainOptions: string[]
  selectedGrain: string
  onGrainChange: (grain: string) => void
}

export interface SizeSelectorProps {
  sizeOptions: string[]
  selectedSize: string
  onSizeChange: (size: string) => void
}

export interface WidthSelectorProps {
  widthOptions: string[]
  selectedWidth: string
  onWidthChange: (width: string) => void
}

// Re-exportar tipos de otros módulos
export type { ProductVariant } from '@/lib/api/product-variants'
export type { ProductGroup, RelatedProduct } from '@/lib/api/related-products'
export type { ProductWithCategory } from '@/types/api'

