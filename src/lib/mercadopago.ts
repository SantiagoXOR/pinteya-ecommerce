// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO CONFIGURATION
// ===================================

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { isMockEnabled, createMockPreference } from './mercadopago-mock';
import { retryMercadoPagoOperation } from './retry-logic';
import { logger, LogLevel, LogCategory } from './logger';
import { CacheUtils } from './cache-manager';
import {
  executeMercadoPagoCritical,
  executeMercadoPagoStandard,
  CircuitBreakerResult
} from './mercadopago/circuit-breaker';

// ✅ MEJORADO: Función para crear cliente con IdempotencyKey dinámico
export function createMercadoPagoClient(transactionId?: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;

  // ✅ NUEVO: Detectar automáticamente si es sandbox
  const isSandbox = accessToken.includes('TEST') || accessToken.includes('APP_USR');

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: transactionId || uuidv4(),
      // ✅ NUEVO: Configurar entorno sandbox explícitamente
      ...(isSandbox && {
        sandbox: true,
        integratorId: 'dev_24c65fb163bf11ea96500242ac130004'
      })
    }
  });
}

// Cliente por defecto (para compatibilidad)
const client = createMercadoPagoClient();

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
 * Crea una preferencia de pago en MercadoPago con retry automático y circuit breaker
 */
export async function createPaymentPreference(data: CreatePreferenceData) {
  // ✅ NUEVO: Verificar si el modo mock está habilitado
  if (isMockEnabled()) {
    console.log('🧪 Usando MercadoPago Mock para desarrollo');
    const mockResult = await createMockPreference(data);
    return {
      success: true,
      data: {
        id: mockResult.id,
        init_point: mockResult.init_point,
        sandbox_init_point: mockResult.sandbox_init_point,
      },
    };
  }

  // ✅ ENTERPRISE: Usar circuit breaker para operación crítica
  const circuitResult = await executeMercadoPagoCritical(async () => {
    // ✅ NUEVO: Usar retry logic para operación crítica
    const retryResult = await retryMercadoPagoOperation(
      async () => {
        // ✅ MEJORADO: Usar cliente con IdempotencyKey dinámico
        const dynamicClient = createMercadoPagoClient(data.external_reference);
        const dynamicPreference = new Preference(dynamicClient);

    // ✅ MEJORADO: Configuración avanzada de métodos de pago
    const paymentMethods = {
      excluded_payment_methods: [
        // Excluir American Express si no se acepta
        // { id: "amex" },
      ],
      excluded_payment_types: [
        // Excluir pagos en efectivo para simplificar
        { id: "ticket" },
        // Excluir cajeros automáticos
        { id: "atm" },
      ],
      installments: 12, // Máximo 12 cuotas
      default_installments: 1, // Por defecto sin cuotas
      default_payment_method_id: null, // Sin método preferido
    };

    // ✅ MEJORADO: URLs dinámicas según entorno
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ✅ NUEVO: Detectar entorno sandbox
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
    const isSandbox = accessToken.includes('TEST') || accessToken.includes('APP_USR');

    const preferenceData = {
      items: data.items,
      payer: data.payer,
      shipments: data.shipments,
      back_urls: {
        success: data.back_urls?.success || `${baseUrl}/checkout/success`,
        failure: data.back_urls?.failure || `${baseUrl}/checkout/failure`,
        pending: data.back_urls?.pending || `${baseUrl}/checkout/pending`,
      },
      // ✅ MEJORADO: Habilitar auto_return condicionalmente
      auto_return: process.env.NODE_ENV === 'production' ? 'approved' : undefined,

      // ✅ MEJORADO: Configuración completa de métodos de pago
      payment_methods: data.payment_methods || paymentMethods,

      notification_url: data.notification_url || `${baseUrl}/api/payments/webhook`,
      statement_descriptor: data.statement_descriptor || 'PINTEYA ECOMMERCE',
      external_reference: data.external_reference,

      // ✅ NUEVO: Configuración de expiración
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas

      // ✅ NUEVO: Configuración específica para sandbox
      ...(isSandbox && {
        purpose: 'wallet_purchase',
        marketplace: 'NONE',
        binary_mode: false,
        // Forzar uso de sandbox en las URLs
        notification_url: data.notification_url || `${baseUrl}/api/payments/webhook?sandbox=true`,
      })
    };

      console.log('Sending to MercadoPago:', JSON.stringify(preferenceData, null, 2));
      const response = await dynamicPreference.create({ body: preferenceData });

      return {
        success: true,
        data: {
          id: response.id,
          init_point: response.init_point,
          sandbox_init_point: response.sandbox_init_point,
        },
      };
      },
      'createPaymentPreference',
      true // Es operación crítica
    );

    // ✅ NUEVO: Manejar resultado del retry
    if (retryResult.success) {
      logger.info(LogCategory.PAYMENT, 'Payment preference created successfully with retry', {
        attempts: retryResult.attempts,
        totalDuration: retryResult.totalDuration,
        preferenceId: retryResult.data?.data.id,
      });
      return retryResult.data!;
    } else {
      logger.error(LogCategory.PAYMENT, 'Failed to create payment preference after retries', retryResult.error!);
      throw new Error(retryResult.error?.message || 'Error creating payment preference after retries');
    }
  });

  // ✅ ENTERPRISE: Manejar resultado del circuit breaker
  if (circuitResult.success) {
    return circuitResult.data!;
  } else {
    if (circuitResult.wasRejected) {
      logger.error(LogCategory.PAYMENT, 'Payment preference creation rejected by circuit breaker', {
        state: circuitResult.state,
        error: circuitResult.error?.message
      });
      return {
        success: false,
        error: `Service temporarily unavailable (Circuit Breaker ${circuitResult.state})`,
      };
    } else {
      logger.error(LogCategory.PAYMENT, 'Payment preference creation failed', {
        error: circuitResult.error?.message,
        executionTime: circuitResult.executionTime
      });
      return {
        success: false,
        error: circuitResult.error?.message || 'Error creating payment preference',
      };
    }
  }
}

/**
 * Obtiene información de un pago por su ID con cache, retry automático y circuit breaker
 */
export async function getPaymentInfo(paymentId: string) {
  // ✅ NUEVO: Usar cache para evitar llamadas repetidas a MercadoPago
  return CacheUtils.cachePaymentInfo(paymentId, async () => {
    // ✅ ENTERPRISE: Usar circuit breaker para consultas (menos crítico)
    const circuitResult = await executeMercadoPagoStandard(async () => {
      // ✅ NUEVO: Usar retry logic para consulta (menos crítica)
      const retryResult = await retryMercadoPagoOperation(
        async () => {
          const paymentInfo = await payment.get({ id: paymentId });

          return {
            success: true,
            data: paymentInfo,
          };
        },
        'getPaymentInfo',
        false // No es operación crítica
      );

      if (retryResult.success) {
        return retryResult.data!;
      } else {
        throw new Error(retryResult.error?.message || 'Error getting payment info');
      }
    });

    // ✅ ENTERPRISE: Manejar resultado del circuit breaker
    if (circuitResult.success) {
      logger.info(LogCategory.PAYMENT, 'Payment info retrieved successfully', {
        paymentId,
        executionTime: circuitResult.executionTime,
        state: circuitResult.state
      });
      return circuitResult.data!;
    } else {
      if (circuitResult.wasRejected) {
        logger.warn(LogCategory.PAYMENT, 'Payment info request rejected by circuit breaker', {
          paymentId,
          state: circuitResult.state
        });
        return {
          success: false,
          error: `Payment service temporarily unavailable (Circuit Breaker ${circuitResult.state})`,
        };
      } else {
        logger.error(LogCategory.PAYMENT, 'Failed to get payment info', {
          paymentId,
          error: circuitResult.error?.message,
          executionTime: circuitResult.executionTime
        });
        return {
          success: false,
          error: circuitResult.error?.message || 'Error getting payment information',
        };
      }
    }
  }); // Cierre del CacheUtils.cachePaymentInfo
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
 * Valida el origen del webhook con soporte para simulaciones del dashboard
 */
export function validateWebhookOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // ✅ DEBUGGING: Log detallado de headers para diagnóstico
  const debugMode = process.env.MERCADOPAGO_WEBHOOK_DEBUG === 'true';
  if (debugMode) {
    console.log('[WEBHOOK_DEBUG] Headers recibidos:', {
      origin,
      userAgent,
      referer,
      host,
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
    });
  }

  // ✅ MEJORADO: Validación más flexible para simulaciones del dashboard
  const isSimulation = (
    // Simulación desde dashboard de MercadoPago
    (referer && referer.includes('mercadopago.com')) ||
    (origin && origin.includes('mercadopago.com')) ||
    // User-Agent de simulación del dashboard
    (userAgent && (
      userAgent.includes('mercadopago') ||
      userAgent.includes('MercadoPago') ||
      userAgent.includes('curl') ||
      userAgent.includes('PostmanRuntime') ||
      userAgent.includes('insomnia')
    ))
  );

  // ✅ SEGURIDAD: Validar origen si está presente
  if (origin && !origin.includes('mercadopago.com') && !isSimulation) {
    console.error('[SECURITY] Invalid webhook origin:', origin);
    return false;
  }

  // ✅ FLEXIBILIDAD: Permitir simulaciones del dashboard
  if (isSimulation) {
    console.log('[WEBHOOK] Simulación detectada desde dashboard MercadoPago');
    return true;
  }

  // ✅ SEGURIDAD: Validar User-Agent para webhooks reales
  if (!userAgent || !userAgent.toLowerCase().includes('mercadopago')) {
    console.error('[SECURITY] Suspicious webhook user-agent:', userAgent);

    // ✅ DESARROLLO: Permitir en modo desarrollo local
    if (process.env.NODE_ENV === 'development' && host?.includes('localhost')) {
      console.warn('[DEV] Permitiendo webhook en desarrollo local');
      return true;
    }

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
