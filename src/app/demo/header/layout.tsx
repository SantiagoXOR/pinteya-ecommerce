// ⚡ FIX VERCEL: Layout específico para /demo/header para forzar renderizado estático
// Esto asegura que Vercel trate esta ruta como página estática, no como lambda
import React from 'react'

export const dynamic = 'force-static'
export const revalidate = false

export default function DemoHeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

