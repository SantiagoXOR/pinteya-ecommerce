"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Hook para debuggear redirecciones de autenticación
 * Rastrea cambios en el estado de autenticación y logs detallados
 */
export function useAuthRedirectDebug() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { userId, sessionId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const previousStateRef = useRef<any>(null);

  useEffect(() => {
    console.log('[AUTH_DEBUG] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');
    return;

    // CÓDIGO COMENTADO TEMPORALMENTE
    // if (!userLoaded || !authLoaded) {
    //   console.log('[AUTH_DEBUG] 🔄 Cargando estado de autenticación...');
    //   return;
    // }

    // const currentState = {
    //   isSignedIn,
    //   userId,
    //   sessionId,
    //   userRole: user?.publicMetadata?.role,
    //   privateRole: user?.privateMetadata?.role,
    //   pathname: window.location.pathname,
    //   search: window.location.search,
    //   timestamp: new Date().toISOString()
    // };

    // Solo log si el estado cambió
    if (JSON.stringify(currentState) !== JSON.stringify(previousStateRef.current)) {
      console.log('[AUTH_DEBUG] 🔍 CAMBIO DE ESTADO DE AUTENTICACIÓN:', {
        previous: previousStateRef.current,
        current: currentState,
        userMetadata: user ? {
          id: user.id,
          emailAddresses: user.emailAddresses.map(e => e.emailAddress),
          publicMetadata: user.publicMetadata,
          privateMetadata: user.privateMetadata,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt
        } : null
      });

      // Detectar si estamos siendo redirigidos
      if (currentState.isSignedIn && currentState.pathname === '/my-account') {
        console.warn('[AUTH_DEBUG] ⚠️ REDIRECCIÓN DETECTADA A MY-ACCOUNT');
        console.log('[AUTH_DEBUG] 🔍 Analizando causa de redirección...');
        
        // Verificar parámetros de URL
        const errorParam = searchParams.get('error');
        const messageParam = searchParams.get('message');
        
        if (errorParam || messageParam) {
          console.log('[AUTH_DEBUG] 📋 Parámetros de error encontrados:', {
            error: errorParam,
            message: messageParam
          });
        }

        // Verificar rol de usuario
        if (currentState.userRole === 'admin' || currentState.privateRole === 'admin') {
          console.error('[AUTH_DEBUG] 🚨 USUARIO ADMIN REDIRIGIDO INCORRECTAMENTE');
          console.log('[AUTH_DEBUG] 💡 Debería ir a /admin en lugar de /my-account');
        }
      }

      previousStateRef.current = currentState;
    }
  }, [userLoaded, authLoaded, isSignedIn, userId, sessionId, user, searchParams]);

  // Función para forzar redirección a admin
  const forceAdminRedirect = () => {
    if (user?.publicMetadata?.role === 'admin' || user?.privateMetadata?.role === 'admin') {
      console.log('[AUTH_DEBUG] 🔄 Forzando redirección a /admin...');
      router.push('/admin');
    } else {
      console.warn('[AUTH_DEBUG] ⚠️ Usuario no tiene rol admin, no se puede redirigir');
    }
  };

  return {
    forceAdminRedirect,
    isAdmin: user?.publicMetadata?.role === 'admin' || user?.privateMetadata?.role === 'admin',
    debugInfo: {
      isSignedIn,
      userId,
      userRole: user?.publicMetadata?.role,
      privateRole: user?.privateMetadata?.role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : null
    }
  };
}
