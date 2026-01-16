/**
 * Componente para toggle entre vistas Mobile/Desktop/All
 * Usado en RouteVisualizer para filtrar métricas por dispositivo
 */

'use client'

import React from 'react'
import { Smartphone, Monitor, Grid } from '@/lib/optimized-imports'

interface DeviceViewToggleProps {
  device: 'mobile' | 'desktop' | 'all'
  onChange: (device: 'mobile' | 'desktop' | 'all') => void
}

export const DeviceViewToggle: React.FC<DeviceViewToggleProps> = ({ device, onChange }) => {
  return (
    <div className='flex items-center gap-2 bg-gray-100 rounded-lg p-1'>
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          device === 'all'
            ? 'bg-yellow-400 text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Grid className='w-4 h-4' />
        Todos
      </button>
      <button
        onClick={() => onChange('desktop')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          device === 'desktop'
            ? 'bg-yellow-400 text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Monitor className='w-4 h-4' />
        Desktop
      </button>
      <button
        onClick={() => onChange('mobile')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          device === 'mobile'
            ? 'bg-yellow-400 text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Smartphone className='w-4 h-4' />
        Mobile
      </button>
    </div>
  )
}

export default DeviceViewToggle
