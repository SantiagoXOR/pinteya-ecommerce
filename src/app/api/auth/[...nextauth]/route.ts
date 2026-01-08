import NextAuth from '@/auth'

// NextAuth v4 handler - Exportar directamente
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

const handler = NextAuth

export { handler as GET, handler as POST }
