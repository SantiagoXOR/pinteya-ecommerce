import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/products/stats
 * Obtener estadísticas reales de productos desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Crear cliente de Supabase con service role para operaciones admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Error interno en validación de origen' },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obtener estadísticas usando una sola query optimizada
    const { data: stats, error } = await supabase.rpc('get_product_stats');

    if (error) {
      console.error('Error obteniendo estadísticas de productos:', error);
      
      // Fallback: calcular estadísticas manualmente
      const [totalResult, activeResult, lowStockResult, noStockResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0),
        supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 10),
        supabase.from('products').select('id', { count: 'exact', head: true }).or('stock.eq.0,stock.is.null')
      ]);

      const fallbackStats = {
        total_products: totalResult.count || 0,
        active_products: activeResult.count || 0,
        low_stock_products: lowStockResult.count || 0,
        no_stock_products: noStockResult.count || 0
      };

      return NextResponse.json({
        success: true,
        stats: fallbackStats,
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    const productStats = stats?.[0] || {
      total_products: 0,
      active_products: 0,
      low_stock_products: 0,
      no_stock_products: 0
    };

    return NextResponse.json({
      success: true,
      stats: productStats,
      source: 'database_function',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en GET /api/admin/products/stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
