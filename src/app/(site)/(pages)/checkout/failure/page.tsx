'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle, ArrowLeft, RefreshCw, CreditCard, HelpCircle } from 'lucide-react';

interface PaymentError {
  payment_id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string; action: string }> = {
  'cc_rejected_insufficient_amount': {
    title: 'Fondos Insuficientes',
    description: 'Tu tarjeta no tiene fondos suficientes para completar la compra.',
    action: 'Intenta con otra tarjeta o verifica tu saldo.'
  },
  'cc_rejected_bad_filled_card_number': {
    title: 'Número de Tarjeta Incorrecto',
    description: 'El número de tarjeta ingresado no es válido.',
    action: 'Verifica el número de tarjeta e intenta nuevamente.'
  },
  'cc_rejected_bad_filled_date': {
    title: 'Fecha de Vencimiento Incorrecta',
    description: 'La fecha de vencimiento de la tarjeta no es válida.',
    action: 'Verifica la fecha de vencimiento e intenta nuevamente.'
  },
  'cc_rejected_bad_filled_security_code': {
    title: 'Código de Seguridad Incorrecto',
    description: 'El código de seguridad (CVV) ingresado no es válido.',
    action: 'Verifica el código de seguridad e intenta nuevamente.'
  },
  'cc_rejected_call_for_authorize': {
    title: 'Autorización Requerida',
    description: 'Tu banco requiere autorización para esta compra.',
    action: 'Contacta a tu banco para autorizar la transacción.'
  },
  'cc_rejected_card_disabled': {
    title: 'Tarjeta Deshabilitada',
    description: 'Tu tarjeta está deshabilitada para compras online.',
    action: 'Contacta a tu banco o intenta con otra tarjeta.'
  },
  'cc_rejected_duplicated_payment': {
    title: 'Pago Duplicado',
    description: 'Ya existe un pago con los mismos datos.',
    action: 'Verifica si el pago ya fue procesado anteriormente.'
  },
  'cc_rejected_high_risk': {
    title: 'Transacción de Alto Riesgo',
    description: 'La transacción fue rechazada por seguridad.',
    action: 'Intenta con otra tarjeta o contacta a tu banco.'
  },
  'default': {
    title: 'Error en el Pago',
    description: 'No pudimos procesar tu pago en este momento.',
    action: 'Intenta nuevamente o usa otro método de pago.'
  }
};

export default function CheckoutFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentError, setPaymentError] = useState<PaymentError>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener parámetros de la URL
    const payment_id = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const status_detail = searchParams.get('status_detail');
    const external_reference = searchParams.get('external_reference');

    setPaymentError({
      payment_id,
      status,
      status_detail,
      external_reference,
    });

    setIsLoading(false);

    // Log para debugging
    console.log('❌ Pago fallido:', {
      payment_id,
      status,
      status_detail,
      external_reference,
    });
  }, [searchParams]);

  const getErrorInfo = () => {
    const statusDetail = paymentError.status_detail;
    return ERROR_MESSAGES[statusDetail || 'default'] || ERROR_MESSAGES.default;
  };

  const handleRetryPayment = () => {
    // Volver al checkout manteniendo los datos del carrito
    router.push('/checkout');
  };

  const handleBackToCart = () => {
    router.push('/cart');
  };

  const handleContactSupport = () => {
    // Abrir email o chat de soporte
    window.location.href = 'mailto:soporte@pinteya.com?subject=Problema con el pago&body=ID de pago: ' + (paymentError.payment_id || 'N/A');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Pago No Procesado
          </CardTitle>
          <p className="text-red-100 text-lg">
            Hubo un problema al procesar tu pago
          </p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Información del error */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">{errorInfo.title}</h3>
                  <p className="text-red-700 mb-2">{errorInfo.description}</p>
                  <p className="text-red-600 text-sm font-medium">{errorInfo.action}</p>
                </div>
              </div>
            </div>

            {/* Detalles técnicos */}
            {paymentError.payment_id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">ID de Pago</h4>
                  <p className="text-gray-900 font-mono text-sm">{paymentError.payment_id}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">Estado</h4>
                  <Badge variant="destructive" className="text-sm">
                    {paymentError.status || 'rejected'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Opciones de solución */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                ¿Qué puedes hacer?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Intentar nuevamente</p>
                    <p className="text-blue-600 text-sm">Verifica los datos de tu tarjeta e intenta otra vez</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Usar otra tarjeta</p>
                    <p className="text-green-600 text-sm">Prueba con una tarjeta diferente</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">Contactar al banco</p>
                    <p className="text-purple-600 text-sm">Tu banco puede tener más información sobre el rechazo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={handleRetryPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar Nuevamente
              </Button>
              
              <Button 
                onClick={handleBackToCart}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Carrito
              </Button>
            </div>

            {/* Soporte */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-3">
                ¿Necesitas ayuda? Nuestro equipo está aquí para asistirte
              </p>
              <Button 
                onClick={handleContactSupport}
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
