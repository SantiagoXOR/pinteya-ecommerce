// ⚡ FIX VERCEL: Layout para forzar renderizado estático de todas las rutas /demo/*
// Esto asegura que Vercel trate estas rutas como páginas estáticas, no como lambdas
export const dynamic = 'force-static'
export const revalidate = false

export default function SiteDemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

