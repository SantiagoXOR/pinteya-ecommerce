// ===================================
// PINTEYA E-COMMERCE - TIPOS DE API
// ===================================

import { Product, Category, Order, User } from './database';

// ===================================
// RESPUESTAS DE API
// ===================================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
  error?: string;
}

// ===================================
// FILTROS Y PARÁMETROS
// ===================================
export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryFilters {
  search?: string;
  parentId?: number;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ===================================
// TIPOS EXTENDIDOS PARA FRONTEND
// ===================================
export interface ProductWithCategory extends Product {
  category?: Category;
}

export interface OrderWithItems extends Order {
  items: Array<{
    id: number;
    product: Product;
    quantity: number;
    price: number;
  }>;
}

// ===================================
// TIPOS PARA FORMULARIOS
// ===================================
export interface CreateOrderData {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface UpdateUserProfile {
  name?: string;
  email?: string;
}

// ===================================
// TIPOS PARA MERCADOPAGO
// ===================================
export interface MercadoPagoPreference {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  external_reference: string;
}

export interface MercadoPagoWebhook {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

// ===================================
// TIPOS PARA ERRORES
// ===================================
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// ===================================
// TIPOS PARA AUTENTICACIÓN
// ===================================
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  clerkId: string;
}

// ===================================
// TIPOS PARA CARRITO (COMPATIBILIDAD)
// ===================================
export interface CartItem {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
}

export interface WishlistItem extends CartItem {
  status?: string;
}
