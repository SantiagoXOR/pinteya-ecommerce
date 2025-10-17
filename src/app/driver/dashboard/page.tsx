/**
 * Dashboard principal para drivers
 * Interfaz mobile-first con información de rutas, estado y acciones rápidas
 */

import { requireDriverAuth } from '@/lib/auth/server-auth-guard'
import { DriverDashboardClient } from './DriverDashboardClient'

export const dynamic = 'force-dynamic'

export default async function DriverDashboardPage() {
  // Validación de autenticación del lado del servidor
  await requireDriverAuth()
  
  return <DriverDashboardClient />
}