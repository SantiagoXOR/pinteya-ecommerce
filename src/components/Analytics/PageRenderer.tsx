/**
 * Componente que renderiza una representación simplificada de una página
 * Usado en RouteVisualizer para mostrar la estructura de la página con overlays
 */

'use client'

import React from 'react'

interface PageRendererProps {
  route: string
  device: 'mobile' | 'desktop' | 'all'
  children?: React.ReactNode
}

export const PageRenderer: React.FC<PageRendererProps> = ({ route, device, children }) => {
  // Determinar dimensiones según dispositivo
  const getDimensions = () => {
    if (device === 'mobile') {
      return { width: '375px', height: '667px' }
    }
    return { width: '100%', maxWidth: '1920px', minHeight: '800px' }
  }

  const dimensions = getDimensions()

  // Renderizar estructura básica según ruta
  const renderPageContent = () => {
    if (route === '/') {
      return (
        <div className='space-y-4'>
          {/* Header simplificado */}
          <div className='bg-gray-100 p-4 rounded'>
            <div className='h-12 bg-gray-200 rounded'></div>
          </div>
          {/* Hero section */}
          <div className='bg-gradient-to-r from-blue-400 to-purple-500 p-8 rounded text-white text-center'>
            <h1 className='text-2xl font-bold mb-2'>Bienvenido</h1>
            <p className='text-sm opacity-90'>Página de inicio</p>
          </div>
          {/* Productos grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='bg-white border border-gray-200 rounded-lg p-4'>
                <div className='aspect-square bg-gray-200 rounded mb-2'></div>
                <div className='h-4 bg-gray-200 rounded mb-2'></div>
                <div className='h-4 bg-gray-200 rounded w-2/3'></div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (route.includes('/buy/') || route.includes('/product/')) {
      return (
        <div className='space-y-4'>
          <div className='bg-gray-100 p-4 rounded'>
            <div className='h-12 bg-gray-200 rounded'></div>
          </div>
          <div className='grid md:grid-cols-2 gap-6'>
            <div className='aspect-square bg-gray-200 rounded'></div>
            <div className='space-y-4'>
              <div className='h-8 bg-gray-200 rounded w-3/4'></div>
              <div className='h-6 bg-gray-200 rounded w-1/2'></div>
              <div className='h-12 bg-yellow-400 rounded w-full'></div>
              <div className='h-10 bg-gray-200 rounded w-2/3'></div>
            </div>
          </div>
        </div>
      )
    }

    // Página genérica
    return (
      <div className='space-y-4'>
        <div className='bg-gray-100 p-4 rounded'>
          <div className='h-12 bg-gray-200 rounded'></div>
        </div>
        <div className='space-y-3'>
          <div className='h-6 bg-gray-200 rounded w-3/4'></div>
          <div className='h-4 bg-gray-200 rounded'></div>
          <div className='h-4 bg-gray-200 rounded w-5/6'></div>
          <div className='h-4 bg-gray-200 rounded w-4/6'></div>
        </div>
      </div>
    )
  }

  const pageContent = renderPageContent()

  return (
    <div
      className='relative bg-white border border-gray-200 rounded-lg overflow-hidden mx-auto'
      style={dimensions}
    >
      <div className='p-6 relative'>
        {pageContent}
        {children}
      </div>
    </div>
  )
}

export default PageRenderer
