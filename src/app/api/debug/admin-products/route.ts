// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { executeWithRLS, createRLSFilters } from '@/lib/auth/enterprise-rls-utils'
import { getCacheStats } from '@/lib/auth/enterprise-cache'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Admin Products Enterprise: Starting check...')

    // ENTERPRISE: Usar nueva autenticación enterprise
    const enterpriseResult = await requireAdminAuth(request, ['products_read'])

    // LEGACY: Mantener método anterior para comparación
    const legacyResult = await checkCRUDPermissions('read', 'products')

    console.log('🔍 Debug Admin Products: Results comparison:', {
      enterprise: {
        success: enterpriseResult.success,
        error: enterpriseResult.error,
        code: enterpriseResult.code,
      },
      legacy: {
        success: legacyResult.success,
        error: legacyResult.error,
        status: legacyResult.status,
        hasUser: !!legacyResult.user,
        hasSupabase: !!legacyResult.supabase,
      },
    })

    if (!enterpriseResult.success && !legacyResult.success) {
      return NextResponse.json(
        {
          error: 'Ambos métodos de autenticación fallaron',
          enterprise: {
            error: enterpriseResult.error,
            code: enterpriseResult.code,
          },
          legacy: {
            error: legacyResult.error,
            step: 'checkCRUDPermissions failed',
          },
          debug: {
            both_methods_failed: true,
            recommended_action: 'Check authentication setup',
          },
        },
        { status: enterpriseResult.status || legacyResult.status || 401 }
      )
    }

    // ENTERPRISE: Probar consulta de productos con RLS si enterprise auth es exitoso
    let productsData = null
    let rlsFilters = null
    let cacheStats = null

    if (enterpriseResult.success) {
      const context = enterpriseResult.context!

      // Obtener estadísticas de cache
      cacheStats = getCacheStats()

      // Crear filtros RLS para productos
      rlsFilters = createRLSFilters(
        {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions,
          isActive: true,
        },
        'products'
      )

      // Ejecutar consulta con RLS
      const productsResult = await executeWithRLS(
        context,
        async (client, rlsContext) => {
          let query = client
            .from('products')
            .select('id, name, price, is_active, category_id')
            .limit(5)

          // Aplicar filtros RLS automáticos
          Object.entries(rlsFilters || {}).forEach(([key, value]) => {
            query = query.eq(key, value)
          })

          const { data, error } = await query

          if (error) {
            throw new Error(`Error consultando productos: ${error.message}`)
          }

          return data
        },
        { enforceRLS: true, auditLog: true }
      )

      if (productsResult.success) {
        productsData = productsResult.data
      }
    }

    return NextResponse.json({
      success: enterpriseResult.success || legacyResult.success,
      message: 'Admin products access comparison completed',
      enterprise: {
        status: enterpriseResult.success ? 'SUCCESS' : 'FAILED',
        context: enterpriseResult.success
          ? {
              userId: enterpriseResult.context?.userId,
              role: enterpriseResult.context?.role,
              permissions: enterpriseResult.context?.permissions,
              securityLevel: enterpriseResult.context?.securityLevel,
            }
          : null,
        rls: {
          filters_applied: rlsFilters,
          products_found: productsData?.length || 0,
          sample_products: productsData?.slice(0, 3),
        },
        cache: cacheStats,
        error: enterpriseResult.error,
        code: enterpriseResult.code,
      },
      legacy: {
        status: legacyResult.success ? 'SUCCESS' : 'FAILED',
        authResult: {
          success: legacyResult.success,
          hasUser: !!legacyResult.user,
          hasSupabase: !!legacyResult.supabase,
          userEmail: legacyResult.user?.email,
          userRole: legacyResult.user?.user_roles?.role_name,
        },
        error: legacyResult.error,
      },
      comparison: {
        methods_agree: enterpriseResult.success === legacyResult.success,
        enterprise_advantages: [
          'RLS integration with automatic filters',
          'Cache statistics and optimization',
          'Granular permissions checking',
          'Complete security context',
          'Audit logging enabled',
        ],
        recommendation: enterpriseResult.success
          ? 'Use enterprise method'
          : 'Fix authentication issues',
      },
      debug: {
        timestamp: new Date().toISOString(),
        request_info: {
          method: request.method,
          url: request.url,
        },
      },
    })
  } catch (error) {
    console.error('🔍 Debug Admin Products: Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error',
        debug: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
