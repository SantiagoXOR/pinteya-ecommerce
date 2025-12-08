// ⚡ FIX VERCEL: Layout para forzar renderizado dinámico
// Esto asegura que Vercel trate esta ruta como lambda explícitamente
import React from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AddressesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

