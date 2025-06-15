// ===================================
// PINTEYA E-COMMERCE - API DE ÓRDENES DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
// TODO: Reactivar cuando Clerk funcione
// import { auth } from '@clerk/nextjs';

// ===================================
// GET - Obtener órdenes del usuario
// ===================================
export async function GET(request: NextRequest) {
  try {
    // TODO: Reemplazar con autenticación real de Clerk
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const userId = 'demo-user-id';
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Obtener usuario primero
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      // Crear usuario demo si no existe
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            clerk_id: userId,
            email: 'usuario@demo.com',
            name: 'Usuario Demo',
          },
        ])
        .select('id')
        .single();

      if (createError) {
        console.error('Error al crear usuario demo:', createError);
        return NextResponse.json(
          { error: 'Error al obtener usuario' },
          { status: 500 }
        );
      }

      if (!newUser) {
        console.error('Error: newUser es null después de la inserción');
        return NextResponse.json(
          { error: 'Error al crear usuario' },
          { status: 500 }
        );
      }

      // Crear algunas órdenes demo para el usuario
      await createDemoOrders(newUser.id);

      // Usar el nuevo usuario
      user = newUser;
    }

    // Construir query base
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            images
          )
        )
      `)
      .eq('user_id', user.id);

    // Filtrar por status si se especifica
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Aplicar paginación y ordenamiento
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error al obtener órdenes:', error);
      return NextResponse.json(
        { error: 'Error al obtener órdenes' },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const { data: stats } = await supabaseAdmin
      .from('orders')
      .select('status, total')
      .eq('user_id', user.id);

    const statistics = {
      total_orders: stats?.length || 0,
      total_spent: stats?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0,
      pending_orders: stats?.filter(order => order.status === 'pending').length || 0,
      completed_orders: stats?.filter(order => order.status === 'delivered').length || 0,
    };

    return NextResponse.json({
      success: true,
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error('Error en GET /api/user/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// Función auxiliar para crear órdenes demo
// ===================================
async function createDemoOrders(userId: string) {
  if (!supabaseAdmin) return;

  try {
    // Obtener algunos productos para las órdenes demo
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .limit(5);

    if (!products || products.length === 0) return;

    // Crear órdenes demo
    const demoOrders = [
      {
        user_id: userId,
        total: 15000.00,
        status: 'delivered',
        payment_id: 'demo_payment_1',
        shipping_address: {
          name: 'Usuario Demo',
          street: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          postal_code: '1043',
          country: 'Argentina'
        }
      },
      {
        user_id: userId,
        total: 8500.00,
        status: 'shipped',
        payment_id: 'demo_payment_2',
        shipping_address: {
          name: 'Usuario Demo',
          street: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          postal_code: '1043',
          country: 'Argentina'
        }
      },
      {
        user_id: userId,
        total: 12300.00,
        status: 'pending',
        payment_id: 'demo_payment_3',
        shipping_address: {
          name: 'Usuario Demo',
          street: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          postal_code: '1043',
          country: 'Argentina'
        }
      }
    ];

    const { data: createdOrders } = await supabaseAdmin
      .from('orders')
      .insert(demoOrders)
      .select();

    // Crear items para cada orden
    if (createdOrders && products.length >= 2) {
      for (const order of createdOrders) {
        const orderItems = [
          {
            order_id: order.id,
            product_id: products[0].id,
            quantity: 2,
            price: products[0].price
          },
          {
            order_id: order.id,
            product_id: products[1].id,
            quantity: 1,
            price: products[1].price
          }
        ];

        await supabaseAdmin
          .from('order_items')
          .insert(orderItems);
      }
    }
  } catch (error) {
    console.error('Error al crear órdenes demo:', error);
  }
}
