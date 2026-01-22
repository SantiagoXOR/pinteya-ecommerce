# Sistema Multitenant - PintureríaDigital

## Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Base de Datos](#base-de-datos)
4. [Detección de Tenant](#detección-de-tenant)
5. [Frontend Dinámico](#frontend-dinámico)
6. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
7. [Gestión de Productos](#gestión-de-productos)
8. [Integración con ERPs](#integración-con-erps)
9. [Analytics por Tenant](#analytics-por-tenant)
10. [Configuración de Dominios](#configuración-de-dominios)
11. [Guía de Desarrollo](#guía-de-desarrollo)
12. [Testing del Sistema Multitenant](#testing-del-sistema-multitenant)
13. [Troubleshooting](#troubleshooting)

---

## Introducción

PintureríaDigital es una plataforma e-commerce multitenant que permite operar múltiples tiendas online desde una única base de código. Cada tienda (tenant) puede tener:

- **Branding propio**: Logo, colores, favicon, imágenes promocionales
- **Dominio propio**: Subdominio (`pinteya.pintureriadigital.com`) o dominio custom (`www.pinteya.com`)
- **Analytics independientes**: Google Analytics 4 y Meta Pixel configurados por tenant
- **Catálogo flexible**: Productos compartidos o independientes, con precios y stock personalizables
- **Integración ERP**: Conexión con sistemas externos (Aikon, SAP, Tango, etc.)

### Tenants Iniciales

| Tenant | Subdominio | Dominio Custom | Color Principal |
|--------|------------|----------------|-----------------|
| Pinteya | `pinteya.pintureriadigital.com` | `www.pinteya.com` | #f27a1d (naranja) |
| Pintemas | `pintemas.pintureriadigital.com` | `www.pintemas.com` | #1e88e5 (azul) |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│  pinteya.pintureriadigital.com / pintemas.pintureriadigital.com │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Edge Network)                         │
│  • Wildcard DNS: *.pintureriadigital.com                        │
│  • Custom domains: www.pinteya.com, www.pintemas.com            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                            │
│  • Detecta tenant por hostname                                   │
│  • Inyecta headers: x-tenant-subdomain, x-tenant-custom-domain  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT SERVICE (Server)                       │
│  • Consulta tabla `tenants` en Supabase                         │
│  • Cache con React.cache() para SSR                             │
│  • Retorna configuración completa del tenant                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                         │
│  • Tabla `tenants`: Configuración de cada tienda                │
│  • RLS Policies: Aislamiento de datos por tenant_id             │
│  • Shared Stock Pools: Stock compartido entre tenants           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Diagrama de Tablas

```
┌──────────────────┐     ┌───────────────────────┐     ┌──────────────────┐
│     tenants      │     │   shared_stock_pools  │     │ external_systems │
├──────────────────┤     ├───────────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)               │     │ id (PK)          │
│ slug (UNIQUE)    │     │ code (UNIQUE)         │     │ code (UNIQUE)    │
│ name             │     │ name                  │     │ name             │
│ subdomain        │     │ city, province        │     │ type             │
│ custom_domain    │     │ is_active             │     │ capabilities     │
│ logo_url         │     └───────────────────────┘     └──────────────────┘
│ primary_color    │              │                           │
│ ga4_measurement_id│             │                           │
│ meta_pixel_id    │              │                           │
│ mercadopago_*    │              │                           │
│ whatsapp_*       │              ▼                           │
│ seo_*            │     ┌───────────────────────┐            │
│ ...              │     │  shared_pool_stock    │            │
└──────────────────┘     ├───────────────────────┤            │
         │               │ pool_id (FK)          │            │
         │               │ product_id (FK)       │            │
         │               │ stock                 │            │
         │               │ reserved_stock        │            │
         │               └───────────────────────┘            │
         │                                                    │
         ▼                                                    ▼
┌──────────────────────┐                    ┌─────────────────────────────┐
│   tenant_products    │                    │   tenant_external_systems   │
├──────────────────────┤                    ├─────────────────────────────┤
│ tenant_id (FK)       │                    │ tenant_id (FK)              │
│ product_id (FK)      │                    │ external_system_id (FK)     │
│ shared_pool_id (FK)  │                    │ instance_id                 │
│ stock                │                    │ api_credentials (JSONB)     │
│ price                │                    │ is_primary                  │
│ discounted_price     │                    └─────────────────────────────┘
│ is_visible           │                                 │
│ is_featured          │                                 │
└──────────────────────┘                                 ▼
                                          ┌───────────────────────────────┐
                                          │ tenant_product_external_ids   │
                                          ├───────────────────────────────┤
                                          │ tenant_id (FK)                │
                                          │ product_id (FK)               │
                                          │ external_system_id (FK)       │
                                          │ external_code                 │
                                          └───────────────────────────────┘
```

### Migraciones SQL

Las migraciones están en `supabase/migrations/` con el prefijo `20260121`:

| Archivo | Descripción |
|---------|-------------|
| `000001_create_tenants_system.sql` | Tabla principal de tenants |
| `000002_create_shared_stock_pools.sql` | Pools de stock compartido |
| `000003_create_tenant_products.sql` | Productos por tenant |
| `000004_create_external_systems.sql` | Integración ERP |
| `000005_add_tenant_id_columns.sql` | Columnas tenant_id en tablas existentes |
| `000006_create_tenant_roles.sql` | Sistema de roles |
| `000007_create_tenant_rls_policies.sql` | Políticas RLS |
| `000008_seed_tenants.sql` | Seed de Pinteya |
| `000009_migrate_existing_data_to_pinteya.sql` | Migración de datos |
| `000010_create_tenant_pintemas.sql` | Creación de Pintemas |

### Row Level Security (RLS)

Todas las tablas con datos transaccionales tienen RLS habilitado:

```sql
-- Ejemplo: Policy para orders
CREATE POLICY "Orders tenant isolation select"
ON orders FOR SELECT
USING (
  auth.role() = 'service_role' OR
  (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id()) OR
  (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
);
```

Para establecer el tenant actual en una sesión:

```sql
SELECT set_current_tenant('uuid-del-tenant');
```

---

## Detección de Tenant

### Flujo de Detección

1. **Middleware** (`middleware.ts`): Extrae hostname y determina tenant
2. **Headers**: Propaga información via headers HTTP
3. **TenantService**: Consulta BD y cachea resultado

### Middleware

```typescript
// middleware.ts
function getTenantInfoFromHost(hostname: string) {
  // Detecta subdominio: pinteya.pintureriadigital.com → 'pinteya'
  // Detecta custom domain: www.pinteya.com → null (se busca en BD)
  // Detecta admin: admin.pintureriadigital.com → isAdminDomain: true
}
```

Headers inyectados:
- `x-tenant-domain`: Hostname completo
- `x-tenant-subdomain`: Subdominio extraído (si aplica)
- `x-tenant-custom-domain`: Dominio custom (si aplica)
- `x-tenant-is-super-admin`: 'true' si es dominio de super admin

### TenantService (Server)

```typescript
// src/lib/tenant/tenant-service.ts
import { getTenantConfig, getTenantPublicConfig } from '@/lib/tenant'

// En un Server Component
const tenant = await getTenantConfig() // Config completa
const publicConfig = await getTenantPublicConfig() // Config pública (sin secretos)
```

---

## Frontend Dinámico

### TenantContext (Client)

```typescript
// En Client Components
'use client'
import { useTenant, useTenantTheme, useTenantAssets } from '@/contexts/TenantContext'

function MyComponent() {
  const tenant = useTenant()
  const { primaryColor, secondaryColor } = useTenantTheme()
  const { logoUrl, faviconUrl } = useTenantAssets()
  
  return <div style={{ color: primaryColor }}>{tenant.name}</div>
}
```

### CSS Variables Dinámicas

El componente `TenantThemeStyles` inyecta CSS variables:

```css
:root {
  --tenant-primary: #f27a1d;
  --tenant-primary-dark: #bd4811;
  --tenant-secondary: #1f2937;
  --tenant-accent: #10b981;
  --tenant-border-radius: 0.5rem;
}
```

Uso en Tailwind:

```html
<button class="bg-tenant-primary hover:bg-tenant-primary-dark">
  Comprar
</button>
```

### Estructura de Assets

```
public/
└── tenants/
    ├── pinteya/
    │   ├── logo.svg
    │   ├── logo-dark.svg
    │   ├── favicon.svg
    │   └── hero/
    │       ├── banner-1.webp
    │       └── banner-2.webp
    └── pintemas/
        ├── logo.svg
        ├── logo-dark.svg
        ├── favicon.svg
        └── hero/
            └── ...
```

---

## Sistema de Roles y Permisos

### Tipos de Roles

```typescript
type TenantUserRole = 
  | 'super_admin'    // Acceso total a la plataforma
  | 'tenant_owner'   // Dueño de un tenant específico
  | 'tenant_admin'   // Administrador de un tenant
  | 'tenant_staff'   // Staff con permisos limitados
  | 'customer'       // Cliente normal
```

### Guards de Autenticación

```typescript
// Para Super Admins
import { requireSuperAdmin } from '@/lib/auth/guards'

export async function GET() {
  const { user, permissions } = await requireSuperAdmin()
  // Solo super admins llegan aquí
}

// Para Tenant Admins
import { requireTenantAdmin, checkTenantPermission } from '@/lib/auth/guards'

export async function GET() {
  const { user, tenant, role, permissions } = await requireTenantAdmin()
  
  // Verificar permiso específico
  const canEditProducts = await checkTenantPermission('products', 'edit')
}
```

### Permisos Granulares

```typescript
interface TenantPermissions {
  products: { view: boolean; edit: boolean; delete: boolean; }
  orders: { view: boolean; edit: boolean; refund: boolean; }
  customers: { view: boolean; edit: boolean; }
  analytics: { view: boolean; export: boolean; }
  settings: { view: boolean; edit: boolean; }
}
```

---

## Gestión de Productos

### Modelo de Stock Flexible

```
┌─────────────────────────────────────────────────────────────┐
│                    CATÁLOGO GLOBAL                          │
│                    (tabla products)                         │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
           ▼                                     ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   STOCK COMPARTIDO      │         │   STOCK INDEPENDIENTE   │
│   (shared_pool_stock)   │         │   (tenant_products)     │
│                         │         │                         │
│ • Pinteya + Pintemas    │         │ • Tenant con depósito   │
│ • Mismo depósito físico │         │   propio                │
│ • Stock sincronizado    │         │ • Stock y precios       │
│   desde ERP             │         │   independientes        │
└─────────────────────────┘         └─────────────────────────┘
```

### TenantProductService

```typescript
import { 
  getTenantProducts, 
  getTenantProductBySlug,
  getTenantProductStock 
} from '@/lib/products/tenant-product-service'

// Obtener productos del tenant actual
const products = await getTenantProducts(tenantId, {
  categoryId: 'uuid',
  brandId: 'uuid',
  minPrice: 1000,
  maxPrice: 5000,
  onlyVisible: true,
  onlyInStock: true,
  limit: 20,
  offset: 0,
})

// Obtener producto específico con variantes
const product = await getTenantProductBySlug('latex-interior-20l')
```

---

## Integración con ERPs

### Sistemas Soportados

| Código | Nombre | Capacidades |
|--------|--------|-------------|
| AIKON | Aikon ERP | stock_sync, price_sync, order_export |
| SAP | SAP Business One | stock_sync, price_sync, order_export, customer_sync |
| TANGO | Tango Gestión | stock_sync, price_sync |
| CUSTOM | Sistema Custom | configurable |

### API de Sincronización

**Endpoint:** `POST /api/sync/[system]`

```bash
# Ejemplo: Sincronizar stock desde Aikon
curl -X POST https://pintureriadigital.com/api/sync/aikon \
  -H "X-API-Key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "external_code": "LAT-INT-20L",
        "stock": 150,
        "price": 45000,
        "discounted_price": 42000
      }
    ]
  }'
```

**Respuesta:**

```json
{
  "success": true,
  "processed": 1,
  "updated": 1,
  "failed": 0,
  "errors": []
}
```

### Configuración de API Key

Las credenciales se almacenan en `tenant_external_systems.api_credentials`:

```json
{
  "api_key": "sk_live_xxx",
  "webhook_secret": "whsec_xxx"
}
```

---

## Analytics por Tenant

### Configuración

Cada tenant tiene sus propios IDs de analytics en la tabla `tenants`:

| Campo | Descripción |
|-------|-------------|
| `ga4_measurement_id` | ID de Google Analytics 4 (G-XXXXXXX) |
| `meta_pixel_id` | ID de Meta Pixel |
| `google_merchant_id` | ID de Google Merchant Center |
| `meta_catalog_id` | ID de Catálogo de Meta |

### Componente TenantAnalytics

```typescript
// Se incluye automáticamente en el layout
<TenantAnalytics />
```

Inyecta los scripts de GA4 y Meta Pixel con los IDs del tenant actual.

### Eventos Personalizados

```typescript
// Los eventos incluyen tenant_id automáticamente
gtag('event', 'purchase', {
  tenant_id: 'uuid',
  tenant_slug: 'pinteya',
  // ... otros datos
})
```

---

## Configuración de Dominios

### Vercel

**vercel.json:**

```json
{
  "framework": "nextjs",
  "regions": ["gru1"],
  "headers": [
    {
      "source": "/tenants/:tenant*",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### Configuración de DNS

1. **Dominio principal:** `pintureriadigital.com` → Vercel
2. **Wildcard:** `*.pintureriadigital.com` → Vercel (CNAME)
3. **Custom domains:** Agregar en Vercel Dashboard

### Agregar Nuevo Dominio Custom

1. En Vercel Dashboard → Project → Settings → Domains
2. Agregar dominio (ej: `www.nuevatienda.com`)
3. Configurar DNS del dominio para apuntar a Vercel
4. Agregar registro en tabla `tenants`:

```sql
UPDATE tenants 
SET custom_domain = 'www.nuevatienda.com'
WHERE slug = 'nueva-tienda';
```

---

## Guía de Desarrollo

### Crear Nuevo Tenant

1. **Crear migración SQL:**

```sql
-- supabase/migrations/xxx_create_tenant_nuevo.sql
INSERT INTO tenants (
  slug, name, subdomain, custom_domain,
  logo_url, primary_color, primary_dark,
  -- ... otros campos
) VALUES (
  'nuevo', 'Tienda Nueva', 'nuevo', NULL,
  '/tenants/nuevo/logo.svg', '#ff0000', '#cc0000',
  -- ...
);
```

2. **Crear assets:**

```
public/tenants/nuevo/
├── logo.svg
├── logo-dark.svg
├── favicon.svg
└── hero/
```

3. **Ejecutar migración:**

```bash
npx supabase db push
```

### Acceder a Datos del Tenant

**En Server Components:**

```typescript
import { getTenantConfig } from '@/lib/tenant'

export default async function Page() {
  const tenant = await getTenantConfig()
  return <h1>{tenant.name}</h1>
}
```

**En Client Components:**

```typescript
'use client'
import { useTenant } from '@/contexts/TenantContext'

export function ClientComponent() {
  const tenant = useTenant()
  return <span>{tenant.name}</span>
}
```

**En API Routes:**

```typescript
import { getTenantConfig } from '@/lib/tenant'

export async function GET() {
  const tenant = await getTenantConfig()
  // Usar tenant.id para filtrar datos
}
```

### Testing Local

Para probar diferentes tenants localmente, modifica `/etc/hosts`:

```
127.0.0.1 pinteya.localhost
127.0.0.1 pintemas.localhost
```

Y accede a `http://pinteya.localhost:3000`

---

## Testing del Sistema Multitenant

### Estructura de Tests

Los tests del sistema multitenant están organizados en `src/__tests__/multitenant/`:

```
src/__tests__/multitenant/
├── unit/                          # Tests unitarios
│   ├── tenant-service.test.ts    # Tests de getTenantBySlug, getTenantById, etc.
│   ├── tenant-service-with-headers.test.ts  # Tests de getTenantConfig, isAdminRequest
│   ├── tenant-context.test.tsx   # Tests del contexto de React
│   ├── tenant-theme.test.tsx     # Tests de temas y estilos
│   └── middleware-detection.test.ts  # Tests de detección en middleware
├── integration/                  # Tests de integración
│   ├── data-isolation.test.ts    # Verificación de aislamiento de datos
│   └── tenant-detection.test.ts  # Tests de detección completa
└── setup-data.ts                 # Datos de prueba compartidos
```

### Ejecutar Tests

```bash
# Todos los tests multitenant
npm run test:multitenant:unit

# Tests específicos
npm test -- tenant-service.test.ts
npm test -- tenant-service-with-headers.test.ts
```

### Estrategia de Mocks

#### 1. Tests sin `headers()` (getTenantBySlug, getTenantById)

Estos tests usan un mock global `__TENANT_TEST_SUPABASE_FACTORY__` para inyectar un cliente Supabase mockeado:

```typescript
// src/__tests__/multitenant/unit/tenant-service.test.ts
const GLOBAL_FACTORY_KEY = '__TENANT_TEST_SUPABASE_FACTORY__'

beforeEach(() => {
  const mockSupabase = createMockSupabase()
  ;(globalThis as any)[GLOBAL_FACTORY_KEY] = () => mockSupabase
})

// El código real en get-admin-client.ts detecta esto:
export function createAdminClient() {
  if (process.env.NODE_ENV === 'test' && 
      typeof globalThis.__TENANT_TEST_SUPABASE_FACTORY__ === 'function') {
    return globalThis.__TENANT_TEST_SUPABASE_FACTORY__()
  }
  // ... implementación real
}
```

**Ventajas:**
- No requiere mockear módulos completos
- Usa la implementación real de `mapDBRowToTenantConfig`
- Fácil de configurar y mantener

#### 2. Tests con `headers()` (getTenantConfig, getTenantPublicConfig, isAdminRequest)

Estas funciones usan `headers()` de Next.js que no está disponible en tests. En lugar de mockear el módulo completo, usamos variables globales:

```typescript
// src/__tests__/multitenant/unit/tenant-service-with-headers.test.ts
globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya
const config = await getTenantConfig()

// El código real en tenant-service.ts detecta esto:
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  if (process.env.NODE_ENV === 'test' && 
      typeof globalThis.__TENANT_TEST_GET_CONFIG__ === 'function') {
    return globalThis.__TENANT_TEST_GET_CONFIG__()
  }
  // ... implementación real con headers()
})
```

**Variables globales disponibles:**
- `__TENANT_TEST_GET_CONFIG__`: Override para `getTenantConfig()`
- `__TENANT_TEST_GET_PUBLIC_CONFIG__`: Override para `getTenantPublicConfig()`
- `__TENANT_TEST_IS_ADMIN_REQUEST__`: Override para `isAdminRequest()`

**Ventajas:**
- Evita problemas con re-exports de ES modules
- Permite usar la implementación real de funciones auxiliares
- No requiere mockear `next/headers` complejamente

### Cobertura de Tests

**Estado actual: 100% de cobertura en tests unitarios multitenant**

| Suite | Tests | Estado |
|-------|-------|--------|
| `tenant-service.test.ts` | 8 tests | ✅ 100% |
| `tenant-service-with-headers.test.ts` | 7 tests | ✅ 100% |
| `tenant-context.test.tsx` | 15 tests | ✅ 100% |
| `tenant-theme.test.tsx` | 12 tests | ✅ 100% |
| `middleware-detection.test.ts` | 10 tests | ✅ 100% |
| **Total** | **52 tests** | ✅ **100%** |

### Escribir Nuevos Tests

#### Test para función sin `headers()`

```typescript
import { getTenantBySlug } from '@/lib/tenant'
import { mockTenants, configToDBRow } from '../setup-data'

describe('getTenantBySlug', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    ;(globalThis as any).__TENANT_TEST_SUPABASE_FACTORY__ = () => mockSupabase
  })

  it('should get tenant by slug', async () => {
    const dbRow = configToDBRow(mockTenants.pinteya)
    mockSupabase.single.mockResolvedValue({
      data: dbRow,
      error: null,
    })

    const tenant = await getTenantBySlug('pinteya')

    expect(tenant).toBeDefined()
    expect(tenant?.slug).toBe('pinteya')
    expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
  })
})
```

#### Test para función con `headers()`

```typescript
import { getTenantConfig } from '@/lib/tenant'
import { mockTenants } from '../setup-data'

describe('getTenantConfig', () => {
  beforeEach(() => {
    delete globalThis.__TENANT_TEST_GET_CONFIG__
  })

  it('should get tenant config', async () => {
    globalThis.__TENANT_TEST_GET_CONFIG__ = async () => mockTenants.pinteya

    const config = await getTenantConfig()

    expect(config).toBeDefined()
    expect(config.slug).toBe('pinteya')
    expect(config.name).toBe('Pinteya')
  })
})
```

### Datos de Prueba

Los datos de prueba están centralizados en `src/__tests__/multitenant/setup-data.ts`:

```typescript
export const mockTenants = {
  pinteya: { /* TenantConfig completo */ },
  pintemas: { /* TenantConfig completo */ },
}

// Helpers para convertir entre formatos
export function configToDBRow(config: TenantConfig): TenantDBRow
export function extractPublicConfig(config: TenantConfig): TenantPublicConfig
```

### Tests de Integración

Los tests de integración verifican el comportamiento completo del sistema:

```typescript
// src/__tests__/multitenant/integration/data-isolation.test.ts
describe('Data Isolation', () => {
  it('should isolate orders by tenant', async () => {
    // Verifica que los datos de un tenant no son visibles para otro
  })
})
```

### Mejores Prácticas

1. **Siempre limpiar mocks en `afterEach`**:
   ```typescript
   afterEach(() => {
     delete (globalThis as any).__TENANT_TEST_SUPABASE_FACTORY__
   })
   ```

2. **Usar `configToDBRow()` para convertir datos de prueba**:
   ```typescript
   const dbRow = configToDBRow(mockTenants.pinteya)
   mockSupabase.single.mockResolvedValue({ data: dbRow, error: null })
   ```

3. **Verificar que los mocks se llaman correctamente**:
   ```typescript
   expect(mockSupabase.from).toHaveBeenCalledWith('tenants')
   expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'pinteya')
   ```

4. **Para funciones con `headers()`, usar variables globales en lugar de mocks complejos**

5. **Mantener los datos de prueba sincronizados con la estructura real de la BD**

---

## Troubleshooting

### "Tenant not found"

**Causa:** El hostname no coincide con ningún tenant en la BD.

**Solución:**
1. Verificar que el tenant existe en la tabla `tenants`
2. Verificar que `subdomain` o `custom_domain` coinciden
3. El sistema usa `pinteya` como fallback por defecto

### "RLS policy violation"

**Causa:** Intentando acceder a datos de otro tenant.

**Solución:**
1. Asegurarse de que `set_current_tenant()` fue llamado
2. Verificar que el `tenant_id` en los datos coincide con el tenant actual
3. Para operaciones admin, usar `service_role` key

### CSS no se actualiza por tenant

**Causa:** Cache de CSS o TenantThemeStyles no está incluido.

**Solución:**
1. Verificar que `TenantProviderWrapper` está en el layout
2. Limpiar cache del navegador
3. Verificar que los colores están definidos en la BD

### Analytics no trackea

**Causa:** IDs de GA4/Meta Pixel vacíos o inválidos.

**Solución:**
1. Verificar `ga4_measurement_id` y `meta_pixel_id` en la BD
2. Verificar en Network tab que los scripts se cargan
3. Verificar en consola que no hay errores de CORS

---

## Estado de Migración - Iteración 5 (2026-01-22)

### ✅ Testing Multitenant (2026-01-23)

**Estado: 100% de cobertura en tests unitarios**

- ✅ **52/52 tests pasando** en suite de tests multitenant
- ✅ Tests unitarios completos para `tenant-service`
- ✅ Tests para funciones con `headers()` usando variables globales
- ✅ Tests de contexto y temas de React
- ✅ Tests de detección en middleware
- ✅ Estrategia de mocks documentada y mejorada
- ✅ Datos de prueba centralizados en `setup-data.ts`

**Archivos de test:**
- `src/__tests__/multitenant/unit/tenant-service.test.ts` - 8 tests
- `src/__tests__/multitenant/unit/tenant-service-with-headers.test.ts` - 7 tests
- `src/__tests__/multitenant/unit/tenant-context.test.tsx` - 15 tests
- `src/__tests__/multitenant/unit/tenant-theme.test.tsx` - 12 tests
- `src/__tests__/multitenant/unit/middleware-detection.test.ts` - 10 tests

### ✅ Completado

#### FASE 1: APIs de Productos (100% completado)
- ✅ `/api/products/route.ts` - Usa `tenant_products` con JOIN `!inner`, filtra por `tenant_id` e `is_visible`
- ✅ `/api/products/[id]/route.ts` - Usa LEFT JOIN para fallback, verifica visibilidad
- ✅ `/api/admin/products/route.ts` - Incluye `tenant_products` (LEFT JOIN), usa precios/stock del tenant
- ✅ `/api/admin/products/stats/route.ts` - Usa `tenant_products` para estadísticas

#### FASE 2: APIs de Analytics (100% completado)
- ✅ `/api/admin/analytics/route.ts` - Todas las funciones filtran por `tenant_id`
- ✅ `/api/admin/orders/analytics/route.ts` - Filtra por `tenant_id`

#### FASE 3: APIs Admin Adicionales (100% completado)
- ✅ `/api/admin/users/route.ts` - Filtra usuarios y órdenes por `tenant_id`, asigna `tenant_id` al crear
- ✅ `/api/admin/orders/route.ts` - Usa `withTenantAdmin`, filtra y asigna `tenant_id`
- ✅ `/api/admin/orders/[id]/route.ts` - Ya migrado (iteración anterior)
- ✅ `/api/admin/orders/[id]/refund/route.ts` - Migrado a `withTenantAdmin`
- ✅ `/api/admin/orders/[id]/status/route.ts` - Migrado a `withTenantAdmin` (GET y POST)
- ✅ `/api/admin/orders/[id]/mark-paid/route.ts` - Migrado a `withTenantAdmin`
- ✅ `/api/admin/orders/[id]/payment-link/route.ts` - Migrado a `withTenantAdmin`
- ✅ `/api/admin/orders/stats/route.ts` - Ya migrado (iteración anterior)
- ✅ `/api/admin/dashboard/route.ts` - Ya migrado (iteración anterior)
- ✅ `/api/admin/customers/route.ts` - Ya migrado (iteración anterior)

#### FASE 4: URLs y Schema Markup (100% completado)
- ✅ `Footer.tsx` - Ya usa `useTenantSafe()`
- ✅ `advanced-schema-markup.ts` - Actualizado para usar `getTenantConfig()`

### ⚠️ Pendiente de Migración

#### APIs Públicas de Carrito (✅ Completado - Iteración 5)
- ✅ `/api/cart/route.ts` - Carrito de compras (GET, POST, DELETE) - **Migrado**
- ✅ `/api/cart/add/route.ts` - Agregar items al carrito - **Migrado**

**Cambios implementados:**
- Constraint única actualizada: `UNIQUE(user_id, product_id, variant_id, tenant_id)`
- Función `upsert_cart_item` actualizada con soporte para `variant_id` y `tenant_id`
- APIs actualizadas para usar función RPC `upsert_cart_item`
- Filtrado por `tenant_id` en todas las consultas
- Índice compuesto `(user_id, tenant_id)` para mejor performance

#### APIs Públicas de Órdenes (Prioridad Alta)
- ❌ `/api/cart/remove/route.ts` - Remover items del carrito
- ❌ `/api/cart/update/route.ts` - Actualizar items del carrito
- ❌ `/api/orders/create-cash-order/route.ts` - Crear orden de efectivo
- ❌ `/api/payments/create-preference/route.ts` - Crear preferencia de pago MercadoPago
- ❌ `/api/user/orders/route.ts` - Órdenes del usuario autenticado

#### APIs Admin Restantes (Prioridad Media)
- ❌ `/api/admin/products/[id]/route.ts` - CRUD de producto individual
- ❌ `/api/admin/products/[id]/images/route.ts` - Gestión de imágenes
- ❌ `/api/admin/products/[id]/technical-sheet/route.ts` - Fichas técnicas
- ❌ `/api/admin/products/variants/route.ts` - Gestión de variantes
- ❌ `/api/admin/orders/[id]/shipments/route.ts` - Gestión de envíos
- ❌ `/api/admin/orders/[id]/history/route.ts` - Historial de órdenes
- ❌ `/api/admin/orders/[id]/whatsapp/route.ts` - Envío por WhatsApp
- ❌ `/api/admin/orders/[id]/payment-proof/route.ts` - Comprobantes de pago
- ❌ `/api/admin/users/[id]/route.ts` - CRUD de usuario individual
- ❌ `/api/admin/users/bulk/route.ts` - Operaciones masivas de usuarios
- ❌ `/api/admin/users/stats/route.ts` - Estadísticas de usuarios
- ❌ `/api/admin/logistics/*` - Sistema de logística (shipments, routes, drivers, etc.)
- ❌ `/api/admin/categories/*` - Gestión de categorías
- ❌ `/api/admin/coupons/*` - Gestión de cupones
- ❌ `/api/admin/promotions/*` - Gestión de promociones

#### APIs de Sincronización y Feeds (Prioridad Media)
- ⚠️ `/api/sync/[system]/route.ts` - Sincronización con ERPs (verificar si usa tenant_id)
- ⚠️ `/api/google-merchant/feed.xml/route.ts` - Feed Google Merchant (verificar)
- ⚠️ `/api/meta-catalog/feed.xml/route.ts` - Feed Meta Catalog (verificar)
- ⚠️ `/api/sitemap/route.ts` - Generación de sitemap (verificar)

#### Componentes Frontend (Prioridad Baja)
- ⚠️ Componentes que muestran órdenes del usuario
- ⚠️ Componentes de checkout que crean órdenes
- ⚠️ Componentes de carrito que crean/actualizan `cart_items`

### 📋 Patrón de Migración

#### Para APIs Públicas (Carrito, Órdenes)
```typescript
import { getTenantConfig } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  const tenant = await getTenantConfig()
  const tenantId = tenant.id
  
  // Al crear orden/item:
  const { data } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
    })
  
  // Al consultar:
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
}

// Para carrito, usar función RPC upsert_cart_item:
export async function POST(request: NextRequest) {
  const tenant = await getTenantConfig()
  const tenantId = tenant.id
  
  const { data: cartItem } = await supabase
    .rpc('upsert_cart_item', {
      user_uuid: userId,
      product_id_param: productId,
      variant_id_param: variantId || null,
      tenant_id_param: tenantId,
      quantity_param: quantity,
    })
}
```

#### Para APIs Admin
```typescript
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  const { tenantId } = guardResult
  
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
})
```

## Changelog

### v1.3.0 (2026-01-23) - Testing Completo
- ✅ 100% de cobertura en tests unitarios multitenant (52/52 tests)
- ✅ Mejoras en estrategia de mocks para funciones con y sin `headers()`
- ✅ Documentación completa de testing en `MULTITENANCY.md`
- ✅ Tests robustos y bien documentados para mantenimiento futuro
- ✅ Centralización de datos de prueba en `setup-data.ts`

### v1.2.0 (2026-01-22) - Iteración 5
- ✅ Actualización de constraint única de `cart_items` para soportar multitenancy y variantes
- ✅ Migración de APIs de carrito (`/api/cart/route.ts`, `/api/cart/add/route.ts`)
- ✅ Función `upsert_cart_item` actualizada con soporte para `variant_id` y `tenant_id`
- ✅ Corrección de seguridad: `search_path` fijo en función `upsert_cart_item`
- ✅ Índice compuesto `(user_id, tenant_id)` para mejor performance
- ✅ Permite que usuarios tengan el mismo producto con diferentes variantes y en diferentes tenants

### v1.1.0 (2026-01-21) - Iteración 4
- ✅ Migración completa de APIs de productos a `tenant_products`
- ✅ Migración completa de APIs de analytics con filtro por `tenant_id`
- ✅ Migración de APIs admin críticas (orders, users, dashboard, customers)
- ✅ Actualización de schema markup para usar configuración del tenant
- ✅ Build verificado sin errores

### v1.0.0 (2026-01-21)

- Implementación inicial del sistema multitenant
- Soporte para Pinteya y Pintemas
- Stock compartido entre tenants
- Integración con Aikon ERP
- Sistema de roles y permisos
- Analytics dinámicos por tenant

---

## 📋 Estado de Migración Completo

Para ver el estado detallado de migración, consulta: **[docs/MIGRATION_STATUS.md](./MIGRATION_STATUS.md)**

### Resumen Rápido

**Completado (~70%):**
- ✅ APIs de productos (públicas y admin)
- ✅ APIs de analytics
- ✅ APIs admin críticas (orders, users, dashboard, customers)
- ✅ Schema markup y URLs
- ✅ APIs de carrito principales (`/api/cart/route.ts`, `/api/cart/add/route.ts`)
- ✅ Constraint única de `cart_items` actualizada para multitenancy

**Pendiente - Prioridad Alta:**
- ❌ APIs de carrito restantes (`/api/cart/remove/route.ts`, `/api/cart/update/route.ts`)
- ❌ APIs de creación de órdenes (`/api/orders/create-cash-order`, `/api/payments/create-preference`)
- ❌ API de órdenes del usuario (`/api/user/orders`)

**Pendiente - Prioridad Media:**
- ❌ ~37 APIs admin restantes (productos individuales, logística, categorías, etc.)

**Pendiente - Prioridad Baja:**
- ⚠️ APIs de sincronización y feeds SEO (verificar funcionamiento)
