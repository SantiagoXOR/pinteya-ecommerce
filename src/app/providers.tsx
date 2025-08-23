"use client";

import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";

// Providers de la aplicación
import { ModalProvider } from "./context/QuickViewModalContext";
import { CartModalProvider } from "./context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import { PreviewSliderProvider } from "./context/PreviewSliderContext";
import CartPersistenceProvider from "@/components/providers/CartPersistenceProvider";
import { SimpleAnalyticsProvider as AnalyticsProvider } from '@/components/Analytics/SimpleAnalyticsProvider';
import { QueryClientProvider } from "@/components/providers/QueryClientProvider";

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

// Componente NextAuthWrapper para manejar sesiones
function NextAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Durante SSG/hidratación inicial, renderizar sin SessionProvider para evitar mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  // DEBUG: Log de configuración NextAuth
  console.log('[NEXTAUTH_PROVIDER] NextAuth.js configurado para Pinteya E-commerce');

  return (
    <SessionProvider>
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

    return (
      <div className="app-content-wrapper">{/* mobile-bottom-nav-padding TEMPORALMENTE DESACTIVADO */}
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <QueryClientProvider>
              <ReduxProvider>
                <CartPersistenceProvider>
                  <AnalyticsProvider>
                    <CartModalProvider>
                      <ModalProvider>
                        <PreviewSliderProvider>
                    <HeaderNextAuth />
                    <QuickViewModal />
                    <CartSidebarModal />
                    <PreviewSliderModal />
                    <ScrollToTop />
                    {/* Contenido principal - Padding ya aplicado en body */}
                    <div>
                      {children}
                    </div>
                    <Footer />
                    {/* Navegación móvil inferior - Solo visible en móviles - TEMPORALMENTE DESACTIVADO */}
                    {/* <div className="md:hidden">
                      <BottomNavigation />
                    </div> */}

                    {/* Botón de carrito flotante */}
                    <FloatingCartButton />

                    {/* Notificación del carrito */}
                    <CartNotification
                      show={notification.show}
                      productName={notification.productName}
                      productImage={notification.productImage}
                      onClose={hideNotification}
                    />
                      </PreviewSliderProvider>
                    </ModalProvider>
                  </CartModalProvider>
                </AnalyticsProvider>
              </CartPersistenceProvider>
            </ReduxProvider>
          </QueryClientProvider>
          </>
        )}
      </div>
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
