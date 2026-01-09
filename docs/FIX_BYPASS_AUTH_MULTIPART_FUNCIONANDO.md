# Fix: BYPASS_AUTH funcionando correctamente con requests multipart/form-data

**Fecha:** 2026-01-08  
**Estado:** ✅ RESUELTO  
**Prioridad:** Crítica

## 📋 Resumen

Se resolvió el error `TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"` que ocurría al subir imágenes en producción con `BYPASS_AUTH` activo. El problema era que Next.js intentaba leer el body del request antes de que el handler pudiera procesarlo.

## 🔍 Problema Original

El error ocurría cuando se intentaba subir imágenes a `/api/admin/products/[id]/images` con `BYPASS_AUTH=true` en producción (Vercel):

```
TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".
    at node:internal/deps/undici/undici:5691:19
    at async consumeBody (node:internal/deps/undici/undici:5728:7)
```

### Causa Raíz

El problema tenía múltiples causas:

1. **Orden de ejecución de middlewares**: Los middlewares (`withErrorHandler`, `withApiLogging`, `withAdminAuth`) se ejecutaban antes de que el handler pudiera leer el body, y alguno de ellos intentaba acceder al request, causando que Next.js intentara parsear el body automáticamente.

2. **Lectura prematura del body**: `getToken()` en el middleware global y `auth()` en el handler intentaban leer el body antes de que el handler pudiera procesarlo.

3. **Detección tardía de BYPASS_AUTH**: El código verificaba `BYPASS_AUTH` después de acceder a propiedades del request (como headers), lo que causaba que Next.js intentara leer el body.

## ✅ Solución Implementada

### 1. Verificación temprana de BYPASS_AUTH

**Archivo:** `src/lib/auth/api-auth-middleware.ts`

**Cambio clave:** Verificar `BYPASS_AUTH` **ANTES** de acceder a cualquier propiedad del request:

```typescript
export function withAdminAuth(permissions: string[] = []) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        // ✅ CRÍTICO: Verificar BYPASS_AUTH PRIMERO, antes de acceder a cualquier propiedad del request
        const bypassAuth = process.env.BYPASS_AUTH === 'true'
        
        // ✅ CRÍTICO: Si BYPASS_AUTH está activo, permitir acceso INMEDIATAMENTE sin verificar nada
        if (bypassAuth) {
          console.log('🔐 [withAdminAuth] ✅ BYPASS_AUTH activo, permitiendo acceso sin verificar permisos')
          return await handler(request, context)
        }
        
        // Solo después verificar Content-Type y otros detalles
        // ...
      }
    }
  }
}
```

**Por qué funciona:** Al retornar inmediatamente cuando `BYPASS_AUTH` está activo, evitamos que cualquier middleware o función intente acceder al request, lo que previene que Next.js intente leer el body.

### 2. Lectura temprana del body en el handler

**Archivo:** `src/app/api/admin/products/[id]/images/route.ts`

**Cambio clave:** Leer el body **PRIMERO**, antes de cualquier otra operación:

```typescript
const postHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // ✅ CRÍTICO: Leer el body PRIMERO, antes de hacer cualquier otra cosa
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error: any) {
    // Manejo de errores específico para Content-Type
    // ...
  }
  
  // Solo después intentar obtener usuario (si no es BYPASS_AUTH)
  let user = null
  if (process.env.BYPASS_AUTH !== 'true') {
    // Intentar obtener usuario...
  }
  
  // Resto del handler...
}
```

**Por qué funciona:** Al leer el body primero, "consumimos" el stream del body, evitando que otros middlewares o funciones intenten leerlo después.

### 3. Reordenamiento de middlewares

**Archivo:** `src/app/api/admin/products/[id]/images/route.ts`

**Cambio clave:** Ejecutar `withAdminAuth` **PRIMERO** para permitir bypass inmediato:

```typescript
// ✅ CRÍTICO: Orden de middlewares optimizado para requests multipart
// withAdminAuth debe ejecutarse PRIMERO para retornar inmediatamente cuando BYPASS_AUTH está activo
export const POST = composeMiddlewares(
  withAdminAuth(['products_update']), // Ejecutar PRIMERO para bypass inmediato
  withErrorHandler,
  withApiLogging
)(postHandler)
```

**Por qué funciona:** Al ejecutar `withAdminAuth` primero, si `BYPASS_AUTH` está activo, retornamos inmediatamente sin que otros middlewares accedan al request.

### 4. Verificación temprana en middleware global

**Archivo:** `middleware.ts`

**Cambio clave:** Verificar `BYPASS_AUTH` antes de acceder a headers:

```typescript
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const isProduction = process.env.NODE_ENV === 'production'
  const startTime = Date.now()

  // ✅ CRÍTICO: Verificar BYPASS_AUTH ANTES de acceder a cualquier propiedad del request
  if (process.env.BYPASS_AUTH === 'true') {
    console.log(`[BYPASS] ✅ Permitiendo acceso sin autenticación a: ${nextUrl.pathname}`)
    // ✅ CRÍTICO: Retornar inmediatamente sin acceder a headers ni procesar el request
    return NextResponse.next()
  }

  // Solo después verificar Content-Type y llamar getToken()
  // ...
}
```

**Por qué funciona:** Al retornar inmediatamente en el middleware global, evitamos que `getToken()` intente leer el body.

### 5. Manejo de errores de Content-Type

**Archivo:** `src/lib/auth/api-auth-middleware.ts`

**Cambio clave:** Capturar errores de Content-Type y permitir acceso si `BYPASS_AUTH` está activo:

```typescript
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
  
  // Manejo de otros errores...
}
```

**Por qué funciona:** Como medida de seguridad adicional, si ocurre un error de Content-Type pero `BYPASS_AUTH` está activo, permitimos el acceso de todas formas.

## 📝 Cambios Adicionales

### Runtime Node.js

**Archivo:** `src/app/api/admin/products/[id]/images/route.ts`

```typescript
// ✅ CRÍTICO: Usar runtime nodejs para evitar problemas con body parsing en Vercel
export const runtime = 'nodejs'
```

### Mejoras en detección de Content-Type

Se mejoró la detección de `Content-Type` usando `.toLowerCase()` para ser más robusta:

```typescript
const contentTypeLower = contentType.toLowerCase()
const isMultipart = contentTypeLower.includes('multipart/form-data')
const isFormUrlEncoded = contentTypeLower.includes('application/x-www-form-urlencoded')
```

## 🎯 Resultado

✅ **El bypass ahora funciona correctamente:**
- Las imágenes se pueden subir sin errores cuando `BYPASS_AUTH=true`
- No hay intentos de leer el body antes de tiempo
- El orden de ejecución de middlewares es óptimo
- Los errores de Content-Type se manejan correctamente

## ⚠️ Notas Importantes

1. **Orden de middlewares es crítico**: `withAdminAuth` debe ejecutarse primero para permitir bypass inmediato.

2. **Lectura temprana del body**: En handlers que procesan `multipart/form-data`, siempre leer el body primero antes de cualquier otra operación.

3. **BYPASS_AUTH es temporal**: Este bypass está habilitado temporalmente en producción. Debe deshabilitarse cuando se resuelvan los problemas de autenticación.

4. **Runtime Node.js**: Las rutas que procesan `multipart/form-data` deben usar `export const runtime = 'nodejs'` para evitar problemas en Vercel.

5. **No clonar requests**: En producción (Vercel), clonar requests puede causar problemas con Content-Type. Pasar el request original directamente al handler.

## 🔄 Flujo de Ejecución Correcto

```
1. Request llega a middleware.ts
   └─> Si BYPASS_AUTH=true → Retornar inmediatamente ✅
   └─> Si no → Verificar autenticación normalmente

2. Request llega a withAdminAuth
   └─> Si BYPASS_AUTH=true → Retornar inmediatamente al handler ✅
   └─> Si no → Verificar permisos normalmente

3. Handler ejecuta
   └─> Leer body PRIMERO (request.formData()) ✅
   └─> Procesar datos
   └─> Retornar respuesta
```

## 📚 Referencias

- [Next.js App Router - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js - Request Body](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body)
- [Vercel - Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

## ✅ Checklist de Verificación

- [x] `BYPASS_AUTH` se verifica antes de acceder a propiedades del request
- [x] El body se lee primero en handlers multipart
- [x] `withAdminAuth` se ejecuta primero en la cadena de middlewares
- [x] El middleware global verifica `BYPASS_AUTH` temprano
- [x] Los errores de Content-Type se manejan correctamente
- [x] Se usa `runtime = 'nodejs'` en rutas multipart
- [x] No se clonan requests innecesariamente

---

**Última actualización:** 2026-01-08  
**Autor:** Sistema de desarrollo  
**Revisado por:** Equipo de desarrollo
