"use client";

// ===================================
// PINTEYA E-COMMERCE - SIMPLE ORDER LIST
// Componente simplificado para mostrar órdenes sin problemas de Fast Refresh
// ===================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ===================================
// TIPOS
// ===================================

interface SimpleOrder {
  id: number;
  status: string;
  total: number;
  created_at: string;
  external_reference?: string;
  payer_info?: {
    name: string;
    email: string;
    phone?: string;
    surname?: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
  };
  order_items?: Array<{
    quantity: number;
    price: number;
    products: {
      name: string;
    };
  }>;
}

interface SimpleOrdersResponse {
  success: boolean;
  data: {
    orders: SimpleOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    analytics: {
      total_orders: number;
      pending_orders: number;
      completed_orders: number;
      total_revenue: number;
      today_revenue: number;
    };
  };
}

// ===================================
// PROPS INTERFACE
// ===================================

interface OrderListSimpleProps {
  onViewOrder?: (orderId: number) => void;
  onEditOrder?: (orderId: number) => void;
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export function OrderListSimple({ onViewOrder, onEditOrder }: OrderListSimpleProps = {}) {
  const [orders, setOrders] = useState<SimpleOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);

  // Estados para filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // ===================================
  // FUNCIÓN DE CARGA DE ÓRDENES
  // ===================================

  const loadOrders = async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      // Construir URL con filtros
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (searchTerm) {params.append('search', searchTerm);}
      if (statusFilter !== 'all') {params.append('status', statusFilter);}

      const url = `/api/admin/orders?${params.toString()}`;
      console.log('🚀 [OrderListSimple] Fetching orders from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('📡 [OrderListSimple] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SimpleOrdersResponse = await response.json();
      console.log('✅ [OrderListSimple] Data received:', {
        success: data.success,
        ordersCount: data.data?.orders?.length,
        total: data.data?.pagination?.total
      });

      if (data.success && data.data) {
        setOrders(data.data.orders);
        setAnalytics(data.data.analytics);
        setPagination(data.data.pagination);
        
        setCurrentPage(page);

        toast({
          title: "Órdenes cargadas",
          description: `Se cargaron ${data.data.orders.length} órdenes de ${data.data.pagination.total} totales`,
        });
      } else {
        throw new Error('Respuesta de API inválida');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [OrderListSimple] Error loading orders:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Error al cargar órdenes",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadOrders();
  }, []);

  // ===================================
  // FUNCIONES DE UTILIDAD
  // ===================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {return 'Fecha no disponible';}

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {return 'Fecha inválida';}

      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateString:', dateString);
      return 'Error en fecha';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      completed: { label: 'Completada', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      processing: { label: 'Procesando', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // ===================================
  // FUNCIONES DE ACCIÓN
  // ===================================

  const handleViewOrder = (orderId: number) => {
    if (onViewOrder) {
      onViewOrder(orderId);
    } else {
      toast({
        title: "Ver Orden",
        description: `Abriendo detalles de la orden #${orderId}`,
      });
      console.log('Ver orden:', orderId);
    }
  };

  const handleEditOrder = (orderId: number) => {
    if (onEditOrder) {
      onEditOrder(orderId);
    } else {
      toast({
        title: "Editar Orden",
        description: `Abriendo editor para la orden #${orderId}`,
      });
      console.log('Editar orden:', orderId);
    }
  };

  // Funciones handleExportOrders y handleNewOrder movidas al componente padre
  // para evitar duplicación de funcionalidad

  // ===================================
  // FUNCIONES DE PAGINACIÓN Y FILTROS
  // ===================================

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      loadOrders(newPage);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    // Debounce la búsqueda
    setTimeout(() => loadOrders(1), 500);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    loadOrders(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
    loadOrders(1);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
    loadOrders(1);
  };

  // ===================================
  // RENDERIZADO
  // ===================================

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>Cargando órdenes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar órdenes</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                  <p className="text-2xl font-bold">{analytics.total_orders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600 ml-auto" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold">{analytics.pending_orders}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-yellow-600 ml-auto" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold">{analytics.completed_orders}</p>
                </div>
                <Package className="h-8 w-8 text-green-600 ml-auto" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Órdenes Recientes</CardTitle>
              <CardDescription>
                {pagination ? `Mostrando ${orders.length} de ${pagination.total} órdenes` : 'Lista de órdenes'}
              </CardDescription>
            </div>
            {/* Botones movidos al header principal del AdminLayout para evitar duplicación */}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por cliente, email o ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
              loadOrders(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Más recientes</SelectItem>
                <SelectItem value="created_at-asc">Más antiguos</SelectItem>
                <SelectItem value="total-desc">Mayor monto</SelectItem>
                <SelectItem value="total-asc">Menor monto</SelectItem>
                <SelectItem value="id-desc">ID descendente</SelectItem>
                <SelectItem value="id-asc">ID ascendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No hay órdenes disponibles</p>
              <p className="text-sm text-gray-500">No se encontraron órdenes en el sistema</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold">{order.external_reference || `Orden #${order.id}`}</h3>
                        {getStatusBadge(order.status)}
                        <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Cliente:</p>
                          <p className="font-medium">{order.payer_info?.name || order.users?.name || 'Cliente no especificado'}</p>
                          <p className="text-gray-500">{order.payer_info?.email || order.users?.email || 'Email no especificado'}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Productos:</p>
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item, idx) => (
                              <p key={idx} className="font-medium">
                                {item.quantity}x {item.products.name}
                              </p>
                            ))
                          ) : (
                            <p className="text-gray-500">Sin productos</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Total:</p>
                          <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        title="Ver detalles de la orden"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrder(order.id)}
                        title="Editar orden"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Controles de Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} órdenes
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}









