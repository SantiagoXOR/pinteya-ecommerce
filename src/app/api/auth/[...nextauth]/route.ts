import { handlers } from '@/auth'

// NextAuth v5 handlers manejan automáticamente el body parsing
// No debemos parsear el body manualmente aquí
export const { GET, POST } = handlers

// Asegurar que NextAuth use el runtime de Node.js en Vercel
export const runtime = 'nodejs'
