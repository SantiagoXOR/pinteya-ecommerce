'use client'

import React from 'react'
import { SecuritySettings } from './SecuritySettings'

export function SecurityPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Configuración de Seguridad</h1>
        <p className='text-gray-600'>Configura y gestiona la seguridad de tu cuenta.</p>
      </div>

      {/* Security Settings */}
      <SecuritySettings />
    </div>
  )
}
