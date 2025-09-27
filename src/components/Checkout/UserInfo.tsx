// ===================================
// PINTEYA E-COMMERCE - USER INFO COMPONENT
// ===================================

'use client'

import React from 'react'
// 🚨 TEMPORAL: Clerk desactivado por regresión crítica
// import { useSession } from 'next-auth/react';
import Link from 'next/link'

interface UserInfoProps {
  className?: string
}

const UserInfo: React.FC<UserInfoProps> = ({ className = '' }) => {
  // 🚨 TEMPORAL: Simular usuario no autenticado
  const user = null
  const isLoaded = true

  if (!isLoaded) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-1/2'></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow-1 rounded-[10px] p-4 sm:p-6 ${className}`}>
      {/* 🚨 TEMPORAL: Mostrar como usuario no autenticado */}
      {user && (
        <div>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-tahiti-gold-100 rounded-full flex items-center justify-center'>
              <span className='text-tahiti-gold-700 font-semibold text-sm'>
                {user?.firstName?.charAt(0) ||
                  user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
                  'U'}
              </span>
            </div>
            <div>
              <p className='font-medium text-gray-900'>
                {user?.fullName ||
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  'Usuario'}
              </p>
              <p className='text-sm text-gray-600'>{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          </div>
          <div className='mt-3 pt-3 border-t border-gray-100'>
            <p className='text-xs text-gray-500'>
              ✅ Autenticado con Clerk - Los datos se guardarán en tu cuenta
            </p>
          </div>
        </div>
      )}

      {/* ✅ CHECKOUT COMO INVITADO - Funcionalidad principal */}
      {!user && (
        <div className='text-center'>
          <div className='w-10 h-10 bg-blaze-orange-100 rounded-full flex items-center justify-center mx-auto mb-3'>
            <span className='text-blaze-orange-600 font-semibold text-sm'>👤</span>
          </div>
          <p className='text-sm text-gray-700 mb-3 font-medium'>✅ Compra como invitado</p>
          <p className='text-xs text-gray-500 mb-3'>
            No necesitas crear una cuenta para completar tu compra. Recibirás la confirmación por
            email.
          </p>
          <Link
            href='/signin'
            className='inline-flex items-center px-3 py-2 text-xs font-medium text-blaze-orange-700 bg-blaze-orange-50 border border-blaze-orange-200 rounded-md hover:bg-blaze-orange-100 transition-colors'
          >
            ¿Tienes cuenta? Iniciar Sesión
          </Link>
        </div>
      )}
    </div>
  )
}

export default UserInfo
