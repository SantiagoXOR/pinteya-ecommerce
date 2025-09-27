import React from 'react'
import ShopDetailsById from '@/components/ShopDetails/ShopDetailsById'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalles del Producto | Pinteya E-commerce',
  description: 'Detalles completos del producto seleccionado',
}

interface ShopDetailsPageProps {
  params: Promise<{ id: string }>
}

const ShopDetailsPage = async ({ params }: ShopDetailsPageProps) => {
  const { id } = await params

  return (
    <main>
      <ShopDetailsById productId={id} />
    </main>
  )
}

export default ShopDetailsPage
