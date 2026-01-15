# 🔑 Variables de Entorno Requeridas - Pinteya E-commerce

## ⚠️ ERROR EN PRODUCCIÓN

```
SUPABASE_SERVICE_ROLE_KEY not found - Admin functions will be limited
```

## 🚨 Solución Inmediata

Debes configurar estas variables en tu plataforma de producción (Vercel):

### Variables Críticas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTk0NTEwMiwiZXhwIjoyMDM3NTIxMTAyfQ.Y_h4g8R9r_XXXX

AUTH_GOOGLE_ID=tu_google_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-tu_google_secret
AUTH_SECRET=genera_un_string_aleatorio_32_chars

NEXTAUTH_URL=https://tu-dominio-produccion.com

NEXT_PUBLIC_MP_PUBLIC_KEY=tu_mercadopago_public_key
MP_ACCESS_TOKEN=tu_mercadopago_access_token

# Redis (Opcional pero recomendado)
REDIS_HOST=tu-redis-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=tu-redis-password
REDIS_DB=0
DISABLE_REDIS=false
```

## 📋 Pasos para Configurar en Vercel

### 1. Acceder a Vercel

```
https://vercel.com/dashboard
→ Selecciona tu proyecto
→ Settings
→ Environment Variables
```

### 2. Agregar Cada Variable

Para cada variable de arriba:

1. Click **"Add New"**
2. **Key**: `SUPABASE_SERVICE_ROLE_KEY` (por ejemplo)
3. **Value**: Pega el valor de tu Supabase
4. **Environments**: Selecciona **Production**, **Preview**, **Development**
5. Click **"Save"**

### 3. ¿Dónde Obtener las Claves?

#### Supabase:
```
https://supabase.com/dashboard
→ Tu proyecto
→ Settings → API
→ Copiar "service_role" key (⚠️ No la "anon" key)
```

#### Google OAuth:
```
https://console.cloud.google.com/
→ APIs & Services → Credentials
→ Create OAuth 2.0 Client ID
→ Authorized redirect URIs: https://tu-dominio.com/api/auth/callback/google
```

#### AUTH_SECRET:
```bash
# Generar en terminal:
openssl rand -base64 32
```

#### MercadoPago:
```
https://www.mercadopago.com.ar/developers/panel/credentials
→ Credenciales de Producción
```

#### Redis:
```
Opción 1: Redis Cloud (Recomendado)
https://redis.com/try-free/
→ Crear cuenta → Crear base de datos → Copiar credenciales

Opción 2: Upstash (Serverless)
https://console.upstash.com/
→ Crear cuenta → Crear base de datos → Copiar credenciales

Ver guía completa: docs/REDIS_CONFIGURATION_GUIDE.md
```

### 4. Redesplegar

Después de agregar todas las variables:

```
Vercel Dashboard
→ Deployments
→ Click en los 3 puntos del último deployment
→ "Redeploy"
```

## ✅ Variables que Debes Configurar

Marca las que ya configuraste:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRÍTICA**
- [ ] `AUTH_GOOGLE_ID`
- [ ] `AUTH_GOOGLE_SECRET`
- [ ] `AUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXT_PUBLIC_MP_PUBLIC_KEY`
- [ ] `MP_ACCESS_TOKEN`
- [ ] `REDIS_HOST` (Opcional - Recomendado)
- [ ] `REDIS_PORT` (Opcional - Recomendado)
- [ ] `REDIS_PASSWORD` (Opcional - Recomendado)
- [ ] `DISABLE_REDIS=false` (Cambiar de true a false)

## 🔍 Verificar Configuración

Crea este archivo para verificar:

**`src/app/api/debug/env-check/route.ts`:**

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    googleId: !!process.env.AUTH_GOOGLE_ID,
    googleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    authSecret: !!process.env.AUTH_SECRET,
    nextauthUrl: process.env.NEXTAUTH_URL,
  })
}
```

Luego accede a: `https://tu-dominio.com/api/debug/env-check`

## 🎯 Prioridad de Variables

### 🔥 Críticas (Sistema no funciona sin ellas):
1. `SUPABASE_SERVICE_ROLE_KEY` ← **Tu error actual**
2. `NEXT_PUBLIC_SUPABASE_URL`
3. `AUTH_GOOGLE_ID`
4. `AUTH_GOOGLE_SECRET`
5. `AUTH_SECRET`

### 🟡 Importantes (Funcionalidades específicas):
6. `NEXTAUTH_URL`
7. `NEXT_PUBLIC_MP_PUBLIC_KEY`
8. `MP_ACCESS_TOKEN`

### 🟢 Opcionales (Recomendados):
9. `REDIS_HOST` - Para rate limiting distribuido y cache
10. `REDIS_PORT` - Puerto de Redis
11. `REDIS_PASSWORD` - Password de Redis
12. `DISABLE_REDIS` - Debe ser `false` para habilitar Redis
13. `GOOGLE_MAPS_API_KEY`
14. `NEXT_PUBLIC_DEBUG`

## 🚨 Seguridad

### ⚠️ NUNCA:
- Subir `.env.local` a Git
- Compartir `SUPABASE_SERVICE_ROLE_KEY`
- Usar `BYPASS_AUTH=true` en producción
- Hardcodear claves en el código

### ✅ SIEMPRE:
- Usar variables de entorno
- Diferentes claves para dev/prod
- Rotar claves si se comprometen
- Mantener `.env.local` en `.gitignore`

## 📝 Orden de Configuración Recomendado

1. ✅ Configurar Supabase (URL + Service Key)
2. ✅ Configurar Google OAuth (ID + Secret)
3. ✅ Generar y configurar AUTH_SECRET
4. ✅ Configurar NEXTAUTH_URL
5. ✅ Redesplegar
6. ✅ Probar login
7. ✅ Configurar MercadoPago (si usas pagos)
8. ✅ Configurar Redis (recomendado para producción)
   - Ver: `docs/REDIS_CONFIGURATION_GUIDE.md`
   - Test: `node scripts/test-redis-connection.js`

---

**Documentación completa**: `docs/CONFIGURACION_PRODUCCION.md`

¿Necesitas ayuda para obtener alguna de estas claves?

