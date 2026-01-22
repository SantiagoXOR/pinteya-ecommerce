# 🔧 Fix: Error 400 en `/api/auth/signin/google`

## ❌ Problema

Al intentar iniciar sesión con Google, se recibe un error `400 Bad Request` en la solicitud a `/api/auth/signin/google`, y el usuario es redirigido al home sin pasar por la autenticación de Google.

## 🔍 Causas Posibles

### 1. **NEXTAUTH_URL no configurado en producción** ⚠️ MÁS PROBABLE

NextAuth necesita `NEXTAUTH_URL` para construir correctamente las URLs de autorización y callback. Sin esta variable, NextAuth no puede generar la URL correcta para redirigir a Google.

**Solución:**
```env
NEXTAUTH_URL=https://www.pinteya.com
```

### 2. **Variables de Google OAuth faltantes o incorrectas**

Si `AUTH_GOOGLE_ID` o `AUTH_GOOGLE_SECRET` no están configuradas o son incorrectas, NextAuth no puede inicializar el provider de Google.

**Solución:**
- Verificar que ambas variables estén configuradas en Vercel
- Verificar que sean las credenciales de **producción** (no desarrollo)
- Verificar que el Client ID termine en `.googleusercontent.com`

### 3. **URL de callback no coincide en Google Cloud Console**

La URL de callback configurada en Google Cloud Console debe coincidir exactamente con la que NextAuth genera.

**Solución:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Ir a **APIs & Services** → **Credentials**
3. Seleccionar tu OAuth 2.0 Client ID
4. Verificar que en **Authorized redirect URIs** esté:
   ```
   https://www.pinteya.com/api/auth/callback/google
   ```
5. **IMPORTANTE**: Debe coincidir exactamente (sin trailing slash, con `https://`)

### 4. **Problema con el handler de NextAuth**

El handler puede no estar exportándose correctamente o puede haber un problema con la ruta.

**Verificación:**
- El archivo `src/app/api/auth/[...nextauth]/route.ts` debe exportar `GET` y `POST`
- La ruta debe ser exactamente `/api/auth/[...nextauth]`

## ✅ Correcciones Implementadas

### 1. Validación de Variables de Entorno (`src/auth.ts`)

Ahora se valida que todas las variables críticas estén configuradas:
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL` (con advertencia si falta)

### 2. Configuración Explícita de basePath y baseUrl

```typescript
const nextAuth = NextAuth({
  basePath: '/api/auth',
  ...(nextAuthUrl && { baseUrl: nextAuthUrl }),
  // ...
})
```

### 3. Endpoint de Verificación (`/api/auth/check-config`)

Nuevo endpoint para verificar la configuración en producción:
```
GET /api/auth/check-config
```

Este endpoint muestra:
- Qué variables están configuradas
- Qué variables faltan
- Recomendaciones específicas

### 4. Mejor Manejo de Errores en SignInForm

El componente ahora:
- Captura errores de red (400, 500, etc.)
- Redirige a la página de error con el código apropiado
- Muestra mensajes más claros al usuario

## 📋 Checklist para Resolver el Problema

### Paso 1: Verificar Variables en Vercel

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar tu proyecto
3. Ir a **Settings** → **Environment Variables**
4. Verificar que estas variables estén configuradas para **Production**:

```
✅ NEXTAUTH_URL=https://www.pinteya.com
✅ AUTH_GOOGLE_ID=tu_client_id.apps.googleusercontent.com
✅ AUTH_GOOGLE_SECRET=GOCSPX-tu_secret
✅ NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Paso 2: Verificar en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Seleccionar tu OAuth 2.0 Client ID
4. Verificar **Authorized redirect URIs**:
   ```
   https://www.pinteya.com/api/auth/callback/google
   ```
5. **IMPORTANTE**: 
   - Debe ser exactamente `https://www.pinteya.com` (no `http://`)
   - No debe tener trailing slash
   - Debe incluir `/api/auth/callback/google` completo

### Paso 3: Verificar Configuración

Después de desplegar, acceder a:
```
https://www.pinteya.com/api/auth/check-config
```

Este endpoint mostrará:
- Qué variables están configuradas
- Qué variables faltan
- Recomendaciones específicas

### Paso 4: Redesplegar

Después de agregar/corregir las variables:
1. En Vercel, ir a **Deployments**
2. Click en los **3 puntos** del último deployment
3. Seleccionar **Redeploy**
4. Esperar a que termine

### Paso 5: Probar el Flujo

1. Ir a `https://www.pinteya.com/auth/signin`
2. Click en "Continuar con Google"
3. Debe redirigir a Google para autenticación
4. Después de autenticar, debe redirigir de vuelta a la app

## 🚨 Errores Comunes y Soluciones

### Error: "400 Bad Request" al hacer click en "Continuar con Google"

**Causa:** `NEXTAUTH_URL` no está configurado o es incorrecto

**Solución:**
1. Verificar que `NEXTAUTH_URL=https://www.pinteya.com` esté en Vercel
2. Redesplegar después de agregar la variable

### Error: "redirect_uri_mismatch" en Google

**Causa:** La URL de callback en Google Cloud Console no coincide

**Solución:**
1. Verificar que la URL en Google Cloud Console sea exactamente:
   ```
   https://www.pinteya.com/api/auth/callback/google
   ```
2. No debe tener trailing slash
3. Debe usar `https://` (no `http://`)

### Error: "invalid_client" en Google

**Causa:** `AUTH_GOOGLE_ID` o `AUTH_GOOGLE_SECRET` son incorrectos

**Solución:**
1. Verificar que las credenciales en Vercel sean correctas
2. Verificar que sean las credenciales de **producción** (no desarrollo)
3. Regenerar las credenciales en Google Cloud Console si es necesario

## 📝 Notas Técnicas

- NextAuth v5 usa `basePath` y `baseUrl` para construir URLs
- El `basePath` por defecto es `/api/auth`
- `NEXTAUTH_URL` debe ser la URL completa de producción (con `https://`)
- La URL de callback en Google debe coincidir exactamente con la que NextAuth genera

## ✅ Estado

- [x] Validación de variables de entorno
- [x] Configuración explícita de basePath/baseUrl
- [x] Endpoint de verificación de configuración
- [x] Mejor manejo de errores en SignInForm
- [ ] Verificar variables en Vercel
- [ ] Verificar configuración en Google Cloud Console
- [ ] Redesplegar
- [ ] Probar flujo completo
