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
}

export interface CheckoutFormData {
  billing: BillingData
  shipping: ShippingData
  paymentMethod: 'mercadopago' | 'bank' | 'cash'
  shippingMethod: 'free' | 'express' | 'pickup'
  couponCode?: string
}

export interface CheckoutState {
  formData: CheckoutFormData
  isLoading: boolean
  errors: Record<string, string>
  step: 'form' | 'processing' | 'payment' | 'redirect'
  preferenceId?: string
  initPoint?: string
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
