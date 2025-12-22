import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { DatabasePageClient } from './DatabasePageClient'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default async function DatabasePage() {
  await requireAdminAuth()

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Base de Datos' }]

  return (
    <AdminLayout title='Base de Datos' breadcrumbs={breadcrumbs}>
      <DatabasePageClient />
    </AdminLayout>
  )
}
