import NextAuth from 'next-auth'
import { authOptions } from '@/auth'
import { NextRequest } from 'next/server'

// NextAuth v4 handler para App Router
// El runtime 'nodejs' es necesario para Vercel
export const runtime = 'nodejs'

// Crear el handler de NextAuth v4
const handler = NextAuth(authOptions)

// Wrapper para adaptar NextRequest a formato que NextAuth espera
// NextAuth v4 necesita que el request tenga un objeto 'query' con los parámetros de ruta
// En Next.js 15+, params es una Promise que debe ser await
async function GET(req: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  // Await params en Next.js 15+
  const resolvedParams = await params
  
  // Construir el objeto query desde los parámetros de ruta
  const query = {
    nextauth: resolvedParams.nextauth || [],
  }
  
  // Crear un objeto request compatible con NextAuth
  const authReq = {
    ...req,
    query,
    url: req.url,
    method: 'GET',
  } as any
  
  return handler(authReq)
}

async function POST(req: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  // Await params en Next.js 15+
  const resolvedParams = await params
  
  // Construir el objeto query desde los parámetros de ruta
  const query = {
    nextauth: resolvedParams.nextauth || [],
  }
  
  // Crear un objeto request compatible con NextAuth
  const authReq = {
    ...req,
    query,
    url: req.url,
    method: 'POST',
  } as any
  
  return handler(authReq)
}

export { GET, POST }
