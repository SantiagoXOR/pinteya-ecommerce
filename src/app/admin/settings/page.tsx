import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { SettingsPageClient } from './SettingsPageClient'

export default async function SettingsPage() {
  // Validación de autenticación del lado del servidor
  await requireAdminAuth()
  
  return <SettingsPageClient />
}