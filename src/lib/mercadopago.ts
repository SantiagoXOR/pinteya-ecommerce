// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO CONFIGURATION
// ===================================

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuración del cliente MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  }
});

// Instancias de los servicios
export const preference = new Preference(client);
export const payment = new Payment(client);

// Tipos para MercadoPago
export interface MercadoPagoItem {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

export interface MercadoPagoPayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
  address?: {
    street_name?: string;
    street_number?: string;
    zip_code?: string;
  };
}

export interface MercadoPagoShipments {
  cost?: number;
  mode?: string;
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
}

export interface CreatePreferenceData {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  shipments?: MercadoPagoShipments;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'approved' | 'all';
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  notification_url?: string;
  statement_descriptor?: string;
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
}

/**
 * Crea una preferencia de pago en MercadoPago
 */
export async function createPaymentPreference(data: CreatePreferenceData) {
  try {
    const preferenceData = {
      items: data.items,
      payer: data.payer,
      shipments: data.shipments,
      back_urls: {
        success: data.back_urls?.success || `http://localhost:3001/checkout/success`,
        failure: data.back_urls?.failure || `http://localhost:3001/checkout/failure`,
        pending: data.back_urls?.pending || `http://localhost:3001/checkout/pending`,
      },
      // Deshabilitar auto_return para desarrollo con localhost
      // auto_return: data.auto_return || 'approved',
      payment_methods: data.payment_methods,
      notification_url: data.notification_url || `http://localhost:3001/api/payments/webhook`,
      statement_descriptor: data.statement_descriptor || 'PINTEYA',
      external_reference: data.external_reference,
      expires: data.expires,
      expiration_date_from: data.expiration_date_from,
      expiration_date_to: data.expiration_date_to,
    };

    console.log('Sending to MercadoPago:', JSON.stringify(preferenceData, null, 2));
    const response = await preference.create({ body: preferenceData });
    
    return {
      success: true,
      data: {
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
      },
    };
  } catch (error: any) {
    console.error('Error creating MercadoPago preference:', error);
    return {
      success: false,
      error: error.message || 'Error creating payment preference',
    };
  }
}

/**
 * Obtiene información de un pago por su ID
 */
export async function getPaymentInfo(paymentId: string) {
  try {
    const paymentInfo = await payment.get({ id: paymentId });
    
    return {
      success: true,
      data: paymentInfo,
    };
  } catch (error: any) {
    console.error('Error getting payment info:', error);
    return {
      success: false,
      error: error.message || 'Error getting payment information',
    };
  }
}

/**
 * Valida la firma del webhook de MercadoPago con seguridad mejorada
 */
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  ts: string,
  rawBody?: string
): { isValid: boolean; error?: string } {
  try {
    const crypto = require('crypto');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[SECURITY] MERCADOPAGO_WEBHOOK_SECRET not configured');
      return { isValid: false, error: 'Webhook secret not configured' };
    }

    // Validar parámetros requeridos
    if (!xSignature || !xRequestId || !dataId || !ts) {
      console.error('[SECURITY] Missing required webhook parameters');
      return { isValid: false, error: 'Missing required parameters' };
    }

    // Validar timestamp (no más de 5 minutos de diferencia)
    const timestamp = parseInt(ts, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > 300) { // 5 minutos
      console.error('[SECURITY] Webhook timestamp too old or future', { timeDiff });
      return { isValid: false, error: 'Invalid timestamp' };
    }

    // Crear el manifest según la documentación de MercadoPago
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generar HMAC
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const sha = hmac.digest('hex');

    // Comparación segura para prevenir timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(sha, 'hex'),
      Buffer.from(xSignature, 'hex')
    );

    if (!isValid) {
      console.error('[SECURITY] Invalid webhook signature', {
        expected: sha,
        received: xSignature,
        manifest,
      });
    }

    return { isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    console.error('[SECURITY] Error validating webhook signature:', error);
    return { isValid: false, error: 'Validation error' };
  }
}

/**
 * Valida el origen del webhook
 */
export function validateWebhookOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent');

  // MercadoPago no siempre envía origin, pero si lo hace debe ser válido
  if (origin && !origin.includes('mercadopago.com')) {
    console.error('[SECURITY] Invalid webhook origin:', origin);
    return false;
  }

  // Validar User-Agent básico
  if (!userAgent || !userAgent.toLowerCase().includes('mercadopago')) {
    console.error('[SECURITY] Suspicious webhook user-agent:', userAgent);
    return false;
  }

  return true;
}

/**
 * Convierte productos del carrito a formato MercadoPago
 */
export function convertCartItemsToMercadoPago(cartItems: any[]): MercadoPagoItem[] {
  return cartItems.map(item => ({
    id: item.id.toString(),
    title: item.name,
    description: item.description || '',
    picture_url: item.images?.previews?.[0] || '',
    category_id: item.category?.slug || 'general',
    quantity: item.quantity,
    currency_id: 'ARS', // Pesos argentinos
    unit_price: item.discounted_price || item.price,
  }));
}

/**
 * Calcula el total de items para MercadoPago
 */
export function calculateTotal(items: MercadoPagoItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.unit_price * item.quantity);
  }, 0);
}

export default client;
