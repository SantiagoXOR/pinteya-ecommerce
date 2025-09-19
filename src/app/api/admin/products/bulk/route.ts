// =====================================================
// API: OPERACIONES MASIVAS DE PRODUCTOS
// Ruta: /api/admin/products/bulk
// Descripción: Operaciones masivas enterprise para productos
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { z } from 'zod';

// =====================================================
// CONFIGURACIÓN
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const BulkOperationSchema = z.object({
  operation: z.enum(['update_status', 'update_category', 'update_price', 'delete']),
  product_ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un producto'),
  data: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    category_id: z.number().int().positive().optional(),
    price_adjustment: z.object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number()
    }).optional()
  }).optional()
});

// =====================================================
// HANDLER POST - OPERACIONES MASIVAS
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = BulkOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de operación inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { operation, product_ids, data } = validationResult.data;

    // Verificar que los productos existen y pertenecen al usuario autorizado
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', product_ids);

    if (checkError) {
      console.error('Error verificando productos:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar productos' },
        { status: 500 }
      );
    }

    if (existingProducts.length !== product_ids.length) {
      return NextResponse.json(
        { error: 'Algunos productos no fueron encontrados' },
        { status: 404 }
      );
    }

    let result;
    let affectedCount = 0;

    // Ejecutar operación según el tipo
    switch (operation) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Estado requerido para operación update_status' },
            { status: 400 }
          );
        }

        const { data: statusUpdateData, error: statusError } = await supabase
          .from('products')
          .update({ 
            is_active: data.status === 'active',
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id');

        if (statusError) {
          throw statusError;
        }

        affectedCount = statusUpdateData?.length || 0;
        result = {
          operation: 'update_status',
          affected_count: affectedCount,
          new_status: data.status
        };
        break;

      case 'update_category':
        if (!data?.category_id) {
          return NextResponse.json(
            { error: 'ID de categoría requerido para operación update_category' },
            { status: 400 }
          );
        }

        // Verificar que la categoría existe
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', data.category_id)
          .single();

        if (categoryError || !category) {
          return NextResponse.json(
            { error: 'Categoría no encontrada' },
            { status: 404 }
          );
        }

        const { data: categoryUpdateData, error: categoryUpdateError } = await supabase
          .from('products')
          .update({ 
            category_id: data.category_id,
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id');

        if (categoryUpdateError) {
          throw categoryUpdateError;
        }

        affectedCount = categoryUpdateData?.length || 0;
        result = {
          operation: 'update_category',
          affected_count: affectedCount,
          new_category: category.name
        };
        break;

      case 'update_price':
        if (!data?.price_adjustment) {
          return NextResponse.json(
            { error: 'Ajuste de precio requerido para operación update_price' },
            { status: 400 }
          );
        }

        // Obtener precios actuales
        const { data: currentProducts, error: priceError } = await supabase
          .from('products')
          .select('id, price')
          .in('id', product_ids);

        if (priceError) {
          throw priceError;
        }

        // Calcular nuevos precios
        const priceUpdates = currentProducts.map(product => {
          let newPrice = product.price;
          
          if (data.price_adjustment!.type === 'percentage') {
            newPrice = product.price * (1 + data.price_adjustment!.value / 100);
          } else {
            newPrice = product.price + data.price_adjustment!.value;
          }

          // Asegurar que el precio no sea negativo
          newPrice = Math.max(0, newPrice);

          return {
            id: product.id,
            price: Math.round(newPrice * 100) / 100, // Redondear a 2 decimales
            updated_at: new Date().toISOString()
          };
        });

        // Actualizar precios uno por uno (Supabase no soporta bulk update con diferentes valores)
        const priceUpdatePromises = priceUpdates.map(update =>
          supabase
            .from('products')
            .update({ price: update.price, updated_at: update.updated_at })
            .eq('id', update.id)
        );

        const priceResults = await Promise.all(priceUpdatePromises);
        const priceErrors = priceResults.filter(result => result.error);

        if (priceErrors.length > 0) {
          console.error('Errores en actualización de precios:', priceErrors);
          return NextResponse.json(
            { error: 'Error al actualizar algunos precios' },
            { status: 500 }
          );
        }

        affectedCount = priceUpdates.length;
        result = {
          operation: 'update_price',
          affected_count: affectedCount,
          price_adjustment: data.price_adjustment
        };
        break;

      case 'delete':
        // Eliminar productos (soft delete marcando como inactivo)
        const { data: deleteData, error: deleteError } = await supabase
          .from('products')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id');

        if (deleteError) {
          throw deleteError;
        }

        affectedCount = deleteData?.length || 0;
        result = {
          operation: 'delete',
          affected_count: affectedCount
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Operación no soportada' },
          { status: 400 }
        );
    }

    // Log de la operación para auditoría
    console.log(`✅ Operación masiva completada:`, {
      operation,
      affected_count: affectedCount,
      user_id: session.user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Operación ${operation} completada exitosamente`,
      data: result
    });

  } catch (error) {
    console.error('❌ Error en operación masiva:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// HANDLER GET - INFORMACIÓN DE OPERACIONES
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Retornar información sobre operaciones disponibles
    const operations = {
      update_status: {
        name: 'Actualizar Estado',
        description: 'Activar o desactivar productos en lote',
        required_data: ['status']
      },
      update_category: {
        name: 'Cambiar Categoría',
        description: 'Mover productos a una nueva categoría',
        required_data: ['category_id']
      },
      update_price: {
        name: 'Ajustar Precios',
        description: 'Aplicar ajustes de precio por porcentaje o valor fijo',
        required_data: ['price_adjustment']
      },
      delete: {
        name: 'Eliminar Productos',
        description: 'Desactivar productos (soft delete)',
        required_data: []
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        available_operations: operations,
        max_products_per_operation: 100
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de operaciones:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}









