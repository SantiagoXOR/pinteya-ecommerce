import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { ApiResponse } from '@/types/api'

export const runtime = 'nodejs'

interface TableInfo {
  name: string
  schema: string
  recordCount: number | null
  columns: number | null
}

// Lista de tablas conocidas
const KNOWN_TABLES = [
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

    const { searchParams } = new URL(request.url)
    const schema = searchParams.get('schema') || 'public'

    // Filtrar solo tablas del esquema especificado
    const tablesForSchema = schema === 'public' ? KNOWN_TABLES : []

    // Obtener conteos de registros para cada tabla
    const tablesWithStats: TableInfo[] = []

    for (const tableName of tablesForSchema) {
      try {
        // Intentar obtener count con timeout
        const { count } = (await Promise.race([
          supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true }),
          new Promise<{ count: null }>((resolve) =>
            setTimeout(() => resolve({ count: null }), 2000)
          ),
        ])) as any

        // Intentar obtener muestra de datos para inferir número de columnas
        let columnCount: number | null = null
        try {
          const { data: sample } = await supabaseAdmin.from(tableName).select('*').limit(1)
          if (sample && sample.length > 0) {
            columnCount = Object.keys(sample[0]).length
          }
        } catch {
          // Ignorar errores al obtener muestra
        }

        tablesWithStats.push({
          name: tableName,
          schema,
          recordCount: count ?? null,
          columns: columnCount,
        })
      } catch (err) {
        // Si falla, agregar sin count
        tablesWithStats.push({
          name: tableName,
          schema,
          recordCount: null,
          columns: null,
        })
      }
    }

    const response: ApiResponse<TableInfo[]> = {
      data: tablesWithStats,
      success: true,
      message: 'Tablas obtenidas exitosamente',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/admin/database/tables:', error)
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
