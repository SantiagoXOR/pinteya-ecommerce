'use client'

import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { SettingsForm } from '@/components/admin/settings/SettingsForm'

export function SettingsPageClient() {
  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Configuración' }]

  return (
    <AdminLayout title='Configuración del Sistema' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <SettingsForm />
      </AdminContentWrapper>
    </AdminLayout>
  )
}
