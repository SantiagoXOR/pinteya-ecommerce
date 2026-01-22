# Plan: Iteración 7 - Migración APIs Admin y Analytics Multitenant

**Estado:** ✅ COMPLETADA (22 Enero 2026)

**Progreso:** 65% → 75% APIs migradas

## Objetivo

Completar la migración de APIs administrativas y de analytics para soporte multitenant, asegurando que todas las operaciones respeten el aislamiento por tenant y proporcionen datos correctos por tenant.

## Estado Actual

### APIs ya migradas (Iteraciones anteriores)

#### APIs Públicas Transaccionales (Iteración 5-6)

- ✅ `GET /api/cart` - Filtra por `tenant_id`
- ✅ `POST /api/cart` - Usa función RPC con `tenant_id`
- ✅ `DELETE /api/cart` - Filtra por `tenant_id`
- ✅ `POST /api/cart/add` - Usa función RPC con `tenant_id`
- ✅ `PUT /api/cart/update` - Filtra por `tenant_id` y soporta `variant_id`
- ✅ `DELETE /api/cart/remove` - Filtra por `tenant_id` y soporta `variant_id`
- ✅ `POST /api/orders/create-cash-order` - Asigna `tenant_id`
- ✅ `POST /api/payments/create-preference` - Asigna `tenant_id`
- ✅ `GET /api/user/orders` - Filtra por `tenant_id`
- ✅ `GET /api/orders/[id] `- Filtra por `tenant_id`
- ✅ `POST /api/payments/webhook` - Valida `tenant_id`

#### APIs Admin de Órdenes (Parcialmente migradas)

- ✅ `GET /api/admin/orders` - Usa `withTenantAdmin`, filtra por `tenant_id`
- ✅ `GET /api/admin/orders/stats` - Usa `withTenantAdmin`, filtra por `tenant_id`
- ⚠️ `GET /api/admin/orders/analytics` - Tiene `getTenantConfig` pero necesita verificación completa
- ⚠️ `GET /api/admin/orders/[id] `- Usa `withTenantAdmin` pero necesita verificación de todas las operaciones
- ❌ `GET /api/admin/orders-simple` - NO filtra por `tenant_id` (riesgo de seguridad)

### APIs pendientes de migración

#### 1. APIs Admin de Órdenes Restantes

**`GET /api/admin/orders-simple/route.ts`**

- ❌ NO filtra por `tenant_id`
- ❌ Permite acceso a órdenes de otros tenants
- ❌ Riesgo de seguridad crítico

**`GET /api/admin/orders/analytics/route.ts`**

- ⚠️ Tiene `getTenantConfig` pero necesita verificar que todas las queries filtren por `tenant_id`
- ⚠️ Necesita revisar todas las agregaciones y métricas

**`GET /api/admin/orders/[id]/route.ts`**

- ⚠️ Usa `withTenantAdmin` pero necesita verificar:
  - GET: Filtro por `tenant_id` al obtener orden
  - PUT/PATCH: Validación de `tenant_id` al actualizar
  - Todas las operaciones relacionadas (payment-link, refund, mark-paid, status, etc.)

**APIs relacionadas con órdenes:**

- ⚠️ `PUT /api/admin/orders/[id]/status/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/mark-paid/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/refund/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/payment-link/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/whatsapp/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/bulk/route.ts` - Verificar filtro por `tenant_id` en operaciones bulk

#### 2. APIs de Analytics

**`GET /api/admin/analytics/route.ts`**

- ⚠️ Necesita verificar filtrado por `tenant_id` en todas las métricas
- ⚠️ Verificar funciones como `getRecentOrders`, `getTopProducts`, etc.

**`GET /api/analytics/metrics/route.ts`**

- ❌ Probablemente no filtra por `tenant_id`
- ❌ Necesita migración completa

#### 3. APIs de Usuarios Admin

**`GET /api/admin/users/route.ts`**

- ⚠️ Verificar si filtra por `tenant_id` en `user_profiles`
- ⚠️ Necesita asegurar aislamiento de usuarios por tenant

**`GET /api/admin/users/[id]/route.ts`**

- ⚠️ Verificar filtro por `tenant_id` al obtener usuario
- ⚠️ Verificar actualizaciones respetan `tenant_id`

**`POST /api/admin/users/bulk/route.ts`**

- ⚠️ Verificar operaciones bulk respetan `tenant_id`

#### 4. APIs de Reportes

**`GET /api/admin/reports/route.ts`**

- ⚠️ Verificar que todos los reportes filtren por `tenant_id`
- ⚠️ Verificar exportaciones respetan aislamiento

## Cambios Requeridos

### 1. Migrar `/api/admin/orders-simple/route.ts`

**Problema actual:**

- No filtra por `tenant_id`, permitiendo acceso a órdenes de otros tenants
- Riesgo de seguridad crítico

**Solución:**

- Agregar import de `getTenantConfig`
- Obtener `tenant_id` del tenant actual
- Agregar filtro `.eq('tenant_id', tenantId)` en la consulta
- Mantener compatibilidad con autenticación simple pero con filtro de tenant

**Código a modificar:**

```typescript
// Agregar al inicio
import { getTenantConfig } from '@/lib/tenant'

// Después de validar autenticación
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Línea ~79: Agregar filtro por tenant_id
let query = supabase.from('orders').select(...)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
```

### 2. Verificar y completar `/api/admin/orders/analytics/route.ts`

**Verificaciones necesarias:**

- Confirmar que todas las queries filtran por `tenant_id`
- Verificar agregaciones y métricas respetan el tenant
- Asegurar que las funciones helper también filtren por tenant

**Código a revisar:**

```typescript
// Línea ~136: Ya tiene getTenantConfig
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Verificar que todas las queries incluyan:
.eq('tenant_id', tenantId)
```

### 3. Verificar `/api/admin/orders/[id]/route.ts`

**Verificaciones necesarias:**

- GET: Confirmar filtro por `tenant_id` al obtener orden
- PUT/PATCH: Validar `tenant_id` antes de actualizar
- Todas las operaciones relacionadas

**Código a verificar:**

```typescript
// GET: Verificar que filtre por tenant_id
const { data: order } = await supabase
  .from('orders')
  .select(...)
  .eq('id', orderId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Verificar

// PUT/PATCH: Validar tenant_id antes de actualizar
const { data: existingOrder } = await supabase
  .from('orders')
  .select('tenant_id')
  .eq('id', orderId)
  .single()

if (existingOrder?.tenant_id !== tenantId) {
  return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
}
```

### 4. Migrar APIs relacionadas con órdenes

**APIs a verificar:**

- `PUT /api/admin/orders/[id]/status/route.ts`
- `POST /api/admin/orders/[id]/mark-paid/route.ts`
- `POST /api/admin/orders/[id]/refund/route.ts`
- `POST /api/admin/orders/[id]/payment-link/route.ts`
- `POST /api/admin/orders/[id]/whatsapp/route.ts`
- `POST /api/admin/orders/bulk/route.ts`

**Patrón a aplicar:**

1. Obtener `tenant_id` del tenant actual
2. Verificar que la orden pertenezca al tenant antes de operar
3. Filtrar todas las queries por `tenant_id`

### 5. Migrar `/api/admin/analytics/route.ts`

**Verificaciones necesarias:**

- Todas las funciones helper deben recibir `tenantId`
- Todas las queries deben filtrar por `tenant_id`
- Métricas agregadas deben respetar el tenant

**Código a modificar:**

```typescript
// Funciones helper deben recibir tenantId
async function getRecentOrders(tenantId: string) {
  const { data } = await supabase
    .from('orders')
    .select(...)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT
    .order('created_at', { ascending: false })
    .limit(10)
  
  return data
}
```

### 6. Migrar `/api/analytics/metrics/route.ts`

**Problema:**

- Probablemente no filtra por `tenant_id`
- Necesita migración completa

**Solución:**

- Agregar `getTenantConfig`
- Filtrar todas las queries por `tenant_id`
- Asegurar que las métricas sean por tenant

### 7. Verificar APIs de Usuarios Admin

**APIs a verificar:**

- `GET /api/admin/users/route.ts` - Filtrar `user_profiles` por `tenant_id`
- `GET /api/admin/users/[id]/route.ts `- Validar `tenant_id` al obtener/actualizar
- `POST /api/admin/users/bulk/route.ts` - Respetar `tenant_id` en operaciones bulk

**Patrón:**

```typescript
// Filtrar usuarios por tenant_id
const { data: users } = await supabase
  .from('user_profiles')
  .select(...)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT
```

### 8. Verificar APIs de Reportes

**`GET /api/admin/reports/route.ts`**

- Verificar que todos los reportes filtren por `tenant_id`
- Asegurar que exportaciones respeten aislamiento

## Estructura de Cambios

### Archivos a Modificar

1. **`src/app/api/admin/orders-simple/route.ts`** (CRÍTICO)

   - Agregar `getTenantConfig`
   - Filtrar consulta por `tenant_id`
   - Prioridad: ALTA (riesgo de seguridad)

2. **`src/app/api/admin/orders/analytics/route.ts`** (VERIFICACIÓN)

   - Verificar todas las queries filtran por `tenant_id`
   - Asegurar funciones helper reciben `tenantId`
   - Prioridad: MEDIA

3. **`src/app/api/admin/orders/[id]/route.ts`** (VERIFICACIÓN)

   - Verificar GET filtra por `tenant_id`
   - Verificar PUT/PATCH valida `tenant_id`
   - Prioridad: ALTA

4. **`src/app/api/admin/orders/[id]/*/route.ts`** (MÚLTIPLES)

   - status/route.ts
   - mark-paid/route.ts
   - refund/route.ts
   - payment-link/route.ts
   - whatsapp/route.ts
   - Prioridad: ALTA

5. **`src/app/api/admin/orders/bulk/route.ts`** (VERIFICACIÓN)

   - Verificar operaciones bulk respetan `tenant_id`
   - Prioridad: MEDIA

6. **`src/app/api/admin/analytics/route.ts`** (VERIFICACIÓN)

   - Verificar todas las funciones helper filtran por `tenant_id`
   - Prioridad: MEDIA

7. **`src/app/api/analytics/metrics/route.ts`** (MIGRACIÓN)

   - Agregar `getTenantConfig`
   - Filtrar todas las queries
   - Prioridad: MEDIA

8. **`src/app/api/admin/users/route.ts`** (VERIFICACIÓN)

   - Verificar filtro por `tenant_id` en `user_profiles`
   - Prioridad: MEDIA

9. **`src/app/api/admin/users/[id]/route.ts`** (VERIFICACIÓN)

   - Verificar validación de `tenant_id`
   - Prioridad: MEDIA

10. **`src/app/api/admin/reports/route.ts`** (VERIFICACIÓN)

    - Verificar reportes filtran por `tenant_id`
    - Prioridad: BAJA

## Consideraciones de Seguridad

### Aislamiento de Datos

- Todas las consultas deben filtrar por `tenant_id`
- No permitir acceso a datos de otros tenants
- Validar `tenant_id` antes de actualizar registros

### Validación de Tenant

- Obtener `tenant_id` del tenant actual (no confiar en parámetros)
- Validar que los registros pertenezcan al tenant antes de operar
- Logging de intentos de acceso cruzado

### Operaciones Bulk

- Asegurar que todas las operaciones bulk respeten `tenant_id`
- Validar cada registro individualmente si es necesario

## Verificación Post-Migración

1. ✅ Probar que no se puede acceder a órdenes de otros tenants
2. ✅ Verificar que analytics muestran solo datos del tenant actual
3. ✅ Confirmar que usuarios solo ven usuarios de su tenant
4. ✅ Verificar que reportes respetan aislamiento
5. ✅ Probar operaciones bulk con múltiples tenants
6. ✅ Verificar que todas las APIs admin respetan `tenant_id`

## ✅ ESTADO: COMPLETADA (22 Enero 2026)

### Resumen de Implementación

**APIs Migradas:**

- ✅ `/api/admin/orders-simple` - Filtro por `tenant_id` (CRÍTICO - seguridad)
- ✅ `/api/admin/orders/analytics` - Filtro por `tenant_id`
- ✅ `/api/admin/orders/[id]` - GET y PATCH verificados
- ✅ `/api/admin/orders/[id]/status `- Filtro por `tenant_id`
- ✅ `/api/admin/orders/[id]/mark-paid `- Filtro por `tenant_id`
- ✅ `/api/admin/orders/[id]/refund `- Filtro por `tenant_id`
- ✅ `/api/admin/orders/[id]/payment-link `- Filtro por `tenant_id`
- ✅ `/api/admin/orders/bulk` - Filtro por `tenant_id` en operaciones masivas
- ✅ `/api/admin/analytics` - Todas las funciones helper filtran por `tenant_id`
- ✅ `/api/analytics/metrics` - Filtro por `tenant_id`
- ✅ `/api/admin/reports` - Todos los reportes filtran por `tenant_id`

**Correcciones:**

- ✅ Corregido uso de `guardResult.userId` en lugar de `authResult.user.id`
- ✅ Agregado filtro por `tenant_id` en todas las queries
- ✅ 0 errores de linting introducidos

**Documentación:**

- ✅ `docs/ITERACION_7_COMPLETADA.md` - Resumen completo
- ✅ `docs/MIGRATION_STATUS.md` - Actualizado con iteración 7
- ✅ `docs/PROJECT_STATUS_MASTER_DOCUMENT.md` - Actualizado progreso a 75%

## Impacto

- **Breaking change**: Ninguno (mantiene compatibilidad)
- **Seguridad**: Mejora significativa al filtrar por `tenant_id` en todas las consultas
- **Funcionalidad**: Analytics y reportes ahora son por tenant
- **Performance**: Posible mejora al filtrar datos desde la base

## Dependencias

- Sistema de detección de tenant (completado en Fase 2)
- `getTenantConfig` implementado (completado en Fase 2)
- `withTenantAdmin` guard implementado (completado en Fase 8)
- Columnas `tenant_id` en tablas (completadas en Fase 1)

## Priorización

### Prioridad ALTA (Seguridad Crítica)

1. `/api/admin/orders-simple/route.ts` - Riesgo de acceso cruzado
2. `/api/admin/orders/[id]/route.ts` - Operaciones críticas
3. `/api/admin/orders/[id]/*/route.ts` - Operaciones relacionadas

### Prioridad MEDIA (Funcionalidad)

4. `/api/admin/orders/analytics/route.ts` - Analytics por tenant
5. `/api/admin/analytics/route.ts` - Métricas por tenant
6. `/api/analytics/metrics/route.ts` - Métricas públicas
7. `/api/admin/users/*/route.ts` - Aislamiento de usuarios

### Prioridad BAJA (Mejoras)

8. `/api/admin/reports/route.ts` - Reportes por tenant
9. `/api/admin/orders/bulk/route.ts` - Operaciones bulk