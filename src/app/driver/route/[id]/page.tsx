/**
 * Vista de navegación GPS en tiempo real para drivers
 * Interfaz principal para navegación turn-by-turn y gestión de entregas
 */

import { requireDriverAuth } from '@/lib/auth/server-auth-guard'
import { DriverRouteClient } from './DriverRouteClient'

export const dynamic = 'force-dynamic'

export default async function DriverRoutePage() {
  // Validación de autenticación del lado del servidor
  await requireDriverAuth()
  
  return <DriverRouteClient />
}