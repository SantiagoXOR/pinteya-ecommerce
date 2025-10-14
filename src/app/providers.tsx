'use client'

import React, { useEffect } from 'react'
import { BrowserCacheUtils } from '@/lib/cache/browser-cache-optimizer'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

// Providers de la aplicación
import { CartModalProvider } from './context/CartSidebarModalContext'
import { ReduxProvider } from '@/redux/provider'
import { PreviewSliderProvider } from './context/PreviewSliderContext'
import CartPersistenceProvider from '@/components/providers/CartPersistenceProvider'
import { SimpleAnalyticsProvider as AnalyticsProvider } from '@/components/Analytics/SimpleAnalyticsProvider'
import { QueryClientProvider } from '@/components/providers/QueryClientProvider'
import { NetworkErrorProvider } from '@/components/providers/NetworkErrorProvider'
import { MonitoringProvider } from '@/providers/MonitoringProvider'
import { AdvancedErrorBoundary } from '@/lib/error-boundary/advanced-error-boundary'
import { ModalProvider } from '@/contexts/ModalContext'

// Componentes UI
import Header from '../components/Header/index'
import Footer from '../components/layout/Footer'
import CartSidebarModal from '@/components/Common/CartSidebarModal/index'
import PreviewSliderModal from '@/components/Common/PreviewSlider'
import ScrollToTop from '@/components/Common/ScrollToTop'
// PreLoader eliminado por requerimiento: no mostrar pantalla de carga
// CartNotification deshabilitado por requerimiento UX
// import CartNotification, { useCartNotification } from '@/components/Common/CartNotification'
// import { BottomNavigation } from "@/components/ui/bottom-navigation";
import FloatingCartButton from '@/components/ui/floating-cart-button'
import { Toaster } from '@/components/ui/toast'

// Componente NextAuthWrapper para manejar sesiones
function NextAuthWrapper({ children }: { children: React.ReactNode }) {
  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce')

  return <SessionProvider>{children}</SessionProvider>
}

export default function Providers({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // Desregistrar SW y limpiar caches si el flag está deshabilitado
    if (process.env.NEXT_PUBLIC_ENABLE_SW !== 'true') {
      BrowserCacheUtils.unregisterAndClearCaches()
    }
  }, [])

  // ✅ NEXTAUTH.JS ACTIVADO - Migración completada 21/08/2025
  // NextAuth.js reemplaza a Clerk para autenticación
  const nextAuthEnabled = true // ✅ ACTIVADO - Sistema funcional

  // Componente interno con todos los providers
  const AppContent = () => {
    // Notificación deshabilitada: no inicializamos el hook
    // const { notification, hideNotification } = useCartNotification()
    const pathname = usePathname()

    // Detectar si estamos en rutas de admin
    const isAdminRoute = pathname?.startsWith('/admin')
    // Detectar si estamos en checkout express para ocultar el botón flotante
    const isCheckoutRoute = pathname?.startsWith('/checkout')

    // DEBUG: Logs para verificar la detección de rutas admin (DESHABILITADO)
    // console.log('🔧 PROVIDERS DEBUG:', {
    //   pathname,
    //   isAdminRoute,
    //   timestamp: new Date().toISOString()
    // });

    return (
      <>
        <AdvancedErrorBoundary
          level='page'
          context='RootApplication'
          enableRetry={true}
          maxRetries={3}
          enableAutoRecovery={true}
          enableReporting={true}
        >
          <MonitoringProvider
            autoStart={process.env.NODE_ENV === 'production'}
            enableErrorBoundary={true}
          >
            <QueryClientProvider>
              <NetworkErrorProvider enableDebugMode={process.env.NODE_ENV === 'development'}>
                <ReduxProvider>
                  <CartPersistenceProvider>
                    <AnalyticsProvider>
                      <ModalProvider>
                        <CartModalProvider>
                          <PreviewSliderProvider>
                            {/* Header y Footer solo para rutas públicas - MOVIDO DENTRO DE QueryClientProvider */}
                            {!isAdminRoute && <Header />}

                            {/* Ocultar el modal del carrito en checkout para no bloquear inputs */}
                            {!isAdminRoute && !isCheckoutRoute && <CartSidebarModal />}
                            <PreviewSliderModal />
                            <ScrollToTop />

                            {/* Contenido principal */}
                            {children}

                            {/* Footer solo para rutas públicas */}
                            {!isAdminRoute && <Footer />}

                            {/* Navegación móvil inferior - Solo visible en móviles - TEMPORALMENTE DESACTIVADO */}
                            {/* <div className="md:hidden">
                      <BottomNavigation />
                    </div> */}

                            {/* Botón de carrito flotante - Oculto en checkout para no tapar el botón de finalizar */}
                            {!isAdminRoute && !isCheckoutRoute && <FloatingCartButton />}

                            {/* Notificación del carrito deshabilitada por requerimiento */}
                            {/* {!isAdminRoute && (
                                <CartNotification
                                  show={notification.show}
                                  productName={notification.productName}
                                  productImage={notification.productImage}
                                  onClose={hideNotification}
                                />
                              )} */}

                            {/* Toaster para notificaciones */}
                            <Toaster />
                          </PreviewSliderProvider>
                        </CartModalProvider>
                      </ModalProvider>
                    </AnalyticsProvider>
                  </CartPersistenceProvider>
                </ReduxProvider>
              </NetworkErrorProvider>
            </QueryClientProvider>
          </MonitoringProvider>
        </AdvancedErrorBoundary>
      </>
    )
  }

  // Renderizado con NextAuth.js SessionProvider
  if (nextAuthEnabled) {
    return (
      <NextAuthWrapper>
        <AppContent />
      </NextAuthWrapper>
    )
  }

  // Fallback sin autenticación
  return <AppContent />
}
