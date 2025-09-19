/**
 * Componente de tarjeta de entrega para drivers
 * Muestra información detallada de cada entrega y controles de acción
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  User,
  Home,
  Info
} from 'lucide-react';
import { cn } from '@/lib/core/utils';

interface DeliveryCardProps {
  delivery: {
    id: string;
    tracking_number: string;
    customer_name: string;
    customer_phone?: string;
    destination: {
      address: string;
      city: string;
      postal_code: string;
      coordinates?: { lat: number; lng: number };
      notes?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight?: number;
    }>;
    status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'exception';
    estimated_delivery_time?: string;
    special_instructions?: string;
    requires_signature?: boolean;
    cash_on_delivery?: number;
  };
  isActive: boolean;
  onComplete: () => void;
  onStartNavigation: () => void;
  isNavigating: boolean;
}

export function DeliveryCard({
  delivery,
  isActive,
  onComplete,
  onStartNavigation,
  isNavigating
}: DeliveryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'exception': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'in_transit': return 'En Tránsito';
      case 'delivered': return 'Entregado';
      case 'exception': return 'Excepción';
      default: return status;
    }
  };

  const handleCallCustomer = () => {
    if (delivery.customer_phone) {
      window.open(`tel:${delivery.customer_phone}`, '_self');
    }
  };

  const handleSendMessage = () => {
    if (delivery.customer_phone) {
      const message = `Hola ${delivery.customer_name}, soy tu driver de Pinteya. Estoy en camino con tu pedido #${delivery.tracking_number}`;
      window.open(`sms:${delivery.customer_phone}?body=${encodeURIComponent(message)}`, '_self');
    }
  };

  const handleOpenMaps = () => {
    const address = encodeURIComponent(delivery.destination.address);
    window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
  };

  return (
    <Card className={cn(
      "m-4",
      isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
              {delivery.tracking_number.slice(-3)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{delivery.customer_name}</h3>
              <Badge className={getStatusColor(delivery.status)}>
                {getStatusText(delivery.status)}
              </Badge>
            </div>
          </div>
          
          {isActive && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={isNavigating ? "secondary" : "default"}
                onClick={onStartNavigation}
                disabled={isNavigating}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {isNavigating ? 'Navegando' : 'Navegar'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dirección de entrega */}
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{delivery.destination.address}</p>
            <p className="text-sm text-gray-600">
              {delivery.destination.city}, {delivery.destination.postal_code}
            </p>
            {delivery.destination.notes && (
              <p className="text-sm text-blue-600 mt-1">
                <Info className="h-4 w-4 inline mr-1" />
                {delivery.destination.notes}
              </p>
            )}
          </div>
        </div>

        {/* Información del pedido */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span>{delivery.items.length} producto{delivery.items.length !== 1 ? 's' : ''}</span>
          </div>
          {delivery.estimated_delivery_time && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{delivery.estimated_delivery_time}</span>
            </div>
          )}
        </div>

        {/* Instrucciones especiales */}
        {delivery.special_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Instrucciones especiales:</p>
                <p className="text-sm text-yellow-700">{delivery.special_instructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pago contra entrega */}
        {delivery.cash_on_delivery && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Cobrar: ${delivery.cash_on_delivery.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex space-x-2">
          {delivery.customer_phone && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCallCustomer}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                Llamar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendMessage}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                SMS
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenMaps}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Detalles expandibles */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </Button>

        {showDetails && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
              <div className="space-y-1">
                {delivery.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-gray-600">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {delivery.requires_signature && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Requiere firma del cliente</span>
              </div>
            )}
          </div>
        )}

        {/* Botón de completar entrega */}
        {isActive && (
          <Button
            onClick={onComplete}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Marcar como Entregado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}









