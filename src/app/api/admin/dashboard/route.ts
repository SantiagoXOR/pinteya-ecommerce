// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - ADMIN DASHBOARD API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/lib/auth/config';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter';
import { createSecurityLogger } from '@/lib/logging/security-logger';
import { withTimeout, ENDPOINT_TIMEOUTS } from '@/lib/config/api-timeouts';

// ===================================
// CONFIGURACIÓN DE RATE LIMITING
// ===================================

const DASHBOARD_RATE_LIMITS = {
  dashboard: { requests: 30, window: 60 * 1000 }, // 30 requests per minute
};

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const DashboardFiltersSchema = z.object({
  period: z.enum(['today', '7days', '30days', '90days', 'year']).optional().default('30days'),
  timezone: z.string().optional().default('America/Argentina/Buenos_Aires'),
  include_comparisons: z.boolean().optional().default(true),
  metrics: z.array(z.enum([
    'sales', 'orders', 'customers', 'products', 'categories', 
    'inventory', 'revenue', 'conversion', 'traffic', 'performance'
  ])).optional()
});

// ===================================
// TIPOS DE DATOS
// ===================================

interface DashboardMetrics {
  overview: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
    conversion_rate: number;
    average_order_value: number;
  };
  sales: {
    current_period: number;
    previous_period: number;
    growth_percentage: number;
    daily_sales: Array<{ date: string; amount: number; orders: number }>;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    recent_orders: Array<{
      id: string;
      customer_name: string;
      total: number;
      status: string;
      created_at: string;
    }>;
  };
  customers: {
    total: number;
    new_this_period: number;
    active_customers: number;
    top_customers: Array<{
      id: string;
      name: string;
      email: string;
      total_orders: number;
      total_spent: number;
    }>;
  };
  products: {
    total: number;
    active: number;
    low_stock: number;
    out_of_stock: number;
    top_selling: Array<{
      id: string;
      name: string;
      sales_count: number;
      revenue: number;
    }>;
  };
  inventory: {
    total_value: number;
    low_stock_alerts: number;
    categories_count: number;
    average_stock_level: number;
  };
  performance: {
    page_load_time: number;
    api_response_time: number;
    error_rate: number;
    uptime_percentage: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    period: string;
    timezone: string;
    cache_duration?: number;
  };
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function validateAdminAuth() {
  try {
    // En desarrollo, permitir acceso sin autenticación
    if (process.env.NODE_ENV === 'development') {
      logger.log(LogLevel.WARN, LogCategory.AUTH, 'Admin auth bypassed in development mode');
      return { userId: 'dev-admin', email: 'dev@admin.com' };
    }

    const session = await auth();
    if (!session?.user?.email) {
      throw new Error('No authenticated session found');
    }

    // Verificar si el usuario es admin
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('role, permissions')
      .eq('email', session.user.email)
      .single();

    if (error || !profile) {
      throw new Error('User profile not found');
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      throw new Error('Insufficient permissions');
    }

    return { userId: session.user.id, email: session.user.email };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Admin authentication failed', { error });
    throw error;
  }
}

async function getDashboardMetrics(period: string, timezone: string): Promise<DashboardMetrics> {
  try {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    // Calcular fechas según el período
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Obtener métricas de órdenes
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at, customer_id')
      .gte('created_at', startDate.toISOString());

    const { data: previousOrdersData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    // Obtener métricas de productos
    const { data: productsData } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock_quantity, is_active');

    // Obtener métricas de clientes
    const { data: customersData } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'customer');

    // Obtener categorías
    const { data: categoriesData } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('is_active', true);

    // Calcular métricas
    const currentRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const previousRevenue = previousOrdersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const totalOrders = ordersData?.length || 0;
    const averageOrderValue = totalOrders > 0 ? currentRevenue / totalOrders : 0;

    const totalProducts = productsData?.length || 0;
    const activeProducts = productsData?.filter(p => p.is_active)?.length || 0;
    const lowStockProducts = productsData?.filter(p => (p.stock_quantity || 0) < 10)?.length || 0;
    const outOfStockProducts = productsData?.filter(p => (p.stock_quantity || 0) === 0)?.length || 0;

    const totalCustomers = customersData?.length || 0;
    const newCustomers = customersData?.filter(c => 
      new Date(c.created_at) >= startDate
    )?.length || 0;

    // Agrupar órdenes por estado
    const ordersByStatus = ordersData?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Ventas diarias
    const dailySales = ordersData?.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0, orders: 0 };
      }
      acc[date].amount += order.total || 0;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; orders: number }>) || {};

    // Órdenes recientes
    const recentOrders = ordersData
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      ?.slice(0, 10)
      ?.map(order => ({
        id: order.id,
        customer_name: 'Cliente', // Se podría obtener del perfil
        total: order.total || 0,
        status: order.status,
        created_at: order.created_at
      })) || [];

    const metrics: DashboardMetrics = {
      overview: {
        total_revenue: currentRevenue,
        total_orders: totalOrders,
        total_customers: totalCustomers,
        total_products: totalProducts,
        conversion_rate: 2.5, // Placeholder - se calcularía con datos de tráfico
        average_order_value: averageOrderValue
      },
      sales: {
        current_period: currentRevenue,
        previous_period: previousRevenue,
        growth_percentage: revenueGrowth,
        daily_sales: Object.values(dailySales)
      },
      orders: {
        total: totalOrders,
        pending: ordersByStatus['pending'] || 0,
        processing: ordersByStatus['processing'] || 0,
        shipped: ordersByStatus['shipped'] || 0,
        delivered: ordersByStatus['delivered'] || 0,
        cancelled: ordersByStatus['cancelled'] || 0,
        recent_orders: recentOrders
      },
      customers: {
        total: totalCustomers,
        new_this_period: newCustomers,
        active_customers: Math.floor(totalCustomers * 0.3), // Placeholder
        top_customers: [] // Se podría calcular con datos de órdenes
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        low_stock: lowStockProducts,
        out_of_stock: outOfStockProducts,
        top_selling: [] // Se podría calcular con datos de ventas
      },
      inventory: {
        total_value: productsData?.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0) || 0,
        low_stock_alerts: lowStockProducts,
        categories_count: categoriesData?.length || 0,
        average_stock_level: totalProducts > 0 ? 
          (productsData?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0) / totalProducts : 0
      },
      performance: {
        page_load_time: 1.2, // Placeholder - se obtendría de métricas reales
        api_response_time: 0.3, // Placeholder
        error_rate: 0.1, // Placeholder
        uptime_percentage: 99.9 // Placeholder
      }
    };

    return metrics;
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error getting dashboard metrics', { error });
    throw error;
  }
}

async function logAuditAction(adminUserId: string, action: string, details?: any) {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: adminUserId,
        action,
        resource_type: 'dashboard',
        details: details || {},
        ip_address: '127.0.0.1', // Se obtendría del request
        user_agent: 'Admin Dashboard'
      });
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUDIT, 'Error logging audit action', { error });
  }
}

// ===================================
// HANDLERS DE LA API
// ===================================

export async function GET(request: NextRequest) {
  // Aplicar rate limiting para APIs administrativos
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.admin,
    async () => {
      // Crear logger de seguridad
      const securityLogger = createSecurityLogger(request);
      const startTime = Date.now();
      let adminUserId = '';

      try {
        // Log del acceso al dashboard administrativo
        securityLogger.logApiAccess(securityLogger.context, 'admin/dashboard', 'read');

        // Autenticación con timeout
        const authResult = await withTimeout(
          () => validateAdminAuth(),
          ENDPOINT_TIMEOUTS['/api/admin']?.request || 30000,
          'Validación de autenticación de admin'
        );
        adminUserId = authResult.userId;

        // Validar parámetros
        const { searchParams } = new URL(request.url);
        const validationResult = DashboardFiltersSchema.safeParse({
          period: searchParams.get('period'),
          timezone: searchParams.get('timezone'),
          include_comparisons: searchParams.get('include_comparisons') === 'true',
          metrics: searchParams.get('metrics')?.split(',') || undefined
        });

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid parameters',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const { period, timezone, include_comparisons } = validationResult.data;

        // Obtener métricas del dashboard con timeout
        const metrics = await withTimeout(
          () => getDashboardMetrics(period, timezone),
          ENDPOINT_TIMEOUTS['/api/admin']?.request || 30000,
          'Obtención de métricas del dashboard'
        );

        // Métricas de rendimiento
        const responseTime = Date.now() - startTime;
        metricsCollector.recordApiCall('admin_dashboard_get', responseTime, 'success');

        // Log de seguridad para acceso exitoso
        securityLogger.logAdminAction(securityLogger.context, 'dashboard_view', {
          period,
          timezone,
          include_comparisons,
          responseTime
        });

        // Audit log
        await logAuditAction(adminUserId, 'dashboard_view', {
          period,
          timezone,
          include_comparisons
        });

        const response: ApiResponse<DashboardMetrics> = {
          success: true,
          data: metrics,
          metadata: {
            timestamp: new Date().toISOString(),
            period,
            timezone,
            cache_duration: 300 // 5 minutos
          }
        };

        return NextResponse.json(response);

      } catch (error) {
        const responseTime = Date.now() - startTime;
        metricsCollector.recordApiCall('admin_dashboard_get', responseTime, 'error');

        // Log del error de seguridad
        securityLogger.logApiError(securityLogger.context, error as Error, {
          endpoint: '/api/admin/dashboard',
          method: 'GET',
          adminUserId,
          responseTime
        });

        logger.log(LogLevel.ERROR, LogCategory.API, 'Dashboard API error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          adminUserId,
          stack: error instanceof Error ? error.stack : undefined
        });

        if (error instanceof Error && error.message.includes('authentication')) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        if (error instanceof Error && error.message.includes('permissions')) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );

  return rateLimitResult;
}










