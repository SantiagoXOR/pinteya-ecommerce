"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, UserPlus, LogOut, Menu } from "lucide-react";

interface AuthSectionProps {
  variant?: 'desktop' | 'mobile';
}

const AuthSection = ({ variant = 'desktop' }: AuthSectionProps) => {
  // Control de activación de Clerk (ACTIVADO para autenticación real)
  const clerkEnabled = true; // ✅ ACTIVADO - Para usar autenticación real con Clerk
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleAuthToggle = () => {
    setIsSignedIn(!isSignedIn);
  };

  if (clerkEnabled) {
    // Versión con Clerk - Adaptada para mobile y desktop
    if (variant === 'mobile') {
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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white text-white hover:bg-white hover:text-blaze-orange-600 text-xs px-3 py-1"
            >
              <Link href="/signin">
                <LogIn className="w-4 h-4 mr-1" />
                Iniciar Sesión
              </Link>
            </Button>
          </SignedOut>
        </div>
      );
    }

    // Versión desktop con Clerk
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
          <div className="flex items-center gap-2">
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
