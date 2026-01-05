// ⚡ FIX VERCEL: Layout para forzar renderizado dinámico de todas las rutas /demo/*
// Cambiado a force-dynamic para que Vercel trate estas rutas como lambdas explícitamente
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
