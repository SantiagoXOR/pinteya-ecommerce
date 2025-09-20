"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";

// Providers de la aplicación
import { ModalProvider } from "./context/QuickViewModalContext";
import { CartModalProvider } from "./context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import { PreviewSliderProvider } from "./context/PreviewSliderContext";
import CartPersistenceProvider from "@/components/providers/CartPersistenceProvider";
import { SimpleAnalyticsProvider as AnalyticsProvider } from '@/components/Analytics/SimpleAnalyticsProvider';
import { QueryClientProvider } from "@/components/providers/QueryClientProvider";
import { NetworkErrorProvider } from "@/components/providers/NetworkErrorProvider";
import { MonitoringProvider } from "@/providers/MonitoringProvider";


// Componentes UI
import HeaderNextAuth from "../components/Header/HeaderNextAuth";
import Footer from "../components/layout/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import CartNotification, { useCartNotification } from "@/components/Common/CartNotification";
// import { BottomNavigation } from "@/components/ui/bottom-navigation";
import FloatingCartButton from "@/components/ui/floating-cart-button";
import { Toaster } from "@/components/ui/toast";

// Componente NextAuthWrapper para manejar sesiones
function NextAuthWrapper({ children }: { children: React.ReactNode }) {
  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce');

  return (
    <SessionProvider session={null}>
      {children}
    </SessionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    // Verificar que estamos en el cliente para evitar errores de SSG
    setIsClient(true);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // ✅ NEXTAUTH.JS ACTIVADO - Migración completada 21/08/2025
  // NextAuth.js reemplaza a Clerk para autenticación
  const nextAuthEnabled = true; // ✅ ACTIVADO - Sistema funcional

  // Componente interno con todos los providers
  const AppContent = () => {
    const { notification, hideNotification } = useCartNotification();
    const pathname = usePathname();

    // Detectar si estamos en rutas de admin
    const isAdminRoute = pathname?.startsWith('/admin');

    // DEBUG: Logs para verificar la detección de rutas admin (DESHABILITADO)
    // console.log('🔧 PROVIDERS DEBUG:', {
    //   pathname,
    //   isAdminRoute,
    //   timestamp: new Date().toISOString()
    // });

    return (
      <>
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <MonitoringProvider
              autoStart={process.env.NODE_ENV === 'production'}
              enableErrorBoundary={true}
            >
              <QueryClientProvider>
                <NetworkErrorProvider enableDebugMode={process.env.NODE_ENV === 'development'}>
                  <ReduxProvider>
                    <CartPersistenceProvider>
                      <AnalyticsProvider>
                        <CartModalProvider>
                          <ModalProvider>
                            <PreviewSliderProvider>

                    {/* Header y Footer solo para rutas públicas */}
                    {!isAdminRoute && <HeaderNextAuth />}

                    <QuickViewModal />
                    {/* CartSidebarModal solo para rutas públicas */}
                    {!isAdminRoute && <CartSidebarModal />}
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

                    {/* Botón de carrito flotante - Solo en rutas públicas */}
                    {!isAdminRoute && <FloatingCartButton />}

                    {/* Notificación del carrito - Solo en rutas públicas */}
                    {!isAdminRoute && (
                      <CartNotification
                        show={notification.show}
                        productName={notification.productName}
                        productImage={notification.productImage}
                        onClose={hideNotification}
                      />
                    )}

                    {/* Toaster para notificaciones */}
                    <Toaster />
                            </PreviewSliderProvider>
                          </ModalProvider>
                        </CartModalProvider>
                      </AnalyticsProvider>
                    </CartPersistenceProvider>
                  </ReduxProvider>
                </NetworkErrorProvider>
              </QueryClientProvider>
            </MonitoringProvider>
          </>
        )}
      </>
    );
  };

  // Renderizado con NextAuth.js SessionProvider
  if (nextAuthEnabled) {
    return (
      <NextAuthWrapper>
        <AppContent />
      </NextAuthWrapper>
    );
  }

  // Fallback sin autenticación
  return <AppContent />;
}









