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

const AIKON_COLUMNS = [
  'Código',
  'Descripción',
  'Familia',
  'Nombre Familia',
  'UM',
  'Unidad de Medida',
  'Marca',
  'Nombre Marca',
  'Costo Neto',
  'Descuento',
  'Descuento Máximo',
  'Oferta',
  'Moneda',
  'Maneja Stock',
  'Estado',
  'Condicion de Venta',
  'Deposito por Defecto',
  'Precio Sugerido',
  'Venta Mínima',
  'Rentabilidad Min',
  'Rentabilidad Max',
  'Compre Ahora',
  'Activo Compre Ahora',
  'Cód.Ref 001',
  'Ref 001',
  'Cód.Ref 002',
  'Ref 002',
  'Stock Disponible',
  'Necesita Sync Aikon',
]

const DEFAULT_SALE_CONDITION = 'Contado'
const DEFAULT_DEPOSIT = 'Deposito Central'
const DEFAULT_CURRENCY = 'ARS'
const DEFAULT_MIN_SALE = 1

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

function generateCSV(aikonRows: Record<string, any>[]): string {
  const header = AIKON_COLUMNS
  const csvRows = aikonRows.map(row => header.map(column => row[column] ?? ''))
  return [header, ...csvRows].map(row => row.map(field => escapeCSVField(field)).join(',')).join('\n')
}

// ✅ NUEVA FUNCIÓN: Generar archivo Excel (usando exceljs - más seguro)
async function generateExcel(rows: ExportRow[], aikonRows: Record<string, any>[]): Promise<Buffer> {
  // Crear workbook
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Productos')

  const worksheetColumns = AIKON_COLUMNS.map((header, index) => ({
    header,
    key: `col_${index}`,
    width: Math.min(Math.max(header.length + 5, 14), 40),
  }))

  worksheet.columns = worksheetColumns

  // Estilizar header
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF97316' }, // Naranja de Pinteya
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  const columnKeys = worksheetColumns.map(column => column.key as string)

  aikonRows.forEach(row => {
    const excelRow: Record<string, any> = {}
    columnKeys.forEach((key, index) => {
      const header = AIKON_COLUMNS[index]
      excelRow[key] = row[header] ?? ''
    })

    worksheet.addRow(excelRow)
  })

  const summarySheet = workbook.addWorksheet('Resumen')
  const uniqueProducts = new Set(rows.map((row: any) => row.product_id))
  const totalVariants = rows.filter((row: any) => row.variant_id).length
  const totalStock = rows.reduce((acc: number, row: any) => acc + (row.variant_stock || 0), 0)
  const productsWithoutCategory = new Set(
    rows.filter((row: any) => !row.category_id).map((row: any) => row.product_id)
  )
  const variantsWithoutAikon = rows.filter(
    (row: any) => !row.variant_aikon_id || row.variant_aikon_id <= 0
  ).length

  summarySheet.addRows([
    ['Total productos únicos', uniqueProducts.size],
    ['Total filas / variantes', rows.length],
    ['Total variantes con ID', totalVariants],
    ['Stock total (sumatoria variantes)', totalStock],
    ['Productos sin categoría', productsWithoutCategory.size],
    ['Variantes sin aikon_id', variantsWithoutAikon],
  ])

  // Generar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  return Buffer.from(buffer)
}

type SupabaseProduct = {
  id: number
  name: string
  slug: string
  description: string | null
  price: number | null
  discounted_price: number | null
  stock: number | null
  category_id: number | null
  brand: string | null
  is_active: boolean
  is_featured?: boolean | null
  aikon_id?: string | null
  medida?: string | null
  created_at: string
  updated_at: string
  product_variants?: any[]
  categories?: {
    id: number
    name: string
  } | null
}

type ExportRow = {
  product_id: number
  product_name: string
  product_slug: string
  product_description: string | null
  category_id: number | null
  category_name: string
  brand: string | null
  is_active: boolean
  is_featured: boolean
  product_price: number | null
  product_discounted_price: number | null
  product_total_stock: number
  variant_id: number | null
  variant_aikon_id: number | null
  variant_slug: string
  variant_color: string
  variant_color_hex: string
  variant_measure: string
  variant_finish: string
  variant_price_list: number | null
  variant_price_sale: number | null
  variant_stock: number
  variant_is_active: boolean
  variant_is_default: boolean
  variant_image_url: string
  product_created_at: string
  product_updated_at: string
  needs_aikon_sync: boolean
}

function buildExportRow(
  product: SupabaseProduct,
  categoryName: string,
  totalStock: number,
  variant?: any | null
): ExportRow {
  const hasVariant = Boolean(variant)
  const variantAikonId = hasVariant ? (variant.aikon_id ?? null) : (product.aikon_id ?? null)

  return {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    product_description: product.description,
    category_id: product.category_id,
    category_name: categoryName,
    brand: product.brand,
    is_active: product.is_active,
    is_featured: Boolean(product.is_featured),
    product_price: product.price,
    product_discounted_price: product.discounted_price,
    product_total_stock: totalStock,
    variant_id: hasVariant ? variant.id : null,
    variant_aikon_id: variantAikonId,
    variant_slug: hasVariant ? variant.variant_slug || '' : '',
    variant_color: hasVariant ? variant.color_name || '' : '',
    variant_color_hex: hasVariant ? variant.color_hex || '' : '',
    variant_measure: hasVariant ? variant.measure || '' : product.medida || '',
    variant_finish: hasVariant ? variant.finish || '' : '',
    variant_price_list: hasVariant ? variant.price_list : product.price,
    variant_price_sale: hasVariant ? variant.price_sale : product.discounted_price,
    variant_stock: hasVariant ? variant.stock ?? 0 : product.stock ?? 0,
    variant_is_active: hasVariant ? Boolean(variant.is_active) : product.is_active,
    variant_is_default: hasVariant ? Boolean(variant.is_default) : true,
    variant_image_url: hasVariant ? variant.image_url || '' : '',
    product_created_at: product.created_at,
    product_updated_at: product.updated_at,
    needs_aikon_sync: variantAikonId.trim() === '',
  }
}

function buildRowsFromProducts(products: SupabaseProduct[]): ExportRow[] {
  const rows: ExportRow[] = []

  products.forEach(product => {
    const categoryName = (product.categories as any)?.name || 'Sin categoría'
    const variants = Array.isArray(product.product_variants) ? product.product_variants : []
    const totalVariantStock =
      variants.length > 0
        ? variants.reduce((sum, variant) => sum + (variant?.stock ?? 0), 0)
        : product.stock ?? 0

    if (variants.length > 0) {
      variants.forEach(variant => {
        rows.push(buildExportRow(product, categoryName, totalVariantStock, variant))
      })
    } else {
      rows.push(buildExportRow(product, categoryName, totalVariantStock, null))
    }
  })

  return rows
}

function filterRowsByStockStatus(rows: ExportRow[], status?: string | null): ExportRow[] {
  if (!status || status === 'all') {
    return rows
  }

  return rows.filter(row => {
    const totalStock = row.product_total_stock ?? 0
    switch (status) {
      case 'out_of_stock':
        return totalStock === 0
      case 'low_stock':
        return totalStock > 0 && totalStock <= 10
      case 'in_stock':
        return totalStock > 10
      default:
        return true
    }
  })
}

function buildAikonDescription(row: ExportRow): string {
  const parts = [row.product_name]

  if (row.variant_measure) {
    parts.push(row.variant_measure)
  }

  if (row.variant_color) {
    parts.push(row.variant_color)
  }

  return parts.filter(Boolean).join(' - ')
}

function mapRowToAikon(row: ExportRow): Record<string, any> {
  const priceList = row.variant_price_list ?? row.product_price ?? null
  const priceSale = row.variant_price_sale ?? row.product_discounted_price ?? priceList
  const handlesStock = row.variant_id !== null
  const discount =
    priceList !== null && priceSale !== null ? Math.max(0, Number(priceList) - Number(priceSale)) : 0

  return {
    Código: row.variant_aikon_id ? String(row.variant_aikon_id) : '',
    Descripción: buildAikonDescription(row),
    Familia: row.category_id ?? '',
    'Nombre Familia': row.category_name || 'Sin categoría',
    UM: row.variant_measure || '',
    'Unidad de Medida': row.variant_measure || '',
    Marca: row.brand || '',
    'Nombre Marca': row.brand || '',
    'Costo Neto': priceList ?? '',
    Descuento: discount,
    'Descuento Máximo': discount,
    Oferta: discount > 0 ? 'Sí' : 'No',
    Moneda: DEFAULT_CURRENCY,
    'Maneja Stock': handlesStock ? 'Sí' : 'No',
    Estado: row.is_active ? 'Activo' : 'Inactivo',
    'Condicion de Venta': DEFAULT_SALE_CONDITION,
    'Deposito por Defecto': DEFAULT_DEPOSIT,
    'Precio Sugerido': priceSale ?? '',
    'Venta Mínima': DEFAULT_MIN_SALE,
    'Rentabilidad Min': '',
    'Rentabilidad Max': '',
    'Compre Ahora': row.is_active ? 'Sí' : 'No',
    'Activo Compre Ahora': row.is_active ? 'Sí' : 'No',
    'Cód.Ref 001': row.product_id,
    'Ref 001': row.product_slug,
    'Cód.Ref 002': row.variant_id ?? '',
    'Ref 002': row.variant_slug || '',
    'Stock Disponible': row.variant_stock ?? 0,
    'Necesita Sync Aikon': row.needs_aikon_sync ? 'Sí' : 'No',
  }
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
        ),
        product_variants (*)
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

    const flattenedRows = buildRowsFromProducts(products as SupabaseProduct[])
    const rowsAfterStockFilter = filterRowsByStockStatus(flattenedRows, validatedFilters.stock_status)

    if (rowsAfterStockFilter.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos para exportar con los filtros aplicados' },
        { status: 404 }
      )
    }

    const aikonRows = rowsAfterStockFilter.map(mapRowToAikon)

    // ✅ Determinar formato solicitado
    const format = validatedFilters.format || searchParams.get('format') || 'csv'
    const timestamp = new Date().toISOString().split('T')[0]

    // Log de la exportación
    console.log('✅ Exportación completada:', {
      products_count: rowsAfterStockFilter.length,
      aikon_rows: aikonRows.length,
      format,
      filters: validatedFilters,
      user_id: session.user.id,
      timestamp: new Date().toISOString(),
    })

    // ✅ Generar archivo según formato
    if (format === 'xlsx') {
      // Generar Excel
      const excelBuffer = await generateExcel(rowsAfterStockFilter, aikonRows)
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
      const csvContent = generateCSV(aikonRows)
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
