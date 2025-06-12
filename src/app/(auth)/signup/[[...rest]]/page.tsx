"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  // Clerk v5 activado y funcionando
  const clerkEnabled = true;

  // Clerk v5 con configuración optimizada
  return (
    <div className="flex min-h-screen items-center justify-center bg-tahiti-gold-50">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/signin"
        redirectUrl="/shop"
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
