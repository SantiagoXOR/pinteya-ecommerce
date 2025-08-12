"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  // Clerk ACTIVADO - Variables configuradas en Vercel
  const clerkEnabled = true;

  // Página de mantenimiento temporal para Vercel
  if (!clerkEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tahiti-gold-50">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 Registro en Mantenimiento
          </h1>
          <p className="text-gray-600 mb-6">
            El sistema de registro está temporalmente desactivado durante el deploy.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Serás redirigido automáticamente a la tienda.
          </p>
          <div className="space-y-3">
            <Link
              href="/shop"
              className="block w-full bg-tahiti-gold-600 text-white py-2 px-4 rounded-md hover:bg-tahiti-gold-700 transition-colors text-center"
            >
              Ir a la Tienda
            </Link>
            <Link
              href="/"
              className="block w-full text-tahiti-gold-600 py-2 px-4 border border-tahiti-gold-600 rounded-md hover:bg-tahiti-gold-50 transition-colors text-center"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Clerk v5 con configuración optimizada (cuando esté activado)
  return (
    <div className="flex min-h-screen items-center justify-center bg-tahiti-gold-50">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/signin"
        fallbackRedirectUrl="/admin"
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
            socialButtonsBlockButton: "border-tahiti-gold-300 hover:bg-tahiti-gold-50",
            formFieldInput: "border-tahiti-gold-300 focus:border-tahiti-gold-500",
            footerActionLink: "text-tahiti-gold-600 hover:text-tahiti-gold-700",
          }
        }}
      />
    </div>
  );
}
