import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { ApiResponse } from '@/types/api'

export const runtime = 'nodejs'

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

interface TableDetails {
  name: string
  schema: string
  recordCount: number | null
  columns: ColumnInfo[]
  indexes: string[]
  foreignKeys: Array<{
    column: string
    referencesTable: string
    referencesColumn: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await requireAdminAuth()

    const tableName = params.name
    const { searchParams } = new URL(request.url)
    const schema = searchParams.get('schema') || 'public'

    // Obtener conteo de registros
    let recordCount: number | null = null
    try {
      const { count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      recordCount = count ?? null
    } catch (err) {
      console.warn(`Could not get count for table ${tableName}:`, err)
    }

    // Información de columnas (limitada - Supabase no expone fácilmente information_schema)
    // Como alternativa, intentamos obtener una muestra de datos para inferir la estructura
    const columns: ColumnInfo[] = []
    try {
      const { data: sample } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (sample && sample.length > 0) {
        Object.keys(sample[0]).forEach(key => {
          columns.push({
            name: key,
            type: typeof sample[0][key],
            nullable: sample[0][key] === null,
            default: null,
          })
        })
      }
    } catch (err) {
      console.warn(`Could not get sample data for table ${tableName}:`, err)
    }

    const details: TableDetails = {
      name: tableName,
      schema,
      recordCount,
      columns,
      indexes: [], // No disponible sin acceso a pg_indexes
      foreignKeys: [], // No disponible sin acceso a information_schema
    }

    const response: ApiResponse<TableDetails> = {
      data: details,
      success: true,
      message: 'Detalles de tabla obtenidos exitosamente',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/admin/database/tables/[name]:', error)
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
