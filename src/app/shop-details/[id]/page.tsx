import { redirect } from 'next/navigation'

export default function LegacyShopDetailsRedirect({ params }: { params: { id: string } }) {
  // Redirigir ruta antigua a la nueva ruta can├│nica
  redirect(`/products/${params.id}`)
}

