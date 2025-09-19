/**
 * API de Demostración del Sistema Enterprise de Validación
 * Muestra todas las funcionalidades del sistema de validación y sanitización
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { withCriticalValidation } from '@/lib/validation/enterprise-validation-middleware';
import {
  validateData,
  sanitizeData
} from '@/lib/validation/enterprise-validation-middleware';
import {
  criticalValidator,
  highValidator,
  standardValidator,
  basicValidator
} from '@/lib/validation/enterprise-validation-system';
import {
  EnterpriseEmailSchema,
  EnterprisePasswordSchema,
  EnterpriseProductSchema,
  EnterpriseUserSchema
} from '@/lib/validation/enterprise-schemas';
import type { ValidatedRequest } from '@/lib/validation/enterprise-validation-middleware';

// =====================================================
// ESQUEMAS DE DEMOSTRACIÓN
// =====================================================

const ValidationDemoSchema = z.object({
  // Datos básicos
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: EnterpriseEmailSchema,
  
  // Datos potencialmente peligrosos
  description: z.string().max(1000, 'Descripción muy larga').optional(),
  html_content: z.string().max(5000, 'Contenido HTML muy largo').optional(),
  
  // Datos de prueba de seguridad
  user_input: z.string().max(500, 'Input muy largo').optional(),
  search_query: z.string().max(200, 'Query muy largo').optional(),
  
  // Datos estructurados
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Demasiadas etiquetas').optional(),
  
  // Configuración de prueba
  test_level: z.enum(['basic', 'standard', 'high', 'critical']).default('standard'),
  enable_sanitization: z.boolean().default(true),
  enable_security_validation: z.boolean().default(true)
});

const SecurityTestSchema = z.object({
  test_type: z.enum(['sql_injection', 'xss', 'script_injection', 'html_injection']),
  payload: z.string().max(1000),
  expected_result: z.enum(['blocked', 'sanitized', 'allowed']).optional()
});

// =====================================================
// GET /api/admin/validation-demo
// Información del sistema de validación
// =====================================================

const getHandler = async (request: ValidatedRequest) => {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'system_info']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // Información del sistema de validación
    const systemInfo = {
      validation_system: {
        name: 'Enterprise Validation System',
        version: '1.0.0',
        features: [
          'Zod schema validation',
          'DOMPurify sanitization',
          'SQL injection detection',
          'XSS prevention',
          'Enterprise audit logging',
          'Performance metrics',
          'Multi-level security configs'
        ]
      },
      
      security_levels: {
        critical: {
          description: 'Máxima seguridad para operaciones admin',
          sanitization: true,
          security_validation: true,
          audit_logging: true,
          allowed_html_tags: [],
          max_string_length: 1000
        },
        high: {
          description: 'Alta seguridad para APIs de pagos',
          sanitization: true,
          security_validation: true,
          audit_logging: true,
          allowed_html_tags: [],
          max_string_length: 500
        },
        standard: {
          description: 'Seguridad estándar para APIs públicas',
          sanitization: true,
          security_validation: true,
          audit_logging: false,
          allowed_html_tags: ['b', 'i', 'em', 'strong'],
          max_string_length: 2000
        },
        basic: {
          description: 'Seguridad básica para contenido de usuario',
          sanitization: true,
          security_validation: false,
          audit_logging: false,
          allowed_html_tags: ['b', 'i', 'em', 'strong', 'p', 'br'],
          max_string_length: 5000
        }
      },
      
      detection_patterns: {
        sql_injection: [
          'SELECT ... FROM',
          'UNION ... SELECT',
          'INSERT ... INTO',
          'UPDATE ... SET',
          'DELETE ... FROM',
          'DROP ... TABLE'
        ],
        xss: [
          '<script>...</script>',
          'javascript:',
          'on*= event handlers',
          'eval(...)',
          'expression(...)'
        ]
      },
      
      sanitization_features: [
        'Script removal',
        'HTML tag filtering',
        'SQL keyword removal',
        'Whitespace normalization',
        'String length limits',
        'Character validation',
        'HTML escaping',
        'Emoji removal (optional)'
      ],
      
      validation_features: [
        'Type validation',
        'Format validation',
        'Range validation',
        'Custom validation rules',
        'Nested object validation',
        'Array validation',
        'File validation',
        'Security pattern detection'
      ]
    };

    const response = {
      success: true,
      data: systemInfo,
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        },
        system: {
          validation_enabled: true,
          sanitization_enabled: true,
          audit_enabled: true
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[VALIDATION_DEMO_GET] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al obtener información del sistema',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

// =====================================================
// POST /api/admin/validation-demo
// Demostración de validación y sanitización
// =====================================================

const postHandler = async (request: ValidatedRequest) => {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'system_test']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // Obtener datos validados del middleware
    const validatedData = request.validatedBody;
    
    if (!validatedData) {
      return NextResponse.json(
        { 
          error: 'Datos de validación no encontrados',
          code: 'VALIDATION_DATA_MISSING',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Demostrar diferentes niveles de validación
    const validationResults: any = {
      middleware_validation: {
        success: true,
        data: validatedData,
        metadata: request.validationMetadata
      }
    };

    // Probar validación manual con diferentes niveles
    const testData = {
      name: validatedData.name,
      email: validatedData.email,
      description: validatedData.description || 'Test description with <script>alert("xss")</script>',
      user_input: validatedData.user_input || 'SELECT * FROM users WHERE id = 1'
    };

    // Validación crítica
    const criticalResult = await validateData(
      z.object({
        name: z.string(),
        email: EnterpriseEmailSchema,
        description: z.string(),
        user_input: z.string()
      }),
      testData,
      'CRITICAL_ADMIN',
      context
    );

    validationResults.critical_validation = {
      success: criticalResult.success,
      errors: criticalResult.errors,
      sanitized_data: criticalResult.sanitized,
      metadata: criticalResult.metadata
    };

    // Validación estándar
    const standardResult = await validateData(
      z.object({
        name: z.string(),
        email: EnterpriseEmailSchema,
        description: z.string(),
        user_input: z.string()
      }),
      testData,
      'STANDARD_PUBLIC',
      context
    );

    validationResults.standard_validation = {
      success: standardResult.success,
      errors: standardResult.errors,
      sanitized_data: standardResult.sanitized,
      metadata: standardResult.metadata
    };

    // Demostrar sanitización manual
    const sanitizationDemo = {
      original_data: {
        malicious_script: '<script>alert("XSS Attack!")</script>Hello World',
        sql_injection: "'; DROP TABLE users; --",
        html_content: '<div onclick="alert(1)">Click me</div>',
        normal_text: 'This is normal text with números 123'
      },
      sanitized_data: {}
    };

    // Sanitizar con diferentes niveles
    sanitizationDemo.sanitized_data = {
      critical_level: sanitizeData(sanitizationDemo.original_data, 'CRITICAL_ADMIN'),
      high_level: sanitizeData(sanitizationDemo.original_data, 'HIGH_PAYMENT'),
      standard_level: sanitizeData(sanitizationDemo.original_data, 'STANDARD_PUBLIC'),
      basic_level: sanitizeData(sanitizationDemo.original_data, 'BASIC_USER')
    };

    // Estadísticas de la demostración
    const demoStats = {
      total_validations: 3,
      successful_validations: [criticalResult, standardResult].filter(r => r.success).length,
      failed_validations: [criticalResult, standardResult].filter(r => !r.success).length,
      sanitization_applied: true,
      security_patterns_detected: [
        ...(criticalResult.errors?.filter(e => e.code.includes('INJECTION') || e.code.includes('XSS')) || []),
        ...(standardResult.errors?.filter(e => e.code.includes('INJECTION') || e.code.includes('XSS')) || [])
      ].length,
      performance_metrics: {
        total_time_ms: (criticalResult.metadata?.performanceMs || 0) + (standardResult.metadata?.performanceMs || 0),
        average_time_ms: ((criticalResult.metadata?.performanceMs || 0) + (standardResult.metadata?.performanceMs || 0)) / 2
      }
    };

    const response = {
      success: true,
      data: {
        validation_results: validationResults,
        sanitization_demo: sanitizationDemo,
        demo_statistics: demoStats,
        recommendations: [
          'Use CRITICAL_ADMIN for admin operations',
          'Use HIGH_PAYMENT for payment processing',
          'Use STANDARD_PUBLIC for public APIs',
          'Use BASIC_USER for user-generated content',
          'Always enable sanitization for user input',
          'Monitor validation performance metrics',
          'Review security pattern detections regularly'
        ]
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        },
        validation: {
          level: 'critical',
          audit_logged: true,
          patterns_detected: demoStats.security_patterns_detected
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[VALIDATION_DEMO_POST] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno en demostración de validación',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

// =====================================================
// PUT /api/admin/validation-demo
// Pruebas de seguridad específicas
// =====================================================

const putHandler = async (request: ValidatedRequest) => {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'security_test']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const testData = request.validatedBody;

    // Ejecutar prueba de seguridad específica
    const securityTest = {
      test_type: testData.test_type,
      payload: testData.payload,
      results: {}
    };

    // Probar con validador crítico
    const testSchema = z.object({
      payload: z.string()
    });

    const testResult = await criticalValidator.validateAndSanitize(
      testSchema,
      { payload: testData.payload },
      context,
      request
    );

    securityTest.results = {
      validation_passed: testResult.success,
      errors_detected: testResult.errors || [],
      sanitized_payload: testResult.sanitized?.payload,
      security_patterns_found: testResult.errors?.filter(e => 
        e.code.includes('INJECTION') || e.code.includes('XSS')
      ) || [],
      performance_ms: testResult.metadata?.performanceMs
    };

    const response = {
      success: true,
      data: {
        security_test: securityTest,
        test_summary: {
          payload_blocked: !testResult.success,
          patterns_detected: securityTest.results.security_patterns_found.length,
          sanitization_effective: testResult.sanitized?.payload !== testData.payload,
          recommendation: testResult.success ? 
            'Payload appears safe' : 
            'Payload contains security threats and was blocked'
        }
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role
        },
        security: {
          test_type: testData.test_type,
          threat_detected: !testResult.success,
          audit_logged: true
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[VALIDATION_DEMO_PUT] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno en prueba de seguridad',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

// =====================================================
// APLICAR MIDDLEWARE DE VALIDACIÓN ENTERPRISE
// =====================================================

export const GET = withCriticalValidation({})(getHandler);

export const POST = withCriticalValidation({
  bodySchema: ValidationDemoSchema
})(postHandler);

export const PUT = withCriticalValidation({
  bodySchema: SecurityTestSchema
})(putHandler);









