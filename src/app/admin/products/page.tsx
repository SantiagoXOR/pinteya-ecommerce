// =====================================================
// PÁGINA: GESTIÓN DE PRODUCTOS ENTERPRISE
// Ruta: /admin/products
// Descripción: Dashboard principal del módulo de productos
// Incluye: Import/Export, Operaciones masivas, Gestión avanzada
// =====================================================

import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { ProductsPageClient } from './ProductsPageClient'

export default async function ProductsPage() {
  // Validación de autenticación del lado del servidor
  await requireAdminAuth()
  
  return <ProductsPageClient />
}