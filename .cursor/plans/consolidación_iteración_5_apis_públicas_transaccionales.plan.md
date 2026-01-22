# Plan de Consolidación Multitenant - Iteración 5

## Migración de APIs Públicas Transaccionales

**Fecha:** 2026-01-21

**Iteración:** 5

**Prioridad:** 🔴 **ALTA** - APIs críticas para operación del e-commerce

**Estimación:** 2-3 días de desarrollo

---

## 🎯 Objetivo

Migrar las APIs públicas que manejan datos transaccionales (carrito, órdenes, pagos) al sistema multitenant, asegurando que todos los registros creados o consultados estén correctamente asociados al `tenant_id` del tenant actual.

---

## 📋 Alcance

### APIs a Migrar

1. **APIs de Carrito** (4 endpoints)

   - `GET /api/cart` - Obtener carrito del usuario
   - `POST /api/cart` - Crear/actualizar items del carrito
   - `PUT /api/cart` - Actualizar carrito completo
   - `DELETE /api/cart` - Limpiar carrito

2. **APIs de Carrito Adicionales** (3 endpoints)

   - `POST /api/cart/add` - Agregar item al carrito
   - `PUT /api/cart/update` - Actualizar cantidad de item
   - `DELETE /api/cart/remove` - Remover item del carrito

3. **APIs de Órdenes** (2 endpoints)

   - `POST /api/orders/create-cash-order` - Crear orden de pago contra entrega
   - `GET /api/user/orders` - Obtener órdenes del usuario autenticado

4. **APIs de Pagos** (1 endpoint)

   - `POST /api/payments/create-preference` - Crear preferencia de pago MercadoPago

**Total:** 10 endpoints

---

## 🔍 Análisis de Impacto

### Tablas Afectadas

| Tabla | Operación | Impacto |

|-------|-----------|---------|

| `cart_items` | SELECT, INSERT, UPDATE, DELETE | **CRÍTICO** - Carrito debe ser por tenant |

| `orders` | INSERT, SELECT | **CRÍTICO** - Órdenes deben estar asociadas al tenant |

| `order_items` | INSERT | **CRÍTICO** - Items de orden deben tener tenant_id |

| `user_profiles` | SELECT | **MEDIO** - Verificar que filtro por tenant_id funciona |

### Consideraciones Especiales

1. **Carrito por Tenant**: Los usuarios pueden tener diferentes carritos según el tenant desde el que accedan
2. **Órdenes Históricas**: Las órdenes existentes sin `tenant_id` deben manejarse (probablemente ya tienen tenant_id por migración anterior)
3. **Compatibilidad**: Mantener compatibilidad con usuarios que puedan tener items en carrito sin tenant_id (migración gradual)

---

## 📝 FASE 1: Migrar APIs de Carrito Principal

### 1.1 `GET /api/cart` - Obtener Carrito

**Archivo:** `src/app/api/cart/route.ts`

**Cambios requeridos:**

```typescript
// ANTES
const { data: cartItems } = await supabase
  .from('cart_items')
  .select('...')
  .eq('user_id', userId)

// DESPUÉS
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
const tenantId = tenant.id

const { data: cartItems } = await supabase
  .from('cart_items')
  .select('...')
  .eq('user_id', userId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
```

**Verificaciones:**

- ✅ Solo muestra items del carrito del tenant actual
- ✅ Maneja casos donde no hay items (retorna array vacío)
- ✅ Mantiene compatibilidad con estructura de respuesta existente

---

### 1.2 `POST /api/cart` - Crear/Actualizar Items

**Archivo:** `src/app/api/cart/route.ts`

**Cambios requeridos:**

```typescript
// ANTES
const { data: newItem } = await supabase
  .from('cart_items')
  .insert({
    user_id: userId,
    product_id: productId,
    quantity: quantity,
    // ...
  })

// DESPUÉS
const tenant = await getTenantConfig()
const tenantId = tenant.id

const { data: newItem } = await supabase
  .from('cart_items')
  .insert({
    user_id: userId,
    product_id: productId,
    quantity: quantity,
    tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
    // ...
  })
```

**Verificaciones:**

- ✅ Asigna `tenant_id` al crear nuevos items
- ✅ Actualiza items existentes verificando que pertenezcan al tenant actual
- ✅ Valida que el producto existe y está visible para el tenant (usar `tenant_products`)

---

### 1.3 `PUT /api/cart` - Actualizar Carrito Completo

**Archivo:** `src/app/api/cart/route.ts`

**Cambios requeridos:**

```typescript
// Similar a POST, pero para actualización masiva
// Verificar que todos los items pertenezcan al tenant actual antes de actualizar
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Verificar ownership antes de actualizar
const { data: existingItems } = await supabase
  .from('cart_items')
  .select('id')
  .eq('user_id', userId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Solo items del tenant
  .in('id', itemIdsToUpdate)
```

**Verificaciones:**

- ✅ Solo actualiza items que pertenecen al tenant actual
- ✅ Rechaza actualizaciones de items de otros tenants (403)

---

### 1.4 `DELETE /api/cart` - Limpiar Carrito

**Archivo:** `src/app/api/cart/route.ts`

**Cambios requeridos:**

```typescript
// ANTES
await supabase
  .from('cart_items')
  .delete()
  .eq('user_id', userId)

// DESPUÉS
const tenant = await getTenantConfig()
const tenantId = tenant.id

await supabase
  .from('cart_items')
  .delete()
  .eq('user_id', userId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Solo items del tenant
```

**Verificaciones:**

- ✅ Solo elimina items del tenant actual
- ✅ No afecta items de otros tenants

---

## 📝 FASE 2: Migrar APIs de Carrito Adicionales

### 2.1 `POST /api/cart/add` - Agregar Item

**Archivo:** `src/app/api/cart/add/route.ts`

**Cambios requeridos:**

```typescript
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
const tenantId = tenant.id

// Al insertar:
await supabase.from('cart_items').insert({
  ...itemData,
  tenant_id: tenantId, // ⚡ MULTITENANT
})

// Al verificar existencia:
await supabase
  .from('cart_items')
  .select('*')
  .eq('user_id', userId)
  .eq('product_id', productId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Verificar en el tenant correcto
```

---

### 2.2 `PUT /api/cart/update` - Actualizar Item

**Archivo:** `src/app/api/cart/update/route.ts`

**Cambios requeridos:**

```typescript
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Verificar ownership antes de actualizar
const { data: existingItem } = await supabase
  .from('cart_items')
  .select('id')
  .eq('id', itemId)
  .eq('user_id', userId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Verificar ownership
  .single()

if (!existingItem) {
  return NextResponse.json(
    { error: 'Item no encontrado o no pertenece al tenant actual' },
    { status: 404 }
  )
}

// Actualizar
await supabase
  .from('cart_items')
  .update({ quantity: newQuantity })
  .eq('id', itemId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Asegurar tenant
```

---

### 2.3 `DELETE /api/cart/remove` - Remover Item

**Archivo:** `src/app/api/cart/remove/route.ts`

**Cambios requeridos:**

```typescript
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Verificar ownership antes de eliminar
const { data: existingItem } = await supabase
  .from('cart_items')
  .select('id')
  .eq('id', itemId)
  .eq('user_id', userId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT
  .single()

if (!existingItem) {
  return NextResponse.json(
    { error: 'Item no encontrado o no pertenece al tenant actual' },
    { status: 404 }
  )
}

// Eliminar
await supabase
  .from('cart_items')
  .delete()
  .eq('id', itemId)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT
```

---

## 📝 FASE 3: Migrar API de Creación de Órdenes

### 3.1 `POST /api/orders/create-cash-order` - Crear Orden de Efectivo

**Archivo:** `src/app/api/orders/create-cash-order/route.ts`

**Cambios requeridos:**

```typescript
// Ya tiene: import { getTenantConfig } from '@/lib/tenant'
// Agregar al inicio de la función POST:

const tenant = await getTenantConfig()
const tenantId = tenant.id

// Al crear la orden:
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    ...orderData,
    tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
  })
  .select()
  .single()

// Al crear order_items:
const orderItems = items.map(item => ({
  ...itemData,
  order_id: order.id,
  tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
}))

await supabase.from('order_items').insert(orderItems)
```

**Verificaciones adicionales:**

- ✅ Validar que los productos del carrito pertenecen al tenant actual
- ✅ Usar precios de `tenant_products` si están disponibles
- ✅ Verificar stock del tenant antes de crear la orden

---

## 📝 FASE 4: Migrar API de Órdenes del Usuario

### 4.1 `GET /api/user/orders` - Obtener Órdenes del Usuario

**Archivo:** `src/app/api/user/orders/route.ts`

**Cambios requeridos:**

```typescript
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
const tenantId = tenant.id

// Construir query con filtro por tenant_id
let query = supabaseAdmin
  .from('orders')
  .select('...')
  .eq('user_id', session.user.id)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
```

**Verificaciones:**

- ✅ Solo muestra órdenes del tenant actual
- ✅ Mantiene paginación y filtros de status
- ✅ Incluye order_items correctamente

---

## 📝 FASE 5: Migrar API de Pagos

### 5.1 `POST /api/payments/create-preference` - Crear Preferencia MercadoPago

**Archivo:** `src/app/api/payments/create-preference/route.ts`

**Cambios requeridos:**

```typescript
import { getTenantConfig } from '@/lib/tenant'

const tenant = await getTenantConfig()
const tenantId = tenant.id

// Al crear la orden (si se crea en esta API):
const { data: order } = await supabase
  .from('orders')
  .insert({
    ...orderData,
    tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
  })

// Al crear order_items:
const orderItems = items.map(item => ({
  ...itemData,
  order_id: order.id,
  tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
}))
```

**Verificaciones adicionales:**

- ✅ Si la API recibe items del carrito, validar que pertenecen al tenant actual
- ✅ Usar configuración de MercadoPago del tenant (si está configurada por tenant)
- ✅ Incluir `tenant_id` en metadata de la preferencia para webhooks

---

## ✅ Checklist de Verificación

### Por cada API migrada:

- [ ] Importa `getTenantConfig` desde `@/lib/tenant`
- [ ] Obtiene `tenantId` al inicio de la función
- [ ] Filtra queries SELECT por `tenant_id`
- [ ] Asigna `tenant_id` en INSERTs
- [ ] Verifica `tenant_id` en UPDATEs y DELETEs
- [ ] Maneja errores de items no encontrados (404)
- [ ] Rechaza operaciones en items de otros tenants (403)
- [ ] Mantiene compatibilidad con estructura de respuesta
- [ ] Actualiza comentarios con `⚡ MULTITENANT`

### Verificación General:

- [ ] `npm run build` compila sin errores
- [ ] No hay warnings nuevos relacionados con tenant
- [ ] Las APIs responden correctamente
- [ ] Los datos se filtran/crean con `tenant_id` correcto

---

## 🧪 Testing Recomendado

### Tests Manuales por Tenant

1. **Carrito:**

   - Agregar items al carrito desde tenant A
   - Verificar que no aparecen en tenant B
   - Agregar items desde tenant B
   - Verificar que ambos carritos son independientes

2. **Órdenes:**

   - Crear orden desde tenant A
   - Verificar que aparece en `/api/user/orders` solo para tenant A
   - Crear orden desde tenant B
   - Verificar que cada tenant ve solo sus órdenes

3. **Pagos:**

   - Crear preferencia desde tenant A
   - Verificar que la orden creada tiene `tenant_id` correcto
   - Verificar que los items tienen `tenant_id` correcto

### Tests de Seguridad

- Intentar acceder a carrito de otro tenant (debe fallar)
- Intentar crear orden con items de otro tenant (debe fallar)
- Verificar que no se pueden modificar items de otros tenants

---

## 📚 Referencias

- Documentación multitenant: `docs/MULTITENANCY.md`
- Estado de migración: `docs/MIGRATION_STATUS.md`
- Quick start: `docs/TENANT-QUICK-START.md`
- Plan iteración 4: `.cursor/plans/consolidación_iteración_4_7ee9b757.plan.md`

---

## 🎯 Resultado Esperado

Al completar esta iteración:

- ✅ **100% de APIs públicas transaccionales migradas**
- ✅ **Carrito funciona correctamente por tenant**
- ✅ **Órdenes se crean con `tenant_id` correcto**
- ✅ **Usuarios solo ven sus órdenes del tenant actual**
- ✅ **Pagos se asocian correctamente al tenant**

**Progreso total estimado:** ~75% completado (de 65% actual)

---

## ⚠️ Notas Importantes

1. **Compatibilidad hacia atrás**: Si hay items en carrito sin `tenant_id`, considerar migración de datos o limpieza
2. **Performance**: Agregar índices en `cart_items(tenant_id, user_id)` si no existen
3. **Validación de productos**: Verificar que productos en carrito/orden están visibles para el tenant
4. **Webhooks**: Asegurar que webhooks de MercadoPago incluyen `tenant_id` en metadata

---

**Estado:** 📝 Plan creado - Listo para implementación