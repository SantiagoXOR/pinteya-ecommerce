'use client'

import React from 'react'
import Link from 'next/link'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Palette, Home, Sparkles } from '@/lib/optimized-imports'
import QuickAddSuggestions from '@/components/ui/quick-add-suggestions'

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext()

  return (
    <div className='text-center py-4 px-4 max-h-full overflow-y-auto'>
      {/* Header más compacto */}
      <div className='mb-4'>
        <div className='mx-auto mb-3 w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center'>
          <ShoppingBag className='w-8 h-8 text-tenant-price' />
        </div>
        <h3 className='text-lg font-bold text-gray-900 mb-1'>¡Tu carrito está vacío!</h3>
        <p className='text-gray-600 text-sm'>
          Descubre nuestros productos y comienza a crear
        </p>
      </div>

      {/* PRODUCTOS CON ENVÍO GRATIS - PRIORIDAD VISUAL */}
      <div className='mb-4'>
        <QuickAddSuggestions onClose={() => closeCartModal()} />
      </div>

      {/* Beneficios compactos (con envío gratis integrado) */}
      <div className='bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 mb-4 border border-yellow-200'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <Sparkles className='w-3.5 h-3.5 text-yellow-600' />
          <span className='text-xs font-semibold text-gray-700'>¿Por qué elegir Pinteya?</span>
        </div>
        <div className='space-y-1.5 text-xs text-gray-600'>
          <div className='flex items-center justify-center gap-2'>
            <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
            <span>Envío gratis desde $50.000</span>
          </div>
          <div className='flex items-center justify-center gap-2'>
            <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
            <span>Pago seguro con MercadoPago</span>
          </div>
          <div className='flex items-center justify-center gap-2'>
            <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
            <span>Productos de calidad profesional</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className='space-y-2'>
        {/* Botón principal */}
        <Button
          onClick={() => closeCartModal()}
          asChild
          className='w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
        >
          <Link href='/'>
            <Palette className='w-4 h-4 mr-2' />
            Explorar Productos
          </Link>
        </Button>

        {/* Botón secundario */}
        <Button
          onClick={() => closeCartModal()}
          asChild
          variant='outline'
          className='w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl transition-all duration-200'
        >
          <Link href='/'>
            <Home className='w-4 h-4 mr-2' />
            Ir al Inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default EmptyCart
