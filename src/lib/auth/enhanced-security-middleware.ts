/**
 * Middleware de Seguridad Mejorado
 * Combina todas las validaciones de seguridad en un middleware unificado
 */

import { NextRequest } from 'next/server'
import type { NextApiRequest } from 'next'
import { withJWTValidation } from './jwt-validation'
import { withCSRFProtection, withAdminCSRFProtection } from './csrf-protection'
import { withRateLimit, withAdminRateLimit, withAuthRateLimit } from './rate-limiting'
import { withSecurityValidation } from './security-validations'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface SecurityMiddlewareConfig {
  enableJWTValidation?: boolean
  enableCSRFProtection?: boolean
  enableRateLimit?: boolean
  enableSecurityValidation?: boolean
  jwtRequiredRole?: string
  jwtRequiredPermissions?: string[]
  rateLimitType?: 'auth' | 'admin' | 'products' | 'payments' | 'general'
  securityPermissions?: string[]
  securityOperation?: string
  strictMode?: boolean
}

export interface SecurityValidationSummary {
  jwtValid: boolean
  csrfValid: boolean
  rateLimitPassed: boolean
  securityValid: boolean
  overallValid: boolean
  errors: string[]
  warnings: string[]
}

// =====================================================
// CONFIGURACIONES PREDEFINIDAS
// =====================================================

export const SECURITY_PRESETS = {
  // Para APIs de autenticación - máxima seguridad
  auth: {
    enableJWTValidation: true,
    enableCSRFProtection: true,
    enableRateLimit: true,
    enableSecurityValidation: true,
    rateLimitType: 'auth' as const,
    strictMode: true,
  },

  // Para APIs admin - alta seguridad
  admin: {
    enableJWTValidation: true,
    enableCSRFProtection: true,
    enableRateLimit: true,
    enableSecurityValidation: true,
    jwtRequiredRole: 'admin',
    jwtRequiredPermissions: ['admin_access'],
    rateLimitType: 'admin' as const,
    securityPermissions: ['canAccessAdmin'],
    securityOperation: 'ADMIN_ACCESS',
    strictMode: true,
  },

  // Para APIs de productos - seguridad moderada
  products: {
    enableJWTValidation: false,
    enableCSRFProtection: true,
    enableRateLimit: true,
    enableSecurityValidation: false,
    rateLimitType: 'products' as const,
    strictMode: false,
  },

  // Para APIs de pagos - alta seguridad
  payments: {
    enableJWTValidation: true,
    enableCSRFProtection: true,
    enableRateLimit: true,
    enableSecurityValidation: true,
    rateLimitType: 'payments' as const,
    securityOperation: 'PAYMENT_PROCESSING',
    strictMode: true,
  },

  // Para APIs generales - seguridad básica
  general: {
    enableJWTValidation: false,
    enableCSRFProtection: false,
    enableRateLimit: true,
    enableSecurityValidation: false,
    rateLimitType: 'general' as const,
    strictMode: false,
  },
}

// =====================================================
// MIDDLEWARE PRINCIPAL
// =====================================================

/**
 * Middleware de seguridad mejorado que combina todas las validaciones
 */
export function withEnhancedSecurity(config: SecurityMiddlewareConfig = {}) {
  return function (handler: Function) {
    return async (request: NextRequest | NextApiRequest, ...args: any[]) => {
      const validationSummary: SecurityValidationSummary = {
        jwtValid: true,
        csrfValid: true,
        rateLimitPassed: true,
        securityValid: true,
        overallValid: true,
        errors: [],
        warnings: [],
      }

      try {
        // 1. Validación JWT si está habilitada
        if (config.enableJWTValidation) {
          const jwtHandler = withJWTValidation(
            config.jwtRequiredRole,
            config.jwtRequiredPermissions
          )(async (req: any) => ({ success: true }))

          try {
            await jwtHandler(request, ...args)
            validationSummary.jwtValid = true
          } catch (error) {
            validationSummary.jwtValid = false
            validationSummary.errors.push('JWT validation failed')

            if (config.strictMode) {
              return createErrorResponse('JWT validation failed', 401, request, args)
            }
          }
        }

        // 2. Protección CSRF si está habilitada
        if (config.enableCSRFProtection) {
          const csrfHandler = (
            config.jwtRequiredRole === 'admin' ? withAdminCSRFProtection() : withCSRFProtection()
          )(async (req: any) => ({ success: true }))

          try {
            await csrfHandler(request, ...args)
            validationSummary.csrfValid = true
          } catch (error) {
            validationSummary.csrfValid = false
            validationSummary.errors.push('CSRF validation failed')

            if (config.strictMode) {
              return createErrorResponse('CSRF validation failed', 403, request, args)
            }
          }
        }

        // 3. Rate Limiting si está habilitado
        if (config.enableRateLimit && config.rateLimitType) {
          const rateLimitHandler = withRateLimit(config.rateLimitType)(async (req: any) => ({
            success: true,
          }))

          try {
            await rateLimitHandler(request, ...args)
            validationSummary.rateLimitPassed = true
          } catch (error) {
            validationSummary.rateLimitPassed = false
            validationSummary.errors.push('Rate limit exceeded')

            return createErrorResponse('Rate limit exceeded', 429, request, args)
          }
        }

        // 4. Validación de seguridad específica si está habilitada
        if (
          config.enableSecurityValidation &&
          config.securityPermissions &&
          config.securityOperation
        ) {
          const securityHandler = withSecurityValidation(
            config.securityPermissions as any,
            config.securityOperation
          )(async (req: any) => ({ success: true }))

          try {
            await securityHandler(request, ...args)
            validationSummary.securityValid = true
          } catch (error) {
            validationSummary.securityValid = false
            validationSummary.errors.push('Security validation failed')

            if (config.strictMode) {
              return createErrorResponse('Security validation failed', 403, request, args)
            }
          }
        }

        // Determinar validez general
        validationSummary.overallValid = config.strictMode
          ? validationSummary.errors.length === 0
          : validationSummary.rateLimitPassed // Rate limit es siempre crítico

        // Añadir resumen de validación al request
        ;(request as any).securityValidation = validationSummary

        // Ejecutar handler original si todas las validaciones pasaron
        if (validationSummary.overallValid) {
          return handler(request, ...args)
        } else {
          return createErrorResponse('Security validation failed', 403, request, args)
        }
      } catch (error) {
        console.error('[ENHANCED_SECURITY] Error en middleware:', error)

        return createErrorResponse('Internal security error', 500, request, args)
      }
    }
  }
}

/**
 * Crea una respuesta de error compatible con ambos tipos de router
 */
function createErrorResponse(
  message: string,
  status: number,
  request: NextRequest | NextApiRequest,
  args: any[]
) {
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    security: true,
  }

  if ('query' in request) {
    // Pages Router
    const res = args[0] as any
    return res.status(status).json(errorResponse)
  } else {
    // App Router
    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// =====================================================
// MIDDLEWARES PREDEFINIDOS
// =====================================================

/**
 * Middleware de seguridad para APIs de autenticación
 */
export function withAuthSecurity() {
  return withEnhancedSecurity(SECURITY_PRESETS.auth)
}

/**
 * Middleware de seguridad para APIs admin
 */
export function withAdminSecurity() {
  return withEnhancedSecurity(SECURITY_PRESETS.admin)
}

/**
 * Middleware de seguridad para APIs de productos
 */
export function withProductSecurity() {
  return withEnhancedSecurity(SECURITY_PRESETS.products)
}

/**
 * Middleware de seguridad para APIs de pagos
 */
export function withPaymentSecurity() {
  return withEnhancedSecurity(SECURITY_PRESETS.payments)
}

/**
 * Middleware de seguridad para APIs generales
 */
export function withGeneralSecurity() {
  return withEnhancedSecurity(SECURITY_PRESETS.general)
}

/**
 * Middleware de seguridad personalizado
 */
export function withCustomSecurity(config: SecurityMiddlewareConfig) {
  return withEnhancedSecurity(config)
}
