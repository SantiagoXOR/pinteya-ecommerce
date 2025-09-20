/**
 * Página de Acceso Denegado
 * Mostrada cuando un usuario autenticado intenta acceder a rutas admin sin permisos
 */

'use client';

import Link from 'next/link';
import { Shield, Home, ArrowLeft } from 'lucide-react';

// Metadata se maneja en layout.tsx para client components

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Icono de acceso denegado */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Título y mensaje */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a esta página. Solo los administradores pueden acceder al panel administrativo.
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Permisos Insuficientes
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Esta área está restringida a usuarios con rol de administrador. 
                    Si crees que deberías tener acceso, contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-orange-500 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blaze-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás
            </button>
          </div>

          {/* Información de contacto */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ¿Necesitas ayuda? Contacta al administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}









