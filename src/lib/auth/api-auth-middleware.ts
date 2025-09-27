// 🔧 Enterprise API Auth Middleware

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'

export function withAdminAuth(permissions: string[] = []) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        // Verificar autenticación enterprise
        const authResult = await checkCRUDPermissions('read', 'products')

        if (!authResult.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: authResult.error || 'Acceso denegado',
              code: 'AUTH_ERROR',
              timestamp: new Date().toISOString(),
              path: request.url,
            },
            { status: 401 }
          )
        }

        return await handler(request, context)
      } catch (error) {
        console.error('Auth middleware error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error de autenticación',
            code: 'AUTH_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: 500 }
        )
      }
    }
  }
}

export function withPermissionCheck(resource: string, action: string) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        const authResult = await checkCRUDPermissions(
          action as 'create' | 'read' | 'update' | 'delete',
          resource
        )

        if (!authResult.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: authResult.error || 'Permisos insuficientes',
              code: 'PERMISSION_DENIED',
              timestamp: new Date().toISOString(),
              path: request.url,
            },
            { status: 403 }
          )
        }

        return await handler(request, context)
      } catch (error) {
        console.error('Permission check error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error de verificación de permisos',
            code: 'PERMISSION_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: 500 }
        )
      }
    }
  }
}
