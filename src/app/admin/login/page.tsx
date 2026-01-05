/**
 * Página de Acceso Admin - Landing Page
 * Página amigable que explica el acceso admin y redirige al signin
 */

import Link from 'next/link'
import { Shield, Lock, Users, BarChart3, Package, ArrowRight } from '@/lib/optimized-imports'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso Administrativo | Pinteya',
  description: 'Acceso al panel administrativo de Pinteya E-commerce',
  robots: 'noindex, nofollow',
}

export default function AdminLoginPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header simple */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <Link href='/' className='flex items-center gap-2 text-gray-600 hover:text-gray-900'>
            <ArrowRight className='w-4 h-4 rotate-180' />
            <span className='text-sm'>Volver a la tienda</span>
          </Link>
        </div>
      </div>

      {/* Contenido principal */}
      <div className='max-w-6xl mx-auto px-4 py-16'>
        <div className='text-center mb-12'>
          {/* Logo */}
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 bg-blaze-orange-600 rounded-2xl flex items-center justify-center shadow-lg'>
              <Shield className='w-12 h-12 text-white' />
            </div>
          </div>

          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Panel Administrativo</h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Accede al panel de control para gestionar tu tienda online de forma completa y eficiente.
          </p>
        </div>

        {/* Características del panel */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
              <Package className='w-6 h-6 text-blue-600' />
            </div>
            <h3 className='font-semibold text-gray-900 mb-2'>Gestión de Productos</h3>
            <p className='text-sm text-gray-600'>
              Administra tu inventario, precios, variantes y stock en tiempo real.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
              <BarChart3 className='w-6 h-6 text-green-600' />
            </div>
            <h3 className='font-semibold text-gray-900 mb-2'>Analytics Avanzados</h3>
            <p className='text-sm text-gray-600'>
              Métricas detalladas, reportes y análisis de rendimiento de tu tienda.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4'>
              <Users className='w-6 h-6 text-purple-600' />
            </div>
            <h3 className='font-semibold text-gray-900 mb-2'>Gestión de Clientes</h3>
            <p className='text-sm text-gray-600'>
              Administra usuarios, permisos y visualiza el historial de compras.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4'>
              <Lock className='w-6 h-6 text-orange-600' />
            </div>
            <h3 className='font-semibold text-gray-900 mb-2'>Acceso Seguro</h3>
            <p className='text-sm text-gray-600'>
              Autenticación con Google y sistema de roles para máxima seguridad.
            </p>
          </div>
        </div>

        {/* CTA Principal */}
        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto'>
          <div className='text-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>¿Listo para comenzar?</h2>
            <p className='text-gray-600'>
              Inicia sesión con tu cuenta de Google para acceder al panel administrativo.
            </p>
          </div>

          <Link
            href='/api/auth/signin?callbackUrl=/admin'
            className='
              w-full flex items-center justify-center gap-3
              px-8 py-4 rounded-xl
              bg-blaze-orange-600 hover:bg-blaze-orange-700
              text-white font-semibold text-lg
              transition-all duration-200
              hover:scale-[1.02]
              shadow-md hover:shadow-xl
            '
          >
            <Shield className='w-6 h-6' />
            Acceder al Panel Admin
            <ArrowRight className='w-5 h-5' />
          </Link>

          <p className='text-sm text-gray-500 text-center mt-6'>
            Solo usuarios autorizados pueden acceder al panel administrativo.
            <br />
            Si tienes problemas para acceder, contacta al administrador del sistema.
          </p>
        </div>

        {/* Información adicional */}
        <div className='mt-12 text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm'>
            <Lock className='w-4 h-4' />
            <span>
              Emails autorizados:{' '}
              <span className='font-mono'>pinturasmascolor@gmail.com, pinteya.app@gmail.com</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

