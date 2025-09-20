/**
 * NextAuth.js API Route Handler
 * Maneja todas las rutas de autenticación (/api/auth/*)
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers

// Configurar runtime para Node.js
export const runtime = 'nodejs'
