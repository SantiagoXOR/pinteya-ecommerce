import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { AdminPageClient } from './AdminPageClient'

export default async function AdminPage() {
  // Validación de autenticación del lado del servidor
  await requireAdminAuth()
  
  return <AdminPageClient />
}