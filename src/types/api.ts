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
  timestamp?: string;
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
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'created_at' | 'brand';
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
// TIPOS PARA MEDICIÓN DE CALIDAD
// ===================================
export interface QualityMetrics {
  score: number;
  category: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  recommendations: string[];
  details: {
    security: QualityCheck;
    performance: QualityCheck;
    user_experience: QualityCheck;
    integration_completeness: QualityCheck;
  };
}

export interface QualityCheck {
  score: number;
  status: 'pass' | 'warning' | 'fail';
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    description: string;
    recommendation?: string;
  }>;
}

export interface IntegrationQualityResponse {
  success: boolean;
  data: QualityMetrics;
  timestamp: number;
  processing_time: number;
}

// ===================================
// TIPOS PARA REPORTES MERCADOPAGO
// ===================================
export interface MercadoPagoReport {
  id: string;
  type: 'released_money' | 'account_money' | 'sales_report';
  date_from: string;
  date_to: string;
  status: 'pending' | 'ready' | 'error';
  download_url?: string;
  created_at: string;
  file_size?: number;
}

export interface ReportMetrics {
  total_transactions: number;
  total: number;
  successful_payments: number;
  failed_payments: number;
  refunds: number;
  chargebacks: number;
  average_ticket: number;
  conversion_rate: number;
}

// ===================================
// TIPOS PARA REEMBOLSOS
// ===================================
export interface RefundRequest {
  payment_id: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  id: string;
  payment_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// ===================================
// TIPOS PARA CONFIGURACIONES AVANZADAS
// ===================================
export interface AdvancedPreferenceConfig {
  excluded_payment_methods?: Array<{ id: string }>;
  excluded_payment_types?: Array<{ id: string }>;
  installments?: {
    default_installments?: number;
    max_installments?: number;
    min_installments?: number;
  };
  shipments?: {
    mode?: 'not_specified' | 'custom' | 'me2';
    cost?: number;
    free_shipping?: boolean;
    receiver_address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: string;
      floor?: string;
      apartment?: string;
      city_name?: string;
      state_name?: string;
      country_name?: string;
    };
  };
  differential_pricing?: { id: number };
  marketplace_fee?: number;
  notification_url?: string;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  binary_mode?: boolean;
  processing_modes?: string[];
  purpose?: string;
  sponsor_id?: number;
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
