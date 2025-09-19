// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO WALLET BRICK
// ===================================

"use client";
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertTriangle, CheckCircle, Shield, Lock } from 'lucide-react';

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
    // ✅ NUEVO: Verificar que estamos en la página correcta antes de cargar el SDK
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/checkout/success') ||
          currentPath.includes('/checkout/failure') ||
          currentPath.includes('/checkout/pending')) {
        console.log('🚫 SDK de MercadoPago no se carga en páginas de resultado');
        return;
      }
    }

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
    if (!sdkLoaded || !preferenceId) {return;}

    // ✅ NUEVO: Verificar que estamos en la página correcta
    // No inicializar el Wallet Brick en páginas de resultado
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/checkout/success') ||
          currentPath.includes('/checkout/failure') ||
          currentPath.includes('/checkout/pending')) {
        console.log('🚫 Wallet Brick no se inicializa en páginas de resultado');
        return;
      }
    }

    const initializeWallet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar que tenemos la clave pública
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Clave pública de MercadoPago no configurada');
        }

        // Verificar que el contenedor existe antes de inicializar
        const container = document.getElementById('wallet_container');
        if (!container) {
          console.warn('⚠️ Contenedor wallet_container no encontrado, cancelando inicialización');
          return;
        }

        // Inicializar MercadoPago
        const mp = new window.MercadoPago(publicKey);

        // Limpiar contenedor anterior si existe
        container.innerHTML = '';

        // Crear el Wallet Brick con manejo de errores mejorado
        try {
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
        } catch (brickError: any) {
          // Manejo específico de errores del Wallet Brick
          if (brickError.message?.includes('wallet_container') ||
              brickError.message?.includes('container')) {
            console.warn('⚠️ Contenedor wallet_container no disponible, esto es normal en páginas de resultado');
            return; // Salir silenciosamente
          }
          throw brickError; // Re-lanzar otros errores
        }

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

  const isMobileOptimized = className?.includes('mobile-optimized');

  return (
    <Card className={`w-full shadow-lg ${className}`}>
      <CardHeader className={cn(
        "bg-gradient-to-r from-blaze-orange-50 to-yellow-50 border-b",
        isMobileOptimized && "px-4 py-4"
      )}>
        <div className={cn(
          "flex items-center justify-between",
          isMobileOptimized && "flex-col gap-3 items-start"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2 text-blaze-orange-700",
            isMobileOptimized && "text-lg"
          )}>
            <CreditCard className={cn("w-5 h-5", isMobileOptimized && "w-4 h-4")} />
            Método de Pago Seguro
          </CardTitle>
          <div className={cn(
            "flex items-center gap-2",
            isMobileOptimized && "w-full justify-between"
          )}>
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              <Lock className="w-3 h-3 mr-1" />
              SSL
            </Badge>
          </div>
        </div>
        <p className={cn(
          "text-sm text-gray-600 mt-1",
          isMobileOptimized && "text-xs mt-2"
        )}>
          Completa tu pago de forma segura con MercadoPago
        </p>
      </CardHeader>
      <CardContent className={cn("p-6", isMobileOptimized && "p-4")}>
        {/* Estado de carga */}
        {isLoading && (
          <div className={cn(
            "flex flex-col items-center justify-center py-12 space-y-6",
            isMobileOptimized && "py-8 space-y-4"
          )}>
            <div className="relative">
              <div className={cn(
                "w-16 h-16 rounded-full bg-blaze-orange-100 flex items-center justify-center",
                isMobileOptimized && "w-12 h-12"
              )}>
                <Loader2 className={cn(
                  "w-8 h-8 animate-spin text-blaze-orange-600",
                  isMobileOptimized && "w-6 h-6"
                )} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-gray-700" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-gray-900">
                Cargando opciones de pago
              </p>
              <p className="text-sm text-gray-600">
                Preparando tu experiencia de pago segura...
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blaze-orange-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-red-800">Error al cargar el sistema de pagos</p>
              <p className="text-sm text-red-600">{error instanceof Error ? error.message : String(error) || 'Error desconocido'}</p>
            </div>
            <Button
              onClick={handleRetry}
              className="bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Reintentar Carga
            </Button>
          </div>
        )}

        {/* Estado listo */}
        {isReady && !error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">
                  Sistema de pagos listo
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Selecciona tu método de pago preferido
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenedor del Wallet Brick */}
        <div
          id="wallet_container"
          ref={walletRef}
          className={`min-h-[300px] rounded-lg border border-gray-200 ${isLoading || error ? 'hidden' : 'block'}`}
        />

        {/* Información adicional */}
        {isReady && !error && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 mb-2">
                  Pago 100% Seguro
                </p>
                <p className="text-sm text-blue-700">
                  Acepta tarjetas de crédito, débito, efectivo y transferencias bancarias.
                  Tus datos están protegidos con encriptación de nivel bancario y certificación PCI DSS.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    SSL 256-bit
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    PCI DSS
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verificado
                  </span>
                </div>
              </div>
            </div>
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
  const isMobileOptimized = className?.includes('mobile-optimized');

  return (
    <Card className={`w-full shadow-lg ${className}`}>
      <CardHeader className={cn(
        "bg-gradient-to-r from-yellow-50 to-orange-50 border-b",
        isMobileOptimized && "px-4 py-4"
      )}>
        <CardTitle className={cn(
          "flex items-center gap-2 text-blaze-orange-700",
          isMobileOptimized && "text-lg"
        )}>
          <CreditCard className={cn("w-5 h-5", isMobileOptimized && "w-4 h-4")} />
          Método de Pago Alternativo
        </CardTitle>
        <p className={cn(
          "text-sm text-gray-600 mt-1",
          isMobileOptimized && "text-xs"
        )}>
          Continúa con el pago en la plataforma de MercadoPago
        </p>
      </CardHeader>
      <CardContent className={cn("p-6", isMobileOptimized && "p-4")}>
        <div className={cn(
          "text-center py-8 space-y-6",
          isMobileOptimized && "py-6 space-y-4"
        )}>
          <div className={cn(
            "w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto",
            isMobileOptimized && "w-12 h-12"
          )}>
            <CreditCard className={cn(
              "w-8 h-8 text-blue-600",
              isMobileOptimized && "w-6 h-6"
            )} />
          </div>
          <div className="space-y-2">
            <p className={cn(
              "font-medium text-gray-900",
              isMobileOptimized && "text-lg"
            )}>
              Finaliza tu compra en MercadoPago
            </p>
            <p className={cn(
              "text-sm text-gray-600",
              isMobileOptimized && "text-xs"
            )}>
              Serás redirigido a la plataforma segura de MercadoPago para completar tu pago
            </p>
          </div>
          <Button
            onClick={() => window.open(initPoint, '_blank')}
            className={cn(
              "w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200",
              isMobileOptimized && "h-14 text-base rounded-xl active:scale-[0.98]"
            )}
            size="lg"
          >
            <CreditCard className={cn("w-5 h-5 mr-2", isMobileOptimized && "w-4 h-4")} />
            Continuar con MercadoPago
          </Button>
          <div className={cn(
            "flex items-center justify-center gap-4 text-xs text-gray-500",
            isMobileOptimized && "gap-6"
          )}>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Pago Seguro
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Datos Protegidos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}









