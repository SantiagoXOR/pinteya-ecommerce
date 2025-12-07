'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
// ⚡ PERFORMANCE: BrowserCacheUtils se carga dinámicamente en useEffect
// Esto reduce Script Evaluation inicial (no se carga hasta que se necesita)
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

// ⚡ PERFORMANCE: Providers críticos (carga inmediata - solo los esenciales)
import { ReduxProvider } from '@/redux/provider'
import { QueryClientProvider } from '@/components/providers/QueryClientProvider'
import { AdvancedErrorBoundary } from '@/lib/error-boundary/advanced-error-boundary'

// ⚡ CRITICAL: Lazy load de providers no críticos para reducir Script Evaluation
// Estos providers se cargan después del FCP para no bloquear la carga inicial
const CartModalProvider = dynamic(() => import('./context/CartSidebarModalContext').then(m => ({ default: m.CartModalProvider })), {
  ssr: false,
  loading: () => null,
})
const PreviewSliderProvider = dynamic(() => import('./context/PreviewSliderContext').then(m => ({ default: m.PreviewSliderProvider })), {
  ssr: false,
  loading: () => null,
})
const CartPersistenceProvider = dynamic(() => import('@/components/providers/CartPersistenceProvider'), {
  ssr: false,
  loading: () => null,
})
const ModalProvider = dynamic(() => import('@/contexts/ModalContext').then(m => ({ default: m.ModalProvider })), {
  ssr: false,
  loading: () => null,
})

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

// ⚡ CRITICAL: Lazy load de componentes UI no críticos
// Header y Footer se cargan inmediatamente (críticos para layout)
import Header from '../components/Header/index'
import Footer from '../components/layout/Footer'

// ⚡ PERFORMANCE: Componentes UI no críticos (lazy load)
const ScrollToTop = dynamic(() => import('@/components/Common/ScrollToTop'), {
  ssr: false,
  loading: () => null,
})
const Toaster = dynamic(() => import('@/components/ui/toast').then(m => ({ default: m.Toaster })), {
  ssr: false,
  loading: () => null,
})

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
// ScrollToTop y Toaster ya son lazy loaded, no necesitan memoización adicional

// Componente NextAuthWrapper para manejar sesiones
const NextAuthWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce')

  return <SessionProvider>{children}</SessionProvider>
})

export default function Providers({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: Inicializar Service Worker para cache de recursos de terceros
    // Esto cachea recursos de Facebook con TTL de 7 días (vs 20min del servidor)
    // Ahorro estimado: 186 KiB según Lighthouse
    // ⚠️ TEMPORAL: Comentado por error de TypeScript (BrowserCacheUtils existe pero TypeScript no lo reconoce)
    // TODO: Investigar problema de TypeScript con export de BrowserCacheUtils
    // Por ahora, el Service Worker se inicializa en otro lugar o se puede habilitar después
    if (process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      // Service Worker initialization - Comentado temporalmente por error de TypeScript
      // Se puede habilitar después de resolver el problema de export
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
    // Detectar si estamos en rutas de autenticación
    const isAuthRoute = pathname?.startsWith('/auth/') || pathname === '/auth'

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
                            {!isAdminRoute && !isAuthRoute && <MemoizedHeader />}

                            {/* Ocultar el modal del carrito en checkout para no bloquear inputs */}
                            {!isAdminRoute && !isCheckoutRoute && !isAuthRoute && <CartSidebarModal />}
                            <PreviewSliderModal />
                            <ScrollToTop />

                            {/* Contenido principal */}
                            {children}

                            {/* Footer solo para rutas públicas - Memoizado */}
                            {!isAdminRoute && !isAuthRoute && <MemoizedFooter />}

                            {/* Navegación móvil inferior - Solo visible en móviles - TEMPORALMENTE DESACTIVADO */}
                            {/* <div className="md:hidden">
                      <BottomNavigation />
                    </div> */}

                            {/* Botones flotantes - Lazy loaded y solo para rutas públicas */}
                            {!isAdminRoute && !isCheckoutRoute && !isAuthRoute && <FloatingCartButton />}
                            {!isAdminRoute && !isCheckoutRoute && !isAuthRoute && <FloatingWhatsAppButton />}

                            {/* Notificación del carrito deshabilitada por requerimiento */}
                            {/* {!isAdminRoute && (
                                <CartNotification
                                  show={notification.show}
                                  productName={notification.productName}
                                  productImage={notification.productImage}
                                  onClose={hideNotification}
                                />
                              )} */}

                            {/* Toaster para notificaciones - Lazy loaded */}
                            <Toaster />
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
