"use client";

import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function TestClerkPage() {
  // Control de activación de Clerk (ACTIVADO - Variables configuradas en Vercel)
  const clerkEnabled = true; // ✅ ACTIVADO - Variables de entorno configuradas

  // Siempre llamar hooks para evitar errores de React
  const userHook = useUser();

  // Solo usar los datos si Clerk está habilitado
  const user = clerkEnabled ? userHook.user : null;
  const isLoaded = clerkEnabled ? userHook.isLoaded : true;

  if (!isLoaded) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (clerkEnabled) {
    // Versión con Clerk activo
    if (!isLoaded) {
      return (
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test de Clerk - ✅ Activo</h1>

        <SignedIn>
          <div className="bg-green-100 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold">✅ Usuario autenticado:</h2>
            <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}</p>
            <p><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Última conexión:</strong> {user?.lastSignInAt?.toLocaleString()}</p>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="bg-blue-100 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold">🔐 Usuario no autenticado</h2>
            <p>Por favor, inicia sesión para continuar.</p>
            <div className="mt-4 space-x-4">
              <Link
                href="/signin"
                className="bg-tahiti-gold-500 text-white px-4 py-2 rounded hover:bg-tahiti-gold-600 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/signup"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </SignedOut>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold">🔧 Estado de Clerk</h2>
          <p><strong>Cargado:</strong> {isLoaded ? '✅ Sí' : '⏳ Cargando...'}</p>
          <p><strong>Usuario:</strong> {user ? '✅ Autenticado' : '❌ No autenticado'}</p>
          <p><strong>Versión:</strong> @clerk/nextjs 6.21.0</p>
          <p><strong>React:</strong> 18.2.0</p>
          <p><strong>Next.js:</strong> 15.3.3</p>
        </div>
      </div>
    );
  }

  // Versión sin Clerk (temporalmente desactivado)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Clerk - ⚠️ Temporalmente Desactivado</h1>

      <div className="bg-yellow-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold">⚠️ Estado Actual</h2>
        <p>Clerk está temporalmente desactivado para permitir el desarrollo sin bloqueos.</p>
        <p>Para reactivar: cambiar <code>clerkEnabled = true</code> en providers.tsx y AuthSection.tsx</p>
      </div>

      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold">🔧 Información del Sistema</h2>
        <p><strong>Versión Clerk:</strong> @clerk/nextjs 6.21.0</p>
        <p><strong>React:</strong> 18.2.0</p>
        <p><strong>Next.js:</strong> 15.3.3</p>
        <p><strong>Estado:</strong> Configurado pero desactivado</p>
      </div>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="text-lg font-semibold">✅ Funcionalidad Temporal</h2>
        <p>La aplicación funciona completamente sin autenticación.</p>
        <p>Todas las funciones de e-commerce están operativas.</p>
        <div className="mt-4 space-x-4">
          <Link
            href="/shop"
            className="bg-tahiti-gold-500 text-white px-4 py-2 rounded hover:bg-tahiti-gold-600 transition-colors"
          >
            Ir a la Tienda
          </Link>
          <Link
            href="/my-account"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Mi Cuenta (Demo)
          </Link>
        </div>
      </div>
    </div>
  );
}
