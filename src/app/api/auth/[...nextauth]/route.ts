import NextAuth from 'next-auth'
import { authOptions } from '@/auth'

// NextAuth v4 handler para App Router
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

// Crear el handler de NextAuth v4
const handler = NextAuth(authOptions)

// Exportar handlers para GET y POST
export { handler as GET, handler as POST }
