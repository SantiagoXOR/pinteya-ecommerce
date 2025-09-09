// ===================================
// PINTEYA E-COMMERCE - ORDER LIST ENTERPRISE COMPONENT
// ===================================

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
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
  ChevronRight,
  Package
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
import { useRenderMonitoring } from '@/hooks/monitoring/useRenderMonitoring';
import { useOrdersEnterpriseStrict } from '@/hooks/admin/useOrdersEnterpriseStrict';

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

// ===================================
// COMPONENTES MEMOIZADOS
// ===================================

interface OrderFiltersProps {
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  enabled: boolean;
}

const OrderFilters = memo<OrderFiltersProps>(({ filters, onFilterChange, enabled }) => {
  if (!enabled) return null;

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
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Estado */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange('status', value === 'all' ? undefined : value)}
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
            value={filters.payment_status || 'all'}
            onValueChange={(value) => onFilterChange('payment_status', value === 'all' ? undefined : value)}
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
            value={`${filters.sort_by}_${filters.sort_order}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('_');
              onFilterChange('sort_by', sortBy);
              onFilterChange('sort_order', sortOrder);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at_desc">Más recientes</SelectItem>
              <SelectItem value="created_at_asc">Más antiguos</SelectItem>
              <SelectItem value="total_desc">Mayor monto</SelectItem>
              <SelectItem value="total_asc">Menor monto</SelectItem>
              <SelectItem value="order_number_asc">Número de orden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
});

OrderFilters.displayName = 'OrderFilters';

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
  enabled: boolean;
}

const BulkActions = memo<BulkActionsProps>(({ selectedCount, onBulkAction, enabled }) => {
  if (!enabled || selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
      <span className="text-sm text-blue-700">
        {selectedCount} orden(es) seleccionada(s)
      </span>
      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAction('export')}
        >
          <Download className="w-4 h-4 mr-1" />
          Exportar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkAction('update_status')}
        >
          Actualizar Estado
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onBulkAction('delete')}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
});

BulkActions.displayName = 'BulkActions';

// Interfaces removidas - ahora se usan los tipos del hook estricto

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
  console.log('🚀 OrderListEnterprise - Componente renderizándose con props:', {
    className,
    enableBulkActions,
    enableFilters,
    pageSize
  });
  
  const { toast } = useToast();
  
  // Monitoreo de renderizado
  const { trackError, metrics } = useRenderMonitoring({
    componentName: 'OrderListEnterprise',
    enabled: process.env.NODE_ENV === 'development',
    enableToasts: false, // Evitar spam de toasts
    enableConsoleLogging: true,
    sampleRate: 0.1 // Monitorear solo 10% de los renders para performance
  });
  
  // Hook con validación estricta de tipos
  const {
    orders,
    pagination,
    filters,
    analytics,
    isLoading,
    error,
    fetchOrders,
    updateFilters,
    refreshOrders,
    clearError,
    retryLastRequest
  } = useOrdersEnterpriseStrict({
    page: 1,
    limit: pageSize,
    sort_by: 'created_at',
    sort_order: 'desc'
  }, {
    autoFetch: true, // ✅ REACTIVADO: Con persistencia, el auto-fetch funciona correctamente
    maxRetries: 3,
    timeout: 10000,
    enableCache: true
  });

  // DEBUG: Logs para verificar datos del hook
  console.log('🔍 OrderListEnterprise - Hook data:', {
    orders: orders,
    ordersLength: orders?.length,
    pagination,
    isLoading,
    error,
    filters
  });

  // Estado local para selecciones
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // ===================================
  // FUNCIONES DE MANEJO DE FILTROS
  // ===================================

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  // Usar useRef para evitar dependencias circulares
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const handleFilterChange = useCallback((key: keyof typeof filters, value: any) => {
    try {
      const currentFilters = filtersRef.current;
      const updatedFilters = { ...currentFilters, [key]: value, page: 1 };
      updateFilters(updatedFilters);
      // REMOVIDO: fetchOrders duplicado que causaba refresco infinito
      // El hook ya maneja el fetch automáticamente
    } catch (error) {
      trackError(error as Error, { action: 'filter_change', key, value });
      toast({
        title: 'Error al aplicar filtros',
        description: 'No se pudieron aplicar los filtros seleccionados.',
        variant: 'destructive'
      });
    }
  }, [updateFilters, trackError, toast]); // Removido 'filters' de dependencias

  const handlePageChange = useCallback((newPage: number) => {
    try {
      const currentFilters = filtersRef.current;
      const updatedFilters = { ...currentFilters, page: newPage };
      updateFilters(updatedFilters);
      // REMOVIDO: fetchOrders duplicado que causaba refresco infinito
      // El hook ya maneja el fetch automáticamente
    } catch (error) {
      trackError(error as Error, { action: 'page_change', page: newPage });
      toast({
        title: 'Error de paginación',
        description: 'No se pudo cambiar de página.',
        variant: 'destructive'
      });
    }
  }, [updateFilters, trackError, toast]); // Removido 'filters' de dependencias

  const handleSelectOrder = useCallback((orderId: string | number, selected: boolean) => {
    const orderIdStr = String(orderId);
    setSelectedOrders(prev =>
      selected
        ? [...prev, orderIdStr]
        : prev.filter(id => id !== orderIdStr)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedOrders(selected ? orders.map(order => String(order.id)) : []);
  }, [orders]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'Advertencia',
        description: 'Selecciona al menos una orden',
        variant: 'destructive',
      });
      return;
    }

    onBulkAction?.(action, selectedOrders);
  }, [selectedOrders, onBulkAction, toast]);

  const handleRefresh = useCallback(() => {
    refreshOrders();
  }, [refreshOrders]);

  // ===================================
  // DATOS MEMOIZADOS
  // ===================================

  // Memoizar datos computados para evitar recálculos innecesarios
  const memoizedData = useMemo(() => {
    const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
    const someSelected = selectedOrders.length > 0;
    const hasOrders = orders.length > 0;
    const hasNextPage = pagination?.hasNextPage || false;
    const hasPreviousPage = pagination?.hasPreviousPage || false;
    const currentPage = pagination?.page || 1;
    const totalPages = pagination?.totalPages || 1;

    return {
      allSelected,
      someSelected,
      hasOrders,
      hasNextPage,
      hasPreviousPage,
      currentPage,
      totalPages
    };
  }, [orders, selectedOrders, pagination]);

  // Memoizar handlers que dependen de datos computados
  const memoizedHandlers = useMemo(() => ({
    onFilterChange: handleFilterChange,
    onPageChange: handlePageChange,
    onSelectOrder: handleSelectOrder,
    onSelectAll: handleSelectAll,
    onBulkAction: handleBulkAction,
    onRefresh: handleRefresh
  }), [
    handleFilterChange,
    handlePageChange,
    handleSelectOrder,
    handleSelectAll,
    handleBulkAction,
    handleRefresh
  ]);

  // ===================================
  // FUNCIONES DE RENDER ELIMINADAS - AHORA USAN COMPONENTES MEMOIZADOS
  // ===================================

  // Función renderBulkActions eliminada - ahora usa componente BulkActions memoizado

  // ===================================
  // RENDER DE TABLA
  // ===================================

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isLoading ? 'Cargando órdenes...' : 'No hay órdenes disponibles'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {isLoading
                ? 'Obteniendo datos desde la API...'
                : 'No se encontraron órdenes con los filtros aplicados'
              }
            </p>
          </div>
          {!isLoading && (
            <Button
              onClick={() => fetchOrders()}
              className="bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar Órdenes
            </Button>
          )}
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
                  checked={selectedOrders.length === orders.length}
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
          {orders.map((order) => {
            const statusInfo = formatOrderStatus(order.status);
            const paymentInfo = formatPaymentStatus(order.payment_status);
            
            return (
              <TableRow key={order.id}>
                {enableBulkActions && (
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(String(order.id))}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-gray-500">#{String(order.id).slice(0, 8)}</div>
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
                    ${(order.total || 0).toLocaleString()} {order.currency}
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
                      <DropdownMenuItem onClick={() => handleBulkAction('export', [String(order.id)])}>
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
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
          {pagination.total} órdenes
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
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
      <OrderFilters
        filters={filters}
        onFilterChange={memoizedHandlers.onFilterChange}
        enabled={enableFilters}
      />

      {/* Acciones masivas */}
      <BulkActions
        selectedCount={selectedOrders.length}
        onBulkAction={memoizedHandlers.onBulkAction}
        enabled={enableBulkActions}
      />

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
