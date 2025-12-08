// ⚡ FIX VERCEL: Layout para forzar renderizado dinámico
// Cambiado a force-dynamic para que Vercel trate esta ruta como lambda explícitamente
import React from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DemoHeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
