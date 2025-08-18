// ===================================
// PINTEYA E-COMMERCE - ORDER LIST ENTERPRISE COMPONENT
// ===================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  OrderEnterprise, 
  OrderFilters, 
  OrderStatus,
  PaymentStatus 
} from '@/types/orders-enterprise';
import { formatOrderStatus, formatPaymentStatus } from '@/lib/orders-enterprise';
import { useToast } from '@/hooks/use-toast';

// ===================================
// INTERFACES
// ===================================

interface OrderListEnterpriseProps {
  className?: string;
  onOrderSelect?: (order: OrderEnterprise) => void;
  onOrderEdit?: (order: OrderEnterprise) => void;
  onBulkAction?: (action: string, orderIds: string[]) => void;
  enableBulkActions?: boolean;
  enableFilters?: boolean;
  pageSize?: number;
}

interface OrderListState {
  orders: OrderEnterprise[];
  loading: boolean;
  error: string | null;
  filters: OrderFilters;
  selectedOrders: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderListEnterprise: React.FC<OrderListEnterpriseProps> = ({
  className = '',
  onOrderSelect,
  onOrderEdit,
  onBulkAction,
  enableBulkActions = true,
  enableFilters = true,
  pageSize = 20,
}) => {
  const { toast } = useToast();
  
  // Estado del componente
  const [state, setState] = useState<OrderListState>({
    orders: [],
    loading: true,
    error: null,
    filters: {
      page: 1,
      limit: pageSize,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
    selectedOrders: [],
    pagination: {
      page: 1,
      limit: pageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  // ===================================
  // FUNCIONES DE API
  // ===================================

  const fetchOrders = useCallback(async (filters: OrderFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/orders?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar órdenes');
      }

      setState(prev => ({
        ...prev,
        orders: data.data.orders,
        pagination: data.data.pagination,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      }));
      
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    fetchOrders(state.filters);
  }, [fetchOrders, state.filters]);

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
        page: 1, // Reset page when filters change
      },
    }));
  };

  const handlePageChange = (newPage: number) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        page: newPage,
      },
    }));
  };

  const handleSelectOrder = (orderId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedOrders: selected
        ? [...prev.selectedOrders, orderId]
        : prev.selectedOrders.filter(id => id !== orderId),
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedOrders: selected ? prev.orders.map(order => order.id) : [],
    }));
  };

  const handleBulkAction = (action: string) => {
    if (state.selectedOrders.length === 0) {
      toast({
        title: 'Advertencia',
        description: 'Selecciona al menos una orden',
        variant: 'destructive',
      });
      return;
    }

    onBulkAction?.(action, state.selectedOrders);
  };

  const handleRefresh = () => {
    fetchOrders(state.filters);
  };

  // ===================================
  // RENDER DE FILTROS
  // ===================================

  const renderFilters = () => {
    if (!enableFilters) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar órdenes..."
                value={state.filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Estado */}
            <Select
              value={state.filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviada</SelectItem>
                <SelectItem value="delivered">Entregada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            {/* Estado de Pago */}
            <Select
              value={state.filters.payment_status || 'all'}
              onValueChange={(value) => handleFilterChange('payment_status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pagos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="failed">Falló</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenamiento */}
            <Select
              value={`${state.filters.sort_by}_${state.filters.sort_order}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('_');
                handleFilterChange('sort_by', sortBy);
                handleFilterChange('sort_order', sortOrder);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Más recientes</SelectItem>
                <SelectItem value="created_at_asc">Más antiguos</SelectItem>
                <SelectItem value="total_amount_desc">Mayor monto</SelectItem>
                <SelectItem value="total_amount_asc">Menor monto</SelectItem>
                <SelectItem value="order_number_asc">Número de orden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===================================
  // RENDER DE ACCIONES MASIVAS
  // ===================================

  const renderBulkActions = () => {
    if (!enableBulkActions || state.selectedOrders.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
        <span className="text-sm text-blue-700">
          {state.selectedOrders.length} orden(es) seleccionada(s)
        </span>
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction('export')}
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction('status_update')}
          >
            Cambiar Estado
          </Button>
        </div>
      </div>
    );
  };

  // ===================================
  // RENDER DE TABLA
  // ===================================

  const renderTable = () => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{state.error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    if (state.orders.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No se encontraron órdenes con los filtros aplicados
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {enableBulkActions && (
              <TableHead className="w-12">
                <Checkbox
                  checked={state.selectedOrders.length === state.orders.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead>Orden</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-12">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.orders.map((order) => {
            const statusInfo = formatOrderStatus(order.status);
            const paymentInfo = formatPaymentStatus(order.payment_status);
            
            return (
              <TableRow key={order.id}>
                {enableBulkActions && (
                  <TableCell>
                    <Checkbox
                      checked={state.selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-gray-500">#{order.id.slice(0, 8)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.user_profiles?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.user_profiles?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                      statusInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      paymentInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      paymentInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      paymentInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {paymentInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    ${order.total_amount.toLocaleString()} {order.currency}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onOrderSelect?.(order)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOrderEdit?.(order)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('export', [order.id])}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  // ===================================
  // RENDER DE PAGINACIÓN
  // ===================================

  const renderPagination = () => {
    if (state.pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Mostrando {((state.pagination.page - 1) * state.pagination.limit) + 1} a{' '}
          {Math.min(state.pagination.page * state.pagination.limit, state.pagination.total)} de{' '}
          {state.pagination.total} órdenes
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(state.pagination.page - 1)}
            disabled={!state.pagination.hasPreviousPage}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {state.pagination.page} de {state.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(state.pagination.page + 1)}
            disabled={!state.pagination.hasNextPage}
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ===================================
  // RENDER PRINCIPAL
  // ===================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
          <p className="text-gray-600">
            Administra y monitorea todas las órdenes del sistema
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      {renderFilters()}

      {/* Acciones masivas */}
      {renderBulkActions()}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {renderTable()}
        </CardContent>
      </Card>

      {/* Paginación */}
      {renderPagination()}
    </div>
  );
};
