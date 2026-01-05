import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import UserManagement from '@/components/admin/users/UserManagement'

export default async function UsersPage() {
  // Validación de autenticación del lado del servidor
  await requireAdminAuth()
  
  return <UserManagement />
}

