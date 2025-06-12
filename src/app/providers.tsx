"use client";

import { useState, useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

// Providers de la aplicación
import { ModalProvider } from "./context/QuickViewModalContext";
import { CartModalProvider } from "./context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import { PreviewSliderProvider } from "./context/PreviewSliderContext";

// Componentes UI
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Configuración de Clerk v5 (ACTIVADO - Variables configuradas en Vercel)
  const clerkEnabled = true; // ✅ ACTIVADO - Variables de entorno configuradas
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Componente interno con todos los providers
  const AppContent = () => (
    <div>
      {loading ? (
        <PreLoader />
      ) : (
        <>
          <ReduxProvider>
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
                </PreviewSliderProvider>
              </ModalProvider>
            </CartModalProvider>
          </ReduxProvider>
        </>
      )}
    </div>
  );

  // Renderizado con ClerkProvider v5 activado
  if (clerkEnabled && publishableKey) {
    return (
      <ClerkProvider
        publishableKey={publishableKey}
        localization={esES}
        signInFallbackRedirectUrl="/shop"
        signUpFallbackRedirectUrl="/shop"
        afterSignOutUrl="/"
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#d97706', // tahiti-gold-600
            colorBackground: '#fffbea', // tahiti-gold-50
            colorInputBackground: '#ffffff',
            colorInputText: '#1f2937',
            borderRadius: '0.5rem',
          },
          elements: {
            formButtonPrimary: "bg-tahiti-gold-600 hover:bg-tahiti-gold-700 text-sm normal-case font-medium",
            card: "shadow-xl border border-tahiti-gold-200",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-600",
          }
        }}
      >
        <AppContent />
      </ClerkProvider>
    );
  }

  // Fallback sin Clerk (solo si no hay publishableKey)
  return <AppContent />;
}
