# Guía de Deployment a Producción - Sistema Multitenant

**Fecha:** 2026-01-23  
**Estado:** 📋 **CHECKLIST PRE-DEPLOYMENT**

---

## 📋 Resumen Ejecutivo

Esta guía detalla los pasos necesarios para desplegar el sistema multitenant a producción después de completar el testing. Incluye verificaciones de base de datos, código, configuración y monitoreo.

---

## 🔄 Renombrado de Proyecto (Opcional pero Recomendado)

**Antes de hacer el deployment, considera renombrar el proyecto para reflejar que es una plataforma multitenant:**

- **Nombre Actual:** `pintureria-digital` ✅ (renombrado)
- **Nombre Sugerido:** `pintureria-digital`

**Lugares donde renombrar:**
1. ✅ **Vercel Dashboard** - Settings → General → Project Name
2. ✅ **Supabase Dashboard** - Settings → General → Project Name
3. ✅ **Redis** (si usas) - Renombrar base de datos
4. ⚠️ **GitHub** (opcional) - Renombrar repositorio
5. ⚠️ **Archivos locales** - `package.json`, scripts, documentación

**⚠️ IMPORTANTE:** Renombrar NO afecta:
- Variables de entorno (siguen siendo las mismas)
- Dominios (siguen siendo los mismos)
- Funcionalidad de la aplicación
- Deployments existentes

**Ver guía completa:** `docs/GUIA_RENOMBRAR_PROYECTO_MULTITENANT.md`

---

## ✅ FASE 1: Verificación Pre-Deployment

### 1.1 Verificación de Base de Datos

#### ✅ Migraciones Aplicadas

Verificar que todas las migraciones multitenant están aplicadas en producción:

```sql
-- Verificar migraciones aplicadas
SELECT 
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%tenant%' OR name LIKE '%2026012%'
ORDER BY applied_at DESC;
```

**Migraciones críticas que deben estar aplicadas:**
- ✅ `20260121000001_create_tenants_system.sql`
- ✅ `20260121000002_create_shared_stock_pools.sql`
- ✅ `20260121000003_create_tenant_products.sql`
- ✅ `20260121000004_create_external_systems.sql`
- ✅ `20260121000005_add_tenant_id_columns.sql`
- ✅ `20260121000006_create_tenant_roles.sql`
- ✅ `20260121000007_create_tenant_rls_policies.sql`
- ✅ `20260121000008_seed_tenants.sql`
- ✅ `20260121000009_migrate_existing_data_to_pinteya.sql`
- ✅ `20260122000001_add_tenant_id_to_logistics_tables.sql`
- ✅ `20260122000002_add_tenant_id_to_coupons_promotions.sql`
- ✅ `20260122000003_add_tenant_id_to_categories.sql`
- ✅ `20260122000004_add_tenant_id_to_system_settings.sql`
- ✅ `20260123_add_multitenant_rls_policies_complete.sql`
- ✅ `20260123_optimize_tenant_indexes.sql`

#### ✅ Verificación de Datos

```sql
-- Verificar que tenant Pinteya existe
SELECT id, slug, name, subdomain, custom_domain 
FROM tenants 
WHERE slug = 'pinteya';

-- Verificar que datos tienen tenant_id
SELECT 
  'orders' as tabla,
  COUNT(*) as total,
  COUNT(tenant_id) as con_tenant_id
FROM orders
UNION ALL
SELECT 
  'order_items' as tabla,
  COUNT(*) as total,
  COUNT(tenant_id) as con_tenant_id
FROM order_items;

-- Verificar tenant_products configurados
SELECT 
  COUNT(*) as total_productos_tenant,
  COUNT(DISTINCT tenant_id) as tenants_con_productos
FROM tenant_products;
```

#### ✅ Verificación de RLS

```sql
-- Verificar RLS habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items', 'cart_items', 'products', 'user_profiles')
ORDER BY tablename;

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'cart_items')
  AND policyname LIKE '%tenant%'
ORDER BY tablename, policyname;
```

### 1.2 Verificación de Código

#### ✅ APIs Migradas

Verificar que todas las APIs críticas están migradas:

**APIs Públicas:**
- ✅ `/api/products` - Usa `tenant_products` con filtro por `tenant_id`
- ✅ `/api/products/[id]` - Verifica `tenant_products.is_visible`
- ✅ `/api/cart/*` - Filtra por `tenant_id`
- ✅ `/api/orders/create-cash-order` - **⚠️ VERIFICAR: Debe asignar `tenant_id`**
- ✅ `/api/payments/create-preference` - **⚠️ VERIFICAR: Debe asignar `tenant_id`**
- ✅ `/api/user/orders` - Filtra por `tenant_id`

**APIs Admin:**
- ✅ Todas las APIs admin usan `withTenantAdmin` o filtran por `tenant_id`

#### ✅ Componentes Frontend

Verificar que componentes principales usan tenant:
- ✅ `TenantProviderWrapper` en `layout.tsx`
- ✅ `TenantThemeStyles` inyecta CSS variables
- ✅ Componentes usan `useTenant()` o `useTenantSafe()`
- ✅ Logo usa `OptimizedLogo` con soporte multitenant

### 1.3 Verificación de Configuración

#### ✅ Variables de Entorno

**Cómo Agregar Variables en Vercel Dashboard:**

1. **Ir a Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Seleccionar proyecto `pintureria-digital`
   - Click en **Settings** (en la barra superior)
   - Click en **Environment Variables** (menú lateral izquierdo)

2. **Agregar Variable:**
   - Click en botón **"Add Environment Variable"** (arriba a la derecha)
   - **Key**: Escribir el nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Value**: Pegar el valor de la variable
   - **Environments**: Seleccionar **"All Environments"** (o específico: Production, Preview, Development)
   - Click en **"Save"**

3. **Variables Requeridas para Multitenant:**

**Variables que YA tienes configuradas:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Ya configurada
- ✅ `NEXTAUTH_SECRET` - Ya configurada
- ✅ Variables de MercadoPago - Ya configuradas
- ✅ Variables de Redis - Ya configuradas

**Variables que FALTAN y debes agregar:**

- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **CRÍTICA** ⚠️
  - **Dónde obtener:** 
    1. Ir a https://supabase.com/dashboard
    2. Seleccionar tu proyecto (aakzspzfulgftqlgwkpb)
    3. Settings → API
    4. En la sección "Project API keys"
    5. Copiar la key **"anon"** (pública) - la que dice "public" o "anon"
  - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (key pública, puede estar expuesta)
  - **En Vercel:** Agregar como "All Environments"
  
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **CRÍTICA** ⚠️
  - **Dónde obtener:**
    1. Ir a https://supabase.com/dashboard
    2. Seleccionar tu proyecto
    3. Settings → API
    4. En la sección "Project API keys"
    5. Copiar la key **"service_role"** (privada) - la que dice "service_role"
    6. **⚠️ CUIDADO:** Esta key tiene permisos completos, mantenerla secreta
  - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (key privada, NO exponer)
  - **En Vercel:** Agregar como "All Environments" o solo "Production"
  - **⚠️ IMPORTANTE:** Esta es la key que permite bypass RLS, mantenerla secreta

- ❌ `NEXTAUTH_URL` - **IMPORTANTE**
  - **Valor:** `https://www.pinteya.com` (o tu dominio principal)
  - **Nota:** Debe ser el dominio exacto donde está desplegada la app
  - **En Vercel:** Agregar como "All Environments"

**Variables Opcionales (por tenant - se pueden configurar en BD):**
- ⚠️ `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (se puede configurar por tenant en tabla `tenants`)
- ⚠️ `NEXT_PUBLIC_META_PIXEL_ID` (se puede configurar por tenant en tabla `tenants`)

**Variables Adicionales Recomendadas:**
- ⚠️ `AUTH_GOOGLE_ID` - Si usas Google OAuth (ya deberías tenerla si usas NextAuth)
- ⚠️ `AUTH_GOOGLE_SECRET` - Si usas Google OAuth (ya deberías tenerla si usas NextAuth)

---

### 📝 Instrucciones Paso a Paso para Agregar Variables

**Paso 1: Obtener Claves de Supabase**

1. Ir a: https://supabase.com/dashboard
2. Seleccionar proyecto: `aakzspzfulgftqlgwkpb` (o el nombre de tu proyecto)
3. En el menú lateral izquierdo, click en **Settings** (⚙️)
4. Click en **API** (en el submenú de Settings)
5. Encontrarás dos keys:
   - **anon public**: Esta es `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Esta es `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRETA)

**Paso 2: Agregar en Vercel**

1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto: `pintureria-digital`
3. Click en **Settings** (barra superior)
4. Click en **Environment Variables** (menú lateral)
5. Para cada variable faltante:
   - Click en **"Add Environment Variable"**
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (por ejemplo)
   - **Value**: Pegar el valor copiado de Supabase
   - **Environments**: Seleccionar **"All Environments"** (o solo Production si prefieres)
   - Click en **"Save"**
6. Repetir para `SUPABASE_SERVICE_ROLE_KEY` y `NEXTAUTH_URL`

**Paso 3: Redesplegar**

Después de agregar las variables:

1. Vercel Dashboard → **Deployments**
2. Click en los **3 puntos** (⋯) del último deployment
3. Click en **"Redeploy"**
4. O hacer un nuevo commit y push a `main` para trigger automático

**⚠️ IMPORTANTE:** Las variables de entorno solo se aplican en nuevos deployments. Si agregas variables nuevas, debes hacer redeploy.

#### ✅ Configuración de Dominios en Vercel

Verificar en Vercel Dashboard → Project → Settings → Domains:

**Dominios Configurados:**
- ✅ `www.pinteya.com` → Debe apuntar al proyecto
- ✅ `pinteya.pintureriadigital.com` → Wildcard o específico
- ⚠️ `pintemas.pintureriadigital.com` → Si se va a activar Pintemas
- ⚠️ `www.pintemas.com` → Si se va a activar Pintemas

---

## ✅ FASE 2: Correcciones Críticas Pre-Deployment

### 2.1 Migrar APIs de Creación de Órdenes

**⚠️ CRÍTICO:** Las APIs de creación de órdenes deben asignar `tenant_id`:

#### `/api/orders/create-cash-order/route.ts`

```typescript
import { getTenantConfig } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  const tenant = await getTenantConfig()
  const tenantId = tenant.id
  
  // Al crear la orden:
  const { data: order } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
    })
    .select()
    .single()
  
  // Al crear order_items:
  await supabase
    .from('order_items')
    .insert(
      items.map(item => ({
        ...item,
        tenant_id: tenantId, // ⚡ MULTITENANT
      }))
    )
}
```

#### `/api/payments/create-preference/route.ts`

```typescript
import { getTenantConfig } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  const tenant = await getTenantConfig()
  const tenantId = tenant.id
  
  // Al crear la orden:
  const { data: order } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      tenant_id: tenantId, // ⚡ MULTITENANT
    })
}
```

### 2.2 Establecer Tenant en Contexto (Opcional pero Recomendado)

Si se quiere usar RLS correctamente, migrar APIs públicas para usar `createTenantClient()`:

```typescript
import { createTenantClientFromContext } from '@/lib/integrations/supabase/server'

export async function GET() {
  // Esto establece el tenant en contexto antes de queries
  const supabase = await createTenantClientFromContext()
  
  // Ahora las queries respetan RLS automáticamente
  const { data } = await supabase.from('orders').select('*')
}
```

**Alternativa Temporal:** Si no se migra ahora, las APIs pueden seguir usando `getSupabaseClient(true)` (service_role) que bypass RLS.

---

## ✅ FASE 3: Testing en Staging/Producción

### 3.1 Testing de Funcionalidad

**Checklist de Testing:**

- [ ] **Detección de Tenant:**
  - [ ] `www.pinteya.com` detecta tenant Pinteya correctamente
  - [ ] `pinteya.pintureriadigital.com` detecta tenant Pinteya
  - [ ] Fallback a Pinteya cuando no se detecta tenant

- [ ] **Productos:**
  - [ ] Lista de productos muestra solo productos visibles del tenant
  - [ ] Detalle de producto muestra precios/stock del tenant
  - [ ] Búsqueda funciona correctamente

- [ ] **Carrito:**
  - [ ] Agregar productos al carrito funciona
  - [ ] Carrito muestra solo items del tenant actual
  - [ ] Actualizar cantidad funciona
  - [ ] Eliminar items funciona

- [ ] **Checkout:**
  - [ ] Crear orden de efectivo asigna `tenant_id` correctamente
  - [ ] Crear orden MercadoPago asigna `tenant_id` correctamente
  - [ ] Orden aparece en admin panel del tenant correcto

- [ ] **Admin Panel:**
  - [ ] Dashboard muestra solo datos del tenant
  - [ ] Órdenes filtradas por tenant
  - [ ] Productos muestran configuración del tenant
  - [ ] Analytics filtrados por tenant

- [ ] **UI/UX:**
  - [ ] Logo del tenant se muestra correctamente
  - [ ] Colores del tenant aplicados (CSS variables)
  - [ ] Favicon del tenant se muestra
  - [ ] Analytics del tenant se cargan (GA4, Meta Pixel)

### 3.2 Testing de Seguridad

- [ ] **Aislamiento de Datos:**
  - [ ] Usuario de Pinteya no puede ver órdenes de Pintemas
  - [ ] Admin de Pinteya solo ve datos de Pinteya
  - [ ] RLS bloquea acceso a datos de otros tenants

- [ ] **RLS Policies:**
  - [ ] Queries con `anon key` respetan RLS (si se migró a `createTenantClient`)
  - [ ] Queries con `service_role` bypass RLS (admin)

### 3.3 Testing de Performance

- [ ] **Queries:**
  - [ ] Queries de productos son rápidas (< 500ms)
  - [ ] Queries de órdenes son rápidas (< 1s)
  - [ ] Índices funcionan correctamente

- [ ] **Carga de Página:**
  - [ ] Homepage carga en < 3s
  - [ ] Página de producto carga en < 2s
  - [ ] Admin panel carga en < 2s

---

## ✅ FASE 4: Deployment a Producción

### 4.1 Preparación

1. **Commit y Push:**
   ```bash
   git add .
   git commit -m "feat: sistema multitenant completo - listo para producción"
   git push origin main
   ```

2. **Verificar Build Local:**
   ```bash
   npm run build
   # Debe completarse sin errores
   ```

3. **Ejecutar Tests:**
   ```bash
   npm test
   npm run test:e2e
   # Todos los tests deben pasar
   ```

### 4.2 Deployment en Vercel

1. **Deploy Automático:**
   - Vercel detectará el push a `main` y desplegará automáticamente
   - O usar: `vercel --prod`

2. **Verificar Build en Vercel:**
   - Ir a Vercel Dashboard → Deployments
   - Verificar que el build fue exitoso
   - Revisar logs por errores

3. **Verificar Variables de Entorno:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Confirmar que todas las variables están configuradas
   - **Verificar específicamente:**
     - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` está presente
     - ✅ `SUPABASE_SERVICE_ROLE_KEY` está presente
     - ✅ `NEXTAUTH_URL` está configurada con `https://www.pinteya.com`
   
   **Si falta alguna variable:**
   - Click en **"Add Environment Variable"**
   - Agregar la variable faltante
   - **Importante:** Después de agregar variables, hacer **Redeploy**:
     - Vercel Dashboard → Deployments
     - Click en los 3 puntos del último deployment
     - Click en **"Redeploy"**
     - O hacer un nuevo push a `main` para trigger automático

### 4.3 Verificación Post-Deployment

**Inmediatamente después del deployment:**

1. **Verificar Sitio Funciona:**
   - [ ] `https://www.pinteya.com` carga correctamente
   - [ ] No hay errores en consola del navegador
   - [ ] No hay errores 500 en Network tab

2. **Verificar Tenant Detection:**
   ```bash
   # En consola del navegador
   console.log(window.__TENANT_CONFIG__)
   # Debe mostrar configuración de Pinteya
   ```

3. **Verificar Creación de Órdenes:**
   - [ ] Crear una orden de prueba
   - [ ] Verificar en BD que tiene `tenant_id` asignado:
   ```sql
   SELECT id, order_number, tenant_id, created_at
   FROM orders
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **Verificar Logs:**
   - Vercel Dashboard → Project → Logs
   - Buscar errores relacionados con tenant
   - Verificar que no hay errores de RLS

---

## ✅ FASE 5: Monitoreo Post-Deployment

### 5.1 Monitoreo Inmediato (Primeras 24 horas)

**Métricas a Monitorear:**

- [ ] **Errores:**
  - [ ] Tasa de errores 500 < 0.1%
  - [ ] No hay errores de "tenant not found"
  - [ ] No hay errores de RLS policy violation

- [ ] **Performance:**
  - [ ] Tiempo de respuesta promedio < 1s
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms

- [ ] **Funcionalidad:**
  - [ ] Órdenes se crean correctamente
  - [ ] Carrito funciona
  - [ ] Productos se muestran

### 5.2 Monitoreo Continuo (Primera Semana)

**Dashboard de Monitoreo:**

- [ ] **Supabase Dashboard:**
  - [ ] Verificar queries lentas
  - [ ] Verificar uso de RLS
  - [ ] Verificar errores de BD

- [ ] **Vercel Analytics:**
  - [ ] Tasa de errores
  - [ ] Performance metrics
  - [ ] Uso de recursos

- [ ] **Logs:**
  - [ ] Revisar logs diariamente
  - [ ] Buscar patrones de errores
  - [ ] Verificar que tenant_id se asigna correctamente

### 5.3 Alertas Configuradas

**Configurar Alertas para:**

- [ ] Tasa de errores > 1%
- [ ] Tiempo de respuesta > 3s
- [ ] Errores de "tenant not found"
- [ ] Errores de RLS policy violation
- [ ] Órdenes creadas sin `tenant_id`

---

## ✅ FASE 6: Rollback Plan

### 6.1 Si Hay Problemas Críticos

**Opción 1: Rollback de Código**

```bash
# Revertir último commit
git revert HEAD
git push origin main

# O volver a commit anterior
git reset --hard <commit-hash>
git push origin main --force
```

**Opción 2: Deshabilitar RLS Temporalmente (Solo Emergencia)**

```sql
-- ⚠️ SOLO EN EMERGENCIA CRÍTICA
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
-- ... etc
```

**⚠️ Nota:** Esto elimina la seguridad de aislamiento. Solo usar si hay problemas críticos que bloquean la aplicación.

**Opción 3: Usar Service Role en Todas las APIs**

Cambiar todas las APIs públicas para usar `getSupabaseClient(true)` temporalmente hasta corregir el problema.

---

## 📋 Checklist Final Pre-Deployment

### Base de Datos
- [ ] Todas las migraciones aplicadas
- [ ] Tenant Pinteya existe y está configurado
- [ ] Datos tienen `tenant_id` asignado
- [ ] RLS habilitado y políticas configuradas
- [ ] Índices creados y funcionando

### Código
- [ ] APIs de creación de órdenes asignan `tenant_id`
- [ ] APIs públicas filtran por `tenant_id`
- [ ] Componentes frontend usan tenant
- [ ] Build exitoso sin errores
- [ ] Tests pasando

### Configuración
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominios configurados en Vercel
- [ ] DNS apunta correctamente

### Testing
- [ ] Testing funcional completado
- [ ] Testing de seguridad completado
- [ ] Testing de performance completado
- [ ] Testing en staging/producción completado

### Documentación
- [ ] Documentación actualizada
- [ ] Plan de rollback documentado
- [ ] Contactos de emergencia identificados

---

## 🚀 Orden de Deployment Recomendado

### Paso 1: Deploy de Código (Sin Activar Multitenant)
1. Deploy código a producción
2. Verificar que sitio funciona normalmente
3. Verificar que no hay errores

### Paso 2: Activar Multitenant Gradualmente
1. Verificar que detección de tenant funciona
2. Verificar que productos se muestran correctamente
3. Verificar que carrito funciona
4. **Crear orden de prueba y verificar `tenant_id`**

### Paso 3: Monitoreo Intensivo
1. Monitorear primeras 10 órdenes
2. Verificar que todas tienen `tenant_id`
3. Verificar que no hay errores de RLS
4. Verificar performance

### Paso 4: Activación Completa
1. Si todo funciona correctamente, considerar activar segundo tenant (Pintemas)
2. Monitorear ambas tiendas
3. Documentar cualquier problema encontrado

---

## 📝 Notas Importantes

1. **Backup de Base de Datos:** Hacer backup antes de deployment
2. **Ventana de Deployment:** Preferir horarios de bajo tráfico
3. **Comunicación:** Notificar al equipo antes del deployment
4. **Documentación:** Documentar cualquier problema encontrado
5. **Rollback:** Tener plan de rollback listo antes de deployar

---

## 🔗 Referencias

- Documentación multitenant: `docs/MULTITENANCY.md`
- Estado de migración: `docs/MIGRATION_STATUS.md`
- Estado de BD producción: `docs/ESTADO_DB_PRODUCCION_MULTITENANT.md`
- Quick start: `docs/TENANT-QUICK-START.md`

---

**Última actualización:** 2026-01-23  
**Próximos pasos:** Completar testing → Seguir esta guía → Deploy a producción
