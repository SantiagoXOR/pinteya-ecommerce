/**
 * Página de rutas asignadas para drivers
 * Lista todas las rutas disponibles y permite iniciar navegación
 */

import { requireDriverAuth } from '@/lib/auth/server-auth-guard'
import { DriverRoutesClient } from './DriverRoutesClient'

export const dynamic = 'force-dynamic'

export default async function DriverRoutesPage() {
  // Validación de autenticación del lado del servidor
  await requireDriverAuth()
  
  return <DriverRoutesClient />
}