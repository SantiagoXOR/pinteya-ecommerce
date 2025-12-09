/**
 * Componente para mostrar información y links de Google Analytics
 * Google Analytics 4 no soporta Embed API directamente sin credenciales adicionales
 */

'use client'

import React from 'react'
import { getGoogleAnalyticsUrl, getGoogleAnalyticsReportsUrl } from '@/lib/integrations/google-analytics-embed'
import { ExternalLink, BarChart3, Info } from '@/lib/optimized-imports'

interface GoogleAnalyticsEmbedProps {
  measurementId?: string
  className?: string
}

const GoogleAnalyticsEmbed: React.FC<GoogleAnalyticsEmbedProps> = ({
  measurementId,
  className = '',
}) => {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_ID || ''

  if (!gaId) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className='flex items-center gap-2 text-yellow-800'>
          <Info className='w-5 h-5' />
          <p className='text-sm'>Google Analytics Measurement ID no configurado</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2'>
          <BarChart3 className='w-5 h-5' />
          Google Analytics
        </h3>
        <p className='text-sm text-gray-600'>
          Google Analytics 4 (Measurement ID: {gaId})
        </p>
      </div>

      {/* Información sobre GA4 */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
        <h4 className='text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2'>
          <Info className='w-4 h-4' />
          Información sobre Google Analytics 4
        </h4>
        <ul className='text-xs text-blue-800 space-y-1 list-disc list-inside'>
          <li>Google Analytics 4 usa una nueva arquitectura diferente a Universal Analytics</li>
          <li>Los eventos de e-commerce se están trackeando correctamente desde nuestro sistema</li>
          <li>Para ver reportes completos, accede directamente a Google Analytics</li>
          <li>Para integración completa con API y reportes embebidos, se requieren credenciales de Service Account</li>
        </ul>
      </div>

      {/* Links a Google Analytics */}
      <div className='space-y-3'>
        <div className='flex flex-col sm:flex-row gap-2'>
          <a
            href={getGoogleAnalyticsUrl(gaId)}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium'
          >
            <ExternalLink className='w-4 h-4' />
            Abrir Google Analytics
          </a>
          <a
            href={getGoogleAnalyticsReportsUrl(gaId)}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium'
          >
            <ExternalLink className='w-4 h-4' />
            Ver Reportes
          </a>
        </div>
        <p className='text-xs text-gray-500'>
          <strong>Nota:</strong> Para integración completa con API y reportes embebidos en el dashboard,
          se requieren credenciales de Service Account de Google Cloud Platform. Actualmente solo
          tenemos el Measurement ID configurado.
        </p>
      </div>

      {/* Métricas trackeadas */}
      <div className='mt-6 pt-4 border-t border-gray-200'>
        <h4 className='text-sm font-semibold text-gray-900 mb-3'>Eventos Trackeados</h4>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-lg font-bold text-gray-900'>PageView</p>
            <p className='text-xs text-gray-600'>Automático</p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-lg font-bold text-gray-900'>view_item</p>
            <p className='text-xs text-gray-600'>Vista de producto</p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-lg font-bold text-gray-900'>add_to_cart</p>
            <p className='text-xs text-gray-600'>Agregar al carrito</p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-lg font-bold text-gray-900'>purchase</p>
            <p className='text-xs text-gray-600'>Compra completada</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleAnalyticsEmbed
