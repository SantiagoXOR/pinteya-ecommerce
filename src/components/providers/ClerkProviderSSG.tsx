"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { useEffect, useState } from "react";

interface ClerkProviderSSGProps {
  children: React.ReactNode;
  publishableKey: string;
}

/**
 * ClerkProvider wrapper que evita errores durante SSG
 * Solo se renderiza en el cliente para evitar problemas de contexto
 */
export default function ClerkProviderSSG({ children, publishableKey }: ClerkProviderSSGProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Durante SSG o hidratación inicial, renderizar sin ClerkProvider
  if (!isMounted) {
    return <>{children}</>;
  }

  // Una vez montado en el cliente, usar ClerkProvider
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
      {children}
    </ClerkProvider>
  );
}
