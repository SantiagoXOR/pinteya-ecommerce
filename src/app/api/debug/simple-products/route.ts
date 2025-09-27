// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Simple Products: Starting...')

    // Crear cliente Supabase con service key (sin autenticación)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Debug Simple Products: Supabase client created')

    // Consulta simple de productos
    const {
      data: products,
      error,
      count,
    } = await supabase
      .from('products')
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
      `,
        { count: 'exact' }
      )
      .limit(10)

    console.log('🔍 Debug Simple Products: Query executed', {
      error: error?.message,
      count,
      productsLength: products?.length,
    })

    if (error) {
      console.error('❌ Error en consulta Supabase:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
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

    console.log('✅ Debug Simple Products: Success', {
      total: count,
      returned: transformedProducts.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        total: count || 0,
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: (count || 0) > 10,
        },
      },
      debug: {
        timestamp: new Date().toISOString(),
        method: 'simple_supabase_query',
        auth: 'service_key',
      },
    })
  } catch (error) {
    console.error('❌ Error fatal en debug simple products:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        debug: {
          timestamp: new Date().toISOString(),
          method: 'simple_supabase_query',
          auth: 'service_key',
        },
      },
      { status: 500 }
    )
  }
}
