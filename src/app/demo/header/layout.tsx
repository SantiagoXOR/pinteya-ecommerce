// ⚡ FIX VERCEL: Layout para forzar renderizado estático
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
