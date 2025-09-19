"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * Se ejecuta solo en el cliente para evitar problemas con SSG
 */
export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isLoaded && !isSignedIn) {
      router.push('/signin');
    }
  }, [isMounted, isLoaded, isSignedIn, router]);

  // Durante SSG o antes de montar, mostrar fallback
  if (!isMounted || !isLoaded) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tahiti-gold-600"></div>
      </div>
    );
  }

  // Si no está autenticado, mostrar fallback
  if (!isSignedIn) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
          <button
            onClick={() => router.push('/signin')}
            className="bg-tahiti-gold-600 text-white px-6 py-2 rounded-md hover:bg-tahiti-gold-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
}









