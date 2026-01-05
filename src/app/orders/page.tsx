import { redirect } from 'next/navigation'

// Redirect de /orders a /mis-ordenes para mantener compatibilidad
// y evitar conflicto con /api/orders en Vercel
export default function OrdersRedirect() {
  redirect('/mis-ordenes')
}
