'use client'

import React from 'react'

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧪 Página de Prueba Simple
        </h1>
        <p className="text-gray-600">
          Esta es una página de prueba simple para verificar que el servidor funciona correctamente.
        </p>
        <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800">
            ✅ Si puedes ver esta página, el servidor está funcionando correctamente.
          </p>
        </div>
      </div>
    </div>
  )
}

