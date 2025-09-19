/**
 * Componente para mostrar lista de órdenes pendientes de entrega
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Truck,
  Route
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  weight: number;
}

interface ShippingAddress {
  streetName: string;
  streetNumber: string;
  floor?: string;
  apartment?: string;
  cityName: string;
  stateName: string;
  zipCode: string;
  fullAddress: string;
}

interface PendingOrder {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  estimatedDelivery?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totalItems: number;
  totalWeight: number;
  notes?: string;
}

interface PendingOrdersData {
  orders: PendingOrder[];
  stats: {
    totalOrders: number;
    totalValue: number;
    totalItems: number;
    totalWeight: number;
    averageOrderValue: number;
  };
  driver: {
    id: string;
    name: string;
    status: string;
  };
}

interface PendingOrdersListProps {
  onStartRoute?: (orders: PendingOrder[]) => void;
  onSelectOrder?: (order: PendingOrder) => void;
}

export default function PendingOrdersList({ onStartRoute, onSelectOrder }: PendingOrdersListProps) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [stats, setStats] = useState<PendingOrdersData['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/driver/pending-orders');
      
      if (!response.ok) {
        throw new Error('Error al cargar órdenes pendientes');
      }

      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders);
        setStats(result.data.stats);
        
        // Seleccionar todas las órdenes por defecto
        const allOrderIds = new Set(result.data.orders.map((order: PendingOrder) => order.id));
        setSelectedOrders(allOrderIds);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error('Error al cargar órdenes pendientes');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const handleStartOptimizedRoute = async () => {
    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
    
    if (selectedOrdersList.length === 0) {
      toast.error('Selecciona al menos una orden para iniciar la ruta');
      return;
    }

    setOptimizing(true);
    
    try {
      // Preparar datos para optimización
      const stops = selectedOrdersList.map(order => ({
        orderId: order.id,
        address: order.shippingAddress.fullAddress,
        priority: order.status === 'confirmed' ? 1 : 0
      }));

      const response = await fetch('/api/driver/optimize-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stops })
      });

      if (!response.ok) {
        throw new Error('Error al optimizar la ruta');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Ruta optimizada: ${result.data.summary.totalStops} paradas, ${Math.round(result.data.summary.totalDistance)}km`);
        
        if (onStartRoute) {
          onStartRoute(selectedOrdersList);
        }
      } else {
        throw new Error(result.error || 'Error en optimización');
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Error al optimizar la ruta');
    } finally {
      setOptimizing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando órdenes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas del día */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Resumen del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                <div className="text-sm text-gray-600">Órdenes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.totalItems}</div>
                <div className="text-sm text-gray-600">Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(stats.totalWeight)}kg</div>
                <div className="text-sm text-gray-600">Peso Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de ruta */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              <span className="font-medium">
                {selectedOrders.size} de {orders.length} órdenes seleccionadas
              </span>
            </div>
            <Button 
              onClick={handleStartOptimizedRoute}
              disabled={selectedOrders.size === 0 || optimizing}
              className="flex items-center gap-2"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Optimizando...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Iniciar Recorrido
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de órdenes */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">¡No hay entregas pendientes!</h3>
              <p className="text-gray-600">Todas las órdenes del día han sido completadas.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card 
              key={order.id} 
              className={`cursor-pointer transition-all ${
                selectedOrders.has(order.id) 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => toggleOrderSelection(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedOrders.has(order.id) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedOrders.has(order.id) && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <h3 className="font-semibold">{order.orderNumber}</h3>
                    <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                      {order.status === 'paid' ? 'Pagado' : 'Confirmado'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(order.total)}</div>
                    <div className="text-sm text-gray-500">{order.totalItems} productos</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{order.shippingAddress.fullAddress}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Creado: {formatDate(order.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{order.totalWeight}kg</span>
                    <span>•</span>
                    <span>{order.items.length} tipos de productos</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span className="text-sm text-yellow-800">{order.notes}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}









