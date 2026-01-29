/**
 * Tipos e interfaces para ProductCard Commercial
 */

import type React from 'react'
import type { TextureType } from '@/lib/textures'

// Interfaces para variantes de productos
export interface ProductVariant {
  id?: string | number
  aikon_id?: number
  measure?: string
  color_name?: string
  color_hex?: string
  finish?: string
  price_list?: number
  price_sale?: number
  stock?: number
  is_active?: boolean
  is_default?: boolean
  image_url?: string | null
}

// Tipos para estructuras de imágenes del producto
export type ProductImageUrl = string

export type ProductImageArray = ProductImageUrl[] | Array<{
  url?: string
  image_url?: string
}>

export type ProductImageObject = {
  main?: string
  previews?: string[]
  thumbnails?: string[]
  gallery?: string[]
}

export type ProductImages = ProductImageArray | ProductImageObject | null | undefined

// Tipo para productos con imágenes (usado en image-resolver)
export interface ProductWithImages {
  image_url?: string | null
  default_variant?: ProductVariant | null
  variants?: ProductVariant[] | null
  images?: ProductImages
  imgs?: {
    previews?: string[]
    thumbnails?: string[]
  } | null
}

// Configuración de badges inteligentes
export interface BadgeConfig {
  showCapacity?: boolean
  showColor?: boolean
  showFinish?: boolean
  showMaterial?: boolean
  showGrit?: boolean
  showDimensions?: boolean
  showWeight?: boolean
  showBrand?: boolean
  maxBadges?: number
}

// Props del componente principal
export interface CommercialProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string
  title?: string
  slug?: string
  brand?: string
  /** Categoría del producto (ej: "Complementos", "Pinturas") - usado para analytics */
  category?: string
  price?: number
  originalPrice?: number
  discount?: string
  isNew?: boolean
  cta?: string
  stock?: number
  productId?: number | string
  onAddToCart?: () => void
  showCartAnimation?: boolean
  
  // Información de cuotas
  installments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  
  // Información de envío
  freeShipping?: boolean
  shippingText?: string
  deliveryLocation?: string
  
  // Nuevas props para sistema de badges inteligente
  variants?: ProductVariant[]
  description?: string
  badgeConfig?: BadgeConfig
  
  // Nuevas props para datos estructurados de la base de datos
  features?: Record<string, any>
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  // Campos directos de la base de datos
  color?: string
  medida?: string
}

// Props para ColorPill
export interface ColorPillProps {
  colorData: { name: string; hex: string; textureType?: TextureType; finish?: string }
  isSelected: boolean
  onSelect: (hex: string) => void
  isImpregnante: boolean
  selectedFinish?: string  // Finish seleccionado actualmente (para textura dinámica)
}

// Props para ColorPillSelector
export interface ColorPillSelectorProps {
  colors: Array<{ name: string; hex: string; textureType?: TextureType; finish?: string }>
  selectedColor?: string
  onColorSelect: (hex: string) => void
  isImpregnante: boolean
  selectedFinish?: string  // Finish seleccionado actualmente (para textura dinámica)
  /** Activa scroll automático tipo marquee cuando el card está hover/touch (solo si hay overflow) */
  autoScroll?: boolean
}

// Props para MeasurePill
export interface MeasurePillProps {
  measure: string
  isSelected: boolean
  onSelect: (measure: string) => void
}

// Props para MeasurePillSelector
export interface MeasurePillSelectorProps {
  measures: string[]
  selectedMeasure?: string
  onMeasureSelect: (measure: string) => void
  commonUnit: string
  colors?: Array<{ name: string; hex: string }>
  selectedColor?: string
  onColorSelect?: (hex: string) => void
  onAddToCart?: () => void
  isAddingToCart?: boolean
  stock?: number
  isImpregnante?: boolean
  /** Activa scroll automático tipo marquee cuando el card está hover/touch (solo si hay overflow) */
  autoScroll?: boolean
}

// Props para ProductCardImage
export interface ProductCardImageProps {
  image?: string
  title?: string
  productId?: number | string
  onImageError?: () => void
  imageError?: boolean
  currentImageSrc?: string
}

// Props para ProductCardContent
export interface ProductCardContentProps {
  variants?: ProductVariant[]
  selectedColorName?: string
  brand?: string
  title?: string
  displayPrice?: number
  displayOriginalPrice?: number
  discount?: string
}

// Props para ProductCardActions
export interface ProductCardActionsProps {
  onAddToCart: (e?: React.MouseEvent) => void
  isAddingToCart: boolean
  stock: number
  cartAddCount: number
}

// Color data type
export interface ColorData {
  name: string
  hex: string
  finish?: string        // Acabado de la variante (ej: "Brillante", "Metálico")
  textureType?: TextureType  // Tipo de textura visual
}

// Default badge config
export const DEFAULT_BADGE_CONFIG: BadgeConfig = {
  showCapacity: true,
  showColor: true,
  showFinish: true,
  // Priorizamos acabado y color sobre otros datos para los badges del grid
  showMaterial: false,
  showGrit: false,
  showDimensions: false,
  showWeight: false,
  showBrand: false,
  maxBadges: 4
}

