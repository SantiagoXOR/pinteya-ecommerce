// 🔧 Enterprise API Auth Middleware

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'

export function withAdminAuth(permissions: string[] = []) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        // ✅ FIX: Detectar multipart/form-data y evitar leer el body
        const contentType = request.headers.get('content-type') || ''
        const isMultipart = contentType.includes('multipart/form-data')
        const isFormUrlEncoded = contentType.includes('application/x-www-form-urlencoded')
        
        // ✅ CRÍTICO: Si es multipart y BYPASS_AUTH está activo, permitir acceso SIN llamar a checkCRUDPermissions
        // Esto evita que cualquier función intente leer el body
        if ((isMultipart || isFormUrlEncoded) && process.env.BYPASS_AUTH === 'true') {
          console.log('🔐 [withAdminAuth] Multipart request con BYPASS_AUTH activo, permitiendo acceso sin verificar permisos')
          return await handler(request, context)
        }
        
        // ✅ CORREGIDO: Mapear permisos a acciones CRUD
        // permissions puede ser ['products_read'], ['products_update'], ['products_delete'], etc.
        let action: 'create' | 'read' | 'update' | 'delete' = 'read'
        let resource = 'products'
        
        if (permissions.length > 0) {
          const permission = permissions[0]
          if (permission.includes('_read')) {
            action = 'read'
          } else if (permission.includes('_update')) {
            action = 'update'
          } else if (permission.includes('_delete')) {
            action = 'delete'
          } else if (permission.includes('_create')) {
            action = 'create'
          }
          
          // Extraer el recurso del permiso (ej: 'products_read' -> 'products')
          const parts = permission.split('_')
          if (parts.length > 0) {
            resource = parts[0]
          }
        }
        
        console.log('🔐 [withAdminAuth] Verificando permisos:', {
          permissions,
          action,
          resource,
          url: request.url,
          contentType,
          isMultipart,
        })
        
        // ✅ CORREGIDO: Pasar request a checkCRUDPermissions para que auth() pueda leer las cookies
        // Para multipart, no pasamos el request para evitar que intente leer el body
        const authResult = await checkCRUDPermissions(action, resource, undefined, isMultipart ? undefined : request)

        if (!authResult.allowed) {
          console.error('❌ [withAdminAuth] Acceso denegado:', {
            error: authResult.error,
            action,
            resource,
            url: request.url,
          })
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

        console.log('✅ [withAdminAuth] Autenticación exitosa')
        return await handler(request, context)
      } catch (error: any) {
        console.error('❌ [withAdminAuth] Error en middleware:', {
          error: error.message,
          stack: error.stack,
          url: request.url,
        })
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
        // ✅ CORREGIDO: Pasar request a checkCRUDPermissions para que auth() pueda leer las cookies
        const authResult = await checkCRUDPermissions(
          action as 'create' | 'read' | 'update' | 'delete',
          resource,
          undefined,
          request
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
