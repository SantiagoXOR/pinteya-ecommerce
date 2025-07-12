// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO WALLET BRICK
// ===================================

"use client";
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

// Tipos para el SDK de MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoWalletProps {
  preferenceId: string;
  onReady?: () => void;
  onError?: (error: any) => void;
  onSubmit?: (data: any) => void;
  className?: string;
}

export default function MercadoPagoWallet({ 
  preferenceId, 
  onReady, 
  onError,
  onSubmit,
  className = ""
}: MercadoPagoWalletProps) {
  const walletRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Verificar si el SDK ya está cargado
  useEffect(() => {
    if (window.MercadoPago) {
      setSdkLoaded(true);
      return;
    }

    // Verificar si ya existe un script del SDK
    const existingScript = document.querySelector('script[src*="sdk.mercadopago.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setSdkLoaded(true));
      return;
    }

    // Cargar el SDK de MercadoPago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      setSdkLoaded(true);
    };
    
    script.onerror = () => {
      setError('Error al cargar el SDK de MercadoPago');
      setIsLoading(false);
      onError?.('Error al cargar el SDK de MercadoPago');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // No remover el script para evitar problemas de recarga
    };
  }, [onError]);

  // Inicializar el Wallet Brick cuando el SDK esté listo
  useEffect(() => {
    if (!sdkLoaded || !preferenceId) return;

    const initializeWallet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar que tenemos la clave pública
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Clave pública de MercadoPago no configurada');
        }

        // Inicializar MercadoPago
        const mp = new window.MercadoPago(publicKey);
        
        // Limpiar contenedor anterior si existe
        const container = document.getElementById('wallet_container');
        if (container) {
          container.innerHTML = '';
        }

        // Crear el Wallet Brick
        await mp.bricks().create("wallet", "wallet_container", {
          initialization: {
            preferenceId: preferenceId,
            redirectMode: "self" // Mantener en la misma pestaña
          },
          callbacks: {
            onReady: () => {
              setIsLoading(false);
              setIsReady(true);
              onReady?.();
            },
            onError: (error: any) => {
              console.error('Error en Wallet Brick:', error);
              setError(error.message || 'Error en el procesamiento del pago');
              setIsLoading(false);
              onError?.(error);
            },
            onSubmit: (data: any) => {
              console.log('Pago enviado:', data);
              onSubmit?.(data);
            },
          },
          customization: {
            texts: {
              valueProp: 'smart_option',
            },
            visual: {
              buttonBackground: 'default',
              borderRadius: '8px',
            },
          },
        });

      } catch (error: any) {
        console.error('Error inicializando Wallet Brick:', error);
        setError(error.message || 'Error inicializando el sistema de pagos');
        setIsLoading(false);
        onError?.(error);
      }
    };

    initializeWallet();
  }, [sdkLoaded, preferenceId, onReady, onError, onSubmit]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    
    // Recargar la página para reiniciar el proceso
    window.location.reload();
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Método de Pago
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estado de carga */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-gray-600">
              Cargando opciones de pago seguras...
            </p>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                size="sm"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Estado listo */}
        {isReady && !error && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Sistema de pagos cargado correctamente
              </span>
            </div>
          </div>
        )}

        {/* Contenedor del Wallet Brick */}
        <div 
          id="wallet_container" 
          ref={walletRef}
          className={`min-h-[200px] ${isLoading || error ? 'hidden' : 'block'}`}
        />

        {/* Información adicional */}
        {isReady && !error && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Pago seguro con MercadoPago:</strong> Acepta tarjetas de crédito, 
              débito, efectivo y transferencias bancarias. Tus datos están protegidos 
              con encriptación de nivel bancario.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de fallback para casos de error crítico
export function MercadoPagoWalletFallback({ 
  initPoint, 
  className = "" 
}: { 
  initPoint: string; 
  className?: string; 
}) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Método de Pago
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-sm text-gray-600 mb-4">
            Continúa con el pago en MercadoPago
          </p>
          <Button 
            onClick={() => window.open(initPoint, '_blank')}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Pagar con MercadoPago
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
