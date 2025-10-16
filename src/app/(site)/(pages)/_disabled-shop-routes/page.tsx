// ===================================
// PINTEYA E-COMMERCE - PÁGINA PRINCIPAL DE TIENDA
// ===================================

import React from 'react'
import ShopWithoutSidebar from '@/components/ShopWithoutSidebar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda de Pinturería | Pinteya E-commerce',
  description:
    'Descubre nuestra amplia selección de productos de pinturería, ferretería y corralón. Pinturas, herramientas, accesorios y más.',
  keywords: 'pinturería, ferretería, corralón, pinturas, herramientas, accesorios, construcción',
}

const ShopPage = () => {
  return (
    <main>
      <ShopWithoutSidebar />
    </main>
  )
}

export default ShopPage
