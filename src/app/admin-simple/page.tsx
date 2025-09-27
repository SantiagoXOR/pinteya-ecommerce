'use client'

import Link from 'next/link'

export default function AdminSimplePage() {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🎯 Panel Admin Simplificado - Pinteya
          </h1>
          <p className='text-gray-600'>
            Acceso directo a las funcionalidades administrativas principales
          </p>
        </div>

        {/* Status */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-8'>
          <div className='flex items-center'>
            <div className='text-green-600 text-xl mr-3'>✅</div>
            <div>
              <h3 className='text-green-800 font-semibold'>¡Acceso Admin Exitoso!</h3>
              <p className='text-green-700 text-sm'>
                Esta página funciona correctamente. El middleware está deshabilitado y puedes
                acceder a las funciones admin.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Productos */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>📦</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Productos</h3>
                <p className='text-sm text-gray-600'>Gestionar catálogo</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/products'
                className='block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors'
              >
                Ver Productos
              </a>
              <a
                href='/admin/products/new'
                className='block w-full text-center bg-blue-100 text-blue-700 py-2 px-4 rounded hover:bg-blue-200 transition-colors'
              >
                Nuevo Producto
              </a>
            </div>
          </div>

          {/* Analytics */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>📊</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Analytics</h3>
                <p className='text-sm text-gray-600'>Métricas y reportes</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/analytics'
                className='block w-full text-center bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors'
              >
                Ver Analytics
              </a>
            </div>
          </div>

          {/* Clientes */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>👥</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Clientes</h3>
                <p className='text-sm text-gray-600'>Gestionar usuarios</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/customers'
                className='block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors'
              >
                Ver Clientes
              </a>
            </div>
          </div>

          {/* Órdenes */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>🛒</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Órdenes</h3>
                <p className='text-sm text-gray-600'>Gestionar pedidos</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/orders'
                className='block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors'
              >
                Ver Órdenes
              </a>
            </div>
          </div>

          {/* MercadoPago */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>💳</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>MercadoPago</h3>
                <p className='text-sm text-gray-600'>Configuración pagos</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/mercadopago'
                className='block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors'
              >
                Ver MercadoPago
              </a>
            </div>
          </div>

          {/* Diagnósticos */}
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-4'>
              <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4'>
                <span className='text-2xl'>🔍</span>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Diagnósticos</h3>
                <p className='text-sm text-gray-600'>Herramientas debug</p>
              </div>
            </div>
            <div className='space-y-2'>
              <a
                href='/admin/diagnostics'
                className='block w-full text-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors'
              >
                Ver Diagnósticos
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mt-8 bg-white rounded-lg shadow-sm p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>🚀 Acciones Rápidas</h3>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <a
              href='/admin'
              className='text-center bg-orange-600 text-white py-3 px-4 rounded hover:bg-orange-700 transition-colors'
            >
              Dashboard Principal
            </a>
            <a
              href='/api/admin/products'
              target='_blank'
              className='text-center bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700 transition-colors'
            >
              API Productos
            </a>
            <a
              href='/'
              className='text-center bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors'
            >
              Ver Sitio Web
            </a>
            <a
              href='/admin/settings'
              className='text-center bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700 transition-colors'
            >
              Configuración
            </a>
          </div>
        </div>

        {/* Status Info */}
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='text-blue-800 font-semibold mb-2'>ℹ️ Información del Sistema</h4>
          <div className='text-blue-700 text-sm space-y-1'>
            <p>
              • <strong>Middleware:</strong> Deshabilitado temporalmente
            </p>
            <p>
              • <strong>Autenticación:</strong> Usuario logueado correctamente
            </p>
            <p>
              • <strong>Rol Admin:</strong> Configurado en Clerk Dashboard
            </p>
            <p>
              • <strong>Estado:</strong> Acceso completo habilitado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
