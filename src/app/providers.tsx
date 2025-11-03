'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { BrowserCacheUtils } from '@/lib/cache/browser-cache-optimizer'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

// ⚡ PERFORMANCE: Providers críticos (carga inmediata)
import { CartModalProvider } from './context/CartSidebarModalContext'
import { ReduxProvider } from '@/redux/provider'
import { PreviewSliderProvider } from './context/PreviewSliderContext'
import CartPersistenceProvider from '@/components/providers/CartPersistenceProvider'
import { QueryClientProvider } from '@/components/providers/QueryClientProvider'
import { AdvancedErrorBoundary } from '@/lib/error-boundary/advanced-error-boundary'
import { ModalProvider } from '@/contexts/ModalContext'

// ⚡ PERFORMANCE: Providers no críticos (lazy load -0.4s FCP)
const AnalyticsProvider = dynamic(
  () => import('@/components/Analytics/SimpleAnalyticsProvider').then(m => ({ default: m.SimpleAnalyticsProvider })),
  { ssr: false }
)
const NetworkErrorProvider = dynamic(
  () => import('@/components/providers/NetworkErrorProvider').then(m => ({ default: m.NetworkErrorProvider })),
  { ssr: false }
)
const MonitoringProvider = dynamic(
  () => import('@/providers/MonitoringProvider').then(m => ({ default: m.MonitoringProvider })),
  { ssr: false }
)

// Componentes UI - Carga inmediata (críticos)
import Header from '../components/Header/index'
import Footer from '../components/layout/Footer'
import ScrollToTop from '@/components/Common/ScrollToTop'
import { Toaster } from '@/components/ui/toast'

// ⚡ PERFORMANCE: Lazy loading de componentes pesados
// Estos componentes se cargan solo cuando son necesarios
const CartSidebarModal = dynamic(() => import('@/components/Common/CartSidebarModal/index'), {
  ssr: false,
  loading: () => null,
})

const PreviewSliderModal = dynamic(() => import('@/components/Common/PreviewSlider'), {
  ssr: false,
  loading: () => null,
})

const FloatingCartButton = dynamic(() => import('@/components/ui/floating-cart-button'), {
  ssr: false,
  loading: () => null,
})

const FloatingWhatsAppButton = dynamic(() => import('@/components/ui/floating-whatsapp-button'), {
  ssr: false,
  loading: () => null,
})

// ⚡ PERFORMANCE: Memoizar componentes para evitar re-renders innecesarios
const MemoizedHeader = React.memo(Header)
const MemoizedFooter = React.memo(Footer)
const MemoizedScrollToTop = React.memo(ScrollToTop)
const MemoizedToaster = React.memo(Toaster)

// Componente NextAuthWrapper para manejar sesiones
const NextAuthWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce')

  return <SessionProvider>{children}</SessionProvider>
})

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
        {/* ⚡ PERFORMANCE: Orden optimizado - Críticos primero */}
        <AdvancedErrorBoundary
          level='page'
          context='RootApplication'
          enableRetry={true}
          maxRetries={3}
          enableAutoRecovery={true}
          enableReporting={true}
        >
          {/* 1. Query client - Crítico para data fetching */}
          <QueryClientProvider>
            {/* 2. Redux - Crítico para state management */}
            <ReduxProvider>
              {/* 3. Cart persistence - Crítico para carrito */}
              <CartPersistenceProvider>
                {/* 4. Modal provider - Crítico para UI */}
                <ModalProvider>
                  <CartModalProvider>
                    <PreviewSliderProvider>
                      {/* ⚡ Providers lazy - No bloquean FCP */}
                      <MonitoringProvider
                        autoStart={process.env.NODE_ENV === 'production'}
                        enableErrorBoundary={true}
                      >
                        <NetworkErrorProvider enableDebugMode={process.env.NODE_ENV === 'development'}>
                          <AnalyticsProvider>
                            {/* Header y Footer solo para rutas públicas - Memoizados para performance */}
                            {!isAdminRoute && <MemoizedHeader />}

                            {/* Ocultar el modal del carrito en checkout para no bloquear inputs */}
                            {!isAdminRoute && !isCheckoutRoute && <CartSidebarModal />}
                            <PreviewSliderModal />
                            <MemoizedScrollToTop />

                            {/* Contenido principal */}
                            {children}

                            {/* Footer solo para rutas públicas - Memoizado */}
                            {!isAdminRoute && <MemoizedFooter />}

                            {/* Navegación móvil inferior - Solo visible en móviles - TEMPORALMENTE DESACTIVADO */}
                            {/* <div className="md:hidden">
                      <BottomNavigation />
                    </div> */}

                            {/* Botones flotantes - Lazy loaded y solo para rutas públicas */}
                            {!isAdminRoute && !isCheckoutRoute && <FloatingCartButton />}
                            {!isAdminRoute && !isCheckoutRoute && <FloatingWhatsAppButton />}

                            {/* Notificación del carrito deshabilitada por requerimiento */}
                            {/* {!isAdminRoute && (
                                <CartNotification
                                  show={notification.show}
                                  productName={notification.productName}
                                  productImage={notification.productImage}
                                  onClose={hideNotification}
                                />
                              )} */}

                            {/* Toaster para notificaciones - Memoizado */}
                            <MemoizedToaster />
                          </AnalyticsProvider>
                        </NetworkErrorProvider>
                      </MonitoringProvider>
                    </PreviewSliderProvider>
                  </CartModalProvider>
                </ModalProvider>
              </CartPersistenceProvider>
            </ReduxProvider>
          </QueryClientProvider>
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
