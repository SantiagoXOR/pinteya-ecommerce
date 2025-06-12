// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO TYPES
// ===================================

export interface MercadoPagoWebhookData {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: string;
  user_id: string;
  version: string;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  operation_type: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  money_release_date?: string;
  currency_id: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  differential_pricing_id?: string;
  deduction_schema?: string;
  installments: number;
  transaction_details: {
    payment_method_reference_id?: string;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url?: string;
    installment_amount: number;
    financial_institution?: string;
    payable_deferral_period?: string;
    acquirer_reference?: string;
  };
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  charges_details: Array<{
    id: string;
    name: string;
    type: string;
    accounts: {
      from: string;
      to: string;
    };
    client_id: string;
    date_created: string;
    last_updated: string;
  }>;
  captured: boolean;
  binary_mode: boolean;
  live_mode: boolean;
  order: {
    id: string;
    type: string;
  };
  external_reference?: string;
  description: string;
  metadata: Record<string, any>;
  payer: {
    type: string;
    id: string;
    email: string;
    identification: {
      type: string;
      number: string;
    };
    phone: {
      area_code: string;
      number: string;
      extension: string;
    };
    first_name: string;
    last_name: string;
    entity_type?: string;
  };
  payment_method: {
    id: string;
    type: string;
    issuer_id: string;
  };
  payment_type_id: string;
  payment_method_id: string;
  issuer_id: string;
  card: {
    id?: string;
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    date_created?: string;
    date_last_updated?: string;
    cardholder?: {
      name?: string;
      identification?: {
        number?: string;
        type?: string;
      };
    };
  };
  statement_descriptor?: string;
  call_for_authorize_id?: string;
  notification_url?: string;
  refunds: Array<{
    id: string;
    payment_id: string;
    amount: number;
    metadata: Record<string, any>;
    source: {
      id: string;
      name: string;
      type: string;
    };
    date_created: string;
    unique_sequence_number?: string;
  }>;
  additional_info: {
    authentication_code?: string;
    available_balance?: string;
    nsu_processadora?: string;
    ip_address?: string;
    items?: Array<{
      id: string;
      title: string;
      description?: string;
      picture_url?: string;
      category_id?: string;
      quantity: number;
      unit_price: number;
    }>;
    payer?: {
      first_name?: string;
      last_name?: string;
      phone?: {
        area_code?: string;
        number?: string;
      };
      address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: number;
      };
      registration_date?: string;
    };
    shipments?: {
      receiver_address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: number;
        floor?: string;
        apartment?: string;
      };
    };
    barcode?: {
      content?: string;
    };
  };
  processing_mode: string;
  merchant_account_id?: string;
  acquirer?: string;
  merchant_number?: string;
  pos_id?: string;
  store_id?: string;
  integrator_id?: string;
  platform_id?: string;
  corporation_id?: string;
  collector_id: string;
  sponsor_id?: string;
  application_fee?: number;
  differential_pricing?: {
    id: string;
  };
  taxes?: Array<{
    value: number;
    type: string;
  }>;
  shipping_amount?: number;
  build_version?: string;
  pos_data_input_mode?: string;
  store_business_name?: string;
  business_info?: {
    unit?: string;
    sub_unit?: string;
  };
  point_of_interaction?: {
    type?: string;
    business_info?: {
      unit?: string;
      sub_unit?: string;
    };
  };
}

export interface CreateOrderRequest {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  payer: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  shipping?: {
    cost: number;
    address: {
      street_name: string;
      street_number: number;
      zip_code: string;
      city_name: string;
      state_name: string;
    };
  };
  external_reference?: string;
}

export interface PaymentPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  operation_type: string;
  additional_info: string;
  auto_return: string;
  back_urls: {
    failure: string;
    pending: string;
    success: string;
  };
  client_id: string;
  collector_id: number;
  coupon_code?: string;
  coupon_labels?: string[];
  date_of_expiration?: string;
  expiration_date_from?: string;
  expiration_date_to?: string;
  expires: boolean;
  external_reference: string;
  items: Array<{
    id: string;
    category_id: string;
    currency_id: string;
    description: string;
    picture_url: string;
    quantity: number;
    title: string;
    unit_price: number;
  }>;
  marketplace: string;
  marketplace_fee: number;
  metadata: Record<string, any>;
  notification_url: string;
  payer: {
    phone: {
      area_code: string;
      number: string;
    };
    address: {
      zip_code: string;
      street_name: string;
      street_number: number;
    };
    email: string;
    identification: {
      number: string;
      type: string;
    };
    name: string;
    surname: string;
    date_created?: string;
    last_purchase?: string;
  };
  payment_methods: {
    default_card_id?: string;
    default_payment_method_id?: string;
    excluded_payment_methods: Array<{ id: string }>;
    excluded_payment_types: Array<{ id: string }>;
    installments?: number;
    default_installments?: number;
  };
  processing_modes?: string[];
  product_id?: string;
  redirect_urls: {
    failure: string;
    pending: string;
    success: string;
  };
  site_id: string;
  shipments: {
    default_shipping_method?: string;
    receiver_address: {
      zip_code: string;
      street_name: string;
      street_number: number;
      floor: string;
      apartment: string;
    };
  };
  total_amount?: number;
  last_updated?: string;
}
