"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Importar ClerkProvider de manera dinámica para evitar errores de SSG
const ClerkProviderSSG = dynamic(() => import("@/components/providers/ClerkProviderSSG"), {
  ssr: false,
});

// Providers de la aplicación
import { ModalProvider } from "./context/QuickViewModalContext";
import { CartModalProvider } from "./context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import { PreviewSliderProvider } from "./context/PreviewSliderContext";
import CartPersistenceProvider from "@/components/providers/CartPersistenceProvider";

// Componentes UI
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import CartNotification, { useCartNotification } from "@/components/Common/CartNotification";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

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
      <div className="mobile-bottom-nav-padding">
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <ReduxProvider>
              <CartPersistenceProvider>
                <CartModalProvider>
                  <ModalProvider>
                    <PreviewSliderProvider>
                    <Header />
                    <QuickViewModal />
                    <CartSidebarModal />
                    <PreviewSliderModal />
                    <ScrollToTop />
                    {children}
                    <Footer />
                    {/* Navegación móvil inferior - Solo visible en móviles */}
                    <div className="md:hidden">
                      <BottomNavigation />
                    </div>
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
            </CartPersistenceProvider>
          </ReduxProvider>
          </>
        )}
      </div>
    );
  };

  // Renderizado con ClerkProvider v5 activado (compatible con SSG)
  if (clerkEnabled && publishableKey) {
    return (
      <ClerkProviderSSG publishableKey={publishableKey}>
        <AppContent />
      </ClerkProviderSSG>
    );
  }

  // Fallback sin Clerk (si no hay publishableKey)
  return <AppContent />;
}
