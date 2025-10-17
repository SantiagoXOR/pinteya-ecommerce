import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { OrdersPageClient } from './OrdersPageClient'

export default async function OrdersPage() {
  // Validación de autenticación del lado del servidor
  await requireAdminAuth()
  
  return <OrdersPageClient />
}