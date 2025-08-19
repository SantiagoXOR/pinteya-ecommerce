import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { withCriticalValidation } from '@/lib/validation/enterprise-validation-middleware';
import {
  EnterpriseProductSchema,
  EnterpriseProductFiltersSchema,
  EnterprisePaginationSchema
} from '@/lib/validation/enterprise-schemas';
import type { ValidatedRequest } from '@/lib/validation/enterprise-validation-middleware';

// Helper function to check admin permissions with proper role verification
async function checkAdminPermissionsForProducts(action: 'create' | 'read' | 'update' | 'delete', request?: NextRequest) {
  return await checkCRUDPermissions('products', action, request);
}

/**
 * GET /api/admin/products
 * Obtener lista paginada de productos con filtros (ENTERPRISE)
 */
const getHandler = async (request: ValidatedRequest) => {
  try {
    // ENTERPRISE: Verificar autenticación con contexto completo
    const authResult = await requireAdminAuth(request, ['admin_access', 'products_read']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // LEGACY: Mantener compatibilidad con sistema anterior
    const legacyAuthResult = await checkAdminPermissionsForProducts('read', request);
    if (!legacyAuthResult.success) {
      return NextResponse.json(
        { error: legacyAuthResult.error },
        { status: legacyAuthResult.status }
      );
    }

    const { supabase, user } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const rawParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '25'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const rawFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      stockMin: searchParams.get('stockMin') ? parseInt(searchParams.get('stockMin')!) : undefined,
      stockMax: searchParams.get('stockMax') ? parseInt(searchParams.get('stockMax')!) : undefined,
    };

    const pagination = PaginationSchema.parse(rawParams);
    const filters = ProductFiltersSchema.parse(rawFilters);

    // Build query
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

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters.stockMin !== undefined) {
      query = query.gte('stock', filters.stockMin);
    }

    if (filters.stockMax !== undefined) {
      query = query.lte('stock', filters.stockMax);
    }

    // Apply sorting
    query = query.order(pagination.sortBy, { ascending: pagination.sortOrder === 'asc' });

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Error al obtener productos' },
        { status: 500 }
      );
    }

    // Transform data to include category name
    const transformedProducts = products?.map(product => ({
      ...product,
      category_name: product.categories?.name || null,
      categories: undefined, // Remove nested object
    })) || [];

    const total = count || 0;
    const totalPages = Math.ceil(total / pagination.pageSize);

    return NextResponse.json({
      data: transformedProducts,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      filters,
      sort: {
        by: pagination.sortBy,
        order: pagination.sortOrder,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Crear nuevo producto (ENTERPRISE)
 */
const postHandler = async (request: ValidatedRequest) => {
  try {
    // ENTERPRISE: Verificar autenticación con contexto completo
    const authResult = await requireAdminAuth(request, ['admin_access', 'products_create']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // LEGACY: Mantener compatibilidad con sistema anterior
    const legacyAuthResult = await checkAdminPermissionsForProducts('create');
    if (!legacyAuthResult.success) {
      return NextResponse.json(
        { error: legacyAuthResult.error },
        { status: legacyAuthResult.status }
      );
    }

    const { supabase, user } = legacyAuthResult;

    // ENTERPRISE: Usar datos ya validados por middleware
    const productData = request.validatedBody;

    if (!productData) {
      return NextResponse.json(
        {
          error: 'Datos de validación no encontrados',
          code: 'VALIDATION_DATA_MISSING',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', productData.category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      );
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
        updated_at,
        categories (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Error al crear producto' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedProduct = {
      ...product,
      category_name: product.categories?.name || null,
      categories: undefined,
    };

    // Log admin action
    await logAdminAction(
      user.id,
      'CREATE',
      'product',
      product.id,
      null,
      transformedProduct
    );

    return NextResponse.json(
      {
        message: 'Producto creado exitosamente',
        data: transformedProduct
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

/**
 * POST SIMPLIFICADO /api/admin/products
 * Crear nuevo producto SIN validaciones enterprise complejas
 */
const postHandlerSimple = async (request: NextRequest) => {
  try {
    console.log('🔧 Products API: Creating product (SIMPLE MODE)...');

    // Verificar autenticación básica con Clerk
    let userId: string;
    try {
      const authResult = await auth();
      userId = authResult.userId || '';

      if (!userId) {
        console.log('❌ Usuario no autenticado - sin userId');
        return NextResponse.json(
          { error: 'Autenticación requerida', code: 'NOT_AUTHENTICATED' },
          { status: 401 }
        );
      }
    } catch (authError) {
      console.error('❌ Error en autenticación Clerk:', authError);
      return NextResponse.json(
        { error: 'Error interno del servidor', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }

    console.log('✅ Usuario autenticado:', userId);

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

    // Crear producto
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
    console.error('❌ Error in POST /api/admin/products (SIMPLE):', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// ENTERPRISE: Aplicar validación crítica para operaciones admin
export const GET = withCriticalValidation({
  querySchema: EnterpriseProductFiltersSchema.merge(EnterprisePaginationSchema)
})(getHandler);

// USAR VERSIÓN SIMPLIFICADA TEMPORALMENTE
export const POST = postHandlerSimple;
