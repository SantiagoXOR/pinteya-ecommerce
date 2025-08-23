import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  noStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalUsers: number;
  activeUsers: number;
}

interface QuickStat {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
}

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // NextAuth.js maneja las cookies de sesión automáticamente
      // No necesitamos obtener token manualmente

      // Hacer requests paralelos a diferentes APIs (con manejo de errores individual)
      const [productsResponse, ordersResponse, usersResponse] = await Promise.allSettled([
        fetch('/api/admin/products/stats', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch('/api/admin/orders/stats', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch('/api/admin/users/stats', {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ]);

      // Procesar respuesta de productos
      let productStats = {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        noStockProducts: 0
      };

      if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
        const data = await productsResponse.value.json();
        if (data.success && data.stats) {
          productStats = {
            totalProducts: data.stats.total_products || 0,
            activeProducts: data.stats.active_products || 0,
            lowStockProducts: data.stats.low_stock_products || 0,
            noStockProducts: data.stats.no_stock_products || 0
          };
        }
      }

      // Procesar respuesta de órdenes (con fallback si no existe la API)
      let orderStats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0
      };

      if (ordersResponse.status === 'fulfilled' && ordersResponse.value.ok) {
        const data = await ordersResponse.value.json();
        if (data.success && data.stats) {
          orderStats = {
            totalOrders: data.stats.total_orders || 0,
            pendingOrders: data.stats.pending_orders || 0,
            completedOrders: data.stats.completed_orders || 0,
            totalRevenue: data.stats.total_revenue || 0,
            todayRevenue: data.stats.today_revenue || 0
          };
        }
      }

      // Procesar respuesta de usuarios (con fallback si no existe la API)
      let userStats = {
        totalUsers: 0,
        activeUsers: 0
      };

      if (usersResponse.status === 'fulfilled' && usersResponse.value.ok) {
        const data = await usersResponse.value.json();
        if (data.success && data.stats) {
          userStats = {
            totalUsers: data.stats.total_users || 0,
            activeUsers: data.stats.active_users || 0
          };
        }
      }

      // Combinar todas las estadísticas
      const combinedStats: DashboardStats = {
        ...productStats,
        ...orderStats,
        ...userStats
      };

      setStats(combinedStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';

      // No establecer error inmediatamente, intentar fallback primero
      console.log('Intentando fallback con API pública de productos...');

      // Fallback: obtener estadísticas básicas directamente de la API pública
      try {
        const response = await fetch('/api/products', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const products = data.data || [];

          const totalProducts = products.length;
          const withStock = products.filter((p: any) => p.stock && p.stock > 0).length;
          const lowStock = products.filter((p: any) => p.stock && p.stock > 0 && p.stock <= 10).length;
          const noStock = products.filter((p: any) => !p.stock || p.stock === 0).length;

          setStats({
            totalProducts,
            activeProducts: withStock,
            lowStockProducts: lowStock,
            noStockProducts: noStock,
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            todayRevenue: 0,
            totalUsers: 0,
            activeUsers: 0
          });

          // Solo mostrar warning, no error completo
          setError(`Usando datos básicos: ${errorMessage}`);
          console.log('Fallback exitoso con API pública');
        } else {
          console.warn('API pública falló, usando datos estáticos');
          // Fallback final con datos conocidos
          setStats({
            totalProducts: 53,
            activeProducts: 53,
            lowStockProducts: 4,
            noStockProducts: 0,
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            todayRevenue: 0,
            totalUsers: 0,
            activeUsers: 0
          });
          setError(`Usando datos estáticos: ${errorMessage}`);
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        // Fallback final con datos estáticos
        setStats({
          totalProducts: 53,
          activeProducts: 53,
          lowStockProducts: 4,
          noStockProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          totalUsers: 0,
          activeUsers: 0
        });
        setError(`Fallback completo falló: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number): { value: string; type: 'positive' | 'negative' | 'neutral' } => {
    if (previous === 0) {
      return { value: '+100%', type: 'positive' };
    }
    
    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);
    
    if (absChange < 1) {
      return { value: '0%', type: 'neutral' };
    }
    
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      type: change > 0 ? 'positive' : 'negative'
    };
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardStats,
    formatCurrency,
    calculateChange
  };
}
