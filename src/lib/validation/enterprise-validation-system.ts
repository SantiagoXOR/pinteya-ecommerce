/**
 * Sistema Enterprise de Validación y Sanitización
 * Unifica y extiende todas las validaciones con capacidades enterprise
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { enterpriseAuditSystem } from '@/lib/security/enterprise-audit-system';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';

// =====================================================
// TIPOS Y INTERFACES ENTERPRISE
// =====================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  sanitized?: T;
  metadata?: ValidationMetadata;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationMetadata {
  validatedAt: string;
  validatedBy?: string;
  sanitizationApplied: boolean;
  securityLevel: 'basic' | 'standard' | 'high' | 'critical';
  rulesApplied: string[];
  performanceMs: number;
}

export interface EnterpriseValidationConfig {
  enableSanitization?: boolean;
  enableSecurityValidation?: boolean;
  enableAuditLogging?: boolean;
  securityLevel?: 'basic' | 'standard' | 'high' | 'critical';
  customSanitizers?: Record<string, (value: any) => any>;
  customValidators?: Record<string, z.ZodSchema>;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxStringLength?: number;
  maxArrayLength?: number;
  maxObjectDepth?: number;
}

export interface SanitizationOptions {
  removeHtml?: boolean;
  removeScripts?: boolean;
  normalizeWhitespace?: boolean;
  trimStrings?: boolean;
  escapeHtml?: boolean;
  removeEmojis?: boolean;
  removeSqlKeywords?: boolean;
  maxLength?: number;
  allowedCharacters?: RegExp;
}

// =====================================================
// CONFIGURACIONES PREDEFINIDAS ENTERPRISE
// =====================================================

export const ENTERPRISE_VALIDATION_CONFIGS: Record<string, EnterpriseValidationConfig> = {
  // Validación crítica para operaciones admin
  CRITICAL_ADMIN: {
    enableSanitization: true,
    enableSecurityValidation: true,
    enableAuditLogging: true,
    securityLevel: 'critical',
    allowedTags: [], // No HTML permitido
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 5
  },

  // Validación alta para APIs de pagos
  HIGH_PAYMENT: {
    enableSanitization: true,
    enableSecurityValidation: true,
    enableAuditLogging: true,
    securityLevel: 'high',
    allowedTags: [],
    maxStringLength: 500,
    maxArrayLength: 50,
    maxObjectDepth: 3
  },

  // Validación estándar para APIs públicas
  STANDARD_PUBLIC: {
    enableSanitization: true,
    enableSecurityValidation: true,
    enableAuditLogging: false,
    securityLevel: 'standard',
    allowedTags: ['b', 'i', 'em', 'strong'],
    maxStringLength: 2000,
    maxArrayLength: 200,
    maxObjectDepth: 4
  },

  // Validación básica para contenido de usuario
  BASIC_USER: {
    enableSanitization: true,
    enableSecurityValidation: false,
    enableAuditLogging: false,
    securityLevel: 'basic',
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    maxStringLength: 5000,
    maxArrayLength: 500,
    maxObjectDepth: 3
  }
};

// =====================================================
// SANITIZADORES ENTERPRISE
// =====================================================

export class EnterpriseSanitizer {
  private config: EnterpriseValidationConfig;

  constructor(config: EnterpriseValidationConfig = ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC) {
    this.config = config;
  }

  /**
   * Sanitiza una cadena de texto
   */
  sanitizeString(value: string, options: SanitizationOptions = {}): string {
    if (typeof value !== 'string') {
      return String(value || '');
    }

    let sanitized = value;

    // Remover scripts maliciosos
    if (options.removeScripts !== false) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }

    // Remover HTML si está configurado
    if (options.removeHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: this.config.allowedTags || [],
        ALLOWED_ATTR: this.config.allowedAttributes || []
      });
    }

    // Escapar HTML
    if (options.escapeHtml) {
      sanitized = validator.escape(sanitized);
    }

    // Normalizar espacios en blanco
    if (options.normalizeWhitespace !== false) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }

    // Trim strings
    if (options.trimStrings !== false) {
      sanitized = sanitized.trim();
    }

    // Remover emojis si está configurado
    if (options.removeEmojis) {
      sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
    }

    // Remover palabras clave SQL sospechosas
    if (options.removeSqlKeywords) {
      const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi;
      sanitized = sanitized.replace(sqlKeywords, '');
    }

    // Aplicar longitud máxima
    const maxLength = options.maxLength || this.config.maxStringLength || 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Validar caracteres permitidos
    if (options.allowedCharacters) {
      sanitized = sanitized.replace(options.allowedCharacters, '');
    }

    return sanitized;
  }

  /**
   * Sanitiza un objeto recursivamente
   */
  sanitizeObject(obj: any, depth: number = 0): any {
    const maxDepth = this.config.maxObjectDepth || 10;
    
    if (depth > maxDepth) {
      throw new Error(`Objeto excede la profundidad máxima permitida (${maxDepth})`);
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, {
        removeHtml: this.config.securityLevel === 'critical',
        removeScripts: true,
        removeSqlKeywords: this.config.securityLevel !== 'basic'
      });
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      const maxLength = this.config.maxArrayLength || 1000;
      if (obj.length > maxLength) {
        throw new Error(`Array excede la longitud máxima permitida (${maxLength})`);
      }
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key, { removeHtml: true, removeScripts: true });
        sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitiza datos de formulario
   */
  sanitizeFormData(formData: FormData): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      const sanitizedKey = this.sanitizeString(key, { removeHtml: true });
      
      if (value instanceof File) {
        // Validar archivo
        sanitized[sanitizedKey] = this.sanitizeFile(value);
      } else {
        sanitized[sanitizedKey] = this.sanitizeString(value.toString());
      }
    }

    return sanitized;
  }

  /**
   * Sanitiza información de archivos
   */
  private sanitizeFile(file: File): { name: string; size: number; type: string } {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv'
    ];

    const sanitizedName = this.sanitizeString(file.name, {
      removeHtml: true,
      removeScripts: true,
      allowedCharacters: /[^a-zA-Z0-9._-]/g
    });

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`Archivo excede el tamaño máximo permitido (${maxSize} bytes)`);
    }

    return {
      name: sanitizedName,
      size: file.size,
      type: file.type
    };
  }
}

// =====================================================
// VALIDADORES ENTERPRISE
// =====================================================

export class EnterpriseValidator {
  private sanitizer: EnterpriseSanitizer;
  private config: EnterpriseValidationConfig;

  constructor(config: EnterpriseValidationConfig = ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC) {
    this.config = config;
    this.sanitizer = new EnterpriseSanitizer(config);
  }

  /**
   * Valida y sanitiza datos usando un schema de Zod
   */
  async validateAndSanitize<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context?: EnterpriseAuthContext,
    request?: NextRequest | NextApiRequest
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now();
    const rulesApplied: string[] = [];

    try {
      // 1. Sanitización si está habilitada
      let sanitizedData = data;
      if (this.config.enableSanitization) {
        sanitizedData = this.sanitizer.sanitizeObject(data);
        rulesApplied.push('sanitization');
      }

      // 2. Validación con Zod
      const validationResult = schema.safeParse(sanitizedData);
      
      if (!validationResult.success) {
        const errors: ValidationError[] = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input,
          severity: this.determineSeverity(err.code, err.path)
        }));

        // Registrar errores de validación si está habilitado
        if (this.config.enableAuditLogging && context) {
          await this.logValidationEvent('VALIDATION_FAILED', errors, context, request);
        }

        return {
          success: false,
          errors,
          metadata: {
            validatedAt: new Date().toISOString(),
            validatedBy: context?.userId,
            sanitizationApplied: this.config.enableSanitization || false,
            securityLevel: this.config.securityLevel || 'standard',
            rulesApplied,
            performanceMs: Date.now() - startTime
          }
        };
      }

      // 3. Validaciones de seguridad adicionales
      if (this.config.enableSecurityValidation) {
        const securityValidation = await this.performSecurityValidation(validationResult.data);
        if (!securityValidation.success) {
          return securityValidation;
        }
        rulesApplied.push('security_validation');
      }

      // 4. Registrar validación exitosa
      if (this.config.enableAuditLogging && context) {
        await this.logValidationEvent('VALIDATION_SUCCESS', [], context, request);
      }

      return {
        success: true,
        data: validationResult.data,
        sanitized: sanitizedData as T,
        metadata: {
          validatedAt: new Date().toISOString(),
          validatedBy: context?.userId,
          sanitizationApplied: this.config.enableSanitization || false,
          securityLevel: this.config.securityLevel || 'standard',
          rulesApplied,
          performanceMs: Date.now() - startTime
        }
      };

    } catch (error) {
      const validationError: ValidationError = {
        field: 'general',
        message: error instanceof Error ? error.message : 'Error de validación desconocido',
        code: 'VALIDATION_ERROR',
        severity: 'high'
      };

      // Registrar error crítico
      if (this.config.enableAuditLogging && context) {
        await this.logValidationEvent('VALIDATION_ERROR', [validationError], context, request);
      }

      return {
        success: false,
        errors: [validationError],
        metadata: {
          validatedAt: new Date().toISOString(),
          validatedBy: context?.userId,
          sanitizationApplied: false,
          securityLevel: this.config.securityLevel || 'standard',
          rulesApplied,
          performanceMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Determina la severidad de un error de validación
   */
  private determineSeverity(code: string, path: (string | number)[]): 'low' | 'medium' | 'high' | 'critical' {
    // Campos críticos
    const criticalFields = ['password', 'email', 'payment', 'admin', 'auth'];
    const highFields = ['user_id', 'amount', 'price', 'quantity'];
    
    const fieldPath = path.join('.').toLowerCase();
    
    if (criticalFields.some(field => fieldPath.includes(field))) {
      return 'critical';
    }
    
    if (highFields.some(field => fieldPath.includes(field))) {
      return 'high';
    }
    
    // Códigos críticos
    const criticalCodes = ['invalid_type', 'custom'];
    if (criticalCodes.includes(code)) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Realiza validaciones de seguridad adicionales
   */
  private async performSecurityValidation(data: any): Promise<ValidationResult> {
    try {
      // Detectar patrones sospechosos
      const dataString = JSON.stringify(data).toLowerCase();
      
      // Patrones de inyección SQL
      const sqlPatterns = [
        /(\bselect\b.*\bfrom\b)/i,
        /(\bunion\b.*\bselect\b)/i,
        /(\binsert\b.*\binto\b)/i,
        /(\bupdate\b.*\bset\b)/i,
        /(\bdelete\b.*\bfrom\b)/i,
        /(\bdrop\b.*\btable\b)/i
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(dataString)) {
          return {
            success: false,
            errors: [{
              field: 'security',
              message: 'Patrón de inyección SQL detectado',
              code: 'SQL_INJECTION_DETECTED',
              severity: 'critical'
            }]
          };
        }
      }

      // Patrones de XSS
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /expression\s*\(/i
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(dataString)) {
          return {
            success: false,
            errors: [{
              field: 'security',
              message: 'Patrón de XSS detectado',
              code: 'XSS_DETECTED',
              severity: 'critical'
            }]
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'security',
          message: 'Error en validación de seguridad',
          code: 'SECURITY_VALIDATION_ERROR',
          severity: 'high'
        }]
      };
    }
  }

  /**
   * Registra eventos de validación en el sistema de auditoría
   */
  private async logValidationEvent(
    eventType: string,
    errors: ValidationError[],
    context: EnterpriseAuthContext,
    request?: NextRequest | NextApiRequest
  ): Promise<void> {
    try {
      await enterpriseAuditSystem.logEnterpriseEvent({
        user_id: context.userId,
        event_type: eventType as any,
        event_category: 'data_validation',
        severity: errors.some(e => e.severity === 'critical') ? 'critical' :
                 errors.some(e => e.severity === 'high') ? 'high' : 'low',
        description: `Validación de datos: ${eventType}`,
        metadata: {
          errors_count: errors.length,
          errors: errors.map(e => ({ field: e.field, code: e.code, severity: e.severity })),
          security_level: this.config.securityLevel
        },
        ip_address: this.getClientIP(request),
        user_agent: this.getUserAgent(request)
      }, context, request as NextRequest);
    } catch (error) {
      console.error('[ENTERPRISE_VALIDATION] Error logging validation event:', error);
    }
  }

  private getClientIP(request?: NextRequest | NextApiRequest): string {
    if (!request) return 'unknown';
    
    if ('headers' in request && typeof request.headers.get === 'function') {
      return (request as NextRequest).headers.get('x-forwarded-for') || 'unknown';
    } else if ('headers' in request) {
      const headerValue = (request as NextApiRequest).headers['x-forwarded-for'];
      return Array.isArray(headerValue) ? headerValue[0] : headerValue || 'unknown';
    }
    
    return 'unknown';
  }

  private getUserAgent(request?: NextRequest | NextApiRequest): string {
    if (!request) return 'unknown';
    
    if ('headers' in request && typeof request.headers.get === 'function') {
      return (request as NextRequest).headers.get('user-agent') || 'unknown';
    } else if ('headers' in request) {
      const headerValue = (request as NextApiRequest).headers['user-agent'];
      return Array.isArray(headerValue) ? headerValue[0] : headerValue || 'unknown';
    }
    
    return 'unknown';
  }
}

// =====================================================
// INSTANCIAS GLOBALES
// =====================================================

// Instancias predefinidas para diferentes niveles de seguridad
export const criticalValidator = new EnterpriseValidator(ENTERPRISE_VALIDATION_CONFIGS.CRITICAL_ADMIN);
export const highValidator = new EnterpriseValidator(ENTERPRISE_VALIDATION_CONFIGS.HIGH_PAYMENT);
export const standardValidator = new EnterpriseValidator(ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC);
export const basicValidator = new EnterpriseValidator(ENTERPRISE_VALIDATION_CONFIGS.BASIC_USER);

// Sanitizadores predefinidos
export const criticalSanitizer = new EnterpriseSanitizer(ENTERPRISE_VALIDATION_CONFIGS.CRITICAL_ADMIN);
export const highSanitizer = new EnterpriseSanitizer(ENTERPRISE_VALIDATION_CONFIGS.HIGH_PAYMENT);
export const standardSanitizer = new EnterpriseSanitizer(ENTERPRISE_VALIDATION_CONFIGS.STANDARD_PUBLIC);
export const basicSanitizer = new EnterpriseSanitizer(ENTERPRISE_VALIDATION_CONFIGS.BASIC_USER);
