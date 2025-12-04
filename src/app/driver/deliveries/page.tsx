/**
 * Página de gestión de entregas para drivers
 * Historial y estado de todas las entregas
 */

import { requireDriverAuth } from '@/lib/auth/server-auth-guard'
import { DriverDeliveriesClient } from './DriverDeliveriesClient'

export default async function DriverDeliveriesPage() {
  // Validación de autenticación del lado del servidor
  await requireDriverAuth()
  
  return <DriverDeliveriesClient />
}