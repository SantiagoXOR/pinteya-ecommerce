# 🚀 Configuración de Variables de Entorno en Producción

**Fecha**: 10 Enero 2025  
**Estado**: Guía de Configuración

## ⚠️ Error Actual

```
SUPABASE_SERVICE_ROLE_KEY not found - Admin functions will be limited
```

Este error aparece porque la variable crítica `SUPABASE_SERVICE_ROLE_KEY` no está configurada en tu servidor de producción.

## 🔑 Variables Críticas Requeridas

Para que el sistema de roles funcione en producción, necesitas configurar estas variables:

### 1. **Supabase (CRÍTICO)**

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**¿Dónde obtenerlas?**
1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Settings** → **API**
4. Copiar:
   - **URL**: Project URL
   - **Service Role Key**: service_role (⚠️ Mantener secreta)

### 2. **NextAuth (CRÍTICO)**

```env
AUTH_GOOGLE_ID=123456789-abc.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-abc123...
AUTH_SECRET=genera_un_string_aleatorio_de_32_caracteres
NEXTAUTH_URL=https://tu-dominio.com
```

**¿Dónde obtenerlas?**

**Google OAuth:**
1. Ir a: https://console.cloud.google.com/
2. Crear proyecto (si no tienes)
3. Ir a **APIs & Services** → **Credentials**
4. Crear **OAuth 2.0 Client ID**
5. Tipo: Web application
6. Authorized redirect URIs: `https://tu-dominio.com/api/auth/callback/google`

**AUTH_SECRET:**
```bash
# Generar en tu terminal:
openssl rand -base64 32
```

### 3. **MercadoPago (Pagos)**

```env
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-abc123...
MP_ACCESS_TOKEN=APP_USR-123456...
```

**¿Dónde obtenerlas?**
1. Ir a: https://www.mercadopago.com.ar/developers/panel/credentials
2. Copiar las credenciales de **Producción**

## 📋 Configuración en Vercel

Si estás usando Vercel (lo más probable):

### Paso 1: Acceder a la Configuración

1. Ir a: https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables Una por Una

Para cada variable crítica:

1. Click en **Add New**
2. **Key**: Nombre de la variable (ej: `SUPABASE_SERVICE_ROLE_KEY`)
3. **Value**: El valor de la variable
4. **Environments**: Seleccionar `Production`, `Preview`, y `Development`
5. Click en **Save**

### Paso 3: Variables que DEBES Agregar

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY  ← CRÍTICA para roles
✅ AUTH_GOOGLE_ID
✅ AUTH_GOOGLE_SECRET
✅ AUTH_SECRET
✅ NEXTAUTH_URL  (tu dominio de producción)
✅ NEXT_PUBLIC_MP_PUBLIC_KEY
✅ MP_ACCESS_TOKEN
```

### Paso 4: Redesplegar

Después de agregar las variables:

1. En Vercel, ir a **Deployments**
2. Click en los **3 puntos** del último deployment
3. Seleccionar **Redeploy**
4. Esperar a que termine

## 🔍 Verificar Variables en Producción

Puedes crear una ruta API temporal para verificar:

```typescript
// src/app/api/debug/check-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante',
    googleId: process.env.AUTH_GOOGLE_ID ? '✅ Configurada' : '❌ Faltante',
    googleSecret: process.env.AUTH_GOOGLE_SECRET ? '✅ Configurada' : '❌ Faltante',
    authSecret: process.env.AUTH_SECRET ? '✅ Configurada' : '❌ Faltante',
    nextauthUrl: process.env.NEXTAUTH_URL || '⚠️ Usando default',
  })
}
```

Luego acceder a: `https://tu-dominio.com/api/debug/check-env`

## 🚨 Seguridad Importante

### ⚠️ NUNCA Hagas Esto:

- ❌ Subir `.env.local` a Git
- ❌ Compartir `SUPABASE_SERVICE_ROLE_KEY` públicamente
- ❌ Usar `BYPASS_AUTH=true` en producción
- ❌ Hardcodear claves en el código

### ✅ SÍ Haz Esto:

- ✅ Usar variables de entorno en Vercel
- ✅ Mantener `.env.local` en `.gitignore`
- ✅ Rotar claves si se comprometen
- ✅ Usar diferentes claves para dev/prod

## 🎯 Checklist de Configuración

Antes de ir a producción, verifica:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada en Vercel
- [ ] `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` configuradas
- [ ] `AUTH_SECRET` generada y configurada
- [ ] `NEXTAUTH_URL` apunta a tu dominio de producción
- [ ] Redirect URI de Google incluye tu dominio
- [ ] Migraciones SQL ejecutadas en Supabase
- [ ] Administradores registrados en `user_profiles`
- [ ] `BYPASS_AUTH` es `false` o no existe

## 🐛 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY not found"

**Causa**: Variable no configurada en Vercel

**Solución**:
1. Ir a Vercel → Settings → Environment Variables
2. Agregar `SUPABASE_SERVICE_ROLE_KEY`
3. Redesplegar

### Error: "Invalid login callback URL"

**Causa**: Redirect URI no configurada en Google

**Solución**:
1. Google Cloud Console → Credentials
2. Editar OAuth 2.0 Client
3. Agregar: `https://tu-dominio.com/api/auth/callback/google`

### Error: "User role is undefined"

**Causa**: Las migraciones SQL no se ejecutaron en producción

**Solución**:
1. Ir a Supabase Dashboard (producción)
2. SQL Editor
3. Ejecutar las migraciones:
   - `20250110_auto_sync_user_profiles.sql`
   - `20250110_register_admin_users.sql`

## 📞 Próximos Pasos

1. **Configurar variables en Vercel** (5 min)
2. **Redesplegar** (2 min)
3. **Probar login** en producción
4. **Verificar acceso admin** con tus emails

---

¿Necesitas ayuda con algún paso específico de la configuración?

