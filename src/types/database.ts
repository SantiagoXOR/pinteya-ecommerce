import { UserMetadata, ProductMetadata } from './hooks'

// ===================================
// PINTEYA E-COMMERCE - TIPOS DE BASE DE DATOS
// ===================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          role_id: string | null
          is_active: boolean
          metadata: UserMetadata // Reemplaza 'any' con UserMetadata
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          is_active?: boolean
          metadata?: UserMetadata
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          is_active?: boolean
          metadata?: UserMetadata
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          icon: string | null
          created_at: string
          updated_at: string | null
          products_count?: number // Campo calculado desde la API
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      product_categories: {
        Row: {
          id: number
          product_id: number
          category_id: number
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          category_id: number
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          category_id?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          brand: string | null
          slug: string
          description: string | null
          price: number
          discounted_price: number | null
          stock: number
          category_id: number | null
          images: ProductMetadata | null // Reemplaza 'any' con ProductMetadata
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          brand?: string | null
          slug: string
          description?: string | null
          price: number
          discounted_price?: number | null
          stock?: number
          category_id?: number | null
          images?: ProductMetadata | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          brand?: string | null
          slug?: string
          description?: string | null
          price?: number
          discounted_price?: number | null
          stock?: number
          category_id?: number | null
          images?: ProductMetadata | null
          created_at?: string
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: number
          user_id: string
          total: number
          status: string
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          total: number
          status?: string
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          total?: number
          status?: string
          payment_id?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          price: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          price: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          price?: number
        }
      }
    }
  }
}

// Tipos auxiliares
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type ProductCategory = Database['public']['Tables']['product_categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

// Tipos para inserción
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

// Tipos para actualización
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type ProductCategoryUpdate = Database['public']['Tables']['product_categories']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

// Función helper para nombre completo
export function getFullName(user: UserProfile): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.first_name || user.email.split('@')[0]
}

// Compatibilidad legacy (deprecated)
export type User = UserProfile
export type UserInsert = UserProfileInsert
export type UserUpdate = UserProfileUpdate
