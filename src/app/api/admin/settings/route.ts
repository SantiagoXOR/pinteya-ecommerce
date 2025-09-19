// ===================================
// PINTEYA E-COMMERCE - ADMIN SETTINGS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const SystemSettingsSchema = z.object({
  general: z.object({
    site_name: z.string().min(1).max(100).optional(),
    site_description: z.string().max(500).optional(),
    site_url: z.string().url().optional(),
    contact_email: z.string().email().optional(),
    support_phone: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().length(3).optional(),
    language: z.string().length(2).optional(),
    maintenance_mode: z.boolean().optional()
  }).optional(),
  
  ecommerce: z.object({
    tax_rate: z.number().min(0).max(100).optional(),
    shipping_cost: z.number().min(0).optional(),
    free_shipping_threshold: z.number().min(0).optional(),
    inventory_tracking: z.boolean().optional(),
    low_stock_threshold: z.number().min(0).optional(),
    allow_backorders: z.boolean().optional(),
    auto_approve_reviews: z.boolean().optional(),
    max_cart_items: z.number().min(1).max(100).optional(),
    session_timeout: z.number().min(5).max(1440).optional() // minutos
  }).optional(),
  
  payments: z.object({
    stripe_enabled: z.boolean().optional(),
    paypal_enabled: z.boolean().optional(),
    mercadopago_enabled: z.boolean().optional(),
    cash_on_delivery: z.boolean().optional(),
    bank_transfer: z.boolean().optional(),
    payment_timeout: z.number().min(5).max(60).optional() // minutos
  }).optional(),
  
  notifications: z.object({
    email_notifications: z.boolean().optional(),
    sms_notifications: z.boolean().optional(),
    push_notifications: z.boolean().optional(),
    order_confirmation: z.boolean().optional(),
    shipping_updates: z.boolean().optional(),
    marketing_emails: z.boolean().optional(),
    low_stock_alerts: z.boolean().optional(),
    new_order_alerts: z.boolean().optional()
  }).optional(),
  
  security: z.object({
    two_factor_auth: z.boolean().optional(),
    password_min_length: z.number().min(6).max(50).optional(),
    session_duration: z.number().min(1).max(168).optional(), // horas
    max_login_attempts: z.number().min(3).max(10).optional(),
    lockout_duration: z.number().min(5).max(1440).optional(), // minutos
    require_email_verification: z.boolean().optional(),
    admin_ip_whitelist: z.array(z.string().ip()).optional()
  }).optional(),
  
  integrations: z.object({
    google_analytics_id: z.string().optional(),
    facebook_pixel_id: z.string().optional(),
    google_tag_manager_id: z.string().optional(),
    mailchimp_api_key: z.string().optional(),
    sendgrid_api_key: z.string().optional(),
    cloudinary_cloud_name: z.string().optional(),
    aws_s3_bucket: z.string().optional()
  }).optional()
});

// ===================================
// TIPOS DE DATOS
// ===================================

interface SystemSettings {
  general: {
    site_name: string;
    site_description: string;
    site_url: string;
    contact_email: string;
    support_phone: string;
    timezone: string;
    currency: string;
    language: string;
    maintenance_mode: boolean;
  };
  ecommerce: {
    tax_rate: number;
    shipping_cost: number;
    free_shipping_threshold: number;
    inventory_tracking: boolean;
    low_stock_threshold: number;
    allow_backorders: boolean;
    auto_approve_reviews: boolean;
    max_cart_items: number;
    session_timeout: number;
  };
  payments: {
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    mercadopago_enabled: boolean;
    cash_on_delivery: boolean;
    bank_transfer: boolean;
    payment_timeout: number;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    order_confirmation: boolean;
    shipping_updates: boolean;
    marketing_emails: boolean;
    low_stock_alerts: boolean;
    new_order_alerts: boolean;
  };
  security: {
    two_factor_auth: boolean;
    password_min_length: number;
    session_duration: number;
    max_login_attempts: number;
    lockout_duration: number;
    require_email_verification: boolean;
    admin_ip_whitelist: string[];
  };
  integrations: {
    google_analytics_id: string;
    facebook_pixel_id: string;
    google_tag_manager_id: string;
    mailchimp_api_key: string;
    sendgrid_api_key: string;
    cloudinary_cloud_name: string;
    aws_s3_bucket: string;
  };
}

// ===================================
// CONFIGURACIONES POR DEFECTO
// ===================================

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    site_name: 'Pinteya E-Commerce',
    site_description: 'Tu tienda online de confianza',
    site_url: 'https://localhost:3000',
    contact_email: 'contacto@pinteya.com',
    support_phone: '+54 11 1234-5678',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
    maintenance_mode: false
  },
  ecommerce: {
    tax_rate: 21.0,
    shipping_cost: 500.0,
    free_shipping_threshold: 15000.0,
    inventory_tracking: true,
    low_stock_threshold: 10,
    allow_backorders: false,
    auto_approve_reviews: false,
    max_cart_items: 50,
    session_timeout: 30
  },
  payments: {
    stripe_enabled: true,
    paypal_enabled: false,
    mercadopago_enabled: true,
    cash_on_delivery: true,
    bank_transfer: true,
    payment_timeout: 15
  },
  notifications: {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    order_confirmation: true,
    shipping_updates: true,
    marketing_emails: false,
    low_stock_alerts: true,
    new_order_alerts: true
  },
  security: {
    two_factor_auth: false,
    password_min_length: 8,
    session_duration: 24,
    max_login_attempts: 5,
    lockout_duration: 15,
    require_email_verification: true,
    admin_ip_whitelist: []
  },
  integrations: {
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_tag_manager_id: '',
    mailchimp_api_key: '',
    sendgrid_api_key: '',
    cloudinary_cloud_name: '',
    aws_s3_bucket: ''
  }
};

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS TEMPORAL PARA DESARROLLO
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      return {
        user: {
          id: 'dev-admin',
          email: 'santiago@xor.com.ar',
          name: 'Dev Admin'
        },
        userId: 'dev-admin'
      };
    }

    const session = await auth();
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 };
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar';
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
    }

    return { user: session.user, userId: session.user.id };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error });
    return { error: 'Error de autenticación', status: 500 };
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value, category')
      .order('category', { ascending: true });

    if (error) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Error obteniendo configuraciones, usando defaults', { error });
      return DEFAULT_SETTINGS;
    }

    if (!settings || settings.length === 0) {
      // Inicializar configuraciones por defecto
      await initializeDefaultSettings();
      return DEFAULT_SETTINGS;
    }

    // Construir objeto de configuraciones desde la base de datos
    const result = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Deep copy
    
    settings.forEach(setting => {
      const keys = setting.key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      try {
        current[lastKey] = JSON.parse(setting.value);
      } catch {
        current[lastKey] = setting.value;
      }
    });

    return result;
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo configuraciones del sistema', { error });
    return DEFAULT_SETTINGS;
  }
}

async function updateSystemSettings(updates: Partial<SystemSettings>, adminUserId: string): Promise<void> {
  const settingsToUpdate: Array<{ key: string; value: string; category: string }> = [];
  
  // Convertir objeto anidado a configuraciones planas
  function flattenSettings(obj: any, prefix = '', category = '') {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenSettings(value, fullKey, key);
      } else {
        settingsToUpdate.push({
          key: fullKey,
          value: JSON.stringify(value),
          category: category || key
        });
      }
    });
  }
  
  flattenSettings(updates);
  
  if (settingsToUpdate.length === 0) {
    return;
  }

  // Actualizar configuraciones en la base de datos
  for (const setting of settingsToUpdate) {
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId
      }, {
        onConflict: 'key'
      });

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error actualizando configuración', { 
        error, 
        key: setting.key 
      });
      throw new Error(`Error actualizando configuración ${setting.key}`);
    }
  }

  // Log de auditoría
  logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Configuraciones del sistema actualizadas', {
    adminUserId,
    updatedKeys: settingsToUpdate.map(s => s.key),
    timestamp: new Date().toISOString()
  });
}

async function initializeDefaultSettings(): Promise<void> {
  try {
    const settingsToInsert: Array<{ key: string; value: string; category: string }> = [];
    
    function flattenDefaults(obj: any, prefix = '', category = '') {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenDefaults(value, fullKey, key);
        } else {
          settingsToInsert.push({
            key: fullKey,
            value: JSON.stringify(value),
            category: category || key
          });
        }
      });
    }
    
    flattenDefaults(DEFAULT_SETTINGS);
    
    const { error } = await supabaseAdmin
      .from('system_settings')
      .insert(settingsToInsert.map(setting => ({
        ...setting,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      })));

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error inicializando configuraciones por defecto', { error });
    } else {
      logger.log(LogLevel.INFO, LogCategory.SYSTEM, 'Configuraciones por defecto inicializadas');
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.SYSTEM, 'Error en inicialización de configuraciones', { error });
  }
}

async function resetToDefaults(adminUserId: string): Promise<void> {
  try {
    // Eliminar todas las configuraciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('system_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Condición que siempre es verdadera

    if (deleteError) {
      throw deleteError;
    }

    // Reinicializar con valores por defecto
    await initializeDefaultSettings();

    // Log de auditoría
    logger.log(LogLevel.WARN, LogCategory.ADMIN, 'Configuraciones del sistema restablecidas a valores por defecto', {
      adminUserId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error restableciendo configuraciones por defecto', { error });
    throw error;
  }
}

// ===================================
// GET - Obtener configuraciones del sistema
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas'
      },
      'admin-settings'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Obtener configuraciones del sistema
    const settings = await getSystemSettings();

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<SystemSettings> = {
      data: settings,
      success: true,
      message: 'Configuraciones obtenidas exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/settings', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// PUT - Actualizar configuraciones del sistema
// ===================================
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2), // Más restrictivo para actualizaciones
        message: 'Demasiadas actualizaciones de configuración'
      },
      'admin-settings-update'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = SystemSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de configuración inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Actualizar configuraciones
    await updateSystemSettings(validationResult.data, authResult.userId!);

    // Obtener configuraciones actualizadas
    const updatedSettings = await getSystemSettings();

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<SystemSettings> = {
      data: updatedSettings,
      success: true,
      message: 'Configuraciones actualizadas exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/settings', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'PUT',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST - Restablecer configuraciones por defecto
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting más restrictivo para reset
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // Máximo 3 resets por hora
        message: 'Demasiados intentos de restablecimiento'
      },
      'admin-settings-reset'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Restablecer a configuraciones por defecto
    await resetToDefaults(authResult.userId!);

    // Obtener configuraciones restablecidas
    const defaultSettings = await getSystemSettings();

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<SystemSettings> = {
      data: defaultSettings,
      success: true,
      message: 'Configuraciones restablecidas a valores por defecto'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/settings', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}









