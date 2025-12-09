/**
 * Página de Inicio de Sesión - NextAuth.js
 * Diseño moderno y responsive para Pinteya E-commerce
 */

import { Suspense } from 'react'
import { SignInForm } from '@/components/Auth/SignInForm'
import { Loader2 } from '@/lib/optimized-imports'
import Link from 'next/link'
import '../auth-page.css'

export default function SignInPage() {
  return (
    <div className='auth-page-container min-h-screen flex flex-col lg:flex-row'>
      {/* Panel izquierdo - Branding con degradado naranja de Newsletter */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-r from-[#eb6313] via-[#bd4811] to-[#eb6313] relative overflow-hidden'>
        {/* Patrón de puntos (igual que Newsletter) */}
        <div className='absolute inset-0 opacity-10'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
        </div>

        <div className='relative z-10 flex flex-col justify-center px-8 xl:px-12 py-16 text-white'>
          <div className='max-w-md'>
            <img 
              src='/images/logo/LOGO POSITIVO.svg' 
              alt='Pinteya'
              style={{ width: '180px', height: 'auto', maxWidth: '180px' }}
              className='mb-8 drop-shadow-2xl'
            />
            <h1 className='text-3xl xl:text-4xl font-bold mb-6 leading-tight drop-shadow-lg'>
              Tu Pinturería Online de Confianza
            </h1>
            <p className='text-lg xl:text-xl text-white/95 mb-8 leading-relaxed drop-shadow-md'>
              Accede a tu cuenta para gestionar productos, órdenes y brindar la mejor experiencia a
              tus clientes.
            </p>

            {/* Características destacadas */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 border border-white/20'>
                <div className='w-2 h-2 bg-yellow-300 rounded-full shadow-lg'></div>
                <span className='text-white drop-shadow-sm'>Gestión completa de inventario</span>
              </div>
              <div className='flex items-center gap-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 border border-white/20'>
                <div className='w-2 h-2 bg-yellow-300 rounded-full shadow-lg'></div>
                <span className='text-white drop-shadow-sm'>Seguimiento de órdenes en tiempo real</span>
              </div>
              <div className='flex items-center gap-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 border border-white/20'>
                <div className='w-2 h-2 bg-yellow-300 rounded-full shadow-lg'></div>
                <span className='text-white drop-shadow-sm'>Analytics y reportes detallados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario (fondo amarillo heredado del body en mobile y desktop) */}
      <div className='flex-1 flex flex-col justify-center px-4 py-12 sm:py-16 sm:px-6 lg:px-8 relative'>
        {/* Contenido */}
        <div className='relative z-10'>
          {/* Logo móvil */}
          <div className='lg:hidden flex justify-center mb-8'>
            <img
              src='/images/logo/LOGO NEGATIVO.svg'
              alt='Pinteya'
              style={{ width: '160px', height: 'auto', maxWidth: '160px' }}
            />
          </div>

          {/* Formulario */}
          <div className='w-full max-w-[95%] sm:max-w-md mx-auto'>
            <Suspense
              fallback={
                <div className='flex justify-center items-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-blaze-orange-600' />
                </div>
              }
            >
              <SignInForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className='mt-8 sm:mt-10 text-center'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blaze-orange-600 transition-colors px-4 py-2 rounded-lg hover:bg-white/80 backdrop-blur-sm'
            >
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
