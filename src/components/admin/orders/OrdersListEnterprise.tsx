// =====================================================
// COMPONENTE: OrdersListEnterprise
// Descripción: Lista enterprise de órdenes con filtros y acciones masivas
// Basado en: Patrones WooCommerce Orders Management
// =====================================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Package, 
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, OrderFilters } from '@/hooks/admin/useOrdersEnterprise';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';

// =====================================================
// INTERFACES
// =====================================================

interface OrdersListEnterpriseProps {
  orders: Order[];
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  onOrderSelect?: (orderId: string) => void;
  onBulkAction?: (orderIds: string[], action: string) => void;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
  };
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function OrdersListEnterprise({
  orders,
  filters,
  onFiltersChange,
  onOrderSelect,
  onBulkAction,
  isLoading = false,
  pagination,
  className
}: OrdersListEnterpriseProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSearch = () => {
    onFiltersChange({ search: searchTerm, page: 1 });
  };

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length > 0 && onBulkAction) {
      onBulkAction(selectedOrders, action);
      setSelectedOrders([]);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return <OrdersListSkeleton className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Órdenes
            </CardTitle>
            <CardDescription>
              Gestión completa de órdenes y estados
            </CardDescription>
          </div>

          {/* Acciones masivas */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length} seleccionadas
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Acciones masivas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleBulkAction('confirm')}>
                    Confirmar órdenes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('process')}>
                    Procesar órdenes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('ship')}>
                    Marcar como enviadas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction('cancel')}
                    className="text-red-600"
                  >
                    Cancelar órdenes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por número de orden, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-2">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ 
                  status: value === 'all' ? undefined : value as OrderStatus,
                  page: 1 
                })
              }
            >
              <SelectTrigger className="w-40">
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

            <Select
              value={filters.payment_status || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ 
                  payment_status: value === 'all' ? undefined : value as PaymentStatus,
                  page: 1 
                })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pagos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {orders.length === 0 ? (
          <EmptyOrdersList />
        ) : (
          <>
            {/* Tabla de órdenes */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === orders.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrders.includes(order.id)}
                      onSelect={(checked) => handleSelectOrder(order.id, checked)}
                      onView={() => onOrderSelect?.(order.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {pagination && (
              <OrdersPagination pagination={pagination} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE FILA DE ORDEN
// =====================================================

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
}

function OrderRow({ order, isSelected, onSelect, onView }: OrderRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="font-mono text-sm">{order.order_number}</span>
          <span className="text-xs text-muted-foreground">
            {order.order_items.length} items
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{order.user_profiles?.name || 'Cliente'}</span>
          <span className="text-xs text-muted-foreground">
            {order.user_profiles?.email}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      
      <TableCell>
        <PaymentStatusBadge status={order.payment_status} />
      </TableCell>
      
      <TableCell className="font-medium">
        {formatCurrency(order.total, order.currency)}
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(order.created_at)}
      </TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Truck className="w-4 h-4 mr-2" />
              Crear envío
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', variant: 'secondary' as const, icon: Clock };
      case 'confirmed':
        return { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle };
      case 'processing':
        return { label: 'Procesando', variant: 'default' as const, icon: Package };
      case 'shipped':
        return { label: 'Enviada', variant: 'default' as const, icon: Truck };
      case 'delivered':
        return { label: 'Entregada', variant: 'default' as const, icon: CheckCircle };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle };
      default:
        return { label: status, variant: 'secondary' as const, icon: Clock };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', variant: 'secondary' as const };
      case 'paid':
        return { label: 'Pagado', variant: 'default' as const };
      case 'failed':
        return { label: 'Fallido', variant: 'destructive' as const };
      case 'refunded':
        return { label: 'Reembolsado', variant: 'outline' as const };
      default:
        return { label: status, variant: 'secondary' as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

function OrdersPagination({ pagination }: { pagination: any }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Mostrando {((pagination.currentPage - 1) * 25) + 1} a{' '}
        {Math.min(pagination.currentPage * 25, pagination.totalItems)} de{' '}
        {pagination.totalItems} órdenes
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={pagination.prevPage}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        
        <span className="text-sm">
          Página {pagination.currentPage} de {pagination.totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={pagination.nextPage}
          disabled={!pagination.hasNext}
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function OrdersListSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyOrdersList() {
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No hay órdenes</h3>
      <p className="text-muted-foreground">
        Las órdenes aparecerán aquí cuando los clientes realicen compras.
      </p>
    </div>
  );
}
