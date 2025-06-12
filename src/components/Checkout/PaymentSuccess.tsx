"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateOrderStatus, getOrderStatus } from '@/lib/api/orders';

interface PaymentSuccessProps {
  type: 'success' | 'failure' | 'pending';
}

const PaymentSuccess = ({ type }: PaymentSuccessProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de MercadoPago
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const merchantOrderId = searchParams.get('merchant_order_id');
  const preferenceId = searchParams.get('preference_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const processPaymentResult = async () => {
      if (!externalReference) {
        setError('No se encontró referencia de la orden');
        setLoading(false);
        return;
      }

      try {
        // Actualizar estado de la orden con los datos de MercadoPago
        if (paymentId) {
          await updateOrderStatus(externalReference, {
            payment_id: paymentId,
            status: status || undefined,
            merchant_order_id: merchantOrderId || undefined,
          });
        }

        // Obtener datos actualizados de la orden
        const orderResult = await getOrderStatus(externalReference);
        
        if (orderResult.success) {
          setOrderData(orderResult.data);
        } else {
          setError(orderResult.error || 'Error obteniendo datos de la orden');
        }
      } catch (err: any) {
        setError(err.message || 'Error procesando resultado del pago');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [paymentId, status, merchantOrderId, externalReference]);

  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          title: '¡Pago Exitoso!',
          subtitle: 'Tu compra ha sido procesada correctamente',
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'failure':
        return {
          title: 'Pago Rechazado',
          subtitle: 'Hubo un problema procesando tu pago',
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        };
      case 'pending':
        return {
          title: 'Pago Pendiente',
          subtitle: 'Tu pago está siendo procesado',
          icon: '⏳',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        };
      default:
        return {
          title: 'Estado Desconocido',
          subtitle: 'No pudimos determinar el estado de tu pago',
          icon: '❓',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  const config = getStatusConfig();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando resultado del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-8 text-center`}>
          {/* Icono */}
          <div className="text-6xl mb-4">{config.icon}</div>
          
          {/* Título */}
          <h1 className={`text-2xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h1>
          
          {/* Subtítulo */}
          <p className={`${config.textColor} mb-6`}>
            {config.subtitle}
          </p>

          {/* Información de la orden */}
          {orderData && (
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Detalles de la Orden</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Orden #:</span>
                  <span className="font-medium">{orderData.order.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${orderData.order.total.toLocaleString('es-AR')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${
                    orderData.order.status === 'paid' ? 'text-green-600' :
                    orderData.order.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {orderData.order.status === 'paid' ? 'Pagado' :
                     orderData.order.status === 'pending' ? 'Pendiente' :
                     'Cancelado'}
                  </span>
                </div>

                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Pago:</span>
                    <span className="font-medium text-xs">{paymentId}</span>
                  </div>
                )}
              </div>

              {/* Items de la orden */}
              {orderData.order.items && orderData.order.items.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-800 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {orderData.order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            {type === 'success' && (
              <Link
                href="/my-account/orders"
                className={`${config.buttonColor} text-white px-6 py-3 rounded-lg font-medium transition-colors block`}
              >
                Ver Mis Órdenes
              </Link>
            )}
            
            {type === 'failure' && (
              <button
                onClick={() => router.back()}
                className={`${config.buttonColor} text-white px-6 py-3 rounded-lg font-medium transition-colors block w-full`}
              >
                Intentar Nuevamente
              </button>
            )}
            
            {type === 'pending' && (
              <Link
                href="/my-account/orders"
                className={`${config.buttonColor} text-white px-6 py-3 rounded-lg font-medium transition-colors block`}
              >
                Seguir Estado del Pago
              </Link>
            )}

            <Link
              href="/"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors hover:bg-gray-300 block"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {type === 'success' && (
            <p>
              Recibirás un email de confirmación con los detalles de tu compra.
              <br />
              Tu pedido será procesado en las próximas 24 horas.
            </p>
          )}
          
          {type === 'failure' && (
            <p>
              Si el problema persiste, contacta a nuestro soporte.
              <br />
              <Link href="/contact" className="text-blue hover:underline">
                Contactar Soporte
              </Link>
            </p>
          )}
          
          {type === 'pending' && (
            <p>
              Los pagos pueden tardar hasta 48 horas en procesarse.
              <br />
              Te notificaremos cuando se confirme el pago.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
