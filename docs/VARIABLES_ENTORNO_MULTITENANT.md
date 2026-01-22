# Variables de Entorno - Sistema Multitenant

**Fecha:** 2026-01-23  
**Estado:** 📋 **GUÍA DE CONFIGURACIÓN**

---

## 📋 Resumen Ejecutivo

En el sistema multitenant, hay **dos tipos de configuraciones**:

1. **Variables de Entorno Globales** (en Vercel) - Compartidas por todos los tenants
2. **Configuraciones por Tenant** (en Base de Datos) - Específicas de cada tenant

---

## 🔧 Variables de Entorno Globales (Vercel)

**Estas se configuran UNA VEZ en Vercel Dashboard y son compartidas por todos los tenants:**

### Variables Críticas (Compartidas)

```env
# Supabase (Compartido - Misma BD para todos los tenants)
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth (Compartido - Mismo sistema de auth)
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=https://www.pinteya.com

# Google OAuth (Compartido - Mismo OAuth)
AUTH_GOOGLE_ID=tu_google_client_id
AUTH_GOOGLE_SECRET=tu_google_secret

# Redis (Compartido - Mismo Redis para todos)
REDIS_HOST=tu-redis-host
REDIS_PORT=12345
REDIS_PASSWORD=tu-redis-password
REDIS_DB=0
DISABLE_REDIS=false

# MercadoPago (Opcional - Puede ser compartido o por tenant)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_CLIENT_ID=xxx
MERCADOPAGO_CLIENT_SECRET=xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx
```

**⚠️ IMPORTANTE:** Estas variables se configuran **UNA VEZ** en Vercel Dashboard → Settings → Environment Variables. NO hay un archivo por tenant.

---

## 🗄️ Configuraciones por Tenant (Base de Datos)

**Estas se almacenan en la tabla `tenants` en Supabase y se leen dinámicamente:**

### Configuraciones que están en la BD (por tenant)

Cada tenant tiene sus propias configuraciones en la tabla `tenants`:

| Campo en BD | Descripción | Ejemplo |
|-------------|-------------|---------|
| `ga4_measurement_id` | Google Analytics 4 ID | `G-XXXXXXXXXX` |
| `meta_pixel_id` | Meta Pixel ID | `123456789012345` |
| `mercadopago_access_token` | MercadoPago Access Token | `APP_USR-xxx` |
| `mercadopago_public_key` | MercadoPago Public Key | `APP_USR-xxx` |
| `mercadopago_webhook_secret` | MercadoPago Webhook Secret | `xxx` |
| `resend_api_key` | Resend API Key (emails) | `re_xxx` |
| `whatsapp_number` | Número de WhatsApp | `+5493516323002` |
| `primary_color` | Color principal | `#f27a1d` |
| `logo_url` | URL del logo | `/tenants/pinteya/logo.svg` |

### Cómo se Obtienen

```typescript
// En Server Components o API Routes
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
// tenant.ga4MeasurementId - Viene de la BD
// tenant.metaPixelId - Viene de la BD
// tenant.mercadopagoAccessToken - Viene de la BD
```

**⚠️ IMPORTANTE:** Estas configuraciones NO se pasan como variables de entorno a Vercel. Se leen desde la base de datos en tiempo de ejecución.

---

## 📝 ¿Dónde Configurar Cada Cosa?

### En Vercel Dashboard (Variables Globales)

**Ir a:** Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

**Agregar estas variables (UNA VEZ):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `AUTH_GOOGLE_ID` (si usas Google OAuth)
- ✅ `AUTH_GOOGLE_SECRET` (si usas Google OAuth)
- ✅ Variables de Redis (si usas Redis)

**⚠️ NO agregar aquí:**
- ❌ `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - Se configura en BD por tenant
- ❌ `NEXT_PUBLIC_META_PIXEL_ID` - Se configura en BD por tenant
- ❌ `MERCADOPAGO_ACCESS_TOKEN` - Se puede configurar en BD por tenant (o global si compartes)

### En Base de Datos (Configuraciones por Tenant)

**Ir a:** Supabase Dashboard → SQL Editor

**Actualizar tenant Pinteya:**
```sql
UPDATE tenants
SET 
  ga4_measurement_id = 'G-XXXXXXXXXX',  -- Tu GA4 ID de Pinteya
  meta_pixel_id = '123456789012345',     -- Tu Meta Pixel ID de Pinteya
  mercadopago_access_token = 'APP_USR-xxx',  -- Si cada tenant tiene su cuenta
  mercadopago_public_key = 'APP_USR-xxx',
  mercadopago_webhook_secret = 'xxx'
WHERE slug = 'pinteya';
```

**Actualizar tenant Pintemas:**
```sql
UPDATE tenants
SET 
  ga4_measurement_id = 'G-YYYYYYYYYY',  -- Tu GA4 ID de Pintemas
  meta_pixel_id = '987654321098765',     -- Tu Meta Pixel ID de Pintemas
  mercadopago_access_token = 'APP_USR-yyy',  -- Si cada tenant tiene su cuenta
  mercadopago_public_key = 'APP_USR-yyy',
  mercadopago_webhook_secret = 'yyy'
WHERE slug = 'pintemas';
```

---

## 🔍 ¿Cómo Funciona en el Código?

### 1. Variables de Entorno (Globales)

```typescript
// Se leen desde process.env (configuradas en Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Configuraciones por Tenant (BD)

```typescript
// Se leen desde la BD usando getTenantConfig()
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
// tenant.ga4MeasurementId - Viene de tenants.ga4_measurement_id
// tenant.metaPixelId - Viene de tenants.meta_pixel_id
// tenant.mercadopagoAccessToken - Viene de tenants.mercadopago_access_token
```

### 3. Uso en Componentes

```typescript
// Componente TenantAnalytics lee desde el tenant
'use client'
import { useTenantAnalytics } from '@/contexts/TenantContext'

function TenantAnalytics() {
  const { ga4MeasurementId, metaPixelId } = useTenantAnalytics()
  // Estos valores vienen de la BD, no de variables de entorno
}
```

---

## ✅ Checklist de Configuración

### Variables de Entorno en Vercel (Globales)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Configurada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Configurada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Configurada en Vercel
- [ ] `NEXTAUTH_SECRET` - Configurada en Vercel
- [ ] `NEXTAUTH_URL` - Configurada en Vercel
- [ ] Variables de Redis (si usas) - Configuradas en Vercel

### Configuraciones por Tenant en BD

**Para Pinteya:**
- [ ] `ga4_measurement_id` - Configurado en tabla `tenants`
- [ ] `meta_pixel_id` - Configurado en tabla `tenants`
- [ ] `mercadopago_access_token` - Configurado en tabla `tenants` (si cada tenant tiene su cuenta)
- [ ] `mercadopago_public_key` - Configurado en tabla `tenants`
- [ ] `mercadopago_webhook_secret` - Configurado en tabla `tenants`

**Para Pintemas:**
- [ ] `ga4_measurement_id` - Configurado en tabla `tenants`
- [ ] `meta_pixel_id` - Configurado en tabla `tenants`
- [ ] `mercadopago_access_token` - Configurado en tabla `tenants` (si cada tenant tiene su cuenta)

---

## 🎯 Resumen

### ❌ NO Existe:
- Archivo de variables de entorno por tenant
- Variables de entorno `NEXT_PUBLIC_GA4_MEASUREMENT_ID_PINTEYA` vs `NEXT_PUBLIC_GA4_MEASUREMENT_ID_PINTEMAS`
- Script para pasar variables por tenant a Vercel

### ✅ SÍ Existe:
- **Variables globales en Vercel** - Configuradas una vez, compartidas por todos
- **Configuraciones por tenant en BD** - En la tabla `tenants`, se leen dinámicamente

### 🔄 Flujo de Configuración:

1. **Variables Globales:**
   - Configurar en Vercel Dashboard → Environment Variables
   - Se aplican a todos los tenants automáticamente

2. **Configuraciones por Tenant:**
   - Configurar en Supabase → SQL Editor → UPDATE tenants
   - Se leen dinámicamente cuando se detecta el tenant
   - Cada tenant puede tener valores diferentes

---

## 📝 Ejemplo Completo

### Configurar GA4 para Pinteya

**NO hacer esto:**
```env
# ❌ NO crear variables así en Vercel
NEXT_PUBLIC_GA4_MEASUREMENT_ID_PINTEYA=G-XXXXXXXXXX
NEXT_PUBLIC_GA4_MEASUREMENT_ID_PINTEMAS=G-YYYYYYYYYY
```

**SÍ hacer esto:**
```sql
-- ✅ Actualizar en la BD
UPDATE tenants
SET ga4_measurement_id = 'G-XXXXXXXXXX'
WHERE slug = 'pinteya';

UPDATE tenants
SET ga4_measurement_id = 'G-YYYYYYYYYY'
WHERE slug = 'pintemas';
```

### El código lee automáticamente:

```typescript
// En cualquier componente
const tenant = await getTenantConfig()
// tenant.ga4MeasurementId ya tiene el valor correcto según el tenant
```

---

## 🔗 Referencias

- Documentación multitenant: `docs/MULTITENANCY.md`
- Guía de deployment: `docs/GUIA_DEPLOYMENT_MULTITENANT_PRODUCCION.md`
- Estructura de tabla tenants: `supabase/migrations/20260121000001_create_tenants_system.sql`

---

**Última actualización:** 2026-01-23  
**Conclusión:** Las configuraciones por tenant están en la BD, NO como variables de entorno en Vercel
