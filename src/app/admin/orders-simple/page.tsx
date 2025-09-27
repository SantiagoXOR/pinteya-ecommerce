// ===================================
// PINTEYA E-COMMERCE - SIMPLE ORDERS PAGE
// Página temporal para probar el componente simplificado de órdenes
// ===================================

import { Metadata } from 'next'
import { OrderListSimple } from '@/components/admin/orders/OrderListSimple'

export const metadata: Metadata = {
  title: 'Órdenes Simple | Pinteya E-commerce Admin',
  description: 'Vista simplificada de órdenes para testing',
}

export default function OrdersSimplePage() {
  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Órdenes - Vista Simplificada</h1>
        <p className='text-gray-600 mt-2'>
          Componente simplificado para probar la carga de órdenes sin problemas de Fast Refresh
        </p>
      </div>

      <OrderListSimple />
    </div>
  )
}
