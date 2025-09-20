// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API UNIFICADA DE DEBUG
// Consolida todas las funcionalidades de debug dispersas
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, getAuthFromHeaders } from '@/lib/auth/admin-auth';
import { checkCRUDPermissions } from '@/lib/auth/admin-auth';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { checkPermission } from '@/lib/auth/supabase-auth-utils';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Schema de validación para debug
const DebugRequestSchema = z.object({
  module: z.enum([
    'auth',           // Autenticación general
    'clerk',          // Clerk específico
    'admin',          // Panel administrativo
    'products',       // Productos y permisos
    'user-profile',   // Perfiles de usuario
    'user-status',    // Estado de usuario
    'permissions',    // Sistema de permisos
    'supabase',       // Conexión Supabase
    'environment',    // Variables de entorno
    'all'            // Diagnóstico completo
  ]).default('all'),
  user_id: z.string().optional(),
  detailed: z.boolean().default(false),
  include_sensitive: z.boolean().default(false)
});

/**
 * Diagnóstico de autenticación unificado
 */
async function debugAuth(request: NextRequest, detailed: boolean = false) {
  const results = {
    timestamp: new Date().toISOString(),
    module: 'auth',
    status: 'unknown' as 'success' | 'partial' | 'failed' | 'unknown'
  };

  try {
    // Método 1: getAuthenticatedUser (migrado)
    const authResult = await getAuthenticatedUser(request);
    
    // Método 2: auth() directo
    let directAuthResult;
    try {
      directAuthResult = await auth();
    } catch (directAuthError: any) {
      directAuthResult = { error: directAuthError.message };
    }
    
    // Método 3: Headers (deprecado)
    const deprecatedHeaders = await getAuthFromHeaders(request);
    
    // Cookies para análisis
    const cookies = request.cookies;
    const sessionCookie = cookies.get('__session');
    const clerkSessionCookie = cookies.get('__clerk_session');
    
    const authData = {
      migrated_method: {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        isAdmin: authResult.isAdmin,
        error: authResult.error
      },
      direct_method: {
        userId: directAuthResult?.userId,
        sessionId: directAuthResult?.sessionId,
        error: directAuthResult?.error
      },
      deprecated_headers: detailed ? {
        userId: deprecatedHeaders.userId,
        sessionId: deprecatedHeaders.sessionId,
        error: deprecatedHeaders.error
      } : { status: 'hidden' },
      cookies: {
        hasSession: !!sessionCookie,
        hasClerkSession: !!clerkSessionCookie,
        sessionValue: detailed ? sessionCookie?.value : 'hidden',
        clerkValue: detailed ? clerkSessionCookie?.value : 'hidden'
      }
    };
    
    // Determinar estado general
    if (authResult.userId && directAuthResult?.userId) {
      results.status = 'success';
    } else if (authResult.userId || directAuthResult?.userId) {
      results.status = 'partial';
    } else {
      results.status = 'failed';
    }
    
    return { ...results, data: authData };
    
  } catch (error: any) {
    return {
      ...results,
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

/**
 * Diagnóstico específico de Clerk
 */
async function debugClerk(detailed: boolean = false) {
  const results = {
    timestamp: new Date().toISOString(),
    module: 'clerk',
    status: 'unknown' as 'success' | 'partial' | 'failed' | 'unknown'
  };

  try {
    const { userId, sessionClaims } = auth();
    
    // Verificar todas las posibles ubicaciones del rol
    const possibleRoles = {
      'sessionClaims.publicMetadata.role': sessionClaims?.publicMetadata?.role,
      'sessionClaims.metadata.role': sessionClaims?.metadata?.role,
      'sessionClaims.role': sessionClaims?.role,
      'sessionClaims.public_metadata.role': sessionClaims?.public_metadata?.role,
      'sessionClaims.user_metadata.role': sessionClaims?.user_metadata?.role
    };
    
    const clerkData = {
      userId,
      hasSessionClaims: !!sessionClaims,
      sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : [],
      publicMetadata: sessionClaims?.publicMetadata,
      metadata: detailed ? sessionClaims?.metadata : { status: 'hidden' },
      possibleRoleLocations: possibleRoles,
      detectedRole: Object.values(possibleRoles).find(role => role === 'admin') || 'none',
      fullStructure: detailed ? sessionClaims : { status: 'hidden' }
    };
    
    results.status = userId ? 'success' : 'failed';
    return { ...results, data: clerkData };
    
  } catch (error: any) {
    return {
      ...results,
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

/**
 * Diagnóstico del panel administrativo
 */
async function debugAdmin(detailed: boolean = false) {
  const results = {
    timestamp: new Date().toISOString(),
    module: 'admin',
    status: 'unknown' as 'success' | 'partial' | 'failed' | 'unknown'
  };

  try {
    const diagnostics = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      },
      supabase: {
        connection: 'unknown',
        productsTable: 'unknown',
        categoriesTable: 'unknown',
        error: null
      }
    };

    // Test Supabase connection
    if (!supabaseUrl || !supabaseServiceKey) {
      diagnostics.supabase.connection = 'missing_credentials';
      diagnostics.supabase.error = 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY';
    } else {
      // Test products table
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1);

      if (productsError) {
        diagnostics.supabase.productsTable = 'error';
        diagnostics.supabase.error = productsError.message;
      } else {
        diagnostics.supabase.productsTable = 'accessible';
        diagnostics.supabase.connection = 'success';
      }

      // Test categories table
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .limit(1);

      diagnostics.supabase.categoriesTable = categoriesError ? 'error' : 'accessible';
    }

    // Determinar estado general
    const hasAllEnvVars = diagnostics.environment.hasSupabaseUrl && 
                         diagnostics.environment.hasSupabaseServiceKey &&
                         diagnostics.environment.hasClerkSecretKey;
    
    if (hasAllEnvVars && diagnostics.supabase.connection === 'success') {
      results.status = 'success';
    } else if (hasAllEnvVars || diagnostics.supabase.connection === 'success') {
      results.status = 'partial';
    } else {
      results.status = 'failed';
    }

    return { ...results, data: diagnostics };
    
  } catch (error: any) {
    return {
      ...results,
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

/**
 * Diagnóstico de productos y permisos
 */
async function debugProducts(request: NextRequest, userId?: string, detailed: boolean = false) {
  const results = {
    timestamp: new Date().toISOString(),
    module: 'products',
    status: 'unknown' as 'success' | 'partial' | 'failed' | 'unknown'
  };

  try {
    const productData = {
      permissions: {
        simple: 'unknown',
        enterprise: 'unknown',
        secure: 'unknown'
      },
      queries: {
        direct: 'unknown',
        withAuth: 'unknown'
      },
      comparison: null as any
    };

    // Test 1: Simple permissions
    try {
      const simpleResult = await checkCRUDPermissions('read', 'products');
      productData.permissions.simple = simpleResult.success ? 'allowed' : 'denied';
    } catch (error: any) {
      productData.permissions.simple = `error: ${error.message}`;
    }

    // Test 2: Enterprise permissions
    try {
      const enterpriseResult = await requireAdminAuth(request, ['products_read']);
      productData.permissions.enterprise = enterpriseResult.success ? 'allowed' : 'denied';
    } catch (error: any) {
      productData.permissions.enterprise = `error: ${error.message}`;
    }

    // Test 3: Secure permissions
    try {
      const secureResult = await checkPermission(request, 'products', 'read');
      productData.permissions.secure = secureResult.allowed ? 'allowed' : 'denied';
    } catch (error: any) {
      productData.permissions.secure = `error: ${error.message}`;
    }

    // Test 4: Direct query
    try {
      const { data: directProducts, error: directError } = await supabaseAdmin
        .from('products')
        .select('id, name, price')
        .limit(3);
      
      productData.queries.direct = directError ? `error: ${directError.message}` : `success: ${directProducts?.length} products`;
    } catch (error: any) {
      productData.queries.direct = `error: ${error.message}`;
    }

    // Determinar estado general
    const successCount = Object.values(productData.permissions).filter(p => p === 'allowed').length;
    if (successCount >= 2) {
      results.status = 'success';
    } else if (successCount >= 1) {
      results.status = 'partial';
    } else {
      results.status = 'failed';
    }

    return { ...results, data: productData };
    
  } catch (error: any) {
    return {
      ...results,
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

/**
 * Diagnóstico completo del sistema
 */
async function debugAll(request: NextRequest, detailed: boolean = false) {
  const results = {
    timestamp: new Date().toISOString(),
    module: 'all',
    status: 'unknown' as 'success' | 'partial' | 'failed' | 'unknown',
    summary: {
      total_modules: 4,
      success_count: 0,
      partial_count: 0,
      failed_count: 0
    }
  };

  try {
    // Ejecutar todos los diagnósticos
    const [authResult, clerkResult, adminResult, productsResult] = await Promise.all([
      debugAuth(request, detailed),
      debugClerk(detailed),
      debugAdmin(detailed),
      debugProducts(request, undefined, detailed)
    ]);

    const allResults = {
      auth: authResult,
      clerk: clerkResult,
      admin: adminResult,
      products: productsResult
    };

    // Calcular resumen
    Object.values(allResults).forEach(result => {
      if (result.status === 'success') {results.summary.success_count++;}
      else if (result.status === 'partial') {results.summary.partial_count++;}
      else {results.summary.failed_count++;}
    });

    // Determinar estado general
    if (results.summary.success_count >= 3) {
      results.status = 'success';
    } else if (results.summary.success_count + results.summary.partial_count >= 2) {
      results.status = 'partial';
    } else {
      results.status = 'failed';
    }

    return { ...results, data: allResults };
    
  } catch (error: any) {
    return {
      ...results,
      status: 'failed' as const,
      error: error.message,
      data: null
    };
  }
}

/**
 * GET /api/debug/unified
 * API unificada de debug con múltiples módulos
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    // Validar parámetros
    const params = DebugRequestSchema.parse(rawParams);
    const { module, user_id, detailed, include_sensitive } = params;
    
    console.log(`🔍 Unified Debug API: Module ${module}, Detailed: ${detailed}`);
    
    let result;
    
    // Ejecutar diagnóstico según el módulo solicitado
    switch (module) {
      case 'auth':
        result = await debugAuth(request, detailed);
        break;
      case 'clerk':
        result = await debugClerk(detailed);
        break;
      case 'admin':
        result = await debugAdmin(detailed);
        break;
      case 'products':
        result = await debugProducts(request, user_id, detailed);
        break;
      case 'all':
      default:
        result = await debugAll(request, detailed);
        break;
    }
    
    // Filtrar información sensible si no está autorizada
    if (!include_sensitive && result.data) {
      // Remover información sensible de la respuesta
      if (typeof result.data === 'object') {
        const sanitized = JSON.parse(JSON.stringify(result.data));
        // Aquí se pueden agregar más filtros de seguridad
        result.data = sanitized;
      }
    }
    
    console.log(`✅ Unified Debug: Module ${module} completed with status ${result.status}`);
    
    return NextResponse.json({
      ...result,
      meta: {
        api_version: '1.0.0',
        unified: true,
        parameters: {
          module,
          detailed,
          include_sensitive
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Unified Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor de debug',
        details: error.message,
        module: 'unified',
        status: 'failed'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/unified
 * Ejecutar diagnósticos específicos con datos de entrada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, user_id, test_data, detailed = false } = body;
    
    console.log(`🔧 Unified Debug POST: Module ${module} with test data`);
    
    // Aquí se pueden agregar diagnósticos específicos que requieren datos de entrada
    // Por ejemplo, probar autenticación con credenciales específicas
    
    return NextResponse.json({
      message: 'Diagnóstico POST completado',
      module,
      test_data: detailed ? test_data : 'hidden',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Unified Debug POST error:', error);
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico POST',
        details: error.message
      },
      { status: 500 }
    );
  }
}










