/**
 * Middleware Enterprise de Validación
 * Integra validación y sanitización con APIs de forma transparente
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  EnterpriseValidator,
  ENTERPRISE_VALIDATION_CONFIGS,
  type EnterpriseValidationConfig,
  type ValidationResult,
  type ValidationError
} from './enterprise-validation-system';
import { getEnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface ValidationMiddlewareOptions {
  bodySchema?: z.ZodSchema;
  querySchema?: z.ZodSchema;
  paramsSchema?: z.ZodSchema;
  configName?: keyof typeof ENTERPRISE_VALIDATION_CONFIGS;
  customConfig?: EnterpriseValidationConfig;
  skipValidation?: (request: NextRequest | NextApiRequest) => boolean;
  onValidationError?: (errors: ValidationError[], request: NextRequest | NextApiRequest) => void;
  enableContextValidation?: boolean;
  strictMode?: boolean;
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: unknown;
  validatedQuery?: Record<string, unknown>;
  validatedParams?: Record<string, string>;
  validationMetadata?: ValidationMetadata;
  enterpriseContext?: EnterpriseAuthContext;
}

export interface ValidatedApiRequest extends NextApiRequest {
  validatedBody?: unknown;
  validatedQuery?: Record<string, unknown>;
  validatedParams?: Record<string, string>;
  validationMetadata?: ValidationMetadata;
  enterpriseContext?: EnterpriseAuthContext;
}

export interface ValidationMetadata {
  body?: ValidationResult<unknown>['metadata'];
  query?: ValidationResult<unknown>['metadata'];
  params?: ValidationResult<unknown>['metadata'];
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  code: string;
  details: ValidationError[];
  timestamp: string;
  path: string;
}

export type ValidationMiddlewareHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

export type ApiValidationMiddlewareHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void>;

// =====================================================
// MIDDLEWARE PARA NEXT.JS APP ROUTER
// =====================================================

/**
 * Middleware de validación para Next.js App Router
 */
export function withEnterpriseValidation(options: ValidationMiddlewareOptions = {}) {
  return function (handler: ValidationMiddlewareHandler) {
    return async function (request: NextRequest, context?: { params?: Record<string, string> }): Promise<NextResponse> {
      try {
        // 1. Verificar si se debe omitir validación
        if (options.skipValidation && options.skipValidation(request)) {
          return await handler(request, context);
        }

        // 2. Obtener configuración de validación
        const config = options.customConfig || 
                      (options.configName ? ENTERPRISE_VALIDATION_CONFIGS[options.configName] : ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC);
        
        const validator = new EnterpriseValidator(config);
        
        // 3. Obtener contexto de autenticación enterprise
        let enterpriseContext: EnterpriseAuthContext | undefined;
        if (options.enableContextValidation) {
          try {
            const authResult = await getEnterpriseAuthContext(request, {
              securityLevel: config.securityLevel || 'standard'
            });
            if (authResult.success) {
              enterpriseContext = authResult.context;
            }
          } catch (error) {
            console.warn('[VALIDATION_MIDDLEWARE] No se pudo obtener contexto enterprise:', error);
          }
        }

        // 4. Crear request validado
        const validatedRequest = request as ValidatedRequest;
        validatedRequest.enterpriseContext = enterpriseContext;
        
        const validationResults: ValidationMetadata = {};
        const allErrors: ValidationError[] = [];

        // 5. Validar body si hay schema
        if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method || '')) {
          try {
            const body = await request.json();
            
            const bodyValidation = await validator.validateAndSanitize(
              options.bodySchema,
              body,
              enterpriseContext,
              request
            );

            if (bodyValidation.success) {
              validatedRequest.validatedBody = bodyValidation.data;
              validationResults.body = bodyValidation.metadata;
            } else {
              allErrors.push(...(bodyValidation.errors || []));
            }
          } catch (error) {
            allErrors.push({
              field: 'body',
              message: 'Error parsing JSON body',
              code: 'INVALID_JSON',
              severity: 'high' as const
            });
          }
        }

        // 6. Validar query parameters si hay schema
        if (options.querySchema) {
          const { searchParams } = new URL(request.url);
          const queryData = Object.fromEntries(searchParams.entries());
          
          const queryValidation = await validator.validateAndSanitize(
            options.querySchema,
            queryData,
            enterpriseContext,
            request
          );

          if (queryValidation.success) {
            validatedRequest.validatedQuery = queryValidation.data;
            validationResults.query = queryValidation.metadata;
          } else {
            allErrors.push(...(queryValidation.errors || []));
          }
        }

        // 7. Validar params si hay schema
        if (options.paramsSchema && context?.params) {
          const paramsValidation = await validator.validateAndSanitize(
            options.paramsSchema,
            context.params,
            enterpriseContext,
            request
          );

          if (paramsValidation.success) {
            validatedRequest.validatedParams = paramsValidation.data as Record<string, string>;
            validationResults.params = paramsValidation.metadata;
          } else {
            allErrors.push(...(paramsValidation.errors || []));
          }
        }

        // 8. Verificar errores de validación
        if (allErrors.length > 0) {
          // Callback personalizado para errores
          if (options.onValidationError) {
            options.onValidationError(allErrors, request);
          }

          // Logging de errores
          console.warn('[VALIDATION_MIDDLEWARE] Errores de validación:', allErrors);

          // Respuesta de error tipada
          const errorResponse: ValidationErrorResponse = {
            success: false,
            error: 'Errores de validación encontrados',
            code: 'VALIDATION_FAILED',
            details: allErrors,
            timestamp: new Date().toISOString(),
            path: request.url
          };

          return NextResponse.json(errorResponse, { status: 400 });
        }

        // 9. Agregar metadata de validación
        validatedRequest.validationMetadata = validationResults;

        // 10. Ejecutar handler con request validado
        return await handler(validatedRequest, context);

      } catch (error) {
        console.error('[VALIDATION_MIDDLEWARE] Error interno:', error);
        
        const errorResponse: ValidationErrorResponse = {
          success: false,
          error: 'Error interno del middleware de validación',
          code: 'VALIDATION_MIDDLEWARE_ERROR',
          details: [{
            field: 'general',
            message: error instanceof Error ? error.message : 'Error desconocido',
            code: 'INTERNAL_ERROR',
            severity: 'critical' as const
          }],
          timestamp: new Date().toISOString(),
          path: request.url
        };

        return NextResponse.json(errorResponse, { status: 500 });
      }
    };
  };
}

// =====================================================
// MIDDLEWARE PARA PAGES API
// =====================================================

/**
 * Middleware de validación para Pages API
 */
export function withEnterpriseValidationAPI(options: ValidationMiddlewareOptions) {
  return function (
    handler: (req: ValidatedApiRequest, res: NextApiResponse) => Promise<void> | void
  ) {
    return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
      try {
        // Verificar si debe saltarse la validación
        if (options.skipValidation && options.skipValidation(req)) {
          return await handler(req as ValidatedApiRequest, res);
        }

        // Obtener configuración de validación
        const config = options.customConfig || 
                      (options.configName ? ENTERPRISE_VALIDATION_CONFIGS[options.configName] : 
                       ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC);

        const validator = new EnterpriseValidator(config);

        // Obtener contexto enterprise si está habilitado
        let enterpriseContext: EnterpriseAuthContext | undefined;
        if (options.enableContextValidation) {
          try {
            // Para Pages API, necesitaríamos adaptar getEnterpriseAuthContext
            // Por ahora, lo omitimos
          } catch (error) {
            console.warn('[VALIDATION_API] No se pudo obtener contexto enterprise:', error);
          }
        }

        const validatedRequest = req as ValidatedApiRequest;
        const validationResults: any = {};
        const allErrors: any[] = [];

        // 1. Validar body si hay schema
        if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
          const bodyValidation = await validator.validateAndSanitize(
            options.bodySchema,
            req.body,
            enterpriseContext,
            req
          );

          if (bodyValidation.success) {
            validatedRequest.validatedBody = bodyValidation.data;
            validationResults.body = bodyValidation.metadata;
          } else {
            allErrors.push(...(bodyValidation.errors || []));
          }
        }

        // 2. Validar query parameters si hay schema
        if (options.querySchema) {
          const queryValidation = await validator.validateAndSanitize(
            options.querySchema,
            req.query,
            enterpriseContext,
            req
          );

          if (queryValidation.success) {
            validatedRequest.validatedQuery = queryValidation.data;
            validationResults.query = queryValidation.metadata;
          } else {
            allErrors.push(...(queryValidation.errors || []));
          }
        }

        // 3. Verificar errores de validación
        if (allErrors.length > 0) {
          // Callback personalizado para errores
          if (options.onValidationError) {
            options.onValidationError(allErrors, req);
          }

          // Respuesta de error
          res.status(400).json({
            error: 'Errores de validación',
            code: 'VALIDATION_FAILED',
            details: allErrors.map(err => ({
              field: err.field,
              message: err.message,
              code: err.code
            })),
            enterprise: true,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // 4. Añadir metadatos de validación
        validatedRequest.validationMetadata = validationResults;
        validatedRequest.enterpriseContext = enterpriseContext;

        // 5. Ejecutar handler original
        return await handler(validatedRequest, res);

      } catch (error) {
        console.error('[VALIDATION_API] Error:', error);
        
        res.status(500).json({
          error: 'Error interno en validación',
          code: 'VALIDATION_ERROR',
          enterprise: true,
          timestamp: new Date().toISOString()
        });
      }
    };
  };
}

// =====================================================
// FUNCIONES DE CONVENIENCIA
// =====================================================

/**
 * Validación crítica para operaciones admin
 */
export const withCriticalValidation = (schemas: Partial<Pick<ValidationMiddlewareOptions, 'bodySchema' | 'querySchema' | 'paramsSchema'>>) =>
  withEnterpriseValidation({
    ...schemas,
    configName: 'CRITICAL_ADMIN',
    enableContextValidation: true,
    strictMode: true
  });

/**
 * Validación alta para APIs de pagos
 */
export const withHighValidation = (schemas: Partial<Pick<ValidationMiddlewareOptions, 'bodySchema' | 'querySchema' | 'paramsSchema'>>) =>
  withEnterpriseValidation({
    ...schemas,
    configName: 'HIGH_PAYMENT',
    enableContextValidation: true,
    strictMode: true
  });

/**
 * Validación estándar para APIs públicas
 */
export const withStandardValidation = (schemas: Partial<Pick<ValidationMiddlewareOptions, 'bodySchema' | 'querySchema' | 'paramsSchema'>>) =>
  withEnterpriseValidation({
    ...schemas,
    configName: 'STANDARD_PUBLIC',
    enableContextValidation: false,
    strictMode: false
  });

/**
 * Validación básica para contenido de usuario
 */
export const withBasicValidation = (schemas: Partial<Pick<ValidationMiddlewareOptions, 'bodySchema' | 'querySchema' | 'paramsSchema'>>) =>
  withEnterpriseValidation({
    ...schemas,
    configName: 'BASIC_USER',
    enableContextValidation: false,
    strictMode: false
  });

/**
 * Función auxiliar para validar datos manualmente
 */
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  securityLevel: keyof typeof ENTERPRISE_VALIDATION_CONFIGS = 'STANDARD_PUBLIC',
  context?: EnterpriseAuthContext
): Promise<ValidationResult<T>> {
  const config = ENTERPRISE_VALIDATION_CONFIGS[securityLevel];
  const validator = new EnterpriseValidator(config);
  
  return await validator.validateAndSanitize(schema, data, context);
}

/**
 * Función auxiliar para sanitizar datos manualmente
 */
export function sanitizeData(
  data: any,
  securityLevel: keyof typeof ENTERPRISE_VALIDATION_CONFIGS = 'STANDARD_PUBLIC'
): any {
  const config = ENTERPRISE_VALIDATION_CONFIGS[securityLevel];
  const validator = new EnterpriseValidator(config);
  
  return validator['sanitizer'].sanitizeObject(data);
}









