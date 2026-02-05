import React from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const LazyShopWithSidebar = dynamic(
  () => import('@/components/ShopWithSidebar/LazyShopWithSidebar'),
  {
    ssr: true,
    loading: () => (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue' />
      </div>
    ),
  }
)

export const metadata: Metadata = {
  title: 'Productos | Pinteya E-commerce',
  description:
    'Explora todos los productos con filtros avanzados: marcas, categorías, precios y más.',
}

const ProductsPage = () => {
  return (
    <main>
      <LazyShopWithSidebar />
    </main>
  )
}

export default ProductsPage