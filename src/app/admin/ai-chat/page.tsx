// ===================================
// ADMIN AI CHAT - Debug y logs
// ===================================

import { Metadata } from 'next'
import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AIChatDebugPanel } from '@/components/admin/AIChatDebugPanel'

export const metadata: Metadata = {
  title: 'AI Chat Debug | Admin Pinteya',
  description: 'Panel de debug, testing y logs del asistente de chat con IA (Gemini)',
}

export default async function AdminAIChatPage() {
  await requireAdminAuth()

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'AI Chat Debug' },
  ]

  return (
    <AdminLayout title="AI Chat - Debug y logs" breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div className="p-6">Cargando panel...</div>}>
        <AIChatDebugPanel />
      </Suspense>
    </AdminLayout>
  )
}
