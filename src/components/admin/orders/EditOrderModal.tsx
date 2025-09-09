/**
 * Modal de Editar Orden - Panel Administrativo
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  Package, 
  User, 
  CreditCard, 
  Truck, 
  Save,
  X,
  Plus,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/admin/useOrderNotifications';

// ===================================
// TIPOS
// ===================================

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  products: {
    id: number;
    name: string;
    stock: number;
  };
}

interface Order {
  id: number;
  external_reference?: string;
  status: string;
  payment_status?: string;
  total: number;
  created_at: string;
  updated_at: string;
  payer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  order_items?: OrderItem[];
  notes?: string;
  tracking_number?: string;
  payment_method?: string;
  shipping_method?: string;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onOrderUpdated: (order: Order) => void;
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onOrderUpdated,
}) => {
  const notifications = useOrderNotifications();

  // Estados
  const [order, setOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    // Detectar cambios
    if (order && Object.keys(editedOrder).length > 0) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [editedOrder, order]);

  // ===================================
  // FUNCIONES
  // ===================================

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
        setEditedOrder({});
      } else {
        notifications.showNetworkError('cargar detalles de la orden');
      }

    } catch (error) {
      console.error('Error loading order details:', error);
      notifications.showNetworkError('cargar detalles de la orden');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setEditedOrder(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setEditedOrder(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any || {}),
        [field]: value,
      },
    }));
  };

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (!order?.order_items) return;

    const updatedItems = order.order_items.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, newQuantity) }
        : item
    );

    setEditedOrder(prev => ({
      ...prev,
      order_items: updatedItems,
    }));
  };

  const calculateNewTotal = () => {
    const items = editedOrder.order_items || order?.order_items || [];
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const saveChanges = async () => {
    try {
      if (!order || !hasChanges) return;

      setIsSaving(true);
      const processingToast = notifications.showProcessingInfo('Guardando cambios');

      // Calcular nuevo total si hay cambios en items
      const finalOrder = {
        ...editedOrder,
        total: editedOrder.order_items ? calculateNewTotal() : order.total,
      };

      // Simular guardado (reemplazar con API real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedOrder = {
        ...order,
        ...finalOrder,
        updated_at: new Date().toISOString(),
      };

      processingToast.dismiss();
      
      notifications.showOrderUpdated({
        orderId: order.id,
        changes: Object.keys(editedOrder).length,
      });

      onOrderUpdated(updatedOrder);
      handleClose();

    } catch (error) {
      console.error('Error saving order:', error);
      notifications.showOrderUpdateError('Error interno del servidor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        '¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.'
      );
      if (!confirmed) return;
    }

    setOrder(null);
    setEditedOrder({});
    setHasChanges(false);
    setActiveTab('basic');
    onClose();
  };

  const getCurrentValue = (field: string, defaultValue: any = '') => {
    return editedOrder[field as keyof typeof editedOrder] ?? order?.[field as keyof Order] ?? defaultValue;
  };

  const getCurrentNestedValue = (parent: string, field: string, defaultValue: any = '') => {
    const editedParent = editedOrder[parent as keyof typeof editedOrder] as any;
    const originalParent = order?.[parent as keyof Order] as any;
    
    return editedParent?.[field] ?? originalParent?.[field] ?? defaultValue;
  };

  if (!order && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Edit className="h-6 w-6" />
            <div className="flex items-center gap-3">
              <span>Editar Orden #{order?.id || orderId}</span>
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cambios sin guardar
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando orden...</p>
            </div>
          </div>
        ) : order ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="customer">Cliente</TabsTrigger>
              <TabsTrigger value="items">Productos</TabsTrigger>
              <TabsTrigger value="shipping">Envío</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              {/* Tab: Información Básica */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Estado de la Orden</Label>
                        <Select
                          value={getCurrentValue('status')}
                          onValueChange={(value) => updateField('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_status">Estado de Pago</Label>
                        <Select
                          value={getCurrentValue('payment_status')}
                          onValueChange={(value) => updateField('payment_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                            <SelectItem value="failed">Fallido</SelectItem>
                            <SelectItem value="refunded">Reembolsado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_method">Método de Pago</Label>
                        <Select
                          value={getCurrentValue('payment_method')}
                          onValueChange={(value) => updateField('payment_method', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="mercadopago">MercadoPago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tracking_number">Número de Seguimiento</Label>
                        <Input
                          id="tracking_number"
                          value={getCurrentValue('tracking_number')}
                          onChange={(e) => updateField('tracking_number', e.target.value)}
                          placeholder="Ingrese número de seguimiento"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notas de la Orden</Label>
                      <Textarea
                        id="notes"
                        value={getCurrentValue('notes')}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Notas adicionales sobre la orden..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Cliente */}
              <TabsContent value="customer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Nombre</Label>
                        <Input
                          id="customer_name"
                          value={getCurrentNestedValue('payer_info', 'name')}
                          onChange={(e) => updateNestedField('payer_info', 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="customer_email">Email</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={getCurrentNestedValue('payer_info', 'email')}
                          onChange={(e) => updateNestedField('payer_info', 'email', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="customer_phone">Teléfono</Label>
                        <Input
                          id="customer_phone"
                          value={getCurrentNestedValue('payer_info', 'phone')}
                          onChange={(e) => updateNestedField('payer_info', 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Productos */}
              <TabsContent value="items" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Productos de la Orden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(editedOrder.order_items || order?.order_items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.products.name}</h4>
                            <p className="text-sm text-gray-600">
                              Precio unitario: ${item.price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Stock disponible: {item.products.stock}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.products.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="text-right min-w-[100px]">
                              <p className="font-medium">
                                ${(item.quantity * item.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {editedOrder.order_items && (
                        <div className="pt-4 border-t">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total:</span>
                            <span>${calculateNewTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Envío */}
              <TabsContent value="shipping" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Información de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="shipping_method">Método de Envío</Label>
                      <Select
                        value={getCurrentValue('shipping_method')}
                        onValueChange={(value) => updateField('shipping_method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Envío Estándar</SelectItem>
                          <SelectItem value="express">Envío Express</SelectItem>
                          <SelectItem value="pickup">Retiro en Tienda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="street">Dirección</Label>
                        <Input
                          id="street"
                          value={getCurrentNestedValue('shipping_address', 'street')}
                          onChange={(e) => updateNestedField('shipping_address', 'street', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={getCurrentNestedValue('shipping_address', 'city')}
                          onChange={(e) => updateNestedField('shipping_address', 'city', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">Provincia/Estado</Label>
                        <Input
                          id="state"
                          value={getCurrentNestedValue('shipping_address', 'state')}
                          onChange={(e) => updateNestedField('shipping_address', 'state', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="zip_code">Código Postal</Label>
                        <Input
                          id="zip_code"
                          value={getCurrentNestedValue('shipping_address', 'zip_code')}
                          onChange={(e) => updateNestedField('shipping_address', 'zip_code', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          
          <Button
            onClick={saveChanges}
            disabled={isSaving || !hasChanges}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
