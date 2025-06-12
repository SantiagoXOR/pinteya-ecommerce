// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, handleSupabaseError } from '@/lib/supabase';
import { validateData, ProductFiltersSchema, ProductSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, ProductWithCategory } from '@/types/api';

// ===================================
// GET /api/products - Obtener productos con filtros
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de query
    const queryParams = {
      category: searchParams.get('category') || undefined,
      priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
      sortBy: searchParams.get('sortBy') as 'price' | 'name' | 'created_at' || 'created_at',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    // Validar parámetros
    const filters = validateData(ProductFiltersSchema, queryParams);
    
    const supabase = getSupabaseClient();
    
    // Construir query base
    let query = supabase
      .from('products')
      .select(`
        *,
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

    if (filters.priceMin) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Solo productos con stock
    query = query.gt('stock', 0);

    // Ordenamiento
    const orderColumn = filters.sortBy === 'created_at' ? 'created_at' : filters.sortBy;
    query = query.order(orderColumn, { ascending: filters.sortOrder === 'asc' });

    // Paginación
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    // Ejecutar query
    const { data: products, error, count } = await query;

    if (error) {
      handleSupabaseError(error, 'GET /api/products');
    }

    // Calcular información de paginación
    const totalPages = Math.ceil((count || 0) / filters.limit);

    const response: PaginatedResponse<ProductWithCategory> = {
      data: products || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages,
      },
      success: true,
      message: `${products?.length || 0} productos encontrados`,
    };

    return NextResponse.json(response);

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
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    
    // Validar datos del producto
    const productData = validateData(ProductSchema, body);
    
    const supabase = getSupabaseClient(true); // Usar cliente admin
    
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
