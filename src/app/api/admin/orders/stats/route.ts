import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/orders/stats
 * Obtener estadísticas de órdenes desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await requireAdminAuth();

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Obtener estadísticas de órdenes
    const [totalResult, pendingResult, completedResult, todayResult] = await Promise.all([
      // Total de órdenes
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
      // Órdenes pendientes
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed', 'processing']),
      // Órdenes completadas
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true })
        .eq('status', 'delivered'),
      // Órdenes de hoy
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0])
    ]);

    const stats = {
      total_orders: totalResult.count || 0,
      pending_orders: pendingResult.count || 0,
      completed_orders: completedResult.count || 0,
      today_orders: todayResult.count || 0
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de órdenes:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        data: {
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          today_orders: 0
        }
      },
      { status: 500 }
    );
  }
}
