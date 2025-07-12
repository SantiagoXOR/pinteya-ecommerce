"use client";

import React from 'react';

export default function TestStickyHeaderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenido de prueba para scroll */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Prueba del Header Sticky
        </h1>
        
        <div className="space-y-8">
          {/* Sección 1 */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Sección 1 - Inicio de la página
            </h2>
            <p className="text-gray-600 mb-4">
              Esta página está diseñada para probar el comportamiento del header sticky. 
              Cuando hagas scroll hacia abajo, el header debería:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Mantenerse fijo en la parte superior de la pantalla</li>
              <li>Cambiar su posición de lg:top-[44px] a top-0 cuando se active el sticky</li>
              <li>Aplicar un backdrop blur y sombra más pronunciada</li>
              <li>Reducir ligeramente el padding y el tamaño del logo</li>
              <li>Mantener un z-index de 9999 para estar por encima de otros elementos</li>
            </ul>
          </section>

          {/* Secciones de relleno para generar scroll */}
          {Array.from({ length: 10 }, (_, i) => (
            <section key={i} className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Sección {i + 2} - Contenido de prueba
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="text-gray-600">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
                  sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Información técnica del header:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Z-index:</strong> 9999 (tanto en clase como en style)</li>
                    <li><strong>Posición:</strong> fixed left-0 w-full</li>
                    <li><strong>Trigger:</strong> window.scrollY >= 60</li>
                    <li><strong>Transición:</strong> header-sticky-transition (0.3s cubic-bezier)</li>
                    <li><strong>Backdrop:</strong> blur(8px) cuando sticky</li>
                  </ul>
                </div>
              </div>
            </section>
          ))}

          {/* Sección final */}
          <section className="bg-blaze-orange-50 p-8 rounded-lg border border-blaze-orange-200">
            <h2 className="text-2xl font-semibold text-blaze-orange-800 mb-4">
              Final de la página
            </h2>
            <p className="text-blaze-orange-700">
              Si llegaste hasta aquí, el header sticky debería estar funcionando correctamente. 
              Puedes hacer scroll hacia arriba para ver cómo se comporta al volver al inicio.
            </p>
            <div className="mt-4 p-4 bg-white rounded border border-blaze-orange-300">
              <h3 className="font-semibold text-blaze-orange-800 mb-2">
                Correcciones aplicadas:
              </h3>
              <ul className="text-sm text-blaze-orange-700 space-y-1">
                <li>✅ Hook useUserRole mejorado con manejo de errores resiliente</li>
                <li>✅ Z-index corregido de z-9999 a z-[9999] + style zIndex: 9999</li>
                <li>✅ Verificado que ActionButtons no usa useUserRole (usa simulación)</li>
                <li>✅ Confirmado que el header sticky está correctamente implementado</li>
                <li>✅ Padding del contenido principal ajustado en providers.tsx</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
