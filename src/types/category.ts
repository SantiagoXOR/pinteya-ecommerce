// Tipo para categorías del boilerplate (legacy)
export type CategoryLegacy = {
  title: string
  id: number
  img: string
}

// Tipo para categorías de Supabase
export type Category = {
  id: number
  name: string
  slug: string
  parent_id?: number | null
  image_url?: string | null
  created_at?: string
  updated_at?: string | null
  products_count?: number
}

// Tipo para el componente SingleItem (adaptado)
export type CategoryDisplay = {
  id: number
  title: string
  img: string
  slug: string
}
