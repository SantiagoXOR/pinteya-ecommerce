// ===================================
// PINTEYA E-COMMERCE - HOOK PARA DASHBOARD DE USUARIO
// ===================================

import { useState, useEffect } from 'react';
import { UserProfile } from './useUserProfile';
import { UserAddress } from './useUserAddresses';
import { UserOrder } from './useUserOrders';

export interface DashboardStatistics {
  total_orders: number;
  total_spent: number;
  pending_orders: number;
  completed_orders: number;
  shipped_orders: number;
  total_addresses: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface TopProduct {
  product: {
    name: string;
    images: any;
    price: string;
  };
  total_quantity: number;
  total_orders: number;
}

export interface DashboardData {
  user: UserProfile;
  statistics: DashboardStatistics;
  recent_orders: UserOrder[];
  monthly_spending: MonthlySpending[];
  top_products: TopProduct[];
  addresses: UserAddress[];
}

export interface UseUserDashboardReturn {
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => void;
}

export function useUserDashboard(): UseUserDashboardReturn {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los datos del dashboard
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener datos del dashboard');
      }

      if (data.success) {
        setDashboard(data.dashboard);
      } else {
        throw new Error('Error al obtener datos del dashboard');
      }
    } catch (err) {
      console.error('Error en useUserDashboard:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar el dashboard
  const refreshDashboard = () => {
    fetchDashboard();
  };

  // Cargar dashboard al montar el componente
  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboard,
    loading,
    error,
    refreshDashboard,
  };
}
