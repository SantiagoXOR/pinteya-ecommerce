import { handlers } from '@/auth'

// NextAuth v5 handlers - Exportar directamente
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

export const { GET, POST } = handlers
