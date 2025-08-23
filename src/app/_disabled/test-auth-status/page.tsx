'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function TestAuthStatusPage() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken()
        .then(token => {
          setTokenInfo({
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : null
          });
        })
        .catch(err => {
          setError(err.message);
        });
    }
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-center">Cargando estado de autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔐 Estado de Autenticación - Pinteya
          </h1>

          {/* Estado General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-lg border-2 ${
              isSignedIn ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <h2 className="text-xl font-semibold mb-4">
                {isSignedIn ? '✅ Usuario Autenticado' : '❌ Usuario NO Autenticado'}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Loaded:</strong> {isLoaded ? 'Sí' : 'No'}</p>
                <p><strong>Signed In:</strong> {isSignedIn ? 'Sí' : 'No'}</p>
                <p><strong>User ID:</strong> {userId || 'N/A'}</p>
                <p><strong>Session ID:</strong> {sessionId || 'N/A'}</p>
              </div>
            </div>

            <div className={`p-6 rounded-lg border-2 ${
              tokenInfo?.hasToken ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <h2 className="text-xl font-semibold mb-4">
                🎫 Token de Autenticación
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Tiene Token:</strong> {tokenInfo?.hasToken ? 'Sí' : 'No'}</p>
                <p><strong>Longitud:</strong> {tokenInfo?.tokenLength || 0} caracteres</p>
                <p><strong>Preview:</strong> {tokenInfo?.tokenPreview || 'N/A'}</p>
                {error && (
                  <p className="text-red-600"><strong>Error:</strong> {error}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          {user && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">👤 Información del Usuario</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}</p>
                  <p><strong>Nombre:</strong> {user.firstName || 'N/A'} {user.lastName || 'N/A'}</p>
                  <p><strong>Username:</strong> {user.username || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Creado:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
                  <p><strong>Última actualización:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</p>
                  <p><strong>Email verificado:</strong> {user.primaryEmailAddress?.verification?.status || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tests de Acceso */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">🧪 Tests de Acceso</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.open('/admin', '_blank')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🏠 Probar /admin
              </button>
              <button
                onClick={() => window.open('/admin/products', '_blank')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📦 Probar /admin/products
              </button>
              <button
                onClick={() => window.open('/debug-admin.html', '_blank')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔧 Herramienta Debug
              </button>
            </div>
          </div>

          {/* Información de Debug */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Información de Debug</h2>
            <pre className="text-xs overflow-x-auto bg-white p-4 rounded border">
{JSON.stringify({
  auth: {
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
    hasToken: tokenInfo?.hasToken
  },
  user: user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    emailVerified: user.primaryEmailAddress?.verification?.status
  } : null,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
}, null, 2)}
            </pre>
          </div>

          {/* Navegación */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🏠 Volver al Inicio
            </button>
            {isSignedIn ? (
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                🔧 Ir al Admin Panel
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                🔐 Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
