// ===================================
// PINTEYA E-COMMERCE - ORDER DETAIL ENTERPRISE COMPONENT
// ===================================

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  RefreshCw, 
  Package, 
  User, 
  CreditCard,
  Truck,
  MessageSquare,
  History,
  Download,
  Eye
} from 'lucide-react';
import { 
  OrderEnterprise, 
  OrderStatusHistory, 
  OrderNote 
} from '@/types/orders-enterprise';
import { formatOrderStatus, formatPaymentStatus } from '@/lib/orders-enterprise';
import { useToast } from '@/hooks/use-toast';
import { OrderStatusManager } from './OrderStatusManager';
import { OrderNotesManager } from './OrderNotesManager';

// ===================================
// INTERFACES
// ===================================

interface OrderDetailEnterpriseProps {
  orderId: string;
  onBack?: () => void;
  onEdit?: (order: OrderEnterprise) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  className?: string;
}

interface OrderDetailState {
  order: OrderEnterprise | null;
  statusHistory: OrderStatusHistory[];
  notes: OrderNote[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const OrderDetailEnterprise: React.FC<OrderDetailEnterpriseProps> = ({
  orderId,
  onBack,
  onEdit,
  onStatusChange,
  className = '',
}) => {
  const { toast } = useToast();
  
  // Estado del componente
  const [state, setState] = useState<OrderDetailState>({
    order: null,
    statusHistory: [],
    notes: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  // ===================================
  // FUNCIONES DE API
  // ===================================

  const fetchOrderDetail = async (showRefreshing = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: !showRefreshing, 
      refreshing: showRefreshing,
      error: null 
    }));
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar orden');
      }

      setState(prev => ({
        ...prev,
        order: data.data.order,
        statusHistory: data.data.statusHistory || [],
        notes: data.data.notes || [],
        loading: false,
        refreshing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
        refreshing: false,
      }));
      
      toast({
        title: 'Error',
        description: 'No se pudo cargar la orden',
        variant: 'destructive',
      });
    }
  };

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  // ===================================
  // MANEJADORES DE EVENTOS
  // ===================================

  const handleRefresh = () => {
    fetchOrderDetail(true);
  };

  const handleStatusChange = async (newStatus: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reason,
          notify_customer: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar estado');
      }

      toast({
        title: 'Estado actualizado',
        description: `La orden ha sido cambiada a: ${data.data.statusDescription}`,
      });

      // Refrescar datos
      fetchOrderDetail(true);
      onStatusChange?.(orderId, newStatus);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cambiar estado',
        variant: 'destructive',
      });
    }
  };

  // ===================================
  // RENDER DE LOADING/ERROR
  // ===================================

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.error || !state.order) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{state.error || 'Orden no encontrada'}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
        </div>
      </div>
    );
  }

  const order = state.order;
  const statusInfo = formatOrderStatus(order.status);
  const paymentInfo = formatPaymentStatus(order.payment_status);

  // ===================================
  // RENDER DE HEADER
  // ===================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Orden {order.order_number}</h1>
          <p className="text-gray-600">
            Creada el {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={state.refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${state.refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button onClick={() => onEdit?.(order)} variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>
    </div>
  );

  // ===================================
  // RENDER DE INFORMACIÓN GENERAL
  // ===================================

  const renderGeneralInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Estado de la Orden */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Estado de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
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
          <p className="text-sm text-gray-600 mt-2">{statusInfo.description}</p>
        </CardContent>
      </Card>

      {/* Estado de Pago */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Estado de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            className={
              paymentInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              paymentInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              paymentInfo.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }
          >
            {paymentInfo.label}
          </Badge>
          <p className="text-sm text-gray-600 mt-2">{paymentInfo.description}</p>
        </CardContent>
      </Card>

      {/* Total */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${order.total_amount.toLocaleString()} {order.currency}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {order.order_items?.length || 0} producto(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // ===================================
  // RENDER DE INFORMACIÓN DEL CLIENTE
  // ===================================

  const renderCustomerInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Datos Personales</h4>
            <p><strong>Nombre:</strong> {order.user_profiles?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {order.user_profiles?.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {order.user_profiles?.phone || 'N/A'}</p>
          </div>
          {order.shipping_address && (
            <div>
              <h4 className="font-medium mb-2">Dirección de Envío</h4>
              <div className="text-sm">
                {typeof order.shipping_address === 'string' 
                  ? JSON.parse(order.shipping_address)
                  : order.shipping_address
                }
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ===================================
  // RENDER DE PRODUCTOS
  // ===================================

  const renderProducts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Productos ({order.order_items?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {order.order_items?.map((item, index) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              {item.products?.images?.[0] && (
                <img 
                  src={item.products.images[0]} 
                  alt={item.products.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{item.products?.name || 'Producto'}</h4>
                <p className="text-sm text-gray-600">
                  Cantidad: {item.quantity} × ${item.unit_price.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${item.total_price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center font-medium text-lg">
          <span>Total:</span>
          <span>${order.total_amount.toLocaleString()} {order.currency}</span>
        </div>
      </CardContent>
    </Card>
  );

  // ===================================
  // RENDER DE ENVÍO
  // ===================================

  const renderShippingInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Información de Envío
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {order.tracking_number && (
            <div>
              <strong>Número de Seguimiento:</strong> {order.tracking_number}
            </div>
          )}
          {order.carrier && (
            <div>
              <strong>Transportista:</strong> {order.carrier}
            </div>
          )}
          {order.estimated_delivery && (
            <div>
              <strong>Entrega Estimada:</strong> {new Date(order.estimated_delivery).toLocaleDateString()}
            </div>
          )}
          {!order.tracking_number && !order.carrier && (
            <p className="text-gray-500">No hay información de envío disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ===================================
  // RENDER PRINCIPAL
  // ===================================

  return (
    <div className={`space-y-6 ${className}`}>
      {renderHeader()}
      {renderGeneralInfo()}

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="status">Gestión de Estado</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {renderCustomerInfo()}
          {renderProducts()}
          {renderShippingInfo()}
        </TabsContent>

        <TabsContent value="status">
          <OrderStatusManager
            order={order}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="notes">
          <OrderNotesManager
            orderId={order.id}
            notes={state.notes}
            onNotesChange={() => fetchOrderDetail(true)}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Estados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {entry.previous_status ? 
                            `${formatOrderStatus(entry.previous_status).label} → ` : 
                            ''
                          }
                          {formatOrderStatus(entry.new_status).label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="text-sm text-gray-600">{entry.reason}</p>
                      )}
                      {entry.user_profiles && (
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {entry.user_profiles.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {state.statusHistory.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No hay historial de cambios disponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
