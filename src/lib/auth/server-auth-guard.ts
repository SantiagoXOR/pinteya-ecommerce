/**
 * Server-Side Authentication Guards para Pinteya E-commerce
 * Validación explícita del lado del servidor para rutas protegidas
 * Complementa el middleware con una segunda capa de seguridad
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Requiere autenticación de administrador
 * Redirige al home si no está autenticado o no es admin
 * @returns Session del usuario autenticado
 */
export async function requireAdminAuth() {
  // BYPASS PARA DESARROLLO
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.log('[Server Auth Guard] ⚠️ BYPASS AUTH ENABLED - Permitiendo acceso sin autenticación')
    return {
      user: {
        email: 'santiago@xor.com.ar',
        name: 'Admin (Bypass Mode)',
        id: 'bypass-admin-id'
      }
    } as any
  }

  const session = await auth()
  
  if (!session?.user) {
    console.warn('[Server Auth Guard] Usuario no autenticado intentando acceder a admin')
    redirect('/')
  }
  
  const isAdmin = session.user.email === 'santiago@xor.com.ar'
  if (!isAdmin) {
    console.warn(`[Server Auth Guard] Usuario no-admin (${session.user.email}) intentando acceder a admin`)
    redirect('/access-denied?type=admin')
  }
  
  console.log(`[Server Auth Guard] Admin autenticado: ${session.user.email}`)
  return session
}

/**
 * Requiere autenticación de conductor/driver
 * Redirige al login de driver si no está autenticado o no es driver
 * @returns Session del usuario autenticado
 */
export async function requireDriverAuth() {
  const session = await auth()
  
  if (!session?.user) {
    console.warn('[Server Auth Guard] Usuario no autenticado intentando acceder a driver')
    redirect('/driver/login')
  }
  
  const allowedDrivers = ['driver@pinteya.com', 'santiago@xor.com.ar']
  const isDriver = allowedDrivers.includes(session.user.email || '')
  
  if (!isDriver) {
    console.warn(`[Server Auth Guard] Usuario no-driver (${session.user.email}) intentando acceder a driver`)
    redirect('/access-denied?type=driver')
  }
  
  console.log(`[Server Auth Guard] Driver autenticado: ${session.user.email}`)
  return session
}

/**
 * Requiere autenticación básica (cualquier usuario logueado)
 * Redirige al login si no está autenticado
 * @returns Session del usuario autenticado
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    console.warn('[Server Auth Guard] Usuario no autenticado intentando acceder a ruta protegida')
    redirect('/api/auth/signin')
  }
  
  console.log(`[Server Auth Guard] Usuario autenticado: ${session.user.email}`)
  return session
}

/**
 * Verifica si el usuario actual es admin (sin redirigir)
 * Útil para mostrar/ocultar elementos de UI
 * @returns boolean indicando si es admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.email === 'santiago@xor.com.ar'
}

/**
 * Verifica si el usuario actual es driver (sin redirigir)
 * Útil para mostrar/ocultar elementos de UI
 * @returns boolean indicando si es driver
 */
export async function isDriver(): Promise<boolean> {
  const session = await auth()
  const allowedDrivers = ['driver@pinteya.com', 'santiago@xor.com.ar']
  return allowedDrivers.includes(session?.user?.email || '')
}

/**
 * Obtiene el usuario actual sin requerir autenticación
 * Útil para componentes que pueden funcionar con o sin autenticación
 * @returns Session del usuario o null
 */
export async function getCurrentUser() {
  return await auth()
}
