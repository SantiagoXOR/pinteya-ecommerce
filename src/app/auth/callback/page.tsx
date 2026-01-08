/**
 * Página de callback después del login
 * Verifica el rol del usuario y redirige según corresponda
 */

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export default async function AuthCallbackPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    // Si no hay sesión, redirigir al login
    redirect('/auth/signin')
  }

  // Si el usuario es admin, redirigir al panel admin
  if (session.user.role === 'admin') {
    redirect('/admin')
  }

  // Para otros usuarios, redirigir a la página principal
  redirect('/')
}



