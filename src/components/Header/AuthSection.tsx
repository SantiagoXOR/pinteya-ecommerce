"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

const AuthSection = () => {
  // Control de activación de Clerk (temporalmente desactivado para Vercel)
  const clerkEnabled = false; // Desactivado temporalmente para deploy en Vercel
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleAuthToggle = () => {
    setIsSignedIn(!isSignedIn);
  };

  if (clerkEnabled) {
    // Versión con Clerk
    return (
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonTrigger: "focus:shadow-none"
              }
            }}
          />
        </SignedIn>

        <SignedOut>
          <Link
            href="/signin"
            className="text-sm font-medium hover:text-tahiti-gold-500 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-tahiti-gold-500 text-white px-4 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
          >
            Registrarse
          </Link>
        </SignedOut>
      </div>
    );
  }

  // Versión temporal sin Clerk
  return (
    <div className="flex items-center gap-4">
      {isSignedIn ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-tahiti-gold-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          <button
            onClick={handleAuthToggle}
            className="text-sm font-medium text-gray-600 hover:text-tahiti-gold-500 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <>
          <Link
            href="/signin"
            className="text-sm font-medium hover:text-tahiti-gold-500 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-tahiti-gold-500 text-white px-4 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
          >
            Registrarse
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthSection;
