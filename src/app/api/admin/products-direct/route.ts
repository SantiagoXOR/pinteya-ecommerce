// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/admin/products-direct
 * API directa sin middleware para el panel admin
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Products Direct: Starting...')

    // Verificar autenticación con NextAuth.js
    const session = await auth()

    if (!session?.user) {
      console.log('❌ Admin Products Direct: No authenticated user')
      return NextResponse.json(
        {
          error: 'Acceso denegado - Autenticación requerida',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('✅ Admin Products Direct: User authenticated', { userId })

    // Verificar si es admin (simplificado)
    const isAdmin = session.user.email === 'santiago@xor.com.ar'

    if (!isAdmin) {
      console.log('❌ Admin Products Direct: User not admin')
      return NextResponse.json(
        {
          error: 'Acceso denegado - Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      )
    }

    console.log('🔍 Admin Products Direct: User info', {
      userId,
      email: session.user.email,
      isAdmin,
    })

    // Usuario verificado como admin
    console.log('✅ Admin Products Direct: Usuario verificado como admin')
    console.log(`📋 Admin status: ${isAdmin}`)

    // Comentamos la verificación de rol temporalmente para debug
    // if (userRole !== 'admin' && userRole !== 'moderator') {
    //   return NextResponse.json(
    //     {
    //       error: 'Acceso denegado - Se requiere rol admin',
    //       code: 'ADMIN_REQUIRED'
    //     },
    //     { status: 403 }
    //   );
    // }

    console.log('✅ Admin Products Direct: Access granted')

    // Crear cliente Supabase con service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const category_id = url.searchParams.get('category_id') || ''

    const offset = (page - 1) * limit

    console.log('🔍 Admin Products Direct: Query params', {
      page,
      limit,
      offset,
      search,
      category_id,
    })

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
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    // Aplicar paginación y ordenamiento
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: products, error, count } = await query

    console.log('🔍 Admin Products Direct: Query executed', {
      error: error?.message,
      count,
      productsLength: products?.length,
    })

    if (error) {
      console.error('❌ Error consultando productos:', error)
      return NextResponse.json(
        {
          error: 'Error al consultar productos',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Transformar productos
    const transformedProducts =
      products?.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        categories: undefined,
      })) || []

    console.log('✅ Admin Products Direct: Success', {
      total: count,
      returned: transformedProducts.length,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        total: count || 0,
        pagination: {
          page,
          limit,
          offset,
          totalPages: Math.ceil((count || 0) / limit),
          hasMore: (count || 0) > offset + limit,
          hasPrevious: page > 1,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        method: 'admin_direct',
        user: userId,
        role: 'admin',
      },
    })
  } catch (error) {
    console.error('❌ Error fatal en admin products direct:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products-direct
 * Crear nuevo producto (versión directa)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Admin Products Direct POST: Starting...')

    // Verificar autenticación con NextAuth.js
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Acceso denegado - Autenticación requerida',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Verificar si es admin (simplificado)
    const isAdmin = session.user.email === 'santiago@xor.com.ar'

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: 'Acceso denegado - Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      )
    }

    // Usuario verificado como admin
    console.log('✅ Admin Products Direct POST: Usuario verificado como admin')
    console.log(`📋 Admin status: ${isAdmin}`)

    // Comentamos la verificación de rol temporalmente para debug

    // Crear cliente Supabase con service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()

    console.log('🔍 Admin Products Direct POST: Body received', {
      hasName: !!body.name,
      hasPrice: !!body.price,
      hasCategory: !!body.category_id,
    })

    // Validación básica
    if (!body.name || !body.price || !body.category_id) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: name, price, category_id',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Crear producto
    const productData = {
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price),
      stock: parseInt(body.stock) || 0,
      category_id: body.category_id,
      images: body.images || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select(
        `
        id,
        name,
        description,
        price,
        stock,
        category_id,
        images,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `
      )
      .single()

    if (error) {
      console.error('❌ Error creando producto:', error)
      return NextResponse.json(
        {
          error: 'Error al crear producto',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Transformar respuesta
    const transformedProduct = {
      ...product,
      category_name: product.categories?.name || null,
      categories: undefined,
    }

    console.log('✅ Admin Products Direct POST: Success', {
      productId: product.id,
      name: product.name,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Producto creado exitosamente',
        data: transformedProduct,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error fatal en admin products direct POST:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
