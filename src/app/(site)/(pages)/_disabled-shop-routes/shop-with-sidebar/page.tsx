import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Productos | Pinteya E-commerce',
  description: 'Redirección a la nueva página de productos',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ShopWithSidebarRedirectPage() {
  redirect('/products')
}
