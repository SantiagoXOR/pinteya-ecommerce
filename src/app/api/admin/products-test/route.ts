// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/products-test
 * Minimal test API to isolate the authResult issue
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Products Test API: Starting...');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    console.log('🧪 Products Test API: Query params', { page, limit, offset });

    // Simple query
    const { data: products, error, count } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        stock,
        categories (
          name
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    console.log('🧪 Products Test API: Query result', {
      error: error?.message,
      count,
      productsLength: products?.length
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Database query failed',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Transform products
    const transformedProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category_name: product.categories?.name || null
    })) || [];

    console.log('✅ Products Test API: Success', {
      total: count,
      returned: transformedProducts.length
    });

    return NextResponse.json({
      success: true,
      message: 'Test API working correctly',
      data: {
        products: transformedProducts,
        total: count || 0,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        api: 'products-test',
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Fatal error in products test API:', error);
    
    // Detailed error logging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    };

    console.error('❌ Error details:', errorDetails);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorDetails.message,
        debug: {
          errorName: errorDetails.name,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}










