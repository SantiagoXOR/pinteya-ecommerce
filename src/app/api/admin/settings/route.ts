// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN SETTINGS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const SystemSettingsSchema = z.object({
  general: z
    .object({
      site_name: z.string().min(1).max(100).optional(),
      site_description: z.string().max(500).optional(),
      site_url: z.string().url().optional(),
      contact_email: z.string().email().optional(),
      support_phone: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().length(3).optional(),
      language: z.string().length(2).optional(),
      maintenance_mode: z.boolean().optional(),
    })
    .optional(),

  ecommerce: z
    .object({
      shipping_cost: z.number().min(0).optional(),
      free_shipping_threshold: z.number().min(0).optional(),
      inventory_tracking: z.boolean().optional(),
      low_stock_threshold: z.number().min(0).optional(),
      allow_backorders: z.boolean().optional(),
      max_cart_items: z.number().min(1).max(100).optional(),
    })
    .optional(),

  payments: z
    .object({
      mercadopago_enabled: z.boolean().optional(),
      cash_on_delivery: z.boolean().optional(),
      payment_timeout: z.number().min(5).max(60).optional(), // minutos
    })
    .optional(),

  integrations: z
    .object({
      google_analytics_id: z.string().optional(),
      facebook_pixel_id: z.string().optional(),
    })
    .optional(),
})

// ===================================
// TIPOS DE DATOS
// ===================================

interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    site_url: string
    contact_email: string
    support_phone: string
    timezone: string
    currency: string
    language: string
    maintenance_mode: boolean
  }
  ecommerce: {
    shipping_cost: number
    free_shipping_threshold: number
    inventory_tracking: boolean
    low_stock_threshold: number
    allow_backorders: boolean
    max_cart_items: number
  }
  payments: {
    mercadopago_enabled: boolean
    cash_on_delivery: boolean
    payment_timeout: number
  }
  integrations: {
    google_analytics_id: string
    facebook_pixel_id: string
  }
}

// ===================================
// CONFIGURACIONES POR DEFECTO
// ===================================

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    site_name: 'Pinteya E-Commerce',
    site_description: 'Tu tienda online de confianza',
    site_url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    contact_email: 'contacto@pinteya.com',
    support_phone: '+54 11 1234-5678',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
    maintenance_mode: false,
  },
  ecommerce: {
    shipping_cost: 10000,
    free_shipping_threshold: 50000,
    inventory_tracking: true,
    low_stock_threshold: 10,
    allow_backorders: false,
    max_cart_items: 99,
  },
  payments: {
    mercadopago_enabled: true,
    cash_on_delivery: true,
    payment_timeout: 15,
  },
  integrations: {
    google_analytics_id: '',
    facebook_pixel_id: '',
  },
}

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS TEMPORAL PARA DESARROLLO
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      // Verificar que existe archivo .env.local para evitar bypass accidental en producción
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath)) {
          return {
            user: {
              id: 'dev-admin',
              email: 'admin@bypass.dev',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Settings] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { user: session.user, userId: session.user.id }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error })
    return { error: 'Error de autenticación', status: 500 }
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getSystemSettings(): Promise<SystemSettings> {
  try {
    if (!supabaseAdmin) {
      console.error('[getSystemSettings] Cliente de Supabase no disponible')
      logger.log(
        LogLevel.WARN,
        LogCategory.API,
        'Cliente de Supabase no disponible, usando defaults',
        {}
      )
      return DEFAULT_SETTINGS
    }

    console.log('[getSystemSettings] Intentando obtener configuraciones con estructura nueva...')
    // Intentar obtener con la estructura nueva primero
    let { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value, category')
      .order('category', { ascending: true })
    console.log('[getSystemSettings] Resultado query estructura nueva:', { 
      hasData: !!settings, 
      dataLength: settings?.length, 
      error: error?.message 
    })

    // Si falla, puede ser porque la tabla todavía tiene estructura antigua
    if (error) {
      console.warn('[getSystemSettings] Error con estructura nueva, intentando antigua:', error.message)
      logger.log(
        LogLevel.WARN,
        LogCategory.API,
        'Error obteniendo configuraciones con estructura nueva, intentando estructura antigua',
        { error: error.message, code: error.code, details: error.details }
      )

      // Intentar con estructura antigua como fallback
      console.log('[getSystemSettings] Intentando con estructura antigua...')
      const { data: oldSettings, error: oldError } = await supabaseAdmin
        .from('system_settings')
        .select('setting_key, setting_value, description')
        .order('setting_key', { ascending: true })
      
      console.log('[getSystemSettings] Resultado query estructura antigua:', { 
        hasData: !!oldSettings, 
        dataLength: oldSettings?.length, 
        error: oldError?.message 
      })

      if (oldError || !oldSettings || oldSettings.length === 0) {
        logger.log(
          LogLevel.WARN,
          LogCategory.API,
          'Error obteniendo configuraciones, usando defaults',
          { error: oldError?.message || 'No se encontraron configuraciones' }
        )
        return DEFAULT_SETTINGS
      }

      // Convertir estructura antigua a formato esperado
      settings = oldSettings.map((old: any) => ({
        key: old.setting_key,
        value: old.setting_value,
        category: 'general', // Por defecto, ya que la estructura antigua no tiene category
      }))
      error = null
    }

    if (!settings || settings.length === 0) {
      // Inicializar configuraciones por defecto
      await initializeDefaultSettings()
      return DEFAULT_SETTINGS
    }

    // Construir objeto de configuraciones desde la base de datos
    const result = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) // Deep copy

    settings.forEach((setting: any) => {
      if (!setting.key) return // Skip si no tiene key

      const keys = setting.key.split('.')
      let current = result

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      const lastKey = keys[keys.length - 1]
      try {
        const parsedValue = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value
        current[lastKey] = parsedValue
      } catch {
        current[lastKey] = setting.value
      }
    })

    return result
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo configuraciones del sistema', {
      error: error instanceof Error ? error.message : String(error),
    })
    return DEFAULT_SETTINGS
  }
}

async function updateSystemSettings(
  updates: Partial<SystemSettings>,
  adminUserId: string
): Promise<void> {
  const settingsToUpdate: Array<{ key: string; value: string; category: string }> = []

  // Convertir objeto anidado a configuraciones planas
  function flattenSettings(obj: any, prefix = '', category = '') {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenSettings(value, fullKey, key)
      } else {
        settingsToUpdate.push({
          key: fullKey,
          value: JSON.stringify(value),
          category: category || key,
        })
      }
    })
  }

  flattenSettings(updates)

  if (settingsToUpdate.length === 0) {
    return
  }

  if (!supabaseAdmin) {
    throw new Error('Cliente de Supabase no disponible')
  }

  // Actualizar configuraciones en la base de datos
  for (const setting of settingsToUpdate) {
    // Intentar con estructura nueva primero
    let { error } = await supabaseAdmin.from('system_settings').upsert(
      {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      },
      {
        onConflict: 'key',
      }
    )

    // Si falla, puede ser estructura antigua, intentar con ella
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      logger.log(
        LogLevel.WARN,
        LogCategory.API,
        'Estructura antigua detectada en actualización, intentando migración automática',
        { key: setting.key }
      )
      
      // Intentar con estructura antigua
      const { error: oldError } = await supabaseAdmin.from('system_settings').upsert(
        {
          setting_key: setting.key,
          setting_value: setting.value,
          description: setting.category,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'setting_key',
        }
      )

      if (oldError) {
        logger.log(LogLevel.ERROR, LogCategory.API, 'Error actualizando configuración (estructura antigua)', {
          error: oldError,
          key: setting.key,
        })
        throw new Error(`Error actualizando configuración ${setting.key}: ${oldError.message}`)
      }
    } else if (error) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error actualizando configuración', {
        error,
        key: setting.key,
      })
      throw new Error(`Error actualizando configuración ${setting.key}: ${error.message}`)
    }
  }

  // Log de auditoría
  logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Configuraciones del sistema actualizadas', {
    adminUserId,
    updatedKeys: settingsToUpdate.map(s => s.key),
    timestamp: new Date().toISOString(),
  })
}

async function initializeDefaultSettings(): Promise<void> {
  try {
    const settingsToInsert: Array<{ key: string; value: string; category: string }> = []

    function flattenDefaults(obj: any, prefix = '', category = '') {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenDefaults(value, fullKey, key)
        } else {
          settingsToInsert.push({
            key: fullKey,
            value: JSON.stringify(value),
            category: category || key,
          })
        }
      })
    }

    flattenDefaults(DEFAULT_SETTINGS)

    const { error } = await supabaseAdmin.from('system_settings').insert(
      settingsToInsert.map(setting => ({
        ...setting,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      }))
    )

    if (error) {
      logger.log(
        LogLevel.ERROR,
        LogCategory.API,
        'Error inicializando configuraciones por defecto',
        { error }
      )
    } else {
      logger.log(LogLevel.INFO, LogCategory.SYSTEM, 'Configuraciones por defecto inicializadas')
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.SYSTEM, 'Error en inicialización de configuraciones', {
      error,
    })
  }
}

async function resetToDefaults(adminUserId: string): Promise<void> {
  try {
    // Eliminar todas las configuraciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('system_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Condición que siempre es verdadera

    if (deleteError) {
      throw deleteError
    }

    // Reinicializar con valores por defecto
    await initializeDefaultSettings()

    // Log de auditoría
    logger.log(
      LogLevel.WARN,
      LogCategory.ADMIN,
      'Configuraciones del sistema restablecidas a valores por defecto',
      {
        adminUserId,
        timestamp: new Date().toISOString(),
      }
    )
  } catch (error) {
    logger.log(
      LogLevel.ERROR,
      LogCategory.API,
      'Error restableciendo configuraciones por defecto',
      { error }
    )
    throw error
  }
}

// ===================================
// GET - Obtener configuraciones del sistema
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitConfig = {
      windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
      message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas',
      standardHeaders: true,
      legacyHeaders: true,
    }
    const rateLimitResult = await checkRateLimit(
      request,
      rateLimitConfig,
      'admin-settings'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ 
        error: rateLimitResult.error || rateLimitConfig.message 
      }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      }
      return NextResponse.json(errorResponse, { status: authResult.status })
    }

    // Obtener configuraciones del sistema
    const settings = await getSystemSettings()

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<SystemSettings> = {
      data: settings,
      success: true,
      message: 'Configuraciones obtenidas exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, rateLimitConfig)
    return nextResponse
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log detallado para debugging
    console.error('[API Admin Settings GET] Error completo:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    })
    
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/settings', { 
      error: errorMessage,
      stack: errorStack
    })

    // Registrar métricas de error
    try {
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/settings',
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        error: errorMessage,
      })
    } catch (metricsError) {
      console.error('[API Admin Settings] Error registrando métricas:', metricsError)
    }

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: `Error interno del servidor: ${errorMessage}`,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// ===================================
// PUT - Actualizar configuraciones del sistema
// ===================================
export async function PUT(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitConfig = {
      windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
      maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2), // Más restrictivo para actualizaciones
      message: 'Demasiadas actualizaciones de configuración',
      standardHeaders: true,
      legacyHeaders: true,
    }
    const rateLimitResult = await checkRateLimit(
      request,
      rateLimitConfig,
      'admin-settings-update'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ 
        error: rateLimitResult.error || rateLimitConfig.message 
      }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      }
      return NextResponse.json(errorResponse, { status: authResult.status })
    }

    // Validar datos de entrada
    const body = await request.json()
    const validationResult = SystemSettingsSchema.safeParse(body)

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de configuración inválidos',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Actualizar configuraciones
    await updateSystemSettings(validationResult.data, authResult.userId!)

    // Obtener configuraciones actualizadas
    const updatedSettings = await getSystemSettings()

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<SystemSettings> = {
      data: updatedSettings,
      success: true,
      message: 'Configuraciones actualizadas exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, rateLimitConfig)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/settings', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'PUT',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// ===================================
// POST - Restablecer configuraciones por defecto
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting más restrictivo para reset
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // Máximo 3 resets por hora
        message: 'Demasiados intentos de restablecimiento',
      },
      'admin-settings-reset'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ 
        error: rateLimitResult.error || rateLimitConfig.message 
      }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      }
      return NextResponse.json(errorResponse, { status: authResult.status })
    }

    // Restablecer a configuraciones por defecto
    await resetToDefaults(authResult.userId!)

    // Obtener configuraciones restablecidas
    const defaultSettings = await getSystemSettings()

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<SystemSettings> = {
      data: defaultSettings,
      success: true,
      message: 'Configuraciones restablecidas a valores por defecto',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, rateLimitConfig)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/settings', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/settings',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
