// 🔧 Enterprise API Auth Middleware

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'

// ✅ DEBUG: Log para verificar orden de ejecución
console.log('[api-auth-middleware] Módulo cargado')

export function withAdminAuth(permissions: string[] = []) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        // ✅ CRÍTICO: Verificar BYPASS_AUTH PRIMERO, antes de acceder a cualquier propiedad del request
        // Esto evita que cualquier acceso al request cause que Next.js intente leer el body
        const bypassAuth = process.env.BYPASS_AUTH === 'true'
        
        // ✅ CRÍTICO: Si BYPASS_AUTH está activo, permitir acceso INMEDIATAMENTE sin verificar nada
        // Esto evita que cualquier acceso al request cause que Next.js intente leer el body
        // DEBE ser lo primero que hacemos, antes de cualquier otra operación
        if (bypassAuth) {
          console.log('🔐 [withAdminAuth] ✅ BYPASS_AUTH activo, permitiendo acceso sin verificar permisos')
          // ✅ CRÍTICO: Pasar el request original directamente al handler
          // NO clonar porque puede causar problemas con Content-Type en producción (Vercel)
          // El handler leerá el body primero, antes de cualquier otra operación
          return await handler(request, context)
        }
        
        // ✅ CRÍTICO: Solo verificar Content-Type si BYPASS_AUTH NO está activo
        // Esto evita que cualquier acceso al request cause que Next.js intente leer el body
        let contentType = ''
        let isMultipart = false
        let isFormUrlEncoded = false
        
        try {
          // Intentar obtener Content-Type de manera segura
          contentType = request.headers.get('content-type') || ''
          const contentTypeLower = contentType.toLowerCase()
          isMultipart = contentTypeLower.includes('multipart/form-data')
          isFormUrlEncoded = contentTypeLower.includes('application/x-www-form-urlencoded')
        } catch (headerError: any) {
          // Si falla al leer headers, retornar error
          console.error('❌ [withAdminAuth] Error leyendo Content-Type:', headerError)
          throw headerError
        }
        
        // ✅ DEBUG: Log del Content-Type para diagnóstico
        console.log('🔐 [withAdminAuth] INICIO - Content-Type detectado:', {
          contentType,
          isMultipart,
          isFormUrlEncoded,
          bypassAuth,
          url: request.url,
          method: request.method,
        })
        
        // ✅ CRÍTICO: Si es multipart/form-data y NO hay BYPASS_AUTH, retornar error
        // porque no podemos leer la sesión sin leer el body
        if (isMultipart || isFormUrlEncoded) {
          console.error('❌ [withAdminAuth] Request multipart sin BYPASS_AUTH, no se puede autenticar')
          return NextResponse.json(
            {
              success: false,
              error: 'Error de autenticación: No se puede autenticar requests multipart sin BYPASS_AUTH',
              code: 'AUTH_ERROR',
              timestamp: new Date().toISOString(),
              path: request.url,
            },
            { status: 401 }
          )
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
        // ✅ CRÍTICO: Si el error es sobre Content-Type y BYPASS_AUTH está activo, permitir acceso
        const bypassAuth = process.env.BYPASS_AUTH === 'true'
        const isContentTypeError = error.message?.includes('Content-Type') || 
                                   error.message?.includes('multipart') ||
                                   error.message?.includes('form-urlencoded')
        
        if (isContentTypeError && bypassAuth) {
          console.log('🔐 [withAdminAuth] ⚠️ Error de Content-Type pero BYPASS_AUTH está activo, permitiendo acceso')
          return await handler(request, context)
        }
        
        console.error('❌ [withAdminAuth] Error en middleware:', {
          error: error.message,
          stack: error.stack,
          url: request.url,
          isContentTypeError,
          bypassAuth,
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
