// ===================================
// PINTEYA E-COMMERCE - MONITORING DASHBOARD PAGE
// ===================================

import { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { MonitoringClientPage } from './MonitoringClientPage'

export const metadata: Metadata = {
  title: 'Dashboard de Monitoreo | Pinteya E-commerce Admin',
  description: 'Dashboard de monitoreo en tiempo real para el sistema Pinteya E-commerce',
}

/**
 * Página principal del dashboard de monitoreo (Server Component)
 */
export default async function MonitoringPage() {
  await requireAdminAuth()

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Monitoreo' },
  ]

  return (
    <AdminLayout title='Dashboard de Monitoreo' breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div className='p-6'>Cargando dashboard de monitoreo...</div>}>
        <MonitoringClientPage />
      </Suspense>
    </AdminLayout>
  )
}
