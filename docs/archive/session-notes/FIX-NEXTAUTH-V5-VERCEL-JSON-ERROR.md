# Fix: NextAuth v5 SyntaxError en Vercel

## Problema

Error en producción (Vercel) al intentar iniciar sesión con Google:

```
SyntaxError: Unexpected token 'c', "csrfToken="... is not valid JSON
```

Este error ocurre cuando NextAuth v5 beta intenta parsear el body del request como JSON cuando viene como `application/x-www-form-urlencoded`.

## Causa

Bug conocido en NextAuth v5 beta.29-30 donde intenta parsear form-urlencoded como JSON en Vercel.

## Soluciones Implementadas

1. ✅ Agregado `export const runtime = 'nodejs'` en el route handler
2. ✅ Configurado soporte para `AUTH_URL` además de `NEXTAUTH_URL`
3. ✅ Verificado que todas las variables de entorno estén configuradas en Vercel

## Soluciones Pendientes

### Opción 1: Esperar actualización de NextAuth
- Monitorear releases de NextAuth v5 para un fix
- Issue reportado en el repositorio de NextAuth

### Opción 2: Considerar NextAuth v4 (estable)
- NextAuth v4 es estable y no tiene este bug
- Requeriría migración del código

### Opción 3: Workaround temporal
- Usar un proxy o middleware que convierta el body antes de que llegue a NextAuth
- No recomendado por complejidad

## Verificaciones Necesarias

1. ✅ Variables de entorno en Vercel:
   - `NEXTAUTH_URL` o `AUTH_URL`: `https://www.pinteya.com`
   - `AUTH_SECRET` o `NEXTAUTH_SECRET`: Configurado
   - `AUTH_GOOGLE_ID`: Configurado
   - `AUTH_GOOGLE_SECRET`: Configurado

2. ✅ Google Cloud Console:
   - Redirect URIs configurados para todos los dominios
   - Incluir: `https://pinteya.com.ar/api/auth/callback/google`

## Estado Actual

- **Versión NextAuth**: 5.0.0-beta.30 (más reciente disponible)
- **Error**: Persiste en producción
- **Local**: Funciona con sesión en caché
- **Producción**: Falla en nuevos logins

## Próximos Pasos

1. Monitorear actualizaciones de NextAuth v5
2. Considerar migración a NextAuth v4 si el problema persiste
3. Verificar si hay workarounds en la comunidad
