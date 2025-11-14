// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: EXPORTACIÓN DE PRODUCTOS CSV/EXCEL
// Ruta: /api/admin/products/export
// Descripción: Exportación masiva de productos a CSV o Excel
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/lib/auth/server-auth-guard'
import { z } from 'zod'
import ExcelJS from 'exceljs' // ✅ SEGURO: Librería segura para generar Excel (sin vulnerabilidades)

// =====================================================
// CONFIGURACIÓN
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const ExportFiltersSchema = z.object({
  category_id: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'all']).optional(),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).optional(),
})

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return ''
  }

  const str = String(field)

  // Si contiene comas, comillas o saltos de línea, envolver en comillas
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escapar comillas duplicándolas
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function generateCSV(products: any[]): string {
  // Headers del CSV
  const headers = [
    'ID',
    'Nombre',
    'Descripción',
    'Precio',
    'Precio Descuento',
    'Stock',
    'SKU',
    'Categoría',
    'Marca',
    'Estado',
    'Destacado',
    'Fecha Creación',
    'Última Actualización',
  ]

  // Crear filas
  const rows = products.map(product => [
    product.id,
    product.name,
    product.description || '',
    product.price,
    product.discounted_price || '',
    product.stock,
    product.sku || '',
    product.category_name || '',
    product.brand || '',
    product.is_active ? 'Activo' : 'Inactivo',
    product.is_featured ? 'Sí' : 'No',
    new Date(product.created_at).toLocaleDateString('es-AR'),
    new Date(product.updated_at).toLocaleDateString('es-AR'),
  ])

  // Combinar headers y filas
  const allRows = [headers, ...rows]

  // Convertir a CSV
  return allRows.map(row => row.map(field => escapeCSVField(field)).join(',')).join('\n')
}

// ✅ NUEVA FUNCIÓN: Generar archivo Excel (usando exceljs - más seguro)
async function generateExcel(products: any[]): Promise<Buffer> {
  // Crear workbook
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Productos')

  // Definir columnas con headers y anchos
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Descripción', key: 'description', width: 50 },
    { header: 'Precio', key: 'price', width: 12 },
    { header: 'Precio Descuento', key: 'discounted_price', width: 15 },
    { header: 'Stock', key: 'stock', width: 8 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Categoría', key: 'category_name', width: 20 },
    { header: 'Marca', key: 'brand', width: 15 },
    { header: 'Estado', key: 'status', width: 10 },
    { header: 'Destacado', key: 'featured', width: 10 },
    { header: 'Fecha Creación', key: 'created_at', width: 15 },
    { header: 'Última Actualización', key: 'updated_at', width: 15 },
  ]

  // Estilizar header
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF97316' }, // Naranja de Pinteya
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  // Agregar datos
  products.forEach(product => {
    worksheet.addRow({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      discounted_price: product.discounted_price || '',
      stock: product.stock,
      sku: product.sku || product.aikon_id || '',
      category_name: product.category_name || 'Sin categoría',
      brand: product.brand || '',
      status: product.is_active ? 'Activo' : 'Inactivo',
      featured: product.is_featured ? 'Sí' : 'No',
      created_at: new Date(product.created_at).toLocaleDateString('es-AR'),
      updated_at: new Date(product.updated_at).toLocaleDateString('es-AR'),
    })
  })

  // Generar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  return Buffer.from(buffer)
}

// =====================================================
// HANDLER GET - EXPORTAR PRODUCTOS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (con bypass en desarrollo)
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const session = authResult.session

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const filters = Object.fromEntries(searchParams.entries())

    // Validar filtros
    const validationResult = ExportFiltersSchema.safeParse(filters)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Filtros inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const validatedFilters = validationResult.data

    // Construir query base
    let query = supabase.from('products').select(`
        *,
        categories (
          id,
          name
        )
      `)

    // Aplicar filtros
    if (validatedFilters.category_id) {
      query = query.eq('category_id', parseInt(validatedFilters.category_id))
    }

    if (validatedFilters.brand) {
      query = query.ilike('brand', `%${validatedFilters.brand}%`)
    }

    if (validatedFilters.status && validatedFilters.status !== 'all') {
      query = query.eq('is_active', validatedFilters.status === 'active')
    }

    if (validatedFilters.stock_status && validatedFilters.stock_status !== 'all') {
      switch (validatedFilters.stock_status) {
        case 'out_of_stock':
          query = query.eq('stock', 0)
          break
        case 'low_stock':
          query = query.gt('stock', 0).lte('stock', 10)
          break
        case 'in_stock':
          query = query.gt('stock', 10)
          break
      }
    }

    if (validatedFilters.price_min) {
      query = query.gte('price', parseFloat(validatedFilters.price_min))
    }

    if (validatedFilters.price_max) {
      query = query.lte('price', parseFloat(validatedFilters.price_max))
    }

    if (validatedFilters.created_from) {
      query = query.gte('created_at', validatedFilters.created_from)
    }

    if (validatedFilters.created_to) {
      query = query.lte('created_at', validatedFilters.created_to)
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false })

    // Limitar a 10,000 productos para evitar problemas de memoria
    query = query.limit(10000)

    // Ejecutar consulta
    const { data: products, error } = await query

    if (error) {
      console.error('Error obteniendo productos para exportación:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos para exportar' },
        { status: 404 }
      )
    }

    // Transformar datos para incluir nombre de categoría
    const transformedProducts = products.map(product => ({
      ...product,
      category_name: (product.categories as any)?.name || 'Sin categoría',
    }))

    // ✅ Determinar formato solicitado
    const format = validatedFilters.format || searchParams.get('format') || 'csv'
    const timestamp = new Date().toISOString().split('T')[0]

    // Log de la exportación
    console.log('✅ Exportación completada:', {
      products_count: products.length,
      format,
      filters: validatedFilters,
      user_id: session.user.id,
      timestamp: new Date().toISOString(),
    })

    // ✅ Generar archivo según formato
    if (format === 'xlsx') {
      // Generar Excel
      const excelBuffer = await generateExcel(transformedProducts)
      const filename = `productos-pinteya-${timestamp}.xlsx`

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
    } else {
      // Generar CSV (por defecto)
      const csvContent = generateCSV(transformedProducts)
      const filename = `productos-pinteya-${timestamp}.csv`

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
    }
  } catch (error) {
    console.error('❌ Error en exportación de productos:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// =====================================================
// HANDLER POST - INFORMACIÓN DE EXPORTACIÓN
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (con bypass en desarrollo)
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const session = authResult.session

    // Obtener filtros del body
    const body = await request.json()
    const validationResult = ExportFiltersSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Filtros inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Contar productos que coinciden con los filtros
    let countQuery = supabase.from('products').select('id', { count: 'exact', head: true })

    // Aplicar los mismos filtros que en GET
    if (filters.category_id) {
      countQuery = countQuery.eq('category_id', parseInt(filters.category_id))
    }

    if (filters.brand) {
      countQuery = countQuery.ilike('brand', `%${filters.brand}%`)
    }

    if (filters.status && filters.status !== 'all') {
      countQuery = countQuery.eq('is_active', filters.status === 'active')
    }

    if (filters.stock_status && filters.stock_status !== 'all') {
      switch (filters.stock_status) {
        case 'out_of_stock':
          countQuery = countQuery.eq('stock', 0)
          break
        case 'low_stock':
          countQuery = countQuery.gt('stock', 0).lte('stock', 10)
          break
        case 'in_stock':
          countQuery = countQuery.gt('stock', 10)
          break
      }
    }

    const { count, error } = await countQuery

    if (error) {
      console.error('Error contando productos:', error)
      return NextResponse.json({ error: 'Error al contar productos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        estimated_products: count || 0,
        max_products: 10000,
        estimated_file_size: `${Math.round((count || 0) * 0.5)}KB`, // Estimación aproximada
        supported_formats: ['CSV', 'Excel (XLSX)'], // ✅ ACTUALIZADO: Excel soportado
        filters_applied: filters,
      },
    })
  } catch (error) {
    console.error('❌ Error obteniendo información de exportación:', error)

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
