/**
 * Página de perfil del driver
 * Información personal, estadísticas y configuración
 */

import { requireDriverAuth } from '@/lib/auth/server-auth-guard'
import { DriverProfileClient } from './DriverProfileClient'

export const dynamic = 'force-dynamic'

export default async function DriverProfilePage() {
  // Validación de autenticación del lado del servidor
  await requireDriverAuth()
  
  return <DriverProfileClient />
}