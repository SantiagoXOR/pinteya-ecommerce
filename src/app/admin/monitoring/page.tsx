// ===================================
// PINTEYA E-COMMERCE - MONITORING DASHBOARD PAGE
// ===================================

import { Metadata } from 'next'
import { Suspense } from 'react'
import { MonitoringClientPage } from './MonitoringClientPage'

export const metadata: Metadata = {
  title: 'Dashboard de Monitoreo | Pinteya E-commerce Admin',
  description: 'Dashboard de monitoreo en tiempo real para el sistema Pinteya E-commerce',
}

/**
 * Página principal del dashboard de monitoreo (Server Component)
 */
export default function MonitoringPage() {
  return (
    <Suspense fallback={<div>Cargando dashboard de monitoreo...</div>}>
      <MonitoringClientPage />
    </Suspense>
  )
}
