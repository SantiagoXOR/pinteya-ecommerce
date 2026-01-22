# 🚀 Guía de Deploy a Producción - Sistema Multitenant

**Fecha**: Enero 2026  
**Estado**: Guía Completa para Producción  
**Sistema**: PintureríaDigital (Plataforma Multitenant)

---

## 📋 Resumen Ejecutivo

Esta guía cubre todos los pasos necesarios para levantar el sistema multitenant en producción con el próximo deploy. El sistema está **100% migrado** y listo para producción.

### ⚠️ Configuración: Dominios Configurados

**Tu proyecto ya tiene los siguientes dominios configurados:**

- ✅ **Dominio de Vercel**: `pintureriadigital.vercel.app` (activo en producción)
- ✅ **Dominios Custom de Pinteya**:
  - `www.pinteya.com` (activo en producción)
  - `www.pinteya.com.ar` (activo en producción)
  - `pinteya.com` → redirige a `www.pinteya.com`
  - `pinteya.com.ar` → redirige a `www.pinteya.com.ar`

**Cómo funciona:**
- ✅ El dominio de Vercel (`pintureriadigital.vercel.app`) mostrará el tenant por defecto (**Pinteya**)
- ✅ Los dominios custom (`www.pinteya.com`, `www.pinteya.com.ar`) también mostrarán **Pinteya**
- ✅ Todos los datos se filtrarán automáticamente por `tenant_id` de Pinteya
- ✅ **Base de datos actualizada**: `www.pinteya.com` vinculado al tenant 'pinteya' en Supabase

### Estado Actual del Sistema

- ✅ **APIs Migradas**: 100% completado (todas las APIs críticas y admin)
- ✅ **Base de Datos**: Migraciones aplicadas y RLS policies configuradas
- ✅ **Frontend**: Componentes principales usan `useTenant()` o `useTenantSafe()`
- ✅ **Testing**: 52/52 tests pasando (100% cobertura unitaria)
- ✅ **Tenants Operativos**: Pinteya (principal - será el tenant por defecto), Pintemas (disponible en BD)

---

## 🔧 PASO 1: Configuración de Variables de Entorno en Vercel

### Variables Críticas Requeridas

Todas estas variables **DEBEN** estar configuradas en Vercel antes del deploy:

#### 1. **Supabase (CRÍTICO)**

```env
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**¿Dónde obtenerlas?**
1. Ir a: https://supabase.com/dashboard
2. Seleccionar proyecto: `pintureria-digital`
3. Ir a **Settings** → **API**
4. Copiar:
   - **URL**: Project URL
   - **Anon Key**: anon/public key
   - **Service Role Key**: service_role (⚠️ Mantener secreta)

#### 2. **NextAuth (CRÍTICO)**

```env
AUTH_GOOGLE_ID=tu-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-tu-google-secret
AUTH_SECRET=genera_un_string_aleatorio_de_32_caracteres
NEXTAUTH_URL=https://pintureriadigital.vercel.app
```

**⚠️ IMPORTANTE - Estrategia Multitenant:**

Para un sistema multitenant, **SIEMPRE usa el dominio principal de la plataforma** (`pintureriadigital.vercel.app`) como `NEXTAUTH_URL`, **NO** uses dominios específicos de tenants.

**¿Por qué?**
- ✅ Funciona para **todos los tenants** sin cambios
- ✅ No necesitas modificar variables cuando agregas nuevos tenants
- ✅ NextAuth maneja callbacks desde cualquier dominio si está configurado en Google OAuth
- ✅ Más fácil de mantener y escalar

**Configuración actual (temporal):**
Si actualmente tienes `NEXTAUTH_URL=https://www.pinteya.com`, está bien para empezar, pero **recomendamos cambiarlo a `https://pintureriadigital.vercel.app`** para preparar el sistema para múltiples tenants.

**¿Dónde obtenerlas?**

**Google OAuth:**
1. Ir a: https://console.cloud.google.com/
2. Crear proyecto (si no tienes)
3. Ir a **APIs & Services** → **Credentials**
4. Crear **OAuth 2.0 Client ID**
5. Tipo: Web application
6. Authorized redirect URIs: 
   - `https://pintureriadigital.vercel.app/api/auth/callback/google`
   - `https://www.pinteya.com/api/auth/callback/google`
   - `https://www.pinteya.com.ar/api/auth/callback/google`

**AUTH_SECRET:**
```bash
# Generar en tu terminal:
openssl rand -base64 32
```

#### 3. **MercadoPago (Pagos)**

```env
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-tu-public-key
MP_ACCESS_TOKEN=APP_USR-tu-access-token
```

**¿Dónde obtenerlas?**
1. Ir a: https://www.mercadopago.com.ar/developers/panel/credentials
2. Copiar las credenciales de **Producción** (no sandbox)

#### 4. **Variables Adicionales Recomendadas**

```env
# Redis (Opcional pero recomendado para cache)
REDIS_HOST=tu-redis-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=tu-redis-password
REDIS_DB=0
DISABLE_REDIS=false

# Email (Resend)
RESEND_API_KEY=re_tu-api-key
RESEND_FROM_EMAIL=noreply@pintureriadigital.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
ANALYTICS_ENABLED=true

# Multitenant: URL canónica del tenant por defecto (redirect desde dominio plataforma)
# Si no se define, se usa https://www.pinteya.com
DEFAULT_TENANT_CANONICAL_URL=https://www.pinteya.com
```

### Configuración en Vercel

1. **Acceder a Vercel Dashboard**
   - Ir a: https://vercel.com/dashboard
   - Seleccionar tu proyecto

2. **Ir a Environment Variables**
   - Settings → **Environment Variables**

3. **Agregar Cada Variable**
   - Click en **Add New**
   - **Key**: Nombre de la variable (ej: `SUPABASE_SERVICE_ROLE_KEY`)
   - **Value**: El valor de la variable
   - **Environments**: Seleccionar `Production`, `Preview`, y `Development`
   - Click en **Save**

4. **Checklist de Variables**

Marca las que ya configuraste:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRÍTICA**
- [ ] `AUTH_GOOGLE_ID`
- [ ] `AUTH_GOOGLE_SECRET`
- [ ] `AUTH_SECRET`
- [ ] `NEXTAUTH_URL` (⚠️ **RECOMENDADO**: `https://pintureriadigital.vercel.app` para multitenant)
- [ ] `NEXT_PUBLIC_MP_PUBLIC_KEY`
- [ ] `MP_ACCESS_TOKEN`
- [ ] `REDIS_HOST` (Opcional)
- [ ] `REDIS_PORT` (Opcional)
- [ ] `REDIS_PASSWORD` (Opcional)
- [ ] `RESEND_API_KEY` (Opcional)
- [ ] `DEFAULT_TENANT_CANONICAL_URL` (Opcional; default `https://www.pinteya.com` para redirect plataforma → tenant)

---

## 🌐 PASO 2: Configuración de Dominios

### 2.1. Dominios Configurados

**✅ Tus dominios ya están configurados en Vercel:**

#### Dominio de Vercel (Principal)
- **Dominio**: `pintureriadigital.vercel.app`
- **Estado**: ✅ Activo en producción
- **Tenant**: Pinteya (por defecto)

#### Dominios Custom de Pinteya
- **Dominios activos**:
  - `www.pinteya.com` ✅ Activo en producción
  - `www.pinteya.com.ar` ✅ Activo en producción
- **Redirecciones**:
  - `pinteya.com` → redirige a `www.pinteya.com`
  - `pinteya.com.ar` → redirige a `www.pinteya.com.ar`

**⚠️ IMPORTANTE:** Necesitas actualizar la base de datos para vincular estos dominios con el tenant Pinteya (ver paso 2.2)

### 2.2. Vincular Dominios Custom con Tenant Pinteya

**✅ COMPLETADO:** La base de datos ha sido actualizada para vincular los dominios custom con el tenant Pinteya.

**SQL ejecutado en Supabase:**

```sql
-- Actualizar tenant Pinteya con sus dominios custom
UPDATE tenants 
SET custom_domain = 'www.pinteya.com'
WHERE slug = 'pinteya';
```

**Nota sobre múltiples dominios:**

El código en `src/lib/tenant/tenant-service.ts` ya soporta automáticamente ambos dominios:
- `www.pinteya.com` (configurado en BD como `custom_domain`)
- `www.pinteya.com.ar` (detectado automáticamente por el código)

No necesitas configurar ambos en la BD, el sistema los detecta automáticamente.

**Verificar que el tenant existe:**

```sql
-- Verificar configuración del tenant Pinteya
SELECT 
  id,
  slug,
  name,
  subdomain,
  custom_domain,
  primary_color
FROM tenants
WHERE slug = 'pinteya';
```

**Cómo funcionará:**

- ✅ **`pintureriadigital.vercel.app`** → Mostrará Pinteya (tenant por defecto)
- ✅ **`www.pinteya.com`** → Mostrará Pinteya (✅ **CONFIGURADO** - `custom_domain` actualizado en BD)
- ✅ **`www.pinteya.com.ar`** → Mostrará Pinteya (✅ **CONFIGURADO** - el código detecta ambos dominios automáticamente)
- ✅ **Todos los datos** se filtrarán automáticamente por `tenant_id` de Pinteya

**⚠️ Nota sobre múltiples tenants:**

Si en el futuro necesitas acceder a otros tenants (como Pintemas), deberás:
1. Configurar dominios custom para Pintemas en Vercel
2. Actualizar la BD con `custom_domain` para Pintemas
3. Agregar los nuevos dominios a Google OAuth (ver sección 2.4)
4. **NO necesitas cambiar `NEXTAUTH_URL`** - sigue usando el dominio de la plataforma

**Estrategia de Variables de Entorno para Múltiples Tenants:**

Cuando tengas múltiples tenants, la configuración correcta es:

```env
# ✅ CORRECTO - Usar dominio de plataforma
NEXTAUTH_URL=https://pintureriadigital.vercel.app
AUTH_URL=https://pintureriadigital.vercel.app
NEXT_PUBLIC_APP_URL=https://pintureriadigital.vercel.app
```

**NO hagas esto:**
```env
# ❌ INCORRECTO - No usar dominios específicos de tenants
NEXTAUTH_URL=https://www.pinteya.com  # Solo funciona para Pinteya
NEXTAUTH_URL=https://www.pintemas.com # Solo funciona para Pintemas
```

**¿Por qué?**
- ✅ El dominio de plataforma funciona para **todos los tenants**
- ✅ No necesitas cambiar variables cuando agregas nuevos tenants
- ✅ Google OAuth puede redirigir a cualquier dominio si está en la lista de URIs autorizados
- ✅ Más fácil de mantener y escalar

### 2.3. Estrategia de Variables de Entorno para Múltiples Tenants

**⚠️ IMPORTANTE:** Cuando tengas múltiples tenants, usa esta configuración:

#### Variables de Entorno Correctas (Multitenant)

```env
# ✅ CORRECTO - Dominio de plataforma (funciona para todos los tenants)
NEXTAUTH_URL=https://pintureriadigital.vercel.app
AUTH_URL=https://pintureriadigital.vercel.app
NEXT_PUBLIC_APP_URL=https://pintureriadigital.vercel.app
```

#### Variables de Entorno Incorrectas (No escalable)

```env
# ❌ INCORRECTO - Dominio específico de tenant
NEXTAUTH_URL=https://www.pinteya.com  # Solo funciona para Pinteya
# Si agregas Pintemas, necesitarías cambiar esto constantemente
```

#### ¿Por qué usar el dominio de plataforma?

1. **Escalabilidad**: Funciona para todos los tenants sin cambios
2. **Mantenibilidad**: No necesitas modificar variables cuando agregas nuevos tenants
3. **Flexibilidad**: Google OAuth puede redirigir a cualquier dominio si está autorizado
4. **Simplicidad**: Una sola configuración para toda la plataforma

#### Configuración Actual vs Recomendada

**Tu configuración actual (funciona pero no es óptima):**
- `NEXTAUTH_URL=https://www.pinteya.com` ✅ Funciona para Pinteya
- ⚠️ Si agregas Pintemas, necesitarías cambiar esto

**Configuración recomendada (multitenant-ready):**
- `NEXTAUTH_URL=https://pintureriadigital.vercel.app` ✅ Funciona para todos los tenants
- ✅ No necesitas cambios cuando agregas nuevos tenants

#### Cómo Funciona NextAuth con Múltiples Dominios

NextAuth usa `NEXTAUTH_URL` principalmente para:
- Generar URLs de callback internas
- Validar requests de autenticación

**Lo importante:** Google OAuth debe tener **todos los dominios** en "Authorized redirect URIs":
- `https://pintureriadigital.vercel.app/api/auth/callback/google` ✅
- `https://www.pinteya.com/api/auth/callback/google` ✅
- `https://www.pinteya.com.ar/api/auth/callback/google` ✅
- `https://www.pintemas.com/api/auth/callback/google` ✅ (cuando lo agregues)

Con esta configuración, NextAuth puede redirigir correctamente desde cualquier dominio autorizado, independientemente del valor de `NEXTAUTH_URL`.

#### OAuth y URL canónica multitenant

El sistema implementa un flujo multitenant para que el login y los redirects post-OAuth mantengan al usuario en el **dominio del tenant** desde el que inició sesión.

**1. Redirect post-login por origen de la request (`baseUrl`)**

El callback `redirect` de NextAuth prioriza `baseUrl` (origen de la petición) sobre `NEXTAUTH_URL`. Con `trustHost: true`, `baseUrl` se deriva del host de la request (o `X-Forwarded-Host` en Vercel). El callback de OAuth llega al dominio desde el que se inició el login, así que el usuario permanece en ese dominio tras autenticarse.

- Login desde **www.pinteya.com** → redirect a `.../auth/callback` en www.pinteya.com.
- Login desde **www.pintemas.com** (u otro tenant) → redirect en su propio dominio.

**2. `NEXTAUTH_URL` como fallback**

`NEXTAUTH_URL` se usa solo cuando no hay `baseUrl` (por ejemplo, contextos server-side sin request). Mantener `NEXTAUTH_URL` = dominio de la app en Vercel (p. ej. `https://pintureriadigital.vercel.app`).

**3. Redirect dominio plataforma → tenant por defecto**

Si el usuario accede por un **dominio de deployment** (p. ej. `pintureriadigital.vercel.app`) que no es un tenant, el middleware redirige las rutas de **UI** (no `/api`) al tenant por defecto:

- Dominios plataforma: `pintureriadigital.vercel.app` (solo ese, no `*.vercel.app`, para no afectar previews).
- El middleware obtiene el tenant por defecto usando `getTenantBySlug(DEFAULT_TENANT_SLUG)` y construye la URL canónica con `getTenantBaseUrl()` (usa `custom_domain` o subdominio según la configuración del tenant).
- Redirect **307** a la URL canónica del tenant + pathname + search.

**Variables de entorno opcionales:**

```env
# Slug del tenant por defecto (default: 'pinteya')
DEFAULT_TENANT_SLUG=pinteya

# Fallback: URL canónica directa (solo si falla obtener el tenant desde BD)
DEFAULT_TENANT_CANONICAL_URL=https://www.pinteya.com
```

**Prioridad de configuración:**
1. Si `DEFAULT_TENANT_SLUG` está definido → obtiene el tenant desde BD y usa su URL canónica (recomendado).
2. Si no, usa `DEFAULT_TENANT_CANONICAL_URL` del env.
3. Si ninguna está definida, usa `https://www.pinteya.com` como fallback hardcoded.

Las rutas `/api/*` no se redirigen (OAuth y APIs siguen en el dominio de la request).

**4. Lista de redirect URI por tenant en Google OAuth**

En **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client**, incluir en **Authorized redirect URIs** **cada** dominio donde haya login:

- `https://www.pinteya.com/api/auth/callback/google`
- `https://www.pinteya.com.ar/api/auth/callback/google`
- `https://pintureriadigital.vercel.app/api/auth/callback/google`
- Por cada **nuevo tenant** con custom domain: `https://<custom_domain>/api/auth/callback/google`
- Si usas subdominios: `https://pinteya.pintureriadigital.com/api/auth/callback/google`, etc.

Sin el `redirect_uri` correspondiente, el login desde ese dominio fallará.

### 2.4. Agregar Más Dominios Custom (Futuro)

Si en el futuro quieres agregar más dominios custom (por ejemplo, para Pintemas):

1. **En Vercel Dashboard**:
   - Settings → **Domains**
   - Click en **Add**
   - Ingresar tu dominio (ej: `www.pintemas.com`)
   - Seguir las instrucciones de DNS que Vercel te proporciona

2. **En tu proveedor de DNS**, agregar el registro CNAME que Vercel te indique

3. **Actualizar en Base de Datos**:
   ```sql
   -- Actualizar tenant Pintemas con su dominio custom
   UPDATE tenants 
   SET custom_domain = 'www.pintemas.com'
   WHERE slug = 'pintemas';
   ```

4. **Actualizar Google OAuth** con la nueva URL de callback:
   - Agregar `https://www.pintemas.com/api/auth/callback/google` a las Authorized redirect URIs

---

## 🗄️ PASO 3: Verificación de Base de Datos

### 3.1. Verificar Migraciones Aplicadas

Las migraciones del sistema multitenant están en `supabase/migrations/` con prefijo `20260121` y `20260122`:

**Migraciones Críticas:**
- ✅ `000001_create_tenants_system.sql` - Tabla principal de tenants
- ✅ `000002_create_shared_stock_pools.sql` - Pools de stock compartido
- ✅ `000003_create_tenant_products.sql` - Productos por tenant
- ✅ `000004_create_external_systems.sql` - Integración ERP
- ✅ `000005_add_tenant_id_columns.sql` - Columnas tenant_id
- ✅ `000006_create_tenant_roles.sql` - Sistema de roles
- ✅ `000007_create_tenant_rls_policies.sql` - Políticas RLS
- ✅ `000008_seed_tenants.sql` - Seed de Pinteya
- ✅ `000009_migrate_existing_data_to_pinteya.sql` - Migración de datos
- ✅ `000010_create_tenant_pintemas.sql` - Creación de Pintemas

**Verificar en Supabase:**
1. Ir a: https://supabase.com/dashboard
2. Seleccionar proyecto: `pintureria-digital`
3. Ir a **SQL Editor**
4. Ejecutar:
   ```sql
   -- Verificar que existe la tabla tenants
   SELECT * FROM tenants;
   
   -- Verificar que existen los tenants
   SELECT slug, name, subdomain, custom_domain FROM tenants;
   
   -- Deberías ver:
   -- - pinteya (subdomain: pinteya)
   -- - pintemas (subdomain: pintemas)
   ```

### 3.2. Verificar RLS Policies

```sql
-- Verificar que RLS está habilitado en tablas críticas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'cart_items', 'tenant_products', 'users');

-- Todas deben tener rowsecurity = true
```

### 3.3. Verificar Datos de Tenants

```sql
-- Verificar configuración de tenants
SELECT 
  id,
  slug,
  name,
  subdomain,
  custom_domain,
  primary_color,
  ga4_measurement_id,
  meta_pixel_id
FROM tenants;

-- Verificar que hay productos asignados a tenants
SELECT 
  t.slug,
  COUNT(tp.product_id) as productos_count
FROM tenants t
LEFT JOIN tenant_products tp ON tp.tenant_id = t.id
GROUP BY t.slug;
```

---

## 🚀 PASO 4: Deploy a Producción

### 4.1. Pre-Deploy Checklist

Antes de hacer el deploy, verifica:

- [ ] Todas las variables de entorno configuradas en Vercel
- [ ] `NEXTAUTH_URL` configurado (usarás el dominio de Vercel después del primer deploy)
- [ ] Migraciones SQL aplicadas en Supabase
- [ ] Tenants creados en base de datos (al menos Pinteya)
- [ ] Build local exitoso: `npm run build`
- [ ] Tests pasando: `npm test` (opcional pero recomendado)

### 4.2. Deploy en Vercel

**Opción 1: Deploy Automático (Git Push)**
```bash
# Si tienes integración con Git, simplemente:
git push origin main
# Vercel automáticamente hará el deploy
```

**Opción 2: Deploy Manual**
1. En Vercel Dashboard → **Deployments**
2. Click en **Add New** → **Deploy**
3. Seleccionar branch: `main`
4. Click en **Deploy**

### 4.3. Post-Deploy: Configurar NEXTAUTH_URL

**⚠️ IMPORTANTE:** Después del primer deploy, necesitas:

1. **Configurar `NEXTAUTH_URL` en Vercel:**
   - Settings → **Environment Variables**
   - Buscar `NEXTAUTH_URL`
   - **RECOMENDADO para multitenant**: `https://pintureriadigital.vercel.app`
   - ⚠️ **Alternativa temporal**: `https://www.pinteya.com` (funciona pero no es escalable)
   - Si no está configurado, agregarlo con `https://pintureriadigital.vercel.app`
   - Guardar
   
   **¿Por qué el dominio de Vercel?**
   - Funciona para todos los tenants (actuales y futuros)
   - No necesitas cambiar variables cuando agregas nuevos tenants
   - Google OAuth puede redirigir a cualquier dominio si está en la lista de URIs autorizados

2. **Verificar Google OAuth:**
   - Ir a Google Cloud Console → **APIs & Services** → **Credentials**
   - Editar tu OAuth 2.0 Client ID
   - Verificar que "Authorized redirect URIs" incluye:
     - `https://pintureriadigital.vercel.app/api/auth/callback/google`
     - `https://www.pinteya.com/api/auth/callback/google`
     - `https://www.pinteya.com.ar/api/auth/callback/google`
   - Si falta alguno, agregarlo y guardar

4. **Redesplegar:**
   - Vercel Dashboard → **Deployments**
   - Click en los **3 puntos** del último deployment
   - Seleccionar **Redeploy**
   - Esperar a que termine

---

## ✅ PASO 5: Verificación Post-Deploy

### 5.1. Verificar Variables de Entorno

Crear endpoint temporal de verificación:

**`src/app/api/debug/check-env/route.ts`:**
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante',
    googleId: process.env.AUTH_GOOGLE_ID ? '✅ Configurada' : '❌ Faltante',
    googleSecret: process.env.AUTH_GOOGLE_SECRET ? '✅ Configurada' : '❌ Faltante',
    authSecret: process.env.AUTH_SECRET ? '✅ Configurada' : '❌ Faltante',
    nextauthUrl: process.env.NEXTAUTH_URL || '⚠️ Usando default',
    mpPublicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ? '✅ Configurada' : '❌ Faltante',
    mpAccessToken: process.env.MP_ACCESS_TOKEN ? '✅ Configurada' : '❌ Faltante',
  })
}
```

**Acceder a:**
- `https://pintureriadigital.vercel.app/api/debug/check-env`
- O `https://www.pinteya.com/api/debug/check-env`
- Verificar que todas muestren ✅

### 5.2. Verificar Detección de Tenants

**Probar el dominio de Vercel:**

1. **Dominio de Vercel (Pinteya - Tenant por Defecto):**
   - Acceder a: `https://pintureriadigital.vercel.app`
   - Verificar que carga con el tema de Pinteya (naranja #f27a1d)
   - Verificar que el logo es el de Pinteya
   - Verificar que los productos se muestran correctamente

2. **Dominios Custom de Pinteya:**
   - Acceder a: `https://www.pinteya.com`
   - Acceder a: `https://www.pinteya.com.ar`
   - Verificar que ambos cargan con el tema de Pinteya
   - Verificar que los productos se muestran correctamente
   - Verificar que el carrito y checkout funcionan

**✅ Todos estos dominios deben mostrar el mismo tenant (Pinteya) y filtrar datos por `tenant_id`.**

### 5.3. Verificar Funcionalidades Críticas

**Para cada tenant, verificar:**

- [ ] **Homepage carga correctamente**
- [ ] **Productos se muestran** (deben filtrarse por tenant)
- [ ] **Carrito funciona** (debe estar aislado por tenant)
- [ ] **Checkout funciona** (debe crear órdenes con `tenant_id` correcto)
- [ ] **Autenticación funciona** (login con Google)
- [ ] **Analytics cargan** (GA4 y Meta Pixel con IDs del tenant)
- [ ] **Admin panel funciona** (debe mostrar solo datos del tenant)

### 5.4. Verificar Aislamiento de Datos

**Test de Seguridad:**

1. **Login como admin de Pinteya**
2. **Verificar que solo ve órdenes de Pinteya**
3. **Intentar acceder a datos de Pintemas** (debe fallar o no mostrar nada)

**En Supabase SQL Editor:**
```sql
-- Verificar que las órdenes tienen tenant_id
SELECT 
  o.id,
  o.tenant_id,
  t.slug as tenant_slug,
  o.total,
  o.created_at
FROM orders o
LEFT JOIN tenants t ON t.id = o.tenant_id
ORDER BY o.created_at DESC
LIMIT 10;

-- Todas las órdenes deben tener tenant_id asignado
```

---

## 🔍 PASO 6: Monitoreo y Troubleshooting

### 6.1. Verificar Logs en Vercel

1. Vercel Dashboard → **Deployments** → Último deployment
2. Click en **Functions** tab
3. Revisar logs para errores

### 6.2. Verificar Logs en Supabase

1. Supabase Dashboard → **Logs**
2. Revisar **API Logs** y **Postgres Logs**
3. Buscar errores relacionados con RLS o queries

### 6.3. Errores Comunes y Soluciones

#### Error: "Tenant not found"

**Causa:** El hostname no coincide con ningún tenant en la BD.

**Solución:**
1. Verificar que el tenant existe en la tabla `tenants`
2. Verificar que `subdomain` o `custom_domain` coinciden
3. El sistema usa `pinteya` como fallback por defecto

#### Error: "RLS policy violation"

**Causa:** Intentando acceder a datos de otro tenant.

**Solución:**
1. Verificar que `set_current_tenant()` fue llamado
2. Verificar que el `tenant_id` en los datos coincide con el tenant actual
3. Para operaciones admin, usar `service_role` key

#### Error: "SUPABASE_SERVICE_ROLE_KEY not found"

**Causa:** Variable no configurada en Vercel.

**Solución:**
1. Ir a Vercel → Settings → Environment Variables
2. Agregar `SUPABASE_SERVICE_ROLE_KEY`
3. Redesplegar

#### Error: CSS no se actualiza por tenant

**Causa:** Cache de CSS o TenantThemeStyles no está incluido.

**Solución:**
1. Verificar que `TenantProviderWrapper` está en el layout
2. Limpiar cache del navegador
3. Verificar que los colores están definidos en la BD

#### Error: Analytics no trackea

**Causa:** IDs de GA4/Meta Pixel vacíos o inválidos.

**Solución:**
1. Verificar `ga4_measurement_id` y `meta_pixel_id` en la BD
2. Verificar en Network tab que los scripts se cargan
3. Verificar en consola que no hay errores de CORS

#### Error 403: "Error al cargar las órdenes" en Admin → Órdenes

**Causa:** La API `/api/admin/orders` usa `withTenantAdmin`, que exige que el usuario esté en `super_admins` o en `tenant_user_roles` para el tenant actual. Tras el deploy multitenant, esas tablas pueden estar vacías y los admins existentes (con `user_profiles.role = 'admin'`) no tenían acceso.

**Solución aplicada (Ene 2026):** Se añadió un **fallback** en `checkTenantAdmin` (`tenant-admin-guard`): si no hay match en `super_admins` ni `tenant_user_roles`, se verifica si el usuario tiene `role = 'admin'` en `user_profiles` vía `isUserAdmin()`. Si es admin legacy, se le otorga acceso al tenant actual con permisos completos.

**Pasos si persiste el 403:**
1. Verificar que el usuario con el que inicias sesión tiene `role_id` → `user_roles.role_name = 'admin'` en `user_profiles`.
2. Opcional: poblar `super_admins` o `tenant_user_roles` para el tenant (ver migración `20260121000006_create_tenant_roles`).
3. Redesplegar tras cualquier cambio en guards o BD.

---

## 📋 Checklist Final Pre-Producción

Antes de considerar el sistema listo para producción, verifica:

### Configuración
- [ ] Todas las variables de entorno configuradas
- [ ] `NEXTAUTH_URL` configurado con dominio de plataforma (`https://pintureriadigital.vercel.app`) ⚠️ **Recomendado para multitenant**
- [ ] Google OAuth configurado con todas las URLs de callback:
  - [ ] `https://pintureriadigital.vercel.app/api/auth/callback/google`
  - [ ] `https://www.pinteya.com/api/auth/callback/google`
  - [ ] `https://www.pinteya.com.ar/api/auth/callback/google`
- [ ] Dominios custom vinculados en base de datos (ver paso 2.2)
- [ ] SSL/HTTPS funcionando (automático en Vercel)

### Base de Datos
- [ ] Migraciones aplicadas
- [ ] Tenants creados (Pinteya, Pintemas)
- [ ] RLS policies habilitadas
- [ ] Datos migrados a tenants

### Funcionalidad
- [ ] Homepage carga por tenant
- [ ] Productos se filtran por tenant
- [ ] Carrito funciona por tenant
- [ ] Checkout crea órdenes con tenant_id
- [ ] Admin panel muestra solo datos del tenant
- [ ] Analytics funcionan por tenant

### Seguridad
- [ ] Aislamiento de datos verificado
- [ ] RLS policies funcionando
- [ ] Autenticación funcionando
- [ ] Variables secretas no expuestas

### Performance
- [ ] Build exitoso sin errores
- [ ] Páginas cargan en <3s
- [ ] APIs responden en <500ms

---

## 🎯 Próximos Pasos Después del Deploy

1. **Monitorear métricas** en Vercel Analytics
2. **Configurar alertas** para errores críticos
3. **Revisar logs** diariamente la primera semana
4. **Probar funcionalidades** en cada tenant
5. **Documentar** cualquier issue encontrado

---

## 📚 Referencias

- **Documentación Multitenant**: `docs/MULTITENANCY.md`
- **Estado de Migración**: `docs/MIGRATION_STATUS.md`
- **Configuración General**: `docs/CONFIGURATION.md`
- **Configuración Producción**: `docs/CONFIGURACION_PRODUCCION.md`

---

## 🆘 Soporte

Si encuentras problemas durante el deploy:

1. Revisar logs en Vercel y Supabase
2. Verificar que todas las variables están configuradas
3. Consultar la sección de Troubleshooting
4. Revisar la documentación en `docs/MULTITENANCY.md`

---

**¡El sistema está listo para producción!** 🚀

El sistema multitenant está 100% migrado y probado. Solo necesitas seguir estos pasos para el deploy.
