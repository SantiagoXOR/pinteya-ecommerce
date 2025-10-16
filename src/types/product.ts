export type Product = {
  title: string
  brand?: string
  description?: string
  reviews: number
  price: number
  discountedPrice: number
  id: number
  imgs?: {
    thumbnails: string[]
    previews: string[]
  }
  // ✅ CAMPOS CRÍTICOS PARA BADGES INTELIGENTES
  variants?: any[]
  specifications?: Record<string, any>
  // Campos directos de la base de datos
  color?: string
  medida?: string
  slug?: string
  // Campos adicionales para compatibilidad
  name?: string
  images?: string[]
  image?: string
  originalPrice?: number
  discount?: number | null
  category?: string
  categoryId?: number
  stock?: number
  isNew?: boolean
}
