// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO ADMIN PAGE
// ===================================

import { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { MercadoPagoDashboard } from '@/components/admin/mercadopago/MercadoPagoDashboard'

export const metadata: Metadata = {
  title: 'MercadoPago Admin - Pinteya E-commerce',
  description: 'Panel de administración para gestión y monitoreo de MercadoPago',
}

// Forzar renderizado dinámico para evitar problemas con auth en prerendering
export const dynamic = 'force-dynamic'

export default async function MercadoPagoAdminPage() {
  // Verificar autenticación
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'MercadoPago' },
  ]

  return (
    <AdminLayout title='MercadoPago Admin' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <MercadoPagoDashboard />
      </AdminContentWrapper>
    </AdminLayout>
  )
}
