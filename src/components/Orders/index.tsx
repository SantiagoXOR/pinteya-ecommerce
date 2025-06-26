import React, { useEffect, useState } from "react";
import SingleOrder from "./SingleOrder";
import { useUserOrders } from "@/hooks/useUserOrders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Filter, Calendar, DollarSign, Truck, CheckCircle, ShoppingBag } from "lucide-react";
// import ordersData from "./ordersData"; // Comentado: ahora usamos datos dinámicos

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Hook para obtener órdenes dinámicas
  const {
    orders,
    loading,
    error,
    pagination,
    statistics,
    fetchOrders,
    refreshOrders,
  } = useUserOrders(currentPage, statusFilter);

  // Manejar cambio de filtro de estado
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    fetchOrders(1, newStatus);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchOrders(newPage, statusFilter);
  };

  // Función para formatear moneda
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(parseFloat(amount));
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Filtros y estadísticas */}
      <div className="mb-6 bg-white rounded-lg shadow-1 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-dark">Mis Órdenes</h3>
            <p className="text-sm text-gray-600">
              Total: {statistics.total_orders} órdenes - {formatCurrency(statistics.total_spent.toString())} gastado
            </p>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
            >
              <option value="all">Todas las órdenes</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagadas</option>
              <option value="shipped">Enviadas</option>
              <option value="delivered">Entregadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <button
              onClick={refreshOrders}
              className="px-3 py-2 bg-tahiti-gold-500 text-white rounded-md text-sm hover:bg-tahiti-gold-600 focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[770px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tahiti-gold-500"></div>
              <span className="ml-3 text-gray-600">Cargando órdenes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <button
                onClick={refreshOrders}
                className="bg-tahiti-gold-500 text-white px-4 py-2 rounded hover:bg-tahiti-gold-600"
              >
                Reintentar
              </button>
            </div>
          ) : orders.length > 0 ? (
            <>
              {/* Header de la tabla */}
              <div className="items-center justify-between py-4.5 px-7.5 hidden md:flex bg-gray-50 rounded-t-lg">
                <div className="min-w-[111px]">
                  <p className="text-custom-sm text-dark font-semibold">Orden</p>
                </div>
                <div className="min-w-[175px]">
                  <p className="text-custom-sm text-dark font-semibold">Fecha</p>
                </div>
                <div className="min-w-[128px]">
                  <p className="text-custom-sm text-dark font-semibold">Estado</p>
                </div>
                <div className="min-w-[213px]">
                  <p className="text-custom-sm text-dark font-semibold">Productos</p>
                </div>
                <div className="min-w-[113px]">
                  <p className="text-custom-sm text-dark font-semibold">Total</p>
                </div>
                <div className="min-w-[113px]">
                  <p className="text-custom-sm text-dark font-semibold">Acción</p>
                </div>
              </div>

              {/* Lista de órdenes */}
              <div className="bg-white rounded-b-lg shadow-1">
                {orders.map((order, key) => (
                  <div key={order.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Vista desktop */}
                    <div className="items-center justify-between py-4.5 px-7.5 hidden md:flex">
                      <div className="min-w-[111px]">
                        <p className="text-sm font-medium text-dark">#{order.id}</p>
                      </div>
                      <div className="min-w-[175px]">
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="min-w-[128px]">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'delivered' ? 'Entregado' :
                           order.status === 'shipped' ? 'Enviado' :
                           order.status === 'paid' ? 'Pagado' :
                           order.status === 'pending' ? 'Pendiente' :
                           order.status === 'cancelled' ? 'Cancelado' :
                           order.status}
                        </span>
                      </div>
                      <div className="min-w-[213px]">
                        <p className="text-sm text-gray-600">
                          {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.order_items.slice(0, 2).map(item => item.products.name).join(', ')}
                          {order.order_items.length > 2 && '...'}
                        </p>
                      </div>
                      <div className="min-w-[113px]">
                        <p className="text-sm font-semibold text-dark">{formatCurrency(order.total)}</p>
                      </div>
                      <div className="min-w-[113px]">
                        <button className="text-tahiti-gold-600 hover:text-tahiti-gold-700 text-sm font-medium">
                          Ver detalles
                        </button>
                      </div>
                    </div>

                    {/* Vista mobile */}
                    <div className="p-4 md:hidden">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-dark">Orden #{order.id}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'delivered' ? 'Entregado' :
                           order.status === 'shipped' ? 'Enviado' :
                           order.status === 'paid' ? 'Pagado' :
                           order.status === 'pending' ? 'Pendiente' :
                           order.status === 'cancelled' ? 'Cancelado' :
                           order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-lg font-semibold text-dark">{formatCurrency(order.total)}</p>
                        </div>
                        <button className="text-tahiti-gold-600 hover:text-tahiti-gold-700 text-sm font-medium">
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm border rounded-md ${
                          currentPage === page
                            ? 'bg-tahiti-gold-500 text-white border-tahiti-gold-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-1">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes órdenes aún</h3>
                <p className="text-gray-600 mb-4">
                  Cuando realices tu primera compra, aparecerá aquí.
                </p>
                <a
                  href="/shop"
                  className="inline-block bg-tahiti-gold-500 text-white px-6 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
                >
                  Ir a la tienda
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;
