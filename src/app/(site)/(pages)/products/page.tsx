import React from 'react'
import ShopWithSidebar from '@/components/ShopWithSidebar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Productos | Pinteya E-commerce',
  description:
    'Explora todos los productos con filtros avanzados: marcas, categorías, precios y más.',
}

const ProductsPage = () => {
  return (
    <main>
      <ShopWithSidebar />
    </main>
  )
}

export default ProductsPage