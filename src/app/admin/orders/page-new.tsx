'use client';

import React from 'react';

export default function OrdersPageNew() {
  console.log('🎯 NEW PAGE: OrdersPageNew renderizando correctamente');
  
  return (
    <div className="min-h-screen bg-green-100 p-8">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">🎯 NUEVA PÁGINA - Admin Orders</h1>
        <p className="text-gray-700 mb-4">
          Esta es una página completamente nueva para verificar si el problema es específico del archivo original.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
          <li>✅ Archivo completamente nuevo creado</li>
          <li>✅ Nombre diferente (page-new.tsx)</li>
          <li>✅ Contenido completamente diferente</li>
        </ul>
        
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Si ves esto significa que:</h3>
          <ol className="list-decimal list-inside text-green-700 space-y-1">
            <li>El problema NO es de cache general</li>
            <li>El problema ES específico del archivo original</li>
            <li>Next.js SÍ puede compilar archivos nuevos correctamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}









