// ===================================
// PINTEYA E-COMMERCE - API DE CATEGORÍAS
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, handleSupabaseError } from '@/lib/supabase';
import { validateData, CategoryFiltersSchema, CategorySchema } from '@/lib/validations';
import { ApiResponse } from '@/types/api';
import { Category } from '@/types/database';

// ===================================
// GET /api/categories - Obtener categorías
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de query
    const queryParams = {
      search: searchParams.get('search') || undefined,
    };

    // Validar parámetros (simplificado para la estructura actual)
    const filters = {
      search: queryParams.search,
    };
    
    const supabase = getSupabaseClient();
    
    // Construir query base - simplificado para la estructura actual
    let query = supabase
      .from('categories')
      .select(`
        *,
        products_count:products(count)
      `)
      .order('name');

    // Aplicar filtros
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Ejecutar query
    const { data: categories, error } = await query;

    if (error) {
      console.error('Error en GET /api/categories:', error);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error obteniendo categorías',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Procesar datos para incluir conteo de productos
    const processedCategories = categories?.map(category => ({
      ...category,
      products_count: category.products_count?.[0]?.count || 0,
    })) || [];

    const response: ApiResponse<Category[]> = {
      data: processedCategories,
      success: true,
      message: `${processedCategories.length} categorías encontradas`,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en GET /api/categories:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST /api/categories - Crear categoría (Admin)
// ===================================
export async function POST(request: NextRequest) {
  try {
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    
    // Validar datos de la categoría
    const categoryData = validateData(CategorySchema, body);
    
    const supabase = getSupabaseClient(true); // Usar cliente admin
    
    // Crear slug si no se proporciona
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Insertar categoría
    const { data: category, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'POST /api/categories');
    }

    const response: ApiResponse<Category> = {
      data: category,
      success: true,
      message: 'Categoría creada exitosamente',
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/categories:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}


