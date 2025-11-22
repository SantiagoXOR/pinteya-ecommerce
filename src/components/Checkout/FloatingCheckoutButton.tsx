'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppSelector } from '@/redux/store'
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const FloatingCheckoutButton: React.FC = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lastProductInfo, setLastProductInfo] = useState<{ brand?: string; name: string; image?: string } | null>(null)
  const cartItems = useAppSelector(selectCartItems)
  const totalPrice = useAppSelector(selectTotalPrice)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Obtener información del último producto agregado
  useEffect(() => {
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const lastItem = cartItems[cartItems.length - 1]
      
      // Obtener imagen del producto
      const productImage = lastItem?.imgs?.thumbnails?.[0] 
        || lastItem?.imgs?.previews?.[0] 
        || lastItem?.image
        || '/images/placeholder.png'

      // Intentar obtener marca del producto desde la API si no está en el item
      const fetchProductBrand = async () => {
        try {
          const response = await fetch(`/api/products/${lastItem.id}`)
          if (response.ok) {
            const data = await response.json()
            const product = data.data || data.product || data
            setLastProductInfo({
              brand: product.brand || '',
              name: lastItem.title || lastItem.name || '',
              image: productImage,
            })
          } else {
            setLastProductInfo({
              brand: '',
              name: lastItem.title || lastItem.name || '',
              image: productImage,
            })
          }
        } catch {
          setLastProductInfo({
            brand: '',
            name: lastItem.title || lastItem.name || '',
            image: productImage,
          })
        }
      }

      fetchProductBrand()
    }
  }, [cartItems])

  const itemCount = Array.isArray(cartItems) ? cartItems.length : 0
  const hasItems = itemCount > 0

  const handleCheckout = () => {
    // Guardar el slug actual en sessionStorage para poder volver
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      const buyPageMatch = pathname.match(/^\/buy\/([^/]+)/)
      if (buyPageMatch && buyPageMatch[1]) {
        sessionStorage.setItem('last_buy_page_slug', buyPageMatch[1])
      }
    }
    router.push('/checkout/meta')
  }

  if (!mounted || !hasItems) {
    return null
  }

  const formattedPrice = totalPrice.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  })

  // Truncar nombre del producto si es muy largo
  const productName = lastProductInfo?.name || ''
  const truncatedName = productName.length > 30 
    ? `${productName.substring(0, 30)}...` 
    : productName

  return (
      <button
        onClick={handleCheckout}
        className={cn(
          'fixed top-[104px] md:top-[117px] left-4 right-4',
          'z-[9998]',
          'w-[calc(100%-2rem)]',
          'bg-[#00a650] hover:bg-[#009645] active:bg-[#00853d]',
          'text-white font-semibold',
          'rounded-lg',
          'px-3 py-2.5 md:px-4 md:py-3',
          'flex items-center justify-between gap-3',
          'shadow-md hover:shadow-lg',
          'transition-all duration-200',
          'touch-manipulation'
        )}
        style={{ 
          position: 'fixed',
          zIndex: 9998,
        }}
      >
        {/* Lado izquierdo: Imagen + Marca y título */}
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          {/* Imagen del producto */}
          {lastProductInfo?.image && (
            <div className='relative w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white'>
              <Image
                src={lastProductInfo.image}
                alt={productName}
                fill
                className='object-cover'
                sizes='56px'
              />
            </div>
          )}

          {/* Marca y título alineados verticalmente a la izquierda */}
          {lastProductInfo && (
            <div className='flex flex-col items-start justify-center min-w-0 flex-1 gap-0.5'>
              {lastProductInfo.brand && (
                <span className='text-[10px] md:text-xs text-white/80 font-medium uppercase tracking-wide leading-none text-left'>
                  {lastProductInfo.brand}
                </span>
              )}
              <span className='text-xs md:text-sm font-semibold text-white leading-none text-left break-words'>
                {truncatedName}
              </span>
              <span className='text-[10px] md:text-xs text-white/70 font-normal leading-none text-left'>
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          )}
        </div>

        {/* Lado derecho: Total + "Comprar ahora" + Flecha */}
        <div className='flex items-center gap-2 flex-shrink-0'>
          <div className='flex flex-col items-end gap-0'>
            <span className='text-lg md:text-xl font-bold text-white leading-none'>
              {formattedPrice}
            </span>
            <span className='text-[10px] md:text-xs text-white/90 font-medium leading-none'>
              Comprar ahora
            </span>
          </div>
          <ArrowRight className='w-5 h-5 md:w-6 md:h-6 flex-shrink-0' />
        </div>
      </button>
  )
}


