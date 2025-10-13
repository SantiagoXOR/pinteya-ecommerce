import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Productos | Pinteya E-commerce',
  description: 'Redirección a la nueva página de productos',
}

export default function ShopWithSidebarRedirectPage() {
  redirect('/products')
}
