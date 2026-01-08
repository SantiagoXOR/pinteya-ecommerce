// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// Re-exportar auth con configuración de runtime
// En NextAuth v4, no hay 'handlers', 'signIn' o 'signOut' en el módulo principal
// signIn/signOut se usan desde 'next-auth/react' en componentes del cliente
export { auth, authOptions } from '@/auth'
