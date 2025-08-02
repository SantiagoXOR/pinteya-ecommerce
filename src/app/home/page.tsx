"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Página de redirección inteligente después del login
 * Redirige a /admin si es admin, a /shop si es usuario normal
 */
export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log('[HOME_PAGE] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');
    return;

    // CÓDIGO COMENTADO TEMPORALMENTE
    // if (!isLoaded) {
    //   console.log('[HOME_PAGE] 🔄 Cargando usuario...');
    //   return;
    // }

    // if (!user) {
    //   console.log('[HOME_PAGE] ❌ Usuario no autenticado, redirigiendo a signin');
    //   router.push('/signin');
    //   return;
    // }

    // // Debug completo del usuario
    // console.log('[HOME_PAGE] 🔍 USUARIO AUTENTICADO:', {
    //   id: user.id,
    //   email: user.emailAddresses[0]?.emailAddress,
    //   publicMetadata: user.publicMetadata,
    //   privateMetadata: user.privateMetadata,
    //   createdAt: user.createdAt,
    //   lastSignInAt: user.lastSignInAt
    // });

    // // Verificar rol de admin
    // const isAdmin = user.publicMetadata?.role === 'admin' ||
    //                user.privateMetadata?.role === 'admin';

    // console.log('[HOME_PAGE] 🔍 VERIFICACIÓN DE ROL:', {
    //   publicRole: user.publicMetadata?.role,
    //   privateRole: user.privateMetadata?.role,
    //   isAdmin
    // });

    // if (isAdmin) {
    //   console.log('[HOME_PAGE] 🚀 Usuario admin detectado, redirigiendo a /admin');
    //   router.push('/admin');
    // } else {
    //   console.log('[HOME_PAGE] 🛍️ Usuario normal detectado, redirigiendo a /shop');
    //   router.push('/shop');
    // }
  }, [user, isLoaded, router]);

  // Mostrar loading mientras se determina la redirección
  return (
    <div className="min-h-screen flex items-center justify-center bg-blaze-orange-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirigiendo...
        </h2>
        <p className="text-gray-600">
          Determinando tu destino según tu rol de usuario
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <strong>🔍 Debug Info:</strong>
            <br />
            User Loaded: {isLoaded ? '✅' : '❌'}
            <br />
            User ID: {user?.id || 'N/A'}
            <br />
            Public Role: {user?.publicMetadata?.role as string || 'N/A'}
            <br />
            Private Role: {user?.privateMetadata?.role as string || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}
