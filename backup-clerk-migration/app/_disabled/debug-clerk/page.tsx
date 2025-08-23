'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function ClerkDebugPage() {
  const { user, isLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const info = {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        unsafeMetadata: user.unsafeMetadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignInAt: user.lastSignInAt,
        // Verificaciones específicas
        checks: {
          hasPublicRole: !!user.publicMetadata?.role,
          publicRoleValue: user.publicMetadata?.role,
          publicRoleType: typeof user.publicMetadata?.role,
          isPublicRoleAdmin: user.publicMetadata?.role === 'admin',
          hasPrivateRole: !!user.privateMetadata?.role,
          privateRoleValue: user.privateMetadata?.role,
          privateRoleType: typeof user.privateMetadata?.role,
          isPrivateRoleAdmin: user.privateMetadata?.role === 'admin',
        }
      };
      setDebugInfo(info);
    }
  }, [user, isLoaded]);

  const handleForceRefresh = async () => {
    try {
      // Forzar recarga del usuario
      await user?.reload();
      console.log('Usuario recargado exitosamente');
      
      // Actualizar debug info
      if (user) {
        const info = {
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          publicMetadata: user.publicMetadata,
          privateMetadata: user.privateMetadata,
          unsafeMetadata: user.unsafeMetadata,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastSignInAt: user.lastSignInAt,
          checks: {
            hasPublicRole: !!user.publicMetadata?.role,
            publicRoleValue: user.publicMetadata?.role,
            publicRoleType: typeof user.publicMetadata?.role,
            isPublicRoleAdmin: user.publicMetadata?.role === 'admin',
            hasPrivateRole: !!user.privateMetadata?.role,
            privateRoleValue: user.privateMetadata?.role,
            privateRoleType: typeof user.privateMetadata?.role,
            isPrivateRoleAdmin: user.privateMetadata?.role === 'admin',
          }
        };
        setDebugInfo(info);
      }
    } catch (error) {
      console.error('Error recargando usuario:', error);
    }
  };

  const handleTestAdminAccess = () => {
    // Intentar acceder a ruta admin
    window.open('/admin', '_blank');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información de usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Usuario no autenticado</h1>
          <p className="mb-4">Debes iniciar sesión para usar esta herramienta de debug.</p>
          <a 
            href="/signin" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Debug Clerk Metadata - Pinteya E-commerce
          </h1>
          <p className="text-gray-600">
            Herramienta de diagnóstico para verificar metadata de usuario en tiempo real
          </p>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleForceRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 Forzar Recarga
            </button>
            <button
              onClick={handleTestAdminAccess}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              🚀 Probar Acceso Admin
            </button>
          </div>
        </div>

        {debugInfo && (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className={`bg-white rounded-lg shadow-md p-6 ${debugInfo.checks.isPublicRoleAdmin ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                <h3 className="font-bold text-lg mb-2">Public Metadata</h3>
                <p className={`text-2xl font-bold ${debugInfo.checks.isPublicRoleAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {debugInfo.checks.isPublicRoleAdmin ? '✅ Admin' : '❌ No Admin'}
                </p>
                <p className="text-sm text-gray-600">
                  Rol: {debugInfo.checks.publicRoleValue || 'undefined'}
                </p>
              </div>

              <div className={`bg-white rounded-lg shadow-md p-6 ${debugInfo.checks.isPrivateRoleAdmin ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`}>
                <h3 className="font-bold text-lg mb-2">Private Metadata</h3>
                <p className={`text-2xl font-bold ${debugInfo.checks.isPrivateRoleAdmin ? 'text-green-600' : 'text-yellow-600'}`}>
                  {debugInfo.checks.isPrivateRoleAdmin ? '✅ Admin' : '⚠️ No Admin'}
                </p>
                <p className="text-sm text-gray-600">
                  Rol: {debugInfo.checks.privateRoleValue || 'undefined'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg mb-2">Usuario</h3>
                <p className="text-lg font-semibold text-blue-600">
                  {debugInfo.email}
                </p>
                <p className="text-sm text-gray-600">
                  ID: {debugInfo.userId}
                </p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">📊 Diagnóstico</h2>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${debugInfo.checks.isPublicRoleAdmin ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className="font-bold mb-2">
                    {debugInfo.checks.isPublicRoleAdmin ? '✅' : '❌'} Public Metadata Check
                  </h3>
                  <p>
                    <strong>Valor:</strong> "{debugInfo.checks.publicRoleValue}" 
                    <span className="text-gray-500"> (tipo: {debugInfo.checks.publicRoleType})</span>
                  </p>
                  <p>
                    <strong>Condición middleware:</strong> publicMetadata.role === 'admin' → {debugInfo.checks.isPublicRoleAdmin ? 'true' : 'false'}
                  </p>
                  {!debugInfo.checks.isPublicRoleAdmin && (
                    <p className="text-red-600 mt-2">
                      🔧 <strong>Problema:</strong> El middleware no detectará rol admin. Configurar role: "admin" en public metadata.
                    </p>
                  )}
                </div>

                <div className={`p-4 rounded-lg ${debugInfo.checks.isPrivateRoleAdmin ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <h3 className="font-bold mb-2">
                    {debugInfo.checks.isPrivateRoleAdmin ? '✅' : '⚠️'} Private Metadata Check
                  </h3>
                  <p>
                    <strong>Valor:</strong> "{debugInfo.checks.privateRoleValue}" 
                    <span className="text-gray-500"> (tipo: {debugInfo.checks.privateRoleType})</span>
                  </p>
                  <p>
                    <strong>Estado:</strong> {debugInfo.checks.isPrivateRoleAdmin ? 'Configurado correctamente' : 'No configurado (opcional)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">🔍 Datos Raw</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Public Metadata</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(debugInfo.publicMetadata, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Private Metadata</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(debugInfo.privateMetadata, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Información General</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify({
                      userId: debugInfo.userId,
                      email: debugInfo.email,
                      createdAt: debugInfo.createdAt,
                      updatedAt: debugInfo.updatedAt,
                      lastSignInAt: debugInfo.lastSignInAt
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}