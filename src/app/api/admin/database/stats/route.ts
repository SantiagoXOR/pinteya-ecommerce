import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { ApiResponse } from '@/types/api'

export const runtime = 'nodejs'

interface DatabaseStats {
  totalTables: number
  totalRecords: number
  schemas: Array<{
    name: string
    tableCount: number
  }>
}

// Lista de tablas conocidas del esquema public
const KNOWN_PUBLIC_TABLES = [
  'products',
  'categories',
  'orders',
  'order_items',
  'user_profiles',
  'cart_items',
  'reviews',
  'analytics_events',
  'system_settings',
  'admin_audit_log',
]

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth()

    if (!supabaseAdmin) {
      throw new Error('Cliente de Supabase no disponible')
    }

    // Obtener conteos de registros para cada tabla conocida
    const tableStats: Array<{ name: string; schema: string; count: number }> = []
    let totalRecords = 0

    for (const tableName of KNOWN_PUBLIC_TABLES) {
      try {
        const { count } = await Promise.race([
          supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true }),
          new Promise<{ count: null }>((resolve) =>
            setTimeout(() => resolve({ count: null }), 2000)
          ),
        ]) as any

        const recordCount = count ?? 0
        tableStats.push({ name: tableName, schema: 'public', count: recordCount })
        totalRecords += recordCount
      } catch (err) {
        // Si falla, agregar con count 0
        tableStats.push({ name: tableName, schema: 'public', count: 0 })
      }
    }

    const stats: DatabaseStats = {
      totalTables: KNOWN_PUBLIC_TABLES.length,
      totalRecords,
      schemas: [
        {
          name: 'public',
          tableCount: KNOWN_PUBLIC_TABLES.length,
        },
      ],
    }

    const response: ApiResponse<DatabaseStats> = {
      data: stats,
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/admin/database/stats:', error)
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
