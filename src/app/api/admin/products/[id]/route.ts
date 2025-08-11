import { NextRequest, NextResponse } from 'next/server';
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth';
import { z } from 'zod';

// Validation schemas
const UpdateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor a 0').optional(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  category_id: z.string().uuid('ID de categoría inválido').optional(),
  image_url: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
});

// Helper function to check admin permissions for specific actions
async function checkAdminPermissionsForProduct(action: 'read' | 'update' | 'delete', request?: NextRequest) {
  return await checkCRUDPermissions('products', action, request);
}

// Helper function to get product by ID
async function getProductById(supabase: any, productId: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
      status,
      created_at,
      updated_at,
      categories (
        id,
        name
      )
    `)
    .eq('id', productId)
    .single();

  if (error) {
    return { error: 'Producto no encontrado', status: 404 };
  }

  // Transform response
  const transformedProduct = {
    ...product,
    category_name: product.categories?.name || null,
    categories: undefined,
  };

  return { product: transformedProduct };
}

/**
 * GET /api/admin/products/[id]
 * Obtener producto específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissionsForProduct('read', request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;
    const productId = params.id;

    // Validate product ID format
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const result = await getProductById(supabase, productId);
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      data: result.product
    });

  } catch (error) {
    console.error('Error in GET /api/admin/products/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]
 * Actualizar producto específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissionsForProduct('update', request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;
    const productId = params.id;
    const body = await request.json();

    // Validate product ID format
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    // Validate request body
    const updateData = UpdateProductSchema.parse(body);

    // Check if product exists
    const existingResult = await getProductById(supabase, productId);
    if ('error' in existingResult) {
      return NextResponse.json(
        { error: existingResult.error },
        { status: existingResult.status }
      );
    }

    // Verify category exists if category_id is being updated
    if (updateData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', updateData.category_id)
        .single();

      if (categoryError || !category) {
        return NextResponse.json(
          { error: 'Categoría no encontrada' },
          { status: 400 }
        );
      }
    }

    // Update product
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select(`
        id,
        name,
        description,
        price,
        stock,
        category_id,
        image_url,
        status,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Error al actualizar producto' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedProduct = {
      ...updatedProduct,
      category_name: updatedProduct.categories?.name || null,
      categories: undefined,
    };

    return NextResponse.json({
      message: 'Producto actualizado exitosamente',
      data: transformedProduct
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/products/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
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
 * DELETE /api/admin/products/[id]
 * Eliminar producto específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissionsForProduct('delete', request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { supabase } = authResult;
    const productId = params.id;

    // Validate product ID format
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingResult = await getProductById(supabase, productId);
    if ('error' in existingResult) {
      return NextResponse.json(
        { error: existingResult.error },
        { status: existingResult.status }
      );
    }

    // Check if product is referenced in orders (optional business rule)
    const { data: orderItems, error: orderCheckError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (orderCheckError) {
      console.error('Error checking order references:', orderCheckError);
      // Continue with deletion even if check fails
    }

    if (orderItems && orderItems.length > 0) {
      // Instead of hard delete, mark as inactive
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error marking product as inactive:', updateError);
        return NextResponse.json(
          { error: 'Error al eliminar producto' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Producto marcado como inactivo (tiene órdenes asociadas)',
        soft_delete: true
      });
    }

    // Hard delete if no order references
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Error al eliminar producto' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/products/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
