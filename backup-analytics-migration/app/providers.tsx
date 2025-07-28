"use client";

import { useState, useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

// Providers de la aplicación
import { ModalProvider } from "./context/QuickViewModalContext";
import { CartModalProvider } from "./context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import { PreviewSliderProvider } from "./context/PreviewSliderContext";
import CartPersistenceProvider from "@/components/providers/CartPersistenceProvider";
import { AnalyticsProvider } from "@/components/Analytics/AnalyticsProvider";
import { QueryClientProvider } from "@/components/providers/QueryClientProvider";

// Componentes UI
import Header from "../components/Header";
import Footer from "../components/layout/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import CartNotification, { useCartNotification } from "@/components/Common/CartNotification";
// import { BottomNavigation } from "@/components/ui/bottom-navigation";
import FloatingCartButton from "@/components/ui/floating-cart-button";

// Componente ClerkWrapper simplificado siguiendo las mejores prácticas oficiales
function ClerkWrapper({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validar publishableKey
  if (!publishableKey) {
    console.warn('ClerkProvider: publishableKey is required');
    return <>{children}</>;
  }

  // Durante SSG/hidratación inicial, renderizar sin ClerkProvider para evitar mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  // Una vez montado en el cliente, usar ClerkProvider con configuración oficial
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      signInFallbackRedirectUrl="/shop"
      signUpFallbackRedirectUrl="/shop"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#eb6313', // blaze-orange-600
          colorBackground: '#fef7ee', // blaze-orange-50
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: "bg-blaze-orange-600 hover:bg-blaze-orange-700 text-sm normal-case font-medium",
          card: "shadow-xl border border-blaze-orange-200",
          headerTitle: "text-2xl font-bold text-gray-900",
          headerSubtitle: "text-gray-600",
        }
      }}
    >
      {children}
    </ClerkProvider>
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

  // Configuración de Clerk v5 (ACTIVADO - Variables configuradas en Vercel)
  const clerkEnabled = true; // ✅ ACTIVADO - Variables de entorno configuradas
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Componente interno con todos los providers
  const AppContent = () => {
    const { notification, hideNotification } = useCartNotification();

    return (
      <div className="">{/* mobile-bottom-nav-padding - TEMPORALMENTE DESACTIVADO */}
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
                    <Header />
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

  // Renderizado con ClerkProvider v5 activado (compatible con SSG)
  if (clerkEnabled && publishableKey) {
    return (
      <ClerkWrapper publishableKey={publishableKey}>
        <AppContent />
      </ClerkWrapper>
    );
  }

  // Fallback sin Clerk (si no hay publishableKey)
  return <AppContent />;
}
