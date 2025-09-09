/**
 * API segura para gestión de productos del panel administrativo
 * Usa Supabase Auth directamente para evitar conflictos con Clerk
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAdminAuth, 
  checkPermission, 
  logAdminAction, 
  validateInput 
} from '@/lib/auth/supabase-auth-utils';

/**
 * GET /api/admin/products-secure
 * Obtener lista paginada de productos con autenticación segura
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔒 Products Secure API: Starting with authentication...');

    // Verificar autenticación y permisos
    const authResult = await checkPermission(request, 'products', 'read');

    if (!authResult.allowed) {
      console.warn('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTH_FAILED',
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const { user, supabase } = authResult;
    console.log('✅ User authenticated:', user?.email, 'Role:', user?.role);

    // Obtener y validar parámetros de query
    const url = new URL(request.url);
    const rawParams = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '10',
      search: url.searchParams.get('search') || '',
      category: url.searchParams.get('category') || '',
      sortBy: url.searchParams.get('sortBy') || 'created_at',
      sortOrder: url.searchParams.get('sortOrder') || 'desc'
    };

    // Validar parámetros
    const page = Math.max(1, parseInt(rawParams.page));
    const limit = Math.min(50, Math.max(1, parseInt(rawParams.limit))); // Máximo 50 por página
    const offset = (page - 1) * limit;

    console.log('🔍 Query params:', { page, limit, offset, search: rawParams.search });

    // Construir query optimizada
    let query = supabase
      .from('products')
      .select(`
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
      `, { count: 'exact' });

    // Aplicar filtros
    if (rawParams.search) {
      query = query.or(`name.ilike.%${rawParams.search}%,description.ilike.%${rawParams.search}%`);
    }

    if (rawParams.category) {
      query = query.eq('category_id', rawParams.category);
    }

    // Aplicar ordenamiento
    const validSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at'];
    const sortBy = validSortFields.includes(rawParams.sortBy) ? rawParams.sortBy : 'created_at';
    const sortOrder = rawParams.sortOrder === 'asc' ? 'asc' : 'desc';
    
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    // Ejecutar query
    const { data: products, error, count } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener productos',
          details: error.message,
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    // Transformar productos
    const transformedProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      category_name: product.categories?.name || null,
      images: product.images,
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || [];

    // Log de acción administrativa
    await logAdminAction(
      user!.id,
      'READ',
      'products',
      undefined,
      null,
      { count: transformedProducts.length, filters: rawParams }
    );

    console.log('✅ Products Secure API: Success', {
      total: count,
      returned: transformedProducts.length,
      user: user?.email
    });

    return NextResponse.json({
      success: true,
      message: 'Productos obtenidos exitosamente',
      data: {
        products: transformedProducts,
        total: count || 0,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1
        },
        filters: {
          search: rawParams.search,
          category: rawParams.category,
          sortBy,
          sortOrder
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        api: 'products-secure',
        version: '2.0.0',
        user: user?.email,
        authenticated: true
      }
    });

  } catch (error) {
    console.error('❌ Fatal error in products secure API:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    };

    console.error('❌ Error details:', errorDetails);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: errorDetails.message,
        code: 'INTERNAL_ERROR',
        debug: {
          errorName: errorDetails.name,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products-secure
 * Crear nuevo producto con autenticación segura
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔒 Products Secure API: Creating product...');

    // Verificar autenticación y permisos
    const authResult = await checkPermission(request, 'products', 'create');

    if (!authResult.allowed) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTH_FAILED'
        },
        { status: authResult.status || 401 }
      );
    }

    const { user, supabase } = authResult;

    // Obtener y validar datos del cuerpo
    const body = await request.json();
    
    const allowedFields = [
      'name', 'description', 'price', 'stock', 
      'category_id', 'images', 'status'
    ];
    
    const productData = validateInput(body, allowedFields);

    // Validaciones específicas
    if (!productData.name || productData.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre del producto es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    if (!productData.price || productData.price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!productData.category_id) {
      return NextResponse.json(
        { error: 'La categoría es requerida' },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', productData.category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      );
    }

    // Crear producto
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id,
        images,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Error al crear producto', details: error.message },
        { status: 500 }
      );
    }

    // Transformar respuesta
    const transformedProduct = {
      ...product,
      category_name: category.name
    };

    // Log de acción administrativa
    await logAdminAction(
      user!.id,
      'CREATE',
      'product',
      product.id,
      null,
      transformedProduct
    );

    console.log('✅ Product created successfully:', product.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Producto creado exitosamente',
        data: transformedProduct
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Error in POST products secure API:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
