import React from 'react'
import ShopWithoutSidebar from '@/components/ShopWithoutSidebar'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Shop Page | NextCommerce Nextjs E-commerce template',
  description: 'This is Shop Page for NextCommerce Template',
  robots: {
    index: false,
    follow: false,
  },
}

const ShopWithoutSidebarPage = () => {
  return (
    <main>
      <ShopWithoutSidebar />
    </main>
  )
}

export default ShopWithoutSidebarPage
