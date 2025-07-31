import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess, getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import {
  requireAdminAuth,
  getEnterpriseAuthContext
} from '@/lib/auth/enterprise-auth-utils';
import {
  validateRLSContext
} from '@/lib/auth/enterprise-rls-utils';
import {
  getCacheStats
} from '@/lib/auth/enterprise-cache';

export async function GET(request: NextRequest) {
  try {
    // ENTERPRISE: Usar nueva autenticación enterprise para comparación
    const enterpriseResult = await requireAdminAuth(request, ['admin_access']);

    // LEGACY: Mantener método anterior para comparación
    const adminResult = await getAuthenticatedAdmin(request);

    if (!adminResult.userId && !enterpriseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no autenticado en ningún método',
        enterprise: {
          error: enterpriseResult.error,
          code: enterpriseResult.code
        },
        legacy: {
          error: adminResult.error
        },
        migration: {
          status: 'ENTERPRISE_MIGRATED',
          comparison: 'Both methods failed - user not authenticated'
        }
      }, { status: 401 });
    }

    // ENTERPRISE: Obtener contexto completo y validación RLS
    let enterpriseContext = null;
    let rlsValidation = null;

    if (enterpriseResult.success) {
      enterpriseContext = enterpriseResult.context;
      rlsValidation = await validateRLSContext(enterpriseContext!);
    }

    // LEGACY: Comparar con método legacy para verificar migración
    const clerkUserId = adminResult.userId || (enterpriseResult.success ? enterpriseResult.context!.userId : null);

    console.log('🔍 Debug Enterprise vs Legacy: Testing with user:', clerkUserId);

    const legacyResult = clerkUserId ? await checkAdminAccess(clerkUserId) : { success: false, error: 'No user ID' };

    // ENTERPRISE: Obtener estadísticas de cache
    const cacheStats = getCacheStats();

    return NextResponse.json({
      success: enterpriseResult.success || adminResult.isAdmin,
      enterprise: {
        status: enterpriseResult.success ? 'SUCCESS' : 'FAILED',
        context: enterpriseResult.success ? {
          userId: enterpriseContext?.userId,
          role: enterpriseContext?.role,
          permissions: enterpriseContext?.permissions,
          securityLevel: enterpriseContext?.securityLevel,
          validations: enterpriseContext?.validations
        } : null,
        rls: rlsValidation ? {
          valid: rlsValidation.valid,
          error: rlsValidation.error
        } : null,
        cache: cacheStats,
        error: enterpriseResult.error,
        code: enterpriseResult.code
      },
      legacy: {
        status: adminResult.isAdmin ? 'SUCCESS' : 'FAILED',
        userId: adminResult.userId,
        sessionId: adminResult.sessionId,
        isAdmin: adminResult.isAdmin,
        error: adminResult.error,
        checkAdminAccess: {
          success: legacyResult.success,
          error: legacyResult.error
        }
      },
      migration: {
        status: 'ENTERPRISE_COMPLETED',
        comparison: {
          enterprise_success: enterpriseResult.success,
          legacy_success: adminResult.isAdmin,
          methods_agree: enterpriseResult.success === adminResult.isAdmin,
          recommended: 'enterprise'
        },
        improvements: [
          '✅ ENTERPRISE: Autenticación con múltiples validaciones de seguridad',
          '✅ ENTERPRISE: Row Level Security (RLS) integrado',
          '✅ ENTERPRISE: Cache inteligente con estadísticas',
          '✅ ENTERPRISE: Contexto completo de seguridad',
          '✅ ENTERPRISE: Permisos granulares',
          '⚠️ LEGACY: Método anterior aún funcional para compatibilidad'
        ]
      },
      debug: {
        clerkUserId,
        timestamp: new Date().toISOString(),
        request_info: {
          method: request.method,
          url: request.url,
          user_agent: request.headers.get('user-agent')?.substring(0, 100)
        }
      }
    });

  } catch (error) {
    console.error('🔍 Debug checkAdminAccess: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
