// =====================================================
// TIPOS TYPESCRIPT - MÓDULO DE LOGÍSTICA ENTERPRISE
// Fecha: 2 de Septiembre, 2025
// Basado en: Patrones Spree Commerce + WooCommerce
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export enum ShipmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum ShippingService {
  STANDARD = 'standard',
  EXPRESS = 'express',
  NEXT_DAY = 'next_day',
  SAME_DAY = 'same_day'
}

export enum TrackingEventType {
  CREATED = 'created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  CUSTOMS_CLEARANCE = 'customs_clearance',
  WAREHOUSE_ARRIVAL = 'warehouse_arrival',
  WAREHOUSE_DEPARTURE = 'warehouse_departure'
}

export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface Address {
  street: string;
  number: string;
  apartment?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  reference?: string;
}

export interface Courier {
  id: number;
  name: string;
  code: string;
  api_endpoint?: string;
  api_key_encrypted?: string;
  is_active: boolean;
  supported_services: ShippingService[];
  coverage_areas: string[];
  base_cost: number;
  cost_per_kg: number;
  free_shipping_threshold?: number;
  max_weight_kg?: number;
  max_dimensions_cm?: string;
  logo_url?: string;
  website_url?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: number;
  shipment_number: string;
  order_id: number;
  status: ShipmentStatus;
  carrier_id?: number;
  carrier?: Courier;
  tracking_number?: string;
  tracking_url?: string;
  shipping_method?: string;
  shipping_service: ShippingService;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_cost: number;
  insurance_cost: number;
  total_cost: number;
  weight_kg?: number;
  dimensions_cm?: string;
  pickup_address?: Address;
  delivery_address: Address;
  special_instructions?: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  picked_up_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  items?: ShipmentItem[];
  tracking_events?: TrackingEvent[];
}

export interface TrackingEvent {
  id: number;
  shipment_id: number;
  status: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  occurred_at: string;
  created_at: string;
  external_event_id?: string;
  raw_data?: Record<string, any>;
}

export interface ShipmentItem {
  id: number;
  shipment_id: number;
  order_item_id?: number;
  product_id?: number;
  quantity: number;
  weight_kg?: number;
  created_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    image_url?: string;
  };
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateShipmentRequest {
  order_id: number;
  carrier_id?: number;
  shipping_service: ShippingService;
  items: Array<{
    order_item_id?: number;
    product_id: number;
    quantity: number;
    weight_kg?: number;
  }>;
  pickup_address?: Address;
  delivery_address: Address;
  weight_kg?: number;
  dimensions_cm?: string;
  special_instructions?: string;
  notes?: string;
  estimated_delivery_date?: string;
}

export interface UpdateShipmentRequest {
  status?: ShipmentStatus;
  carrier_id?: number;
  tracking_number?: string;
  tracking_url?: string;
  shipping_method?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_cost?: number;
  insurance_cost?: number;
  weight_kg?: number;
  dimensions_cm?: string;
  special_instructions?: string;
  notes?: string;
  admin_notes?: string;
}

export interface GetShipmentsRequest {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  carrier?: string;
  date_from?: string;
  date_to?: string;
  search?: string; // tracking_number, order_id, shipment_number
  order_by?: 'created_at' | 'updated_at' | 'estimated_delivery_date';
  order_direction?: 'asc' | 'desc';
}

export interface CreateTrackingEventRequest {
  shipment_id: number;
  status: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  occurred_at: string;
  external_event_id?: string;
  raw_data?: Record<string, any>;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface LogisticsStats {
  total_shipments: number;
  pending_shipments: number;
  in_transit_shipments: number;
  delivered_shipments: number;
  exception_shipments: number;
  average_delivery_time: number; // días
  on_time_delivery_rate: number; // porcentaje
  total_shipping_cost: number;
  active_couriers: number;
}

export interface LogisticsAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  shipment_id?: number;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

export interface PerformanceMetric {
  date: string;
  shipments_count: number;
  delivered_count: number;
  on_time_count: number;
  average_delivery_time: number;
  total_cost: number;
}

export interface CarrierPerformance {
  carrier_id: number;
  carrier_name: string;
  total_shipments: number;
  delivered_shipments: number;
  on_time_deliveries: number;
  on_time_rate: number;
  average_delivery_time: number;
  total_cost: number;
  average_cost_per_shipment: number;
}

export interface LogisticsDashboardResponse {
  data: {
    stats: LogisticsStats;
    recent_shipments: Shipment[];
    alerts: LogisticsAlert[];
    performance_metrics: PerformanceMetric[];
    carrier_performance: CarrierPerformance[];
  };
}

// =====================================================
// SHIPPING QUOTE TYPES
// =====================================================

export interface ShippingQuoteRequest {
  origin_address: Address;
  destination_address: Address;
  weight_kg: number;
  dimensions_cm: string;
  declared_value?: number;
  service_type?: ShippingService;
  courier_codes?: string[]; // Si se quiere cotizar solo ciertos couriers
}

export interface ShippingQuote {
  courier_id: number;
  courier_name: string;
  service_type: ShippingService;
  cost: number;
  estimated_delivery_days: number;
  estimated_delivery_date: string;
  includes_insurance: boolean;
  max_declared_value?: number;
  restrictions?: string[];
}

export interface ShippingQuoteResponse {
  quotes: ShippingQuote[];
  cheapest_quote?: ShippingQuote;
  fastest_quote?: ShippingQuote;
  recommended_quote?: ShippingQuote;
}

// =====================================================
// FORM VALIDATION SCHEMAS (para usar con Zod)
// =====================================================

export interface AddressFormData {
  street: string;
  number: string;
  apartment?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  reference?: string;
}

export interface ShipmentFormData {
  order_id: number;
  carrier_id?: number;
  shipping_service: ShippingService;
  delivery_address: AddressFormData;
  pickup_address?: AddressFormData;
  weight_kg?: number;
  dimensions_cm?: string;
  special_instructions?: string;
  notes?: string;
  estimated_delivery_date?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    weight_kg?: number;
  }>;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Carrier API Types
export interface CarrierFiltersRequest {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  service?: ShippingService;
  coverage_area?: string;
  sort_by?: 'name' | 'created_at' | 'base_cost' | 'cost_per_kg';
  sort_order?: 'asc' | 'desc';
}

export interface CarrierCreateRequest {
  name: string;
  code: string;
  api_endpoint?: string;
  api_key?: string;
  supported_services: ShippingService[];
  coverage_areas: string[];
  base_cost: number;
  cost_per_kg: number;
  free_shipping_threshold?: number;
  max_weight_kg?: number;
  max_dimensions_cm?: string;
  logo_url?: string;
  website_url?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active?: boolean;
}

export interface CarrierUpdateRequest extends Partial<Omit<CarrierCreateRequest, 'code'>> {}

export interface CarrierResponse {
  data: Courier;
  success: boolean;
  message: string;
}

export interface CarrierListResponse {
  data: Courier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search?: string;
    is_active?: boolean;
    service?: ShippingService;
    coverage_area?: string;
  };
}

// Tracking API Types
export interface TrackingFiltersRequest {
  page?: number;
  limit?: number;
  shipment_id?: number;
  tracking_number?: string;
  event_type?: TrackingEventType;
  status?: ShipmentStatus;
  date_from?: string;
  date_to?: string;
  location?: string;
  carrier_id?: number;
  sort_by?: 'created_at' | 'event_date' | 'shipment_id';
  sort_order?: 'asc' | 'desc';
}

export interface TrackingEventCreateRequest {
  shipment_id: number;
  event_type: TrackingEventType;
  status: ShipmentStatus;
  event_date: string;
  location: string;
  description?: string;
  carrier_reference?: string;
  estimated_delivery?: string;
  metadata?: Record<string, any>;
}

export interface TrackingEventUpdateRequest extends Partial<Omit<TrackingEventCreateRequest, 'shipment_id'>> {}

export interface BulkTrackingUpdateRequest {
  events: TrackingEventCreateRequest[];
}

export interface TrackingResponse {
  data: TrackingEvent;
  success: boolean;
  message: string;
}

export interface TrackingListResponse {
  data: TrackingEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    shipment_id?: number;
    tracking_number?: string;
    event_type?: TrackingEventType;
    status?: ShipmentStatus;
    date_from?: string;
    date_to?: string;
    location?: string;
    carrier_id?: number;
  };
}

// =====================================================
// API RESPONSE WRAPPERS
// =====================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

// =====================================================
// HOOK TYPES
// =====================================================

export interface UseLogisticsDashboardReturn {
  data: LogisticsDashboardResponse['data'] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseShipmentsReturn {
  data: PaginatedResponse<Shipment> | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTrackingEventsReturn {
  data: TrackingEvent[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}









