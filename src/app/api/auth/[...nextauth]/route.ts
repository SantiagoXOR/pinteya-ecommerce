import NextAuth from 'next-auth'
import { authOptions } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

// NextAuth v4 handler para App Router
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

// Wrapper para manejar requests correctamente en App Router
async function GET(req: NextRequest) {
  return handler(req as any)
}

async function POST(req: NextRequest) {
  return handler(req as any)
}

export { GET, POST }
