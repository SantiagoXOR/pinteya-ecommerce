/**
 * Página de configuración inicial del sistema
 * Permite crear el usuario administrador
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const AdminSetupPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createAdminUser = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          securityKey: 'CREATE_ADMIN_PINTEYA_2025',
          email: 'santiago@xor.com.ar',
          password: 'SavoirFaire19$'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Configuración del Sistema
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Crear Usuario Administrador
            </h2>
            <p className="text-gray-600 mb-4">
              Este proceso creará el usuario administrador principal del sistema con acceso completo al dashboard de analytics.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Datos del Administrador:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li><strong>Email:</strong> santiago@xor.com.ar</li>
                <li><strong>Contraseña:</strong> SavoirFaire19$</li>
                <li><strong>Rol:</strong> Administrador</li>
                <li><strong>Permisos:</strong> Acceso completo</li>
              </ul>
            </div>

            <button
              onClick={createAdminUser}
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
              }`}
            >
              {isLoading ? 'Creando Usuario...' : 'Crear Usuario Administrador'}
            </button>
          </div>

          {/* Resultado */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">✅ Usuario Creado Exitosamente</h3>
              <div className="text-green-800 text-sm">
                <p><strong>Mensaje:</strong> {result.message}</p>
                <p><strong>Email:</strong> {result.user?.email}</p>
                <p><strong>ID de Auth:</strong> {result.user?.auth_id}</p>
                <p><strong>Rol:</strong> {result.user?.profile?.user_roles?.role_name}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-900 mb-2">❌ Error</h3>
              <p className="text-red-800 text-sm">{error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Próximos Pasos:</h3>
            <ol className="text-gray-700 text-sm space-y-1 list-decimal list-inside">
              <li>Crear el usuario administrador usando el botón de arriba</li>
              <li>Ir a la página de login de Clerk</li>
              <li>Iniciar sesión con las credenciales del administrador</li>
              <li>Acceder al dashboard de analytics en <code>/admin/analytics</code></li>
              <li>Verificar que todos los permisos funcionen correctamente</li>
            </ol>
          </div>

          {/* Enlaces útiles */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Enlaces Útiles:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/signin"
                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium text-blue-900">Iniciar Sesión</div>
                <div className="text-blue-700 text-sm">Página de login de Clerk</div>
              </Link>
              <a
                href="/admin/analytics"
                className="block p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="font-medium text-purple-900">Dashboard Analytics</div>
                <div className="text-purple-700 text-sm">Panel de administración</div>
              </a>
              <a
                href="/demo/analytics"
                className="block p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-medium text-green-900">Demo Analytics</div>
                <div className="text-green-700 text-sm">Demostración del sistema</div>
              </a>
              <a
                href="/api/auth/sync-user"
                className="block p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="font-medium text-orange-900">API Sync User</div>
                <div className="text-orange-700 text-sm">Sincronización de usuarios</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;









