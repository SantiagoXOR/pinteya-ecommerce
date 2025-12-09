import { selectTotalPrice } from '@/redux/features/cart-slice'
import { useAppSelector } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ShoppingCart, CreditCard, Truck } from '@/lib/optimized-imports'
import Image from 'next/image'
import ShippingProgressBar from '@/components/ui/shipping-progress-bar'
import MercadoPagoLogo from '@/components/ui/mercadopago-logo'

const OrderSummary = () => {
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const totalPrice = useSelector(selectTotalPrice)

  // Calcular envío
  const shippingCost = totalPrice >= 50000 ? 0 : 2500
  const finalTotal = totalPrice + shippingCost

  return (
    <div className='lg:max-w-[455px] w-full'>
      {/* <!-- order list box --> */}
      <Card className='border-0 shadow-2'>
        <div className='border-b border-gray-200 py-6 px-6'>
          <div className='flex items-center gap-3'>
            <ShoppingCart className='w-5 h-5 text-primary' />
            <h3 className='font-bold text-xl text-gray-900'>Resumen del Pedido</h3>
            <Badge variant='outline' size='sm'>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        <div className='p-6'>
          {/* <!-- title --> */}
          <div className='flex items-center justify-between py-4 border-b border-gray-200'>
            <h4 className='font-semibold text-gray-900'>Producto</h4>
            <h4 className='font-semibold text-gray-900'>Subtotal</h4>
          </div>

          {/* <!-- product items --> */}
          <div className='max-h-60 overflow-y-auto'>
            {cartItems.map((item: any, key: number) => (
              <div
                key={key}
                className='flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
              >
                <div className='flex-1 pr-4'>
                  <p className='text-gray-900 font-medium line-clamp-2'>{item.title}</p>
                  <p className='text-sm text-gray-500'>Cantidad: {item.quantity}</p>
                </div>
                <div className='text-right'>
                  <p className='font-semibold text-gray-900'>
                    ${(item.discountedPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Progreso Envío Gratis */}
          <div className='pt-6 border-t border-gray-200'>
            <ShippingProgressBar currentAmount={totalPrice} variant='detailed' className='mb-4' />
          </div>

          {/* <!-- calculations --> */}
          <div className='space-y-3 pt-4 border-t border-gray-200'>
            <div className='flex items-center justify-between'>
              <p className='text-gray-600'>Subtotal</p>
              <p className='font-semibold' style={{ color: '#c2410b' }}>
                ${totalPrice.toLocaleString()}
              </p>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <p className='text-gray-600'>Envío</p>
                {shippingCost === 0 && (
                  <Badge className='bg-green-100 text-green-700 border-green-200' size='sm'>
                    Gratis
                  </Badge>
                )}
              </div>
              <p className='font-semibold text-gray-900'>
                {shippingCost === 0 ? (
                  <span className='text-green-600 font-bold'>Gratis</span>
                ) : (
                  `$${shippingCost.toLocaleString()}`
                )}
              </p>
            </div>

            <div className='flex items-center justify-between pt-3 border-t border-gray-200'>
              <p className='font-bold text-lg text-gray-900'>Total</p>
              <p className='font-bold text-2xl' style={{ color: '#c2410b' }}>
                ${finalTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sección Pago Instantáneo */}
          <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200'>
            <div className='flex items-center justify-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                <CreditCard className='w-4 h-4 text-white' />
              </div>
              <h4 className='font-bold text-gray-900 text-lg'>Pagas al instante</h4>
            </div>

            <div className='flex items-center justify-center gap-2 mb-3'>
              <span className='text-sm text-gray-600'>Procesado por</span>
              <div className='bg-white px-3 py-1 rounded-lg shadow-sm border'>
                <MercadoPagoLogo size='sm' variant='text' />
              </div>
            </div>

            <p className='text-xs text-center text-gray-500'>
              Pago seguro y protegido • Sin costos adicionales
            </p>
          </div>

          {/* <!-- checkout button --> */}
          <Button
            size='lg'
            className='w-full mt-6 font-bold text-xl bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 py-4'
          >
            <CreditCard className='w-6 h-6 mr-3' />
            Finalizar Compra
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default OrderSummary
