import NextAuth from 'next-auth'
import { authOptions } from '@/auth'

// NextAuth v4 handler para App Router
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
