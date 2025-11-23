import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

// ⚡ PERFORMANCE: Lazy load del componente pesado con loading state
const MetaCheckoutWizard = dynamic(
  () => import('@/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard'),
  {
    loading: () => (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500' />
          <p className='text-gray-600'>Cargando checkout...</p>
        </div>
      </div>
    ),
    ssr: false, // Solo cargar en cliente si es necesario
  }
)

const MetaCheckoutPage = () => {
  return (
    <main className='min-h-screen'>
      <Suspense fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500' />
            <p className='text-gray-600'>Cargando checkout...</p>
          </div>
        </div>
      }>
        <MetaCheckoutWizard />
      </Suspense>
    </main>
  )
}

export default MetaCheckoutPage

