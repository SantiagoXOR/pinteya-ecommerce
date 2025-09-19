// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTO INDIVIDUAL
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase';
import { validateData, ProductSchema } from '@/lib/validations';
import { ApiResponse, ProductWithCategory } from '@/types/api';

// ===================================
// GET /api/products/[id] - Obtener producto por ID
// ===================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Validar parámetro ID
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const supabase = getSupabaseClient();

    // Verificar que el cliente de Supabase esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/products/[id]');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Obtener producto con categoría
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, price, discounted_price, brand, stock, images, created_at, updated_at,
        category:categories(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const notFoundResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Producto no encontrado',
        };
        return NextResponse.json(notFoundResponse, { status: 404 });
      }
      handleSupabaseError(error, `GET /api/products/${id}`);
    }

    const response: ApiResponse<ProductWithCategory> = {
      data: product,
      success: true,
      message: 'Producto obtenido exitosamente',
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en GET /api/products/[id]:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// PUT /api/products/[id] - Actualizar producto (Admin)
// ===================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    // Validar parámetro ID
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validar datos del producto (permitir actualizaciones parciales)
    const productData = validateData(ProductSchema.partial(), body);
    
    const supabase = getSupabaseClient(true); // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en PUT /api/products/[id]');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Actualizar producto
    const { data: product, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const notFoundResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Producto no encontrado',
        };
        return NextResponse.json(notFoundResponse, { status: 404 });
      }
      handleSupabaseError(error, `PUT /api/products/${id}`);
    }

    const response: ApiResponse<ProductWithCategory> = {
      data: product,
      success: true,
      message: 'Producto actualizado exitosamente',
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en PUT /api/products/[id]:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// DELETE /api/products/[id] - Eliminar producto (Admin)
// ===================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // TODO: Verificar permisos de administrador
    // const { userId } = auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    // Validar parámetro ID
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const supabase = getSupabaseClient(true); // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en DELETE /api/products/[id]');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Eliminar producto
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      handleSupabaseError(error, `DELETE /api/products/${id}`);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Producto eliminado exitosamente',
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en DELETE /api/products/[id]:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
