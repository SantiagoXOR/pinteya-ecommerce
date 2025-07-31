// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, handleSupabaseError } from '@/lib/supabase';
import { validateData, safeValidateData, ProductFiltersSchema, ProductSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, ProductWithCategory } from '@/types/api';
import {
  executeWithRLS,
  withRLS,
  createRLSFilters
} from '@/lib/auth/enterprise-rls-utils';

// ===================================
// GET /api/products - Obtener productos con filtros
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de query
    const queryParams = {
      category: searchParams.get('category') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      brand: searchParams.get('brand') || undefined,
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
      paintType: searchParams.get('paintType') || undefined,
      paintTypes: searchParams.get('paintTypes')?.split(',').filter(Boolean) || undefined,
      priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
      sortBy: searchParams.get('sortBy') as 'price' | 'name' | 'created_at' | 'brand' || 'created_at',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    // Validar parámetros de manera segura
    const validationResult = safeValidateData(ProductFiltersSchema, queryParams);

    if (!validationResult.success) {
      console.error('Error de validación en GET /api/products:', validationResult.error);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: `Parámetros inválidos: ${validationResult.error}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const filters = validationResult.data!;
    
    const supabase = getSupabaseClient();

    // Verificar que el cliente de Supabase esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/products');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Construir query base optimizada (solo campos necesarios)
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, price, discounted_price, brand, stock, images,
        category:categories(id, name, slug)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.category) {
      // Primero obtener el ID de la categoría por su slug
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.category)
        .single();

      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    // Filtro por múltiples categorías (nuevo)
    if (filters.categories && filters.categories.length > 0) {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id')
        .in('slug', filters.categories);

      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map(cat => cat.id);
        query = query.in('category_id', categoryIds);
      }
    }

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    // Filtro por múltiples marcas (nuevo)
    if (filters.brands && filters.brands.length > 0) {
      query = query.in('brand', filters.brands);
    }

    // Filtro por tipo de pintura (nuevo)
    if (filters.paintType) {
      query = query.eq('paint_type', filters.paintType);
    }

    // Filtro por múltiples tipos de pintura (nuevo)
    if (filters.paintTypes && filters.paintTypes.length > 0) {
      query = query.in('paint_type', filters.paintTypes);
    }

    if (filters.priceMin) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
    }

    // Solo productos con stock (temporalmente comentado para testing)
    // query = query.gt('stock', 0);

    // Ordenamiento
    const orderColumn = filters.sortBy === 'created_at' ? 'created_at' :
                       filters.sortBy === 'brand' ? 'brand' :
                       (filters.sortBy || 'created_at');
    query = query.order(orderColumn, { ascending: filters.sortOrder === 'asc' });

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ejecutar query
    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error en GET /api/products - Supabase:', error);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error obteniendo productos de la base de datos',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Calcular información de paginación
    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<ProductWithCategory> = {
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
      success: true,
      message: `${products?.length || 0} productos encontrados`,
    };

    // Agregar headers de cache para mejorar performance
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/products:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST /api/products - Crear producto (Admin)
// ===================================
export async function POST(request: NextRequest) {
  try {
    // ENTERPRISE: Usar nueva autenticación enterprise para admin
    const { requireAdminAuth } = await import('@/lib/auth/enterprise-auth-utils');

    const authResult = await requireAdminAuth(request, ['products_create']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    const body = await request.json();
    
    // Validar datos del producto
    const productData = validateData(ProductSchema, body);
    
    const supabase = getSupabaseClient(true); // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en POST /api/products');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Crear slug si no se proporciona
    if (!productData.slug) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Insertar producto
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .single();

    if (error) {
      handleSupabaseError(error, 'POST /api/products');
    }

    const response: ApiResponse<ProductWithCategory> = {
      data: product,
      success: true,
      message: 'Producto creado exitosamente',
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/products:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
