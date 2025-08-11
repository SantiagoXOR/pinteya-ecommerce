"use client";

import { SignIn } from "@clerk/nextjs";

interface SignInWrapperProps {
  redirectUrl?: string;
}

export default function SignInWrapper({ redirectUrl = "/shop" }: SignInWrapperProps) {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: "bg-tahiti-gold-500 hover:bg-tahiti-gold-700 text-white",
          card: "shadow-none",
          headerTitle: "text-dark",
          headerSubtitle: "text-gray-600",
        }
      }}
      fallbackRedirectUrl={redirectUrl}
    />
  );
}
