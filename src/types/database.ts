// ===================================
// PINTEYA E-COMMERCE - TIPOS DE BASE DE DATOS
// ===================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string | null;
          products_count?: number; // Campo calculado desde la API
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          brand: string | null;
          slug: string;
          description: string | null;
          price: number;
          discounted_price: number | null;
          stock: number;
          category_id: number | null;
          images: any | null; // JSONB
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          brand?: string | null;
          slug: string;
          description?: string | null;
          price: number;
          discounted_price?: number | null;
          stock?: number;
          category_id?: number | null;
          images?: any | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          brand?: string | null;
          slug?: string;
          description?: string | null;
          price?: number;
          discounted_price?: number | null;
          stock?: number;
          category_id?: number | null;
          images?: any | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: number;
          user_id: string;
          total: number;
          status: string;
          payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          total: number;
          status?: string;
          payment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          total?: number;
          status?: string;
          payment_id?: string | null;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
        };
        Insert: {
          id?: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
        };
        Update: {
          id?: number;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          price?: number;
        };
      };
    };
  };
}

// Tipos auxiliares
export type User = Database['public']['Tables']['users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];

// Tipos para inserción
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

// Tipos para actualización
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update'];
