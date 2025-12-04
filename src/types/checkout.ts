// ===================================
// PINTEYA E-COMMERCE - CHECKOUT TYPES
// ===================================

export interface BillingData {
  firstName: string
  lastName: string
  dni?: string
  companyName?: string
  country: string
  streetAddress: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  orderNotes?: string
  observations?: string
}

export interface ShippingData {
  differentAddress: boolean
  firstName?: string
  lastName?: string
  companyName?: string
  country?: string
  streetAddress?: string
  apartment?: string
  city?: string
  state?: string
  zipCode?: string
  observations?: string
}

export interface CheckoutFormData {
  billing: BillingData
  shipping: ShippingData
  paymentMethod: 'mercadopago' | 'cash'
  shippingMethod: 'free' | 'express' | 'pickup'
  couponCode?: string
}

export interface CheckoutState {
  formData: CheckoutFormData
  isLoading: boolean
  errors: Record<string, string>
  step: 'form' | 'processing' | 'payment' | 'redirect' | 'cash_success'
  preferenceId?: string
  initPoint?: string
  cashOrderData?: CashOrderData
}

// Tipos para pago contra entrega
export interface CashOrderData {
  orderId: string
  total: number
  whatsappUrl: string
  customerName: string
  phone: string
}

// Tipos para la API de cash order
export interface CreateCashOrderPayload {
  cart: Array<{
    id: string
    title: string
    price: number
    discountedPrice?: number
    quantity: number
    image: string
  }>
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dni?: string
  }
  billing: {
    streetAddress: string
    observations?: string
  }
  shipping: {
    streetAddress: string
    observations?: string
  }
  totals: {
    subtotal: number
    shipping: number
    total: number
  }
}

export interface CreateCashOrderResponse {
  success: boolean
  orderId: string
  whatsappUrl: string
  error?: string
}

export interface ShippingOption {
  id: string
  name: string
  description: string
  cost: number
  estimatedDays: string
}

export interface CheckoutSummary {
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  itemCount: number
}

// Tipos para la API de pagos
export interface PaymentPreferenceItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

export interface PaymentPayer {
  name: string
  surname: string
  email: string
  phone: string
  identification?: {
    type: string
    number: string
  }
}

export interface PaymentShippingAddress {
  street_name: string
  street_number: string
  zip_code: string
  city_name: string
  state_name: string
}

export interface PaymentShipping {
  cost: number
  address: PaymentShippingAddress
}

export interface CreatePreferencePayload {
  items: PaymentPreferenceItem[]
  payer: PaymentPayer
  shipping?: PaymentShipping
  external_reference?: string
}

export interface PaymentPreferenceResponse {
  init_point: string
  preference_id: string
  success: boolean
  error?: string
}
