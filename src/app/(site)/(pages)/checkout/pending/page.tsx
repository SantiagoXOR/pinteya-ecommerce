'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, ArrowLeft, RefreshCw, Mail, Phone, Home } from 'lucide-react';

interface PendingPayment {
  payment_id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  payment_type?: string;
}

const PENDING_REASONS: Record<string, { title: string; description: string; timeframe: string }> = {
  'pending_contingency': {
    title: 'Verificación en Proceso',
    description: 'Estamos verificando tu pago. Te notificaremos cuando esté confirmado.',
    timeframe: '1-2 días hábiles'
  },
  'pending_review_manual': {
    title: 'Revisión Manual',
    description: 'Tu pago está siendo revisado manualmente por nuestro equipo.',
    timeframe: '1-3 días hábiles'
  },
  'pending_waiting_transfer': {
    title: 'Esperando Transferencia',
    description: 'Estamos esperando que se complete la transferencia bancaria.',
    timeframe: '1-2 días hábiles'
  },
  'pending_waiting_payment': {
    title: 'Esperando Pago',
    description: 'Estamos esperando la confirmación del pago.',
    timeframe: '24-48 horas'
  },
  'default': {
    title: 'Pago Pendiente',
    description: 'Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.',
    timeframe: '1-2 días hábiles'
  }
};

export default function CheckoutPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingPayment, setPendingPayment] = useState<PendingPayment>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener parámetros de la URL
    const payment_id = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const status_detail = searchParams.get('status_detail');
    const external_reference = searchParams.get('external_reference');
    const payment_type = searchParams.get('payment_type');

    setPendingPayment({
      payment_id,
      status,
      status_detail,
      external_reference,
      payment_type,
    });

    setIsLoading(false);

    // Log para debugging
    console.log('⏳ Pago pendiente:', {
      payment_id,
      status,
      status_detail,
      external_reference,
      payment_type,
    });
  }, [searchParams]);

  const getPendingInfo = () => {
    const statusDetail = pendingPayment.status_detail;
    return PENDING_REASONS[statusDetail || 'default'] || PENDING_REASONS.default;
  };

  const handleCheckStatus = () => {
    // Recargar la página para verificar el estado
    window.location.reload();
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  const pendingInfo = getPendingInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Pago en Proceso
          </CardTitle>
          <p className="text-yellow-100 text-lg">
            Tu pago está siendo verificado
          </p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Información del estado pendiente */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-1">{pendingInfo.title}</h3>
                  <p className="text-yellow-700 mb-2">{pendingInfo.description}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600 text-sm font-medium">
                      Tiempo estimado: {pendingInfo.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles del pago */}
            {pendingPayment.payment_id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">ID de Pago</h4>
                  <p className="text-gray-900 font-mono text-sm">{pendingPayment.payment_id}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">Estado</h4>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    {pendingPayment.status || 'pending'}
                  </Badge>
                </div>

                {pendingPayment.external_reference && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Número de Orden</h4>
                    <p className="text-gray-900 font-mono text-sm">{pendingPayment.external_reference}</p>
                  </div>
                )}

                {pendingPayment.payment_type && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Método de Pago</h4>
                    <p className="text-gray-900 text-sm capitalize">{pendingPayment.payment_type}</p>
                  </div>
                )}
              </div>
            )}

            {/* Qué esperar */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ¿Qué sucede ahora?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Verificación automática</p>
                    <p className="text-blue-600 text-sm">Nuestro sistema está verificando tu pago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Notificación por email</p>
                    <p className="text-green-600 text-sm">Te enviaremos un email cuando se confirme el pago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">Seguimiento disponible</p>
                    <p className="text-purple-600 text-sm">Puedes verificar el estado en tu panel de pedidos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información importante */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Información Importante</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• No es necesario realizar el pago nuevamente</li>
                <li>• Tu pedido está reservado mientras se procesa el pago</li>
                <li>• Recibirás notificaciones por email sobre cualquier cambio</li>
                <li>• Si tienes dudas, puedes contactar a nuestro soporte</li>
              </ul>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={handleCheckStatus}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Estado
              </Button>
              
              <Button 
                onClick={handleViewOrders}
                variant="outline"
                className="flex-1"
              >
                Ver Mis Pedidos
              </Button>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleBackToHome}
                variant="ghost"
                className="text-gray-600 hover:text-gray-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
            </div>

            {/* Soporte */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                ¿Tienes alguna pregunta? Contáctanos en{' '}
                <a href="mailto:soporte@pinteya.com" className="text-yellow-600 hover:underline">
                  soporte@pinteya.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









