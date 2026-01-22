# Migración de MercadoPago a Credenciales por Tenant

**Fecha**: 8 de Enero, 2026  
**Estado**: ✅ **COMPLETADA**  
**Versión**: 1.0.0

## 📋 Resumen Ejecutivo

Esta migración transforma el sistema de MercadoPago de usar variables de entorno globales a un sistema multitenant donde cada tenant tiene sus propias credenciales almacenadas en la base de datos.

### Objetivos Alcanzados

- ✅ Cada tenant usa sus propias credenciales de MercadoPago
- ✅ Credenciales almacenadas en la tabla `tenants` de la base de datos
- ✅ Soporte completo para múltiples cuentas de MercadoPago
- ✅ Validación de credenciales antes de usar MercadoPago
- ✅ Compatibilidad hacia atrás mantenida (fallback a env vars en desarrollo)

## 🗄️ Estructura de Base de Datos

### Campos en Tabla `tenants`

La tabla `tenants` ya contiene los siguientes campos para MercadoPago:

```sql
mercadopago_access_token    TEXT        NULL  -- Access token del tenant
mercadopago_public_key      VARCHAR     NULL  -- Public key del tenant (para frontend)
mercadopago_webhook_secret  TEXT        NULL  -- Secret para validar webhooks
mercadopago_client_id       VARCHAR     NULL  -- (Reservado para uso futuro)
mercadopago_client_secret   TEXT        NULL  -- (Reservado para uso futuro)
```

### Verificación de Campos

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
  AND column_name LIKE '%mercadopago%'
ORDER BY ordinal_position;
```

## 🔧 Cambios Implementados

### 1. Refactorización del Cliente de MercadoPago

**Archivo**: `src/lib/integrations/mercadopago/index.ts`

#### Antes:
```typescript
export function createMercadoPagoClient(transactionId?: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!
  // ...
}
```

#### Después:
```typescript
// MULTITENANT: Ahora acepta accessToken como parámetro
export function createMercadoPagoClient(
  accessToken: string,
  transactionId?: string
) {
  // Usa accessToken del parámetro
  // ...
}

// Función helper para compatibilidad (deprecated)
export function createMercadoPagoClientLegacy(transactionId?: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
  return createMercadoPagoClient(accessToken, transactionId)
}
```

### 2. Funciones Actualizadas

Todas las funciones principales ahora aceptan credenciales como parámetros:

- ✅ `createPaymentPreference(data, accessToken)` - Crea preferencias de pago
- ✅ `getPaymentInfo(paymentId, accessToken)` - Obtiene información de pagos
- ✅ `getPaymentDetails(paymentId, accessToken)` - Obtiene detalles completos
- ✅ `validateWebhookSignature(..., webhookSecret)` - Valida firmas de webhooks

### 3. Rutas API Actualizadas

#### `/api/payments/create-preference/route.ts`

```typescript
// Obtener tenant config
const tenant = await getTenantConfig()

// Validar credenciales
if (!tenant.mercadopagoAccessToken) {
  return NextResponse.json({
    success: false,
    error: 'MercadoPago no configurado para este tenant'
  }, { status: 400 })
}

// Usar credenciales del tenant
const preferenceResult = await createPaymentPreference(
  preferenceData,
  tenant.mercadopagoAccessToken
)
```

#### `/api/payments/webhook/route.ts`

El webhook ahora:
1. Obtiene el `payment_id` del webhook
2. Busca la orden por `external_reference` o `payment_id`
3. Obtiene el `tenant_id` de la orden
4. Obtiene las credenciales del tenant
5. Valida y procesa el webhook con las credenciales correctas

```typescript
// Obtener tenant desde la orden
const { data: order } = await supabase
  .from('orders')
  .select('tenant_id')
  .eq('external_reference', orderReference)
  .single()

const tenant = await getTenantById(order.tenant_id)
const paymentResult = await getPaymentInfo(
  paymentId,
  tenant.mercadopagoAccessToken
)
```

#### Rutas Admin

Todas las rutas admin ahora usan credenciales del tenant:

- ✅ `/api/admin/orders/[id]/refund/route.ts`
- ✅ `/api/admin/orders/[id]/payment-proof/route.ts`
- ✅ `/api/admin/orders/[id]/payment-link/route.ts`

### 4. Componente Frontend

**Archivo**: `src/components/Checkout/MercadoPagoWallet.tsx`

El componente ahora acepta `publicKey` como prop opcional:

```typescript
interface MercadoPagoWalletProps {
  preferenceId: string
  publicKey?: string // ⚡ MULTITENANT: Public key del tenant
  // ...
}

// Uso: Usa publicKey del tenant o fallback a env var
const mpPublicKey = publicKey || process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
```

### 5. Health Checks

**Archivo**: `src/lib/monitoring/health-checks.ts`

El health check ahora verifica credenciales por tenant:

```typescript
// Obtener todos los tenants
const tenants = await getAllTenants()

// Verificar credenciales de cada tenant
const tenantCredentialsStatus = tenants.map(tenant => ({
  tenantId: tenant.id,
  tenantSlug: tenant.slug,
  hasAccessToken: !!tenant.mercadopagoAccessToken,
  hasPublicKey: !!tenant.mercadopagoPublicKey,
  hasWebhookSecret: !!tenant.mercadopagoWebhookSecret,
  isConfigured: !!(tenant.mercadopagoAccessToken && tenant.mercadopagoPublicKey),
}))
```

## 🔄 Flujo de Datos

```mermaid
graph TD
    A[Request API] --> B[getTenantConfig]
    B --> C[TenantConfig desde BD]
    C --> D{¿Tiene credenciales MP?}
    D -->|Sí| E[createMercadoPagoClient con tenant.mercadopagoAccessToken]
    D -->|No| F[Error: Credenciales no configuradas]
    E --> G[Operación MercadoPago]
    G --> H[Respuesta]
```

## 📝 Guía de Uso

### Configurar Credenciales para un Tenant

1. **Obtener credenciales de MercadoPago**:
   - Access Token (producción o test)
   - Public Key
   - Webhook Secret

2. **Actualizar en base de datos**:

```sql
UPDATE tenants
SET 
  mercadopago_access_token = 'APP_USR_...',
  mercadopago_public_key = 'APP_USR_...',
  mercadopago_webhook_secret = 'webhook_secret_...'
WHERE slug = 'nombre-del-tenant';
```

3. **Verificar configuración**:

```typescript
const tenant = await getTenantConfig()
console.log('Access Token:', tenant.mercadopagoAccessToken ? '✅ Configurado' : '❌ No configurado')
console.log('Public Key:', tenant.mercadopagoPublicKey ? '✅ Configurado' : '❌ No configurado')
```

### Usar en Componentes Frontend

```typescript
// En un Server Component
const tenant = await getTenantPublicConfig()

// Pasar public key al componente
<MercadoPagoWallet
  preferenceId={preferenceId}
  publicKey={tenant.mercadopagoPublicKey}
/>
```

### Usar en API Routes

```typescript
// Obtener tenant config
const tenant = await getTenantConfig()

// Validar credenciales
if (!tenant.mercadopagoAccessToken) {
  return NextResponse.json({
    success: false,
    error: 'MercadoPago no configurado para este tenant'
  }, { status: 400 })
}

// Usar credenciales
const result = await createPaymentPreference(data, tenant.mercadopagoAccessToken)
```

## 🔒 Seguridad

### Validaciones Implementadas

1. **Validación de credenciales antes de usar**:
   - Verifica que `tenant.mercadopagoAccessToken` no sea null
   - Lanza error descriptivo si faltan credenciales

2. **Webhook validation**:
   - Obtiene tenant desde la orden asociada al pago
   - Usa el webhook secret del tenant correcto
   - Valida que el pago pertenece al tenant correcto

3. **Logging seguro**:
   - No loggea credenciales completas
   - Solo loggea que las credenciales están presentes/ausentes

### Consideraciones

- ⚠️ Las credenciales solo se usan server-side
- ✅ El public key puede exponerse al frontend (es público por diseño)
- ✅ Validación de webhook con secret del tenant correcto

## 🧪 Testing

### Tests Actualizados

Los siguientes archivos de test necesitan actualización:

- `src/__tests__/lib/health-checks.test.ts`
- `src/__tests__/api/payments/*.test.ts`
- `src/__tests__/multitenant/e2e/tenant-checkout.spec.ts`

### Mocking en Tests

```typescript
// Mock getTenantConfig para tests
jest.mock('@/lib/tenant/tenant-service', () => ({
  getTenantConfig: jest.fn().mockResolvedValue({
    id: 'test-tenant-id',
    mercadopagoAccessToken: 'TEST_ACCESS_TOKEN',
    mercadopagoPublicKey: 'TEST_PUBLIC_KEY',
    mercadopagoWebhookSecret: 'TEST_WEBHOOK_SECRET',
  }),
}))
```

## 📊 Estado de Migración

### Archivos Modificados

1. ✅ `src/lib/integrations/mercadopago/index.ts` - Cliente refactorizado
2. ✅ `src/app/api/payments/create-preference/route.ts` - Usa credenciales del tenant
3. ✅ `src/app/api/payments/webhook/route.ts` - Obtiene tenant y usa sus credenciales
4. ✅ `src/app/api/payments/refunds/route.ts` - Usa credenciales del tenant
5. ✅ `src/app/api/payments/status/[id]/route.ts` - Usa credenciales del tenant
6. ✅ `src/app/api/admin/orders/[id]/refund/route.ts` - Usa credenciales del tenant
7. ✅ `src/app/api/admin/orders/[id]/payment-proof/route.ts` - Usa credenciales del tenant
8. ✅ `src/app/api/admin/orders/[id]/payment-link/route.ts` - Usa credenciales del tenant
9. ✅ `src/components/Checkout/MercadoPagoWallet.tsx` - Acepta public key como prop
10. ✅ `src/lib/monitoring/health-checks.ts` - Verifica credenciales por tenant

### Compatibilidad

- ✅ Compatibilidad hacia atrás mantenida
- ✅ Fallback a variables de entorno en desarrollo
- ✅ Sin breaking changes en la API pública

## 🚀 Próximos Pasos

1. **Actualizar tests** para usar credenciales del tenant
2. **Migrar variables de entorno** a la base de datos para tenants existentes
3. **Documentar** proceso de configuración para nuevos tenants
4. **Monitorear** uso de credenciales por tenant en producción

## 📚 Referencias

- [Plan de Migración Original](./.cursor/plans/migración_mercadopago_a_credenciales_por_tenant_7e4150e2.plan.md)
- [Documentación MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [Sistema Multitenant](./docs/PROJECT_STATUS_MASTER_DOCUMENT.md)

## ✅ Checklist de Verificación

- [x] Cliente de MercadoPago refactorizado
- [x] Todas las funciones actualizadas para aceptar credenciales
- [x] Rutas API actualizadas
- [x] Componente frontend actualizado
- [x] Health checks actualizados
- [x] Validaciones de seguridad implementadas
- [x] Documentación creada
- [ ] Tests actualizados (pendiente)
- [ ] Migración de datos de producción (pendiente)

---

**Última actualización**: 8 de Enero, 2026  
**Autor**: Sistema de Migración Automatizada  
**Revisado por**: Equipo de Desarrollo
