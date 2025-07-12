// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO ADVANCED PREFERENCES API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';
import { metricsCollector } from '@/lib/metrics';

// Configuraciones avanzadas de preferencias según documentación oficial
interface AdvancedPreferenceConfig {
  // Exclusión de medios de pago
  excluded_payment_methods?: Array<{
    id: string;
  }>;
  excluded_payment_types?: Array<{
    id: string;
  }>;
  
  // Configuración de cuotas
  installments?: {
    default_installments?: number;
    max_installments?: number;
    min_installments?: number;
  };
  
  // Configuración de envío
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
  
  // Configuración de descuentos
  differential_pricing?: {
    id: number;
  };
  
  // Configuración de marketplace
  marketplace_fee?: number;
  
  // Configuración de notificaciones
  notification_url?: string;
  
  // Configuración de URLs de retorno
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  
  // Configuración de expiración
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  
  // Configuración de modo binario
  binary_mode?: boolean;
  
  // Configuración de procesamiento externo
  processing_modes?: string[];
  
  // Configuración de propósito
  purpose?: string;
  
  // Configuración de sponsor
  sponsor_id?: number;
}

/**
 * GET /api/payments/preferences
 * Obtiene configuraciones de preferencias disponibles
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      'preferences-config',
      clientIP,
      RATE_LIMIT_CONFIGS.ANALYTICS
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    logger.info(LogCategory.API, 'Preferences config request', {
      userId,
      clientIP,
    });

    // Configuraciones disponibles según documentación de MercadoPago
    const availableConfigurations = {
      payment_methods: {
        excluded_payment_methods: [
          { id: 'visa', name: 'Visa' },
          { id: 'master', name: 'Mastercard' },
          { id: 'amex', name: 'American Express' },
          { id: 'naranja', name: 'Naranja' },
          { id: 'cabal', name: 'Cabal' },
          { id: 'cencosud', name: 'Cencosud' },
          { id: 'cordobesa', name: 'Cordobesa' },
          { id: 'argencard', name: 'Argencard' },
        ],
        excluded_payment_types: [
          { id: 'credit_card', name: 'Tarjetas de Crédito' },
          { id: 'debit_card', name: 'Tarjetas de Débito' },
          { id: 'ticket', name: 'Efectivo' },
          { id: 'bank_transfer', name: 'Transferencia Bancaria' },
          { id: 'digital_currency', name: 'Dinero en Cuenta' },
        ],
      },
      installments: {
        options: [1, 3, 6, 9, 12, 18, 24],
        default: 1,
        max_allowed: 24,
      },
      shipments: {
        modes: [
          { id: 'not_specified', name: 'No especificado' },
          { id: 'custom', name: 'Personalizado' },
          { id: 'me2', name: 'MercadoEnvíos' },
        ],
        free_shipping_threshold: 50000, // ARS
      },
      expiration: {
        min_hours: 1,
        max_hours: 720, // 30 días
        default_hours: 24,
      },
      processing_modes: [
        { id: 'aggregator', name: 'Agregador' },
        { id: 'gateway', name: 'Gateway' },
      ],
      purposes: [
        { id: 'onboarding_credits', name: 'Créditos de Onboarding' },
        { id: 'wallet_purchase', name: 'Compra con Wallet' },
      ],
    };

    // Configuración actual del sistema
    const currentConfig: AdvancedPreferenceConfig = {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: {
        default_installments: 1,
        max_installments: 12,
        min_installments: 1,
      },
      shipments: {
        mode: 'custom',
        free_shipping: true,
      },
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      binary_mode: false,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
    };

    // Registrar métricas
    await metricsCollector.recordApiCall(
      '/api/payments/preferences',
      'GET',
      200,
      Date.now() - startTime,
      { userId }
    );

    logger.info(LogCategory.API, 'Preferences config retrieved', {
      userId,
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        available_configurations: availableConfigurations,
        current_config: currentConfig,
        documentation: {
          excluded_payment_methods: 'Excluir métodos de pago específicos (ej: Visa, Mastercard)',
          excluded_payment_types: 'Excluir tipos de pago (ej: tarjetas de crédito, efectivo)',
          installments: 'Configurar cuotas mínimas, máximas y por defecto',
          shipments: 'Configurar envíos y costos de shipping',
          expiration: 'Configurar fecha de expiración de preferencias',
          binary_mode: 'Modo binario para aprobación/rechazo inmediato',
          back_urls: 'URLs de retorno después del pago',
          notification_url: 'URL para recibir notificaciones de webhook',
        },
      },
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    });

    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(LogCategory.API, 'Preferences config failed', error as Error, {
      clientIP,
      processingTime,
    });

    await metricsCollector.recordApiCall(
      '/api/payments/preferences',
      'GET',
      500,
      processingTime,
      { error: (error as Error).message }
    );

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/preferences
 * Actualiza configuraciones de preferencias
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      'preferences-update',
      clientIP,
      RATE_LIMIT_CONFIGS.PAYMENT_CREATION
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    const config: AdvancedPreferenceConfig = await request.json();

    logger.info(LogCategory.API, 'Preferences config update started', {
      userId,
      config: JSON.stringify(config),
      clientIP,
    });

    // Validar configuración
    const validationResult = validatePreferenceConfig(config);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // En una implementación real, aquí se guardaría la configuración en base de datos
    // Por ahora simulamos la actualización
    const updatedConfig = {
      ...config,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    // Registrar métricas
    await metricsCollector.recordApiCall(
      '/api/payments/preferences',
      'POST',
      200,
      Date.now() - startTime,
      { userId, configKeys: Object.keys(config) }
    );

    logger.info(LogCategory.API, 'Preferences config updated successfully', {
      userId,
      configKeys: Object.keys(config),
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        config: updatedConfig,
        message: 'Configuración actualizada exitosamente',
      },
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    });

    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(LogCategory.API, 'Preferences config update failed', error as Error, {
      clientIP,
      processingTime,
    });

    await metricsCollector.recordApiCall(
      '/api/payments/preferences',
      'POST',
      500,
      processingTime,
      { error: (error as Error).message }
    );

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Valida la configuración de preferencias
 */
function validatePreferenceConfig(config: AdvancedPreferenceConfig): { valid: boolean; error?: string } {
  // Validar cuotas
  if (config.installments) {
    const { min_installments, max_installments, default_installments } = config.installments;
    
    if (min_installments && min_installments < 1) {
      return { valid: false, error: 'Las cuotas mínimas deben ser al menos 1' };
    }
    
    if (max_installments && max_installments > 24) {
      return { valid: false, error: 'Las cuotas máximas no pueden ser más de 24' };
    }
    
    if (min_installments && max_installments && min_installments > max_installments) {
      return { valid: false, error: 'Las cuotas mínimas no pueden ser mayores a las máximas' };
    }
    
    if (default_installments && min_installments && default_installments < min_installments) {
      return { valid: false, error: 'Las cuotas por defecto no pueden ser menores a las mínimas' };
    }
    
    if (default_installments && max_installments && default_installments > max_installments) {
      return { valid: false, error: 'Las cuotas por defecto no pueden ser mayores a las máximas' };
    }
  }

  // Validar envíos
  if (config.shipments) {
    const { mode, cost } = config.shipments;
    
    if (mode && !['not_specified', 'custom', 'me2'].includes(mode)) {
      return { valid: false, error: 'Modo de envío inválido' };
    }
    
    if (cost && cost < 0) {
      return { valid: false, error: 'El costo de envío no puede ser negativo' };
    }
  }

  // Validar fechas de expiración
  if (config.expiration_date_from && config.expiration_date_to) {
    const dateFrom = new Date(config.expiration_date_from);
    const dateTo = new Date(config.expiration_date_to);
    
    if (dateFrom >= dateTo) {
      return { valid: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' };
    }
    
    if (dateTo <= new Date()) {
      return { valid: false, error: 'La fecha de expiración debe ser futura' };
    }
  }

  // Validar marketplace fee
  if (config.marketplace_fee && (config.marketplace_fee < 0 || config.marketplace_fee > 100)) {
    return { valid: false, error: 'La comisión de marketplace debe estar entre 0 y 100%' };
  }

  return { valid: true };
}
