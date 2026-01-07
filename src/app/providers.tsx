'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
// ⚡ PERFORMANCE: BrowserCacheUtils se carga dinámicamente en useEffect
// Esto reduce Script Evaluation inicial (no se carga hasta que se necesita)
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { useDeferredHydration } from '@/hooks/useDeferredHydration'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'

// ⚡ FIX CRÍTICO: Redux debe cargarse inmediatamente - componentes lo necesitan en render inicial
// Revertir lazy load de Redux porque componentes críticos (cart, buy) lo usan inmediatamente
import { ReduxProvider } from '@/redux/provider'

// ⚡ FASE 2.1: Solo lazy load de React Query (no crítico para render inicial)
// Redux se mantiene crítico porque componentes lo usan inmediatamente
const QueryClientProviderLazy = dynamic(() => import('@/components/providers/QueryClientProvider').then(m => ({ default: m.QueryClientProvider })), {
  ssr: true, // SSR necesario para data fetching inicial
  loading: () => null,
})

// ⚡ FASE 2.1: Wrapper para diferir solo React Query hasta después del TTI
const DeferredQueryProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  // ⚡ Diferir carga de React Query hasta después del TTI
  // Redux se carga inmediatamente porque es crítico
  const shouldLoad = useDeferredHydration({
    minDelay: process.env.NODE_ENV === 'development' ? 0 : 2000, // 2s en prod (reducido de 3s)
    maxDelay: process.env.NODE_ENV === 'development' ? 0 : 4000, // 4s máximo (reducido de 5s)
    useIdleCallback: process.env.NODE_ENV === 'production',
  })

  if (!shouldLoad) {
    // Renderizar sin React Query - componentes usarán fallbacks o esperarán
    return <>{children}</>
  }

  return (
    <QueryClientProviderLazy>
      {children}
    </QueryClientProviderLazy>
  )
})
DeferredQueryProvider.displayName = 'DeferredQueryProvider'

// ⚡ PERFORMANCE: Error boundary crítico (carga inmediata)
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

// ⚡ DESACTIVADO: Botones flotantes reemplazados por bottom navigation estilo MercadoLibre
// const FloatingCartButton = dynamic(() => import('@/components/ui/floating-cart-button'), {
//   ssr: false,
//   loading: () => null,
// })

// const FloatingWhatsAppButton = dynamic(() => import('@/components/ui/floating-whatsapp-button'), {
//   ssr: false,
//   loading: () => null,
// })

// ⚡ PERFORMANCE: Bottom navigation estilo MercadoLibre (lazy load)
const MercadoLibreBottomNav = dynamic(() => import('@/components/ui/bottom-navigation-mercadolibre').then(m => ({ default: m.MercadoLibreBottomNav })), {
  ssr: false,
  loading: () => null,
})

// ⚡ PERFORMANCE: Memoizar componentes para evitar re-renders innecesarios
// ⚡ FIX: Header no recibe props, así que memo no ayuda - el problema está en los hooks internos
// La optimización debe hacerse dentro del componente Header mismo
const MemoizedHeader = Header // No memoizar ya que no recibe props y los hooks internos causan re-renders
const MemoizedFooter = React.memo(Footer)
// ScrollToTop y Toaster ya son lazy loaded, no necesitan memoización adicional

// Componente NextAuthWrapper para manejar sesiones
const NextAuthWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce')

  return <SessionProvider>{children}</SessionProvider>
})

// ⚡ FASE 4: Componente wrapper para diferir providers no críticos después del LCP
const DeferredProviders = React.memo(({ 
  children, 
  isAdminRoute, 
  isCheckoutRoute, 
  isAuthRoute 
}: { 
  children: React.ReactNode
  isAdminRoute: boolean
  isCheckoutRoute: boolean
  isAuthRoute: boolean
}) => {
  // ⚡ FASE 4: Diferir hidratación de providers no críticos después del LCP
  // ⚡ FIX: En desarrollo, hidratar inmediatamente para evitar recargas molestas
  // En producción, mantener la hidratación diferida para mejor performance
  const shouldHydrate = useDeferredHydration({
    minDelay: process.env.NODE_ENV === 'development' ? 0 : 1000, // Inmediato en dev, 1s en prod
    maxDelay: process.env.NODE_ENV === 'development' ? 0 : 2000, // Inmediato en dev, 2s en prod
    useIdleCallback: process.env.NODE_ENV === 'production', // Solo usar idle callback en prod
  })

  if (!shouldHydrate) {
    // Renderizar sin providers no críticos para reducir TBT
    return <>{children}</>
  }

  return (
    <MonitoringProvider
      autoStart={process.env.NODE_ENV === 'production'}
      enableErrorBoundary={true}
    >
      <NetworkErrorProvider enableDebugMode={process.env.NODE_ENV === 'development'}>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </NetworkErrorProvider>
    </MonitoringProvider>
  )
})
DeferredProviders.displayName = 'DeferredProviders'

// ⚡ FASE 4: Componente wrapper para diferir componentes UI no críticos después del LCP
// Componente wrapper para bottom nav que se oculta cuando el cart modal está abierto
const BottomNavWrapper = ({ 
  isAdminRoute, 
  isAuthRoute,
  isCheckoutRoute
}: { 
  isAdminRoute: boolean
  isAuthRoute: boolean
  isCheckoutRoute: boolean
}) => {
  // Obtener estado del cart modal para ocultar bottom nav cuando está abierto
  let isCartModalOpen = false
  try {
    const cartContext = useCartModalContext()
    isCartModalOpen = cartContext.isCartModalOpen
  } catch {
    // Si el contexto no está disponible, continuar sin error
  }

  if (isAdminRoute || isAuthRoute || isCheckoutRoute || isCartModalOpen) {
    return null
  }

  return <MercadoLibreBottomNav />
}

const DeferredComponents = React.memo(({ 
  isAdminRoute, 
  isAuthRoute,
  isCheckoutRoute
}: { 
  isAdminRoute: boolean
  isAuthRoute: boolean
  isCheckoutRoute: boolean
}) => {
  // ⚡ FASE 4: Diferir hidratación de componentes UI no críticos después del LCP
  // ⚡ FIX: En desarrollo, hidratar inmediatamente para evitar recargas molestas
  const shouldHydrate = useDeferredHydration({
    minDelay: process.env.NODE_ENV === 'development' ? 0 : 500, // Inmediato en dev, 500ms en prod
    maxDelay: process.env.NODE_ENV === 'development' ? 0 : 1000, // Inmediato en dev, 1s en prod
    useIdleCallback: process.env.NODE_ENV === 'production', // Solo usar idle callback en prod
  })

  if (!shouldHydrate) {
    return null
  }

  return (
    <>
      <ScrollToTop />
      <BottomNavWrapper 
        isAdminRoute={isAdminRoute}
        isAuthRoute={isAuthRoute}
        isCheckoutRoute={isCheckoutRoute}
      />
      <Toaster />
    </>
  )
})
DeferredComponents.displayName = 'DeferredComponents'

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
          enableAutoRecovery={false}
          enableReporting={true}
          recoveryTimeout={10000}
        >
          {/* ⚡ FIX: Redux crítico - cargar inmediatamente. React Query lazy loaded */}
          <ReduxProvider>
            <DeferredQueryProvider>
            {/* 3. Cart persistence - Crítico para carrito */}
            <CartPersistenceProvider>
              {/* 4. Modal provider - Crítico para UI */}
              <ModalProvider>
                <CartModalProvider>
                  <PreviewSliderProvider>
                    {/* ⚡ FASE 4: Providers diferidos después del LCP para reducir TBT */}
                    <DeferredProviders
                      isAdminRoute={isAdminRoute}
                      isCheckoutRoute={isCheckoutRoute}
                      isAuthRoute={isAuthRoute}
                    >
                      {/* Header y Footer solo para rutas públicas - Memoizados para performance */}
                      {!isAdminRoute && !isAuthRoute && !isCheckoutRoute && <MemoizedHeader />}

                      {/* Ocultar el modal del carrito en checkout para no bloquear inputs */}
                      {!isAdminRoute && !isCheckoutRoute && !isAuthRoute && <CartSidebarModal />}
                      <PreviewSliderModal />
                      
                      {/* ⚡ FASE 4: Componentes diferidos después del LCP */}
                      <DeferredComponents
                        isAdminRoute={isAdminRoute}
                        isAuthRoute={isAuthRoute}
                        isCheckoutRoute={isCheckoutRoute}
                      />

                      {/* Contenido principal */}
                      {children}

                      {/* Footer solo para rutas públicas - Memoizado */}
                      {!isAdminRoute && !isAuthRoute && !isCheckoutRoute && <MemoizedFooter />}
                    </DeferredProviders>
                  </PreviewSliderProvider>
                </CartModalProvider>
              </ModalProvider>
            </CartPersistenceProvider>
            </DeferredQueryProvider>
          </ReduxProvider>
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
