// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API SIMPLIFICADA DE PRODUCTOS ADMIN
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { checkCRUDPermissions } from '@/lib/auth/admin-auth';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con service key para operaciones admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * POST /api/admin/products-simple
 * Crear nuevo producto (SIMPLIFICADO - SIN VALIDACIONES ENTERPRISE)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Products Simple API: Creating product...');

    // Verificar autenticación básica
    const authResult = await checkCRUDPermissions('create', 'products');

    if (!authResult.allowed) {
      console.log('❌ Auth failed:', authResult.error);
      return NextResponse.json(
        {
          error: authResult.error || 'Autenticación requerida',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }

    console.log('✅ Auth successful');

    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    // Validación básica de campos requeridos
    const requiredFields = ['name', 'price'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            error: `Campo requerido: ${field}`,
            code: 'MISSING_FIELD'
          },
          { status: 400 }
        );
      }
    }

    // Mapear datos del frontend al formato de base de datos
    const productData = {
      name: body.name,
      description: body.description || '',
      short_description: body.short_description || '',
      price: parseFloat(body.price),
      discounted_price: body.compare_price ? parseFloat(body.compare_price) : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      stock: parseInt(body.stock) || 0,
      low_stock_threshold: parseInt(body.low_stock_threshold) || 5,
      category_id: body.category_id ? parseInt(body.category_id) : null,
      status: body.status || 'draft',
      is_active: body.status === 'active',
      track_inventory: body.track_inventory !== false,
      allow_backorders: body.allow_backorders === true,
      // Generar slug automático
      slug: body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + '-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Mapped product data:', JSON.stringify(productData, null, 2));

    // Verificar categoría si se proporciona
    if (productData.category_id) {
      const { data: category, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', productData.category_id)
        .single();

      if (categoryError || !category) {
        console.log('❌ Category not found:', categoryError);
        return NextResponse.json(
          { 
            error: 'Categoría no encontrada',
            code: 'CATEGORY_NOT_FOUND'
          },
          { status: 400 }
        );
      }
    }

    // Crear producto usando Supabase Admin (bypassing RLS)
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('❌ Error creating product:', error);
      return NextResponse.json(
        { 
          error: 'Error al crear producto',
          code: 'DATABASE_ERROR',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Product created successfully:', product);

    return NextResponse.json(
      {
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Error in POST /api/admin/products-simple:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/products-simple
 * Obtener lista de productos (SIMPLIFICADO)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Products Simple API: Getting products...');

    // Verificar autenticación básica
    const authResult = await checkCRUDPermissions('read', 'products');

    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error || 'Autenticación requerida',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }

    // Obtener productos usando Supabase Admin
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id,
        status,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener productos',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: products || [],
        total: products?.length || 0
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in GET /api/admin/products-simple:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}










