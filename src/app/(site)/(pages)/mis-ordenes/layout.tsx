// ⚡ FIX VERCEL: Layout para página de client component
// Como la página es un Client Component ('use client'), no podemos forzar renderizado estático
// En su lugar, permitimos renderizado dinámico que es compatible con Client Components
import React from 'react'

// ⚡ FIX: No podemos usar 'force-static' con Client Components
// Vercel manejará esto como una ruta dinámica que se renderiza en el servidor
export const dynamic = 'force-dynamic'

export default function MisOrdenesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

