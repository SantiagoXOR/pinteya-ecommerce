import { Metadata } from 'next'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Admin Panel - Pinteya E-commerce',
  description: 'Panel de administración y diagnósticos para Pinteya E-commerce',
  robots: 'noindex, nofollow', // No indexar páginas de admin
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ OBTENER NONCE del middleware para CSP
  const headersList = await headers()
  const nonce = headersList.get('X-Nonce') || undefined

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* ✅ CSP NONCE - Script para configuración admin */}
      {nonce && (
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.__ADMIN_NONCE__ = "${nonce}";
              console.log('🛡️ Admin CSP Nonce configurado:', "${nonce}");
            `,
          }}
        />
      )}
      {children}
    </div>
  )
}
