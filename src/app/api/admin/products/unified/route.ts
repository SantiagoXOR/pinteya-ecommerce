// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API UNIFICADA DE PRODUCTOS ADMIN
// Consolida todas las variantes: simple, direct, rls, secure, test
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { executeWithRLS } from '@/lib/auth/enterprise-rls-utils'
import { checkPermission } from '@/lib/auth/supabase-auth-utils'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Schema de validación unificado
const UnifiedProductFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  sort_by: z.enum(['name', 'price', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  auth_mode: z.enum(['simple', 'direct', 'rls', 'secure', 'test']).default('secure'),
})

const UnifiedProductCreateSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'Precio debe ser mayor a 0'),
  stock: z.number().int().min(0).default(0),
  category_id: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
  is_active: z.boolean().default(true),
  auth_mode: z.enum(['simple', 'direct', 'rls', 'secure', 'test']).default('secure'),
})

// Función de autenticación unificada
async function unifiedAuth(request: NextRequest, action: string, mode: string) {
  switch (mode) {
    case 'simple':
      return await checkCRUDPermissions(action as any, 'products')

    case 'direct':
      const session = await auth()
      if (!session?.user) {
        return { allowed: false, error: 'Autenticación requerida', status: 401 }
      }
      const isAdmin = session.user.email === 'santiago@xor.com.ar'
      if (!isAdmin) {
        return { allowed: false, error: 'Permisos de administrador requeridos', status: 403 }
      }
      return { allowed: true, user: session.user, supabase: supabaseAdmin }

    case 'rls':
      const authResult = await requireAdminAuth(request, ['products_read'])
      if (!authResult.success) {
        return { allowed: false, error: authResult.error, status: authResult.status }
      }
      return { allowed: true, context: authResult.context, supabase: authResult.supabase }

    case 'secure':
      return await checkPermission(request, 'products', action)

    case 'test':
      // Modo test sin autenticación para debugging
      return { allowed: true, supabase: supabaseAdmin }

    default:
      return { allowed: false, error: 'Modo de autenticación no válido', status: 400 }
  }
}

/**
 * GET /api/admin/products/unified
 * API unificada para obtener productos con múltiples modos de autenticación
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const rawParams = Object.fromEntries(url.searchParams.entries())

    // Validar parámetros
    const params = UnifiedProductFiltersSchema.parse(rawParams)
    const {
      auth_mode,
      page,
      limit,
      search,
      category_id,
      is_active,
      price_min,
      price_max,
      sort_by,
      sort_order,
    } = params

    console.log(`🔍 Unified Products API: Mode ${auth_mode}, Page ${page}`)

    // Autenticación unificada
    const authResult = await unifiedAuth(request, 'read', auth_mode)

    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: 'AUTH_FAILED',
          mode: auth_mode,
        },
        { status: authResult.status || 401 }
      )
    }

    const supabase = authResult.supabase || supabaseAdmin
    const offset = (page - 1) * limit

    // Construir consulta
    let query = supabase.from('products').select(
      `
        id,
        name,
        description,
        price,
        stock,
        category_id,
        images,
        is_active,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `,
      { count: 'exact' }
    )

    // Aplicar filtros
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }
    if (price_min !== undefined) {
      query = query.gte('price', price_min)
    }
    if (price_max !== undefined) {
      query = query.lte('price', price_max)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    // Ejecutar consulta con RLS si es necesario
    let result
    if (auth_mode === 'rls' && authResult.context) {
      result = await executeWithRLS(authResult.context, async client => await query)
    } else {
      result = await query
    }

    const { data: products, error, count } = result

    if (error) {
      console.error(`❌ ${auth_mode} mode error:`, error)
      return NextResponse.json(
        {
          error: 'Error al obtener productos',
          details: error.message,
          mode: auth_mode,
        },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    console.log(`✅ ${auth_mode} mode: ${products?.length} products retrieved`)

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      meta: {
        auth_mode,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('❌ Unified Products API error:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products/unified
 * API unificada para crear productos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = UnifiedProductCreateSchema.parse(body)
    const { auth_mode, ...productData } = params

    console.log(`🔧 Unified Products API: Creating product with ${auth_mode} mode`)

    // Autenticación unificada
    const authResult = await unifiedAuth(request, 'create', auth_mode)

    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: 'AUTH_FAILED',
          mode: auth_mode,
        },
        { status: authResult.status || 401 }
      )
    }

    const supabase = authResult.supabase || supabaseAdmin

    // Crear producto
    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (error) {
      console.error(`❌ ${auth_mode} mode create error:`, error)
      return NextResponse.json(
        {
          error: 'Error al crear producto',
          details: error.message,
          mode: auth_mode,
        },
        { status: 500 }
      )
    }

    console.log(`✅ ${auth_mode} mode: Product created with ID ${product.id}`)

    return NextResponse.json(
      {
        data: product,
        message: 'Producto creado exitosamente',
        meta: {
          auth_mode,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Unified Products API create error:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
