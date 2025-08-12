"use client";

import { SignUp } from "@clerk/nextjs";

interface SignUpWrapperProps {
  redirectUrl?: string;
}

export default function SignUpWrapper({ redirectUrl = "/shop" }: SignUpWrapperProps) {
  return (
    <SignUp
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
