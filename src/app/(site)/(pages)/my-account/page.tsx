"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

/**
 * PÁGINA TEMPORAL DE REDIRECCIÓN
 * 
 * Esta página existe únicamente para romper el ciclo recursivo
 * causado por configuraciones de Clerk que redirigen a /my-account.
 * 
 * FUNCIÓN: Redirigir inmediatamente a /admin
 * ESTADO: TEMPORAL - Eliminar cuando se corrijan las configuraciones de Clerk
 */
export default function MyAccountRedirectPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    console.log('[MY_ACCOUNT_REDIRECT] 🔄 Página temporal activada - Redirigiendo a /admin');
    
    // Redirección inmediata sin condiciones
    const timer = setTimeout(() => {
      console.log('[MY_ACCOUNT_REDIRECT] ✅ Ejecutando redirección a /admin');
      router.replace('/admin');
    }, 100); // Delay mínimo para evitar problemas de hidratación

    return () => clearTimeout(timer);
  }, [router]);

  // Mostrar mensaje temporal mientras se redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirigiendo al Panel de Administración
        </h2>
        <p className="text-gray-600">
          Por favor espera un momento...
        </p>
      </div>
    </div>
  );
}
