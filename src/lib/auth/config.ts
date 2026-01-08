// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// Re-exportar auth con configuración de runtime
// En NextAuth v4, no hay 'handlers' - se exporta el handler default directamente
export { auth, authOptions } from '@/auth'
