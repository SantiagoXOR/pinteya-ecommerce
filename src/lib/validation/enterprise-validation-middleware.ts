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
  type ValidationResult
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
  onValidationError?: (errors: any[], request: NextRequest | NextApiRequest) => void;
  enableContextValidation?: boolean;
  strictMode?: boolean;
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  validationMetadata?: any;
  enterpriseContext?: EnterpriseAuthContext;
}

export interface ValidatedApiRequest extends NextApiRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  validationMetadata?: any;
  enterpriseContext?: EnterpriseAuthContext;
}

// =====================================================
// MIDDLEWARE PARA NEXT.JS APP ROUTER
// =====================================================

/**
 * Middleware de validación para Next.js App Router
 */
export function withEnterpriseValidation(options: ValidationMiddlewareOptions) {
  return function <T extends any[]>(
    handler: (request: ValidatedRequest, ...args: T) => Promise<NextResponse> | NextResponse
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      try {
        // Verificar si debe saltarse la validación
        if (options.skipValidation && options.skipValidation(request)) {
          return await handler(request as ValidatedRequest, ...args);
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

        const validatedRequest = request as ValidatedRequest;
        const validationResults: any = {};
        const allErrors: any[] = [];

        // 1. Validar body si hay schema
        if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
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
              severity: 'high'
            });
          }
        }

        // 2. Validar query parameters si hay schema
        if (options.querySchema) {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          
          const queryValidation = await validator.validateAndSanitize(
            options.querySchema,
            queryParams,
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

        // 3. Validar params si hay schema
        if (options.paramsSchema) {
          // Extraer params de la URL (esto requeriría configuración adicional)
          // Por ahora, asumimos que los params están disponibles en el contexto
          const params = (request as any).params || {};
          
          const paramsValidation = await validator.validateAndSanitize(
            options.paramsSchema,
            params,
            enterpriseContext,
            request
          );

          if (paramsValidation.success) {
            validatedRequest.validatedParams = paramsValidation.data;
            validationResults.params = paramsValidation.metadata;
          } else {
            allErrors.push(...(paramsValidation.errors || []));
          }
        }

        // 4. Verificar errores de validación
        if (allErrors.length > 0) {
          // Callback personalizado para errores
          if (options.onValidationError) {
            options.onValidationError(allErrors, request);
          }

          // Logging de errores
          console.warn('[VALIDATION_MIDDLEWARE] Errores de validación:', allErrors);

          // Respuesta de error
          return NextResponse.json(
            {
              error: 'Errores de validación',
              code: 'VALIDATION_FAILED',
              details: allErrors.map(err => ({
                field: err.field,
                message: err.message,
                code: err.code
              })),
              enterprise: true,
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // 5. Añadir metadatos de validación
        validatedRequest.validationMetadata = validationResults;
        validatedRequest.enterpriseContext = enterpriseContext;

        // 6. Ejecutar handler original
        return await handler(validatedRequest, ...args);

      } catch (error) {
        console.error('[VALIDATION_MIDDLEWARE] Error:', error);
        
        return NextResponse.json(
          {
            error: 'Error interno en validación',
            code: 'VALIDATION_ERROR',
            enterprise: true,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
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
