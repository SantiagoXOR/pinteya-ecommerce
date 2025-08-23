// ===================================
// PINTEYA E-COMMERCE - API DE DASHBOARD DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { ApiResponse } from '@/types/api';

// ===================================
// GET - Obtener estadísticas del dashboard
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/dashboard');
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Autenticación con Clerk
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener estadísticas de órdenes
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at')
      .eq('user_id', user.id);

    // Obtener órdenes recientes con detalles
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        order_items (
          quantity,
          products (
            name,
            images
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Obtener direcciones
    const { data: addresses } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id);

    // Calcular estadísticas
    const totalOrders = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
    const completedOrders = orders?.filter(order => order.status === 'delivered').length || 0;
    const shippedOrders = orders?.filter(order => order.status === 'shipped').length || 0;

    // Calcular gasto por mes (últimos 6 meses)
    const monthlySpending = calculateMonthlySpending(orders || []);

    // Productos más comprados
    const { data: topProducts } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products (
          name,
          images,
          price
        )
      `)
      .in('order_id', orders?.map(o => o.id) || []);

    const productStats = calculateTopProducts(topProducts || []);

    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      statistics: {
        total_orders: totalOrders,
        total_spent: totalSpent,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        shipped_orders: shippedOrders,
        total_addresses: addresses?.length || 0,
      },
      recent_orders: recentOrders || [],
      monthly_spending: monthlySpending,
      top_products: productStats,
      addresses: addresses || [],
    };

    return NextResponse.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error('Error en GET /api/user/dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// Función auxiliar para calcular gasto mensual
// ===================================
function calculateMonthlySpending(orders: any[]) {
  const monthlyData: { [key: string]: number } = {};
  const now = new Date();

  // Inicializar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  // Sumar gastos por mes
  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.hasOwnProperty(key)) {
      monthlyData[key] += parseFloat(order.total);
    }
  });

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }));
}

// ===================================
// Función auxiliar para calcular productos más comprados
// ===================================
function calculateTopProducts(orderItems: any[]) {
  const productMap: { [key: string]: any } = {};

  orderItems.forEach(item => {
    const productId = item.product_id;
    if (!productMap[productId]) {
      productMap[productId] = {
        product: item.products,
        total_quantity: 0,
        total_orders: 0,
      };
    }
    productMap[productId].total_quantity += item.quantity;
    productMap[productId].total_orders += 1;
  });

  return Object.values(productMap)
    .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
    .slice(0, 5);
}
