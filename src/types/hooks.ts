// ===================================
// PINTEYA E-COMMERCE - TIPOS PARA HOOKS
// ===================================

import { Session } from 'next-auth';

// ===================================
// TIPOS PARA AUTENTICACIÓN
// ===================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null; // Reemplaza 'any' con Session de NextAuth
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

// ===================================
// TIPOS PARA IMÁGENES DE PRODUCTOS
// ===================================

export interface ProductImage {
  main: string;
  gallery: string[];
  previews: string[];
  thumbnails: string[];
}

export interface ProductImageDetailed {
  id?: string;
  url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
  file_size?: number;
  file_type?: string;
}

// ===================================
// TIPOS PARA DASHBOARD DE USUARIO
// ===================================

export interface TopProduct {
  id: number;
  name: string;
  total_quantity: number;
  total_spent: number;
  images: ProductImage; // Reemplaza 'any' con ProductImage
}

export interface DashboardStatistics {
  total_orders: number;
  total_spent: number;
  pending_orders: number;
  completed_orders: number;
}

export interface RecentOrder {
  id: number;
  external_reference: string;
  total: number;
  status: string;
  created_at: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export interface UserAddress {
  id: number;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

export interface DashboardData {
  user: AuthUser;
  statistics: DashboardStatistics;
  recent_orders: RecentOrder[];
  monthly_spending: MonthlySpending[];
  top_products: TopProduct[];
  addresses: UserAddress[];
}

// ===================================
// TIPOS PARA ÓRDENES DE USUARIO
// ===================================

export interface ShippingAddress {
  street_name: string;
  street_number: string;
  zip_code: string;
  city_name: string;
  state_name: string;
  country?: string;
  additional_info?: string;
  floor?: string;
  apartment?: string;
  full_address?: string;
}

export interface OrderItemProduct {
  id: number;
  name: string;
  images: ProductImage; // Reemplaza 'any' con ProductImage
  brand?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: string | number;
  products: OrderItemProduct;
}

export interface UserOrder {
  id: number;
  external_reference: string;
  total: string | number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  shipping_address: ShippingAddress; // Reemplaza 'any' con ShippingAddress
  order_number?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  fulfillment_status?: string;
  notes?: string;
  payment_method?: string;
  shipping_method?: string;
}

export interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
  average_order_value: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UseUserOrdersReturn {
  orders: UserOrder[];
  loading: boolean;
  error: string | null;
  pagination: OrderPagination;
  statistics: OrderStatistics;
  fetchOrders: (page?: number, filters?: Record<string, any>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

// ===================================
// TIPOS PARA CARRITO
// ===================================

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  discounted_price?: number;
  images: ProductImage; // Reemplaza 'any' con ProductImage
  stock: number;
  brand?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: CartProduct;
}

// ===================================
// TIPOS PARA METADATA JSONB
// ===================================

export interface UserMetadata {
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
  profile?: {
    avatar_url?: string;
    bio?: string;
    phone?: string;
  };
  settings?: {
    newsletter_subscribed?: boolean;
    marketing_emails?: boolean;
  };
  [key: string]: any; // Para flexibilidad adicional
}

export interface ProductMetadata {
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  variants?: Array<{
    name: string;
    options: string[];
  }>;
  specifications?: Record<string, string>;
  [key: string]: any; // Para flexibilidad adicional
}