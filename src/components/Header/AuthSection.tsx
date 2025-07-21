"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu } from "lucide-react";

interface AuthSectionProps {
  variant?: 'desktop' | 'mobile' | 'topbar';
}

const AuthSection = ({ variant = 'desktop' }: AuthSectionProps) => {
  // Control de activación de Clerk (ACTIVADO para autenticación real)
  const clerkEnabled = true; // ✅ ACTIVADO - Para usar autenticación real con Clerk
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { isLoaded } = useUser();

  // Componente skeleton para estado de carga
  const AuthSkeleton = () => (
    <div className="flex items-center gap-2">
      <div className="h-8 w-24 bg-white/20 rounded animate-pulse loading-shimmer" />
    </div>
  );

  const handleAuthToggle = () => {
    setIsSignedIn(!isSignedIn);
  };

  if (clerkEnabled) {
    // Versión con Clerk - Adaptada para mobile y desktop
    if (variant === 'mobile') {
      if (!isLoaded) {
        return <AuthSkeleton />;
      }

      return (
        <div className="flex items-center">
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
            <button
              className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 p-2 flex items-center justify-center floating-button focus-ring group"
            >
              <Link href="/signin" className="flex items-center justify-center">
                {/* Logo de Google en colores oficiales */}
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </Link>
            </button>
          </SignedOut>
        </div>
      );
    }

    if (variant === 'topbar') {
      return (
        <div className="flex items-center">
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6",
                  userButtonTrigger: "focus:shadow-none"
                }
              }}
            />
          </SignedIn>

          <SignedOut>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-gray-800 hover:text-gray-900 text-xs px-2 py-1 h-auto"
            >
              <Link href="/signin">
                Ingresá
              </Link>
            </Button>
          </SignedOut>
        </div>
      );
    }

    // Versión desktop con Clerk
    if (!isLoaded) {
      return <AuthSkeleton />;
    }

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
          <button
            className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 p-2 flex items-center justify-center"
          >
            <Link href="/signin" className="flex items-center justify-center">
              {/* Logo de Google en colores oficiales */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </Link>
          </button>
        </SignedOut>
      </div>
    );
  }

  // Versión mobile simplificada
  if (variant === 'mobile') {
    return (
      <div className="flex items-center">
        {isSignedIn ? (
          <div className="flex items-center gap-2" data-testid="signed-in-mobile">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                U
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAuthToggle}
              className="gap-2 border-white text-white hover:bg-white hover:text-blaze-orange-600 text-xs px-3 py-1"
            >
              <Menu className="w-4 h-4" />
              Menú
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-white text-white hover:bg-white hover:text-blaze-orange-600 text-xs px-3 py-1"
            data-testid="signin-mobile"
          >
            <Link href="/signin">
              <LogIn className="w-4 h-4 mr-1" />
              Iniciar Sesión
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Versión desktop completa
  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? (
        <div className="flex items-center gap-3" data-testid="signed-in">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuthToggle}
            className="gap-2 border-white text-white hover:bg-white hover:text-blaze-orange-600"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2" data-testid="signed-out">
          <Button variant="outline" size="sm" asChild className="border-white text-white hover:bg-white hover:text-blaze-orange-600">
            <Link href="/signin">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-white text-blaze-orange-600 hover:bg-gray-100">
            <Link href="/signup">
              <UserPlus className="w-4 h-4 mr-2" />
              Registrarse
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuthSection;
