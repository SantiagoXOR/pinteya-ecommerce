"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, UserPlus, LogOut } from "lucide-react";

const AuthSection = () => {
  // Control de activación de Clerk (TEMPORALMENTE DESACTIVADO para mostrar botones)
  const clerkEnabled = false; // ⚠️ TEMPORALMENTE DESACTIVADO - Para mostrar botones de autenticación
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

  // Versión temporal sin Clerk - Migrada al Design System
  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? (
        <div className="flex items-center gap-3">
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
      )}
    </div>
  );
};

export default AuthSection;
