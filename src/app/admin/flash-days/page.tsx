// ===================================
// PANEL ADMIN FLASH DAYS - CAMPAÑA FINALIZADA
// ===================================
// Fecha finalización: Noviembre 2025
// Estado: DESHABILITADO - Tabla flash_days_participants eliminada

'use client'

import { AlertCircle } from '@/lib/optimized-imports'

export default function FlashDaysPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <AlertCircle className="w-16 h-16 mx-auto text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Campaña Flash Days Finalizada
        </h1>
        <p className="text-gray-600 mb-4">
          La campaña "Pintura Flash Days - Color & Ahorro" ha finalizado exitosamente.
        </p>
        <p className="text-sm text-gray-500">
          Panel deshabilitado en Noviembre 2025.
          Tabla <code className="bg-gray-100 px-2 py-1 rounded">flash_days_participants</code> eliminada.
        </p>
      </div>
    </div>
  )
}
