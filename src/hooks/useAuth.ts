/**
 * Hook de Autenticación para NextAuth.js
 * Reemplaza los hooks de Clerk con NextAuth.js
 */

'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UseAuthReturn, AuthUser } from '@/types/hooks'

// ===================================
// INTERFACES
// ===================================
// Interfaces movidas a @/types/hooks para reutilización

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignIn = useCallback(
    async (provider: string = 'google', options?: { callbackUrl?: string }) => {
      try {
        await signIn(provider, {
          callbackUrl: options?.callbackUrl || '/admin',
          redirect: true,
        })
      } catch (error) {
        console.error('Error al iniciar sesión:', error)
      }
    },
    []
  )

  const handleSignOut = useCallback(async (options?: { callbackUrl?: string }) => {
    try {
      await signOut({
        callbackUrl: options?.callbackUrl || '/',
        redirect: true,
      })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }, [])

  // Mapear usuario de NextAuth a nuestro formato
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id || session.user.email || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null

  return {
    user,
    isLoaded: status !== 'loading',
    isSignedIn: status === 'authenticated',
    signIn: handleSignIn,
    signOut: handleSignOut,
    session,
    status,
  }
}

// Hook para verificar si el usuario es administrador
export function useIsAdmin(): boolean {
  const { user, isSignedIn } = useAuth()

  // Por ahora, todos los usuarios autenticados son admin
  // TODO: Implementar sistema de roles más granular
  return isSignedIn && !!user
}

// Hook para proteger rutas
export function useRequireAuth(redirectTo: string = '/api/auth/signin') {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  if (isLoaded && !isSignedIn) {
    router.push(redirectTo)
  }

  return { isSignedIn, isLoaded }
}
