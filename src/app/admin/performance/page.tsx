// ===================================
// ADMIN PERFORMANCE DASHBOARD
// Dashboard de monitoreo de performance en tiempo real
// ===================================

import { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { PerformanceClientPage } from './PerformanceClientPage'

export const metadata: Metadata = {
  title: 'Performance Dashboard | Pinteya E-commerce Admin',
  description: 'Dashboard de monitoreo de performance en tiempo real para el sistema Pinteya E-commerce',
}

/**
 * Página principal del dashboard de performance (Server Component)
 */
export default async function PerformanceDashboardPage() {
  await requireAdminAuth()

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Performance' },
  ]

  return (
    <AdminLayout title='Performance Dashboard' breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div className='p-6'>Cargando dashboard de performance...</div>}>
        <PerformanceClientPage />
      </Suspense>
    </AdminLayout>
  )
}
