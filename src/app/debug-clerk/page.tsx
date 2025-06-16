"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugClerkPage() {
  const [mounted, setMounted] = useState(false);
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [clerkLoaded, setClerkLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Intentar cargar Clerk y capturar errores
    const checkClerk = async () => {
      try {
        // Verificar si Clerk está disponible globalmente
        if (typeof window !== 'undefined') {
          // @ts-ignore
          if (window.Clerk) {
            setClerkLoaded(true);
          } else {
            // Esperar un poco más para que Clerk se cargue
            setTimeout(() => {
              // @ts-ignore
              if (window.Clerk) {
                setClerkLoaded(true);
              } else {
                setClerkError('Clerk no se cargó en window.Clerk');
              }
            }, 2000);
          }
        }
      } catch (error) {
        setClerkError(`Error al verificar Clerk: ${error}`);
      }
    };

    checkClerk();
  }, []);

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        </div>
      </div>
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug Clerk Configuration</h1>
      
      <div className="space-y-6">
        {/* Environment Variables */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">🔐 Environment Variables</h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="font-medium">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</span>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-sm ${
                  publishableKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {publishableKey ? '✅ Presente' : '❌ Ausente'}
                </span>
                {publishableKey && (
                  <div className="text-xs text-gray-600 font-mono mt-1">
                    {publishableKey.substring(0, 30)}...
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-sm mb-2">Valor completo (solo para debug):</h3>
              <div className="text-xs font-mono break-all text-gray-700">
                {publishableKey || 'No configurado'}
              </div>
            </div>
          </div>
        </div>

        {/* Clerk Loading Status */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-green-600">📦 Clerk Loading Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Clerk Script Loaded:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                clerkLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {clerkLoaded ? '✅ Cargado' : '⏳ Cargando...'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Component Mounted:</span>
              <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                ✅ Montado
              </span>
            </div>

            {clerkError && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <h3 className="font-medium text-red-800 mb-2">❌ Error detectado:</h3>
                <div className="text-sm text-red-700">{clerkError}</div>
              </div>
            )}
          </div>
        </div>

        {/* Browser Environment */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🌐 Browser Environment</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">User Agent:</span>
              <span className="text-sm text-gray-600 max-w-md truncate">
                {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">URL:</span>
              <span className="text-sm text-gray-600">
                {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Protocol:</span>
              <span className="text-sm text-gray-600">
                {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Network Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">🌐 Network Test</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Verificando conectividad con los servicios de Clerk...
            </p>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('https://clerk.com', { mode: 'no-cors' });
                  console.log('Clerk.com accessible');
                } catch (error) {
                  console.error('Error accessing Clerk.com:', error);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Test Clerk.com Connectivity
            </button>
          </div>
        </div>

        {/* Manual Clerk Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-red-600">🧪 Manual Clerk Test</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Intentar cargar Clerk manualmente para diagnóstico...
            </p>
            
            <button
              onClick={async () => {
                try {
                  // Intentar importar Clerk dinámicamente
                  const { useUser } = await import('@clerk/nextjs');
                  console.log('Clerk imported successfully:', useUser);
                  alert('✅ Clerk se importó correctamente');
                } catch (error) {
                  console.error('Error importing Clerk:', error);
                  alert(`❌ Error al importar Clerk: ${error}`);
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Test Clerk Import
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">💡 Recommendations</h2>
          <div className="space-y-3">
            {!publishableKey && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <h3 className="font-medium text-red-800 mb-2">❌ Variable de entorno faltante</h3>
                <p className="text-sm text-red-700">
                  Configura NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY en Vercel
                </p>
              </div>
            )}
            
            {publishableKey && !clerkLoaded && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ Clerk no se carga</h3>
                <p className="text-sm text-yellow-700">
                  La variable está configurada pero Clerk no se carga. Verifica la conectividad de red.
                </p>
              </div>
            )}
            
            {publishableKey && clerkLoaded && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">✅ Todo parece estar bien</h3>
                <p className="text-sm text-green-700">
                  Clerk está configurado y cargado correctamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔧 Actions</h2>
          <div className="space-x-4">
            <Link
              href="/test-clerk"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Test Clerk Components
            </Link>
            <Link
              href="/signin"
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Try Sign In
            </Link>
            <Link
              href="/test-env"
              className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              Environment Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
