'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'

const CartPage = () => {
  const router = useRouter()
  const cartItems = useAppSelector(selectCartItems)

  // ✅ Redirecciones solo en useEffect para evitar desmontaje/updates durante render
  useEffect(() => {
    const isFromCheckout =
      typeof document !== 'undefined' && document.referrer?.includes('/checkout')
    const hasCheckoutSession =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('checkout-in-progress') === 'true'

    if (cartItems.length === 0 && !isFromCheckout && !hasCheckoutSession) {
      router.replace('/')
      return
    }
    if (cartItems.length > 0) {
      router.replace('/')
    }
  }, [cartItems.length, router])

  // Si el carrito está vacío y venimos de checkout, mostrar mensaje
  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Carrito Vacío</h1>
          <p className='text-gray-600 mb-6'>
            Tu carrito está vacío. Esto puede ser normal si acabas de completar una compra.
          </p>
          <button
            onClick={() => router.push('/')}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default CartPage
