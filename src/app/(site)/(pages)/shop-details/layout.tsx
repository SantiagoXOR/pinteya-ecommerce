// ⚡ FIX VERCEL: Layout para forzar renderizado estático
// Esto asegura que Vercel trate esta ruta como página estática, no como lambda
export const dynamic = 'force-static'
export const revalidate = false

export default function ShopDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

