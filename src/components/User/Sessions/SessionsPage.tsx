'use client'

import React from 'react'
import { SessionManager } from './SessionManager'

export function SessionsPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Gestión de Sesiones</h1>
        <p className='text-gray-600'>
          Controla y gestiona todas tus sesiones activas en diferentes dispositivos.
        </p>
      </div>

      {/* Sessions Manager */}
      <SessionManager />
    </div>
  )
}
