"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MyAccount from "@/components/MyAccount/MyAccount";
import Breadcrumb from "@/components/Common/Breadcrumb";
import React from "react";

const MyAccountPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout para evitar loading infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn('[MY_ACCOUNT_PAGE] ⚠️ Timeout de carga - Redirigiendo a shop');
        setLoadingTimeout(true);
        router.push('/shop');
      }
    }, 10000); // 10 segundos timeout

    return () => clearTimeout(timeout);
  }, [isLoaded, router]);

  useEffect(() => {
    console.log('[MY_ACCOUNT_PAGE] 🔍 INTERCEPTANDO ACCESO A MY-ACCOUNT');

    if (!isLoaded) {
      console.log('[MY_ACCOUNT_PAGE] ⏳ Esperando carga de usuario...');
      return;
    }

    if (!user) {
      console.log('[MY_ACCOUNT_PAGE] ❌ Usuario no autenticado, redirigiendo a signin');
      router.push('/signin');
      return;
    }

    // Debug completo del usuario
    console.log('[MY_ACCOUNT_PAGE] 🔍 USUARIO EN MY-ACCOUNT:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt
    });

    // Verificar si es admin y redirigir
    const isAdmin = user.publicMetadata?.role === 'admin' ||
                   user.privateMetadata?.role === 'admin';

    console.log('[MY_ACCOUNT_PAGE] 🔍 VERIFICACIÓN DE ROL ADMIN:', {
      publicRole: user.publicMetadata?.role,
      privateRole: user.privateMetadata?.role,
      isAdmin
    });

    if (isAdmin) {
      console.log('[MY_ACCOUNT_PAGE] 🚀 USUARIO ADMIN DETECTADO - REDIRIGIENDO A /admin');
      router.push('/admin');
      return;
    }

    console.log('[MY_ACCOUNT_PAGE] ✅ Usuario normal, permitiendo acceso a my-account');
  }, [user, isLoaded, router]);

  // Mostrar loading mientras se verifica
  if (!isLoaded && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando acceso...
          </h2>
          <p className="text-gray-600">
            Comprobando permisos de usuario
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Si esto toma mucho tiempo, serás redirigido automáticamente
          </p>
        </div>
      </div>
    );
  }

  // Si hay timeout, mostrar mensaje de error
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Problema de conexión
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo verificar tu sesión. Redirigiendo a la tienda...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <Breadcrumb title={"Mi Cuenta"} pages={["Mi Cuenta"]} />
      <MyAccount />
    </main>
  );
};

export default MyAccountPage;
