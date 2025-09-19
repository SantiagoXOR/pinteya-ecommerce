// ===================================
// PINTEYA E-COMMERCE - HOOK PARA ÓRDENES DE USUARIO
// ===================================

import { useState, useEffect } from 'react';

export interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  products: {
    id: number;
    name: string;
    images: any;
  };
}

export interface UserOrder {
  id: number;
  user_id: string;
  total: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_id: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderStatistics {
  total_orders: number;
  total_spent: number;
  pending_orders: number;
  completed_orders: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UseUserOrdersReturn {
  orders: UserOrder[];
  loading: boolean;
  error: string | null;
  pagination: OrderPagination;
  statistics: OrderStatistics;
  fetchOrders: (page?: number, status?: string) => void;
  refreshOrders: () => void;
}

export function useUserOrders(initialPage = 1, initialStatus = 'all'): UseUserOrdersReturn {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<OrderPagination>({
    page: initialPage,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [statistics, setStatistics] = useState<OrderStatistics>({
    total_orders: 0,
    total_spent: 0,
    pending_orders: 0,
    completed_orders: 0,
  });

  // Función para obtener las órdenes
  const fetchOrders = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (status && status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/user/orders?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener órdenes');
      }

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
        setStatistics(data.statistics);
      } else {
        throw new Error('Error al obtener órdenes');
      }
    } catch (err) {
      console.error('Error en useUserOrders:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar las órdenes
  const refreshOrders = () => {
    fetchOrders(pagination.page, initialStatus);
  };

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchOrders(initialPage, initialStatus);
  }, [initialPage, initialStatus]);

  return {
    orders,
    loading,
    error,
    pagination,
    statistics,
    fetchOrders,
    refreshOrders,
  };
}









