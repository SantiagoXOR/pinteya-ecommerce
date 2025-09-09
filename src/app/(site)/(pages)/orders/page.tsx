'use client';

import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  products: {
    id: number;
    name: string;
    images: string[];
  };
}

interface Order {
  id: number;
  external_reference: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'blue', icon: CheckCircle },
  processing: { label: 'Procesando', color: 'orange', icon: Package },
  shipped: { label: 'Enviado', color: 'purple', icon: Truck },
  delivered: { label: 'Entregado', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'red', icon: XCircle },
  returned: { label: 'Devuelto', color: 'gray', icon: RotateCcw },
  refunded: { label: 'Reembolsado', color: 'gray', icon: RotateCcw },
};

const paymentStatusConfig = {
  pending: { label: 'Pendiente', color: 'yellow' },
  paid: { label: 'Pagado', color: 'green' },
  failed: { label: 'Fallido', color: 'red' },
  refunded: { label: 'Reembolsado', color: 'gray' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/user/orders');
      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(data.data);
      } else {
        setError(data.error || 'Error al cargar órdenes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment' = 'order') => {
    const config = type === 'order' ? statusConfig : paymentStatusConfig;
    const statusInfo = config[status as keyof typeof config];
    
    if (!statusInfo) return null;

    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
        {type === 'order' && statusInfo.icon && (
          <statusInfo.icon className="w-3 h-3 mr-1" />
        )}
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tus órdenes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
            <button 
              onClick={fetchOrders}
              className="mt-4 bg-blaze-orange-600 text-white px-6 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Órdenes
          </h1>
          <p className="text-gray-600">
            Historial completo de tus compras
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes órdenes aún
            </h3>
            <p className="text-gray-600 mb-6">
              Cuando realices tu primera compra, aparecerá aquí
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 transition-colors"
            >
              Comenzar a comprar
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header de la orden */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Orden #{order.external_reference}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(order.payment_status, 'payment')}
                      {getStatusBadge(order.status, 'order')}
                    </div>
                  </div>
                </div>

                {/* Items de la orden */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {item.products.images && item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.products.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ${parseFloat(item.price).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer de la orden */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-semibold text-gray-900">
                        ${parseFloat(order.total).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/api/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalles
                      </Link>
                      {order.status === 'delivered' && (
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 transition-colors">
                          Volver a comprar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
