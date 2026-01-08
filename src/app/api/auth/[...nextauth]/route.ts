import NextAuth from 'next-auth'
import { authOptions } from '@/auth'

// NextAuth v4 handler para App Router
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

// Crear el handler de NextAuth v4
// NextAuth v4 maneja automáticamente los requests de App Router
const handler = NextAuth(authOptions)

// Exportar handlers directamente - NextAuth v4 maneja la adaptación internamente
export { handler as GET, handler as POST }
