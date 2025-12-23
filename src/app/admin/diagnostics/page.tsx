// ===================================
// ADMIN DIAGNOSTICS PAGE
// Panel de diagnósticos para el sistema
// ===================================

import { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { DiagnosticsClientPage } from './DiagnosticsClientPage'

export const metadata: Metadata = {
  title: 'Panel de Diagnósticos | Pinteya E-commerce Admin',
  description: 'Herramientas de diagnóstico y debugging para el sistema Pinteya E-commerce',
}

/**
 * Página principal del panel de diagnósticos (Server Component)
 */
export default async function DiagnosticsPage() {
  await requireAdminAuth()

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Diagnósticos' },
  ]

  return (
    <AdminLayout title='Panel de Diagnósticos' breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div className='p-6'>Cargando panel de diagnósticos...</div>}>
        <DiagnosticsClientPage />
      </Suspense>
    </AdminLayout>
  )
}
