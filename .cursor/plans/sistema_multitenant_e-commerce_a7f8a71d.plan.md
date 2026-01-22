---
name: PintureríaDigital - Plataforma Multitenant
overview: Transformar Pinteya E-commerce en PintureríaDigital, una plataforma multitenant que aloja múltiples tiendas de pinturería compartiendo catálogo pero con branding, analytics, pagos y administración independientes. Incluye sistema de roles híbrido (Super Admin + Tenant Admins) y soporte para subdominios wildcard + dominios custom.
todos:
  - id: rebranding-infra
    content: "FASE 0: Renombrar proyecto en Supabase y Vercel a 'pintureria-digital', configurar dominio pintureriadigital.com"
    status: completed
  - id: db-tenants
    content: "FASE 1: Crear migración SQL para tabla tenants con todos los campos (branding, analytics, pagos, WhatsApp, SEO)"
    status: completed
  - id: db-tenant-products
    content: "FASE 1: Crear tabla tenant_products para precios/stock/visibilidad por tenant"
    status: completed
  - id: db-shared-stock-pools
    content: "FASE 1: Crear tablas shared_stock_pools y shared_pool_stock para stock compartido (Pinteya+Pintemas)"
    status: completed
  - id: db-external-systems
    content: "FASE 1: Crear tablas external_systems, tenant_external_systems y tenant_product_external_ids para integración ERP"
    status: completed
  - id: db-tenant-id-columns
    content: "FASE 1: Agregar columna tenant_id a tablas orders, analytics_events, user_profiles, cart_items"
    status: completed
  - id: db-tenant-roles
    content: "FASE 1: Crear tablas tenant_user_roles y super_admins para sistema de permisos híbrido"
    status: completed
  - id: db-rls-policies
    content: "FASE 1: Crear RLS policies para aislamiento de datos por tenant"
    status: completed
  - id: tenant-service
    content: "FASE 2: Implementar TenantService (detección por dominio/subdomain, cache, fallback)"
    status: completed
  - id: tenant-context
    content: "FASE 2: Crear TenantContext y TenantProvider para cliente"
    status: completed
  - id: middleware-tenant
    content: "FASE 2: Modificar middleware.ts para detectar tenant por host header (wildcard + custom domains)"
    status: completed
  - id: theme-system
    content: "FASE 3: Implementar TenantThemeStyles con CSS variables dinámicas por tenant"
    status: completed
  - id: tailwind-vars
    content: "FASE 3: Actualizar tailwind.config.ts para usar CSS variables del tenant"
    status: completed
  - id: assets-structure
    content: "FASE 3: Crear estructura public/tenants/[slug]/ y mover assets de Pinteya"
    status: completed
  - id: refactor-header
    content: "FASE 4: Refactorizar Header para logo/colores dinámicos del tenant"
    status: completed
  - id: refactor-footer
    content: "FASE 4: Refactorizar Footer para nombre/WhatsApp/redes del tenant"
    status: completed
  - id: refactor-hero
    content: "FASE 4: Refactorizar Hero/HeroCarousel para imágenes del tenant"
    status: completed
  - id: refactor-logo
    content: "FASE 4: Refactorizar OptimizedLogo para usar assets del tenant"
    status: completed
  - id: analytics-tenant
    content: "FASE 5: Crear TenantAnalytics component unificado (GA4 + Meta Pixel dinámicos)"
    status: completed
  - id: analytics-apis
    content: "FASE 5: Modificar meta-marketing-api.ts y google-analytics-api.ts para config del tenant"
    status: completed
  - id: feeds-tenant
    content: "FASE 6: Crear feeds dinámicos /api/feeds/[tenant]/google-merchant.xml y meta-catalog.xml"
    status: completed
  - id: metadata-dynamic
    content: "FASE 7: Implementar generateMetadata dinámico por tenant en layout.tsx"
    status: completed
  - id: structured-data
    content: "FASE 7: Refactorizar structured-data.ts para datos dinámicos del tenant"
    status: completed
  - id: super-admin-guards
    content: "FASE 8: Crear guards de autenticación (SuperAdminGuard, TenantAdminGuard)"
    status: completed
  - id: super-admin-layout
    content: "FASE 8: Crear layout y rutas de super-admin/"
    status: completed
  - id: super-admin-tenants
    content: "FASE 8: Crear CRUD de tenants en super-admin/tenants/"
    status: completed
  - id: tenant-admin-permissions
    content: "FASE 8: Modificar admin/ existente para verificar permisos por tenant"
    status: completed
  - id: orders-tenant
    content: "FASE 9: Modificar creación de órdenes para incluir tenant_id"
    status: completed
  - id: mercadopago-tenant
    content: "FASE 9: Configurar MercadoPago dinámico por tenant (credenciales de tabla)"
    status: completed
  - id: whatsapp-tenant
    content: "FASE 9B: Modificar WhatsApp service para usar número del tenant"
    status: completed
  - id: product-service-tenant
    content: "FASE 9C: Crear TenantProductService para obtener productos con stock/precio del tenant"
    status: completed
  - id: erp-sync-api
    content: "FASE 9D: Crear API /api/sync/[system] para sincronización de ERPs (Aikon, SAP, etc.)"
    status: completed
  - id: migrate-aikon-ids
    content: "FASE 10: Migrar códigos aikon_id existentes a tenant_product_external_ids"
    status: completed
  - id: migrate-env-vars
    content: "FASE 10: Migrar variables de .env a tabla tenants (700+ referencias)"
    status: completed
  - id: seed-pinteya
    content: "FASE 11: Crear seed de tenant Pinteya con configuración actual"
    status: completed
  - id: migrate-data
    content: "FASE 11: Migrar órdenes/analytics/usuarios existentes con tenant_id de Pinteya"
    status: completed
  - id: move-assets
    content: "FASE 11: Mover assets a public/tenants/pinteya/"
    status: completed
  - id: vercel-config
    content: "FASE 12: Crear vercel.json y configurar proyecto pintureria-digital"
    status: completed
  - id: vercel-domains
    content: "FASE 12: Configurar wildcard *.pintureriadigital.com y dominios custom"
    status: completed
  - id: create-pintemas
    content: "FASE 13: Crear segundo tenant 'Pintemas' con su configuración"
    status: completed
  - id: update-cart-constraint
    content: "FASE 14: Actualizar constraint única de cart_items para multitenancy y variantes (UNIQUE(user_id, product_id, variant_id, tenant_id))"
    status: completed
  - id: migrate-cart-apis
    content: "FASE 14: Migrar APIs de carrito para usar nueva constraint y función upsert_cart_item"
    status: completed
  - id: fix-cart-security
    content: "FASE 14: Corregir search_path en función upsert_cart_item para seguridad"
    status: completed
  - id: migrate-cart-update-remove
    content: "ITERACIÓN 6: Migrar APIs /api/cart/update y /api/cart/remove para soportar variant_id y filtrado por tenant_id"
    status: completed
  - id: migrate-orders-api
    content: "ITERACIÓN 6: Migrar API /api/orders/[id] para filtrar por tenant_id y prevenir acceso a órdenes de otros tenants"
    status: completed
  - id: migrate-webhook-tenant
    content: "ITERACIÓN 6: Actualizar webhook de pagos para validar tenant_id al procesar notificaciones de MercadoPago"
    status: completed
  - id: migrate-orders-simple
    content: "ITERACIÓN 7: Migrar /api/admin/orders-simple para filtrar por tenant_id (CRÍTICO - seguridad)"
    status: pending
  - id: verify-orders-analytics
    content: "ITERACIÓN 7: Verificar y completar /api/admin/orders/analytics para filtrar todas las queries por tenant_id"
    status: pending
  - id: verify-orders-detail
    content: "ITERACIÓN 7: Verificar /api/admin/orders/[id] y todas sus operaciones relacionadas filtran por tenant_id"
    status: pending
  - id: migrate-analytics-apis
    content: "ITERACIÓN 7: Migrar APIs de analytics (/api/admin/analytics, /api/analytics/metrics) para filtrar por tenant_id"
    status: pending
  - id: verify-users-admin
    content: "ITERACIÓN 7: Verificar APIs de usuarios admin filtran por tenant_id en user_profiles"
    status: pending
---

# Plan de Implementación: PintureríaDigital - Plataforma Multitenant

## Resumen Ejecutivo

Transformar el proyecto actual "Pinteya E-commerce" en **PintureríaDigital**, una plataforma multitenant que permite alojar múltiples tiendas de pinturería (Pinteya, Pintemas, etc.) compartiendo el catálogo de productos pero con branding, analytics, pagos y configuraciones independientes.

### Cambios de Infraestructura

| Elemento | Actual | Nuevo |

|----------|--------|-------|

| Nombre proyecto | Pinteya E-commerce | PintureríaDigital |

| Proyecto Vercel | pinteya-ecommerce | pintureria-digital |

| Proyecto Supabase | Renombrar | pintureria-digital |

| Dominio plataforma | - | pintureriadigital.com |

| Admin central | /admin | admin.pintureriadigital.com |

### Estrategia de Dominios

```
SUBDOMINIOS (incluidos por defecto):
├── pinteya.pintureriadigital.com
├── pintemas.pintureriadigital.com
└── [tenant].pintureriadigital.com

DOMINIOS PROPIOS (opcionales):
├── www.pinteya.com → alias
├── www.pintemas.com → alias
└── www.[custom].com → alias configurable

ADMIN CENTRAL:
└── admin.pintureriadigital.com
```

---

## Arquitectura General

```mermaid
flowchart TB
    subgraph Domains[Dominios]
        D1[www.pinteya.com]
        D2[www.pintemas.com]
        D3[tienda-n.com]
    end
    
    subgraph Middleware[Middleware de Detección]
        MW[TenantMiddleware]
    end
    
    subgraph TenantContext[Contexto del Tenant]
        TC[TenantProvider]
        TH[useTenant Hook]
    end
    
    subgraph SharedData[Datos Compartidos]
        Products[(products)]
        Categories[(categories)]
        Brands[(brands)]
        Variants[(product_variants)]
    end
    
    subgraph TenantData[Datos por Tenant]
        Tenants[(tenants)]
        Orders[(orders + tenant_id)]
        Analytics[(analytics + tenant_id)]
        Users[(users + tenant_id)]
        TenantProducts[(tenant_product_config)]
    end
    
    subgraph Theming[Sistema de Temas]
        CSS[CSS Variables Dinámicas]
        Assets[Assets por Tenant]
        Meta[Metadata Dinámica]
    end
    
    D1 --> MW
    D2 --> MW
    D3 --> MW
    MW --> TC
    TC --> TH
    TH --> SharedData
    TH --> TenantData
    TH --> Theming
```

---

## FASE 1: Infraestructura de Base de Datos

### 1.1 Crear Tabla Principal de Tenants

Archivo: `supabase/migrations/YYYYMMDD_create_tenants_system.sql`

```sql
-- Tabla principal de configuración por tenant
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  
  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Paleta de colores (CSS variables)
  primary_color VARCHAR(7) DEFAULT '#f27a1d',
  primary_dark VARCHAR(7) DEFAULT '#bd4811',
  primary_light VARCHAR(7) DEFAULT '#f9be78',
  secondary_color VARCHAR(7) DEFAULT '#00f269',
  accent_color VARCHAR(7) DEFAULT '#f9a007',
  background_gradient_start VARCHAR(7) DEFAULT '#000000',
  background_gradient_end VARCHAR(7) DEFAULT '#eb6313',
  header_bg_color VARCHAR(7) DEFAULT '#bd4811',
  
  -- Configuración de tema extendida
  theme_config JSONB DEFAULT '{
    "borderRadius": "0.5rem",
    "fontFamily": "Plus Jakarta Sans"
  }',
  
  -- Google Analytics
  ga4_measurement_id VARCHAR(50),
  ga4_property_id VARCHAR(50),
  google_credentials_json TEXT,
  google_merchant_id VARCHAR(50),
  google_site_verification VARCHAR(100),
  
  -- Meta/Facebook
  meta_pixel_id VARCHAR(50),
  meta_access_token TEXT,
  meta_ad_account_id VARCHAR(50),
  meta_catalog_id VARCHAR(50),
  
  -- MercadoPago
  mercadopago_access_token TEXT,
  mercadopago_public_key VARCHAR(255),
  mercadopago_webhook_secret TEXT,
  
  -- Email (Resend)
  resend_api_key TEXT,
  from_email VARCHAR(255),
  support_email VARCHAR(255),
  
  -- WhatsApp
  whatsapp_number VARCHAR(20),
  whatsapp_message_template TEXT,
  
  -- SEO y Metadata
  site_title VARCHAR(255),
  site_description TEXT,
  site_keywords TEXT[],
  og_image_url TEXT,
  
  -- Configuración regional
  currency VARCHAR(3) DEFAULT 'ARS',
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  locale VARCHAR(10) DEFAULT 'es_AR',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active);
```

### 1.2 Sistema de Productos con Stock Compartido/Independiente

El sistema soporta dos modos:

- **Stock compartido**: Pinteya + Pintemas comparten el mismo depósito (mismo stock, mismo precio)
- **Stock independiente**: Cada tenant tiene su propio inventario y precios
```sql
-- Pools de stock compartido (para casos como Pinteya+Pintemas)
CREATE TABLE shared_stock_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,           -- "Pool Córdoba Central"
  code VARCHAR(20) UNIQUE NOT NULL,     -- "POOL-CBA"
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock del pool compartido
CREATE TABLE shared_pool_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES shared_stock_pools(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  
  stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,     -- Reservado en carritos/órdenes pendientes
  
  last_sync_at TIMESTAMPTZ,
  
  UNIQUE(pool_id, product_id)
);

-- Configuración de producto por tenant
CREATE TABLE tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  
  -- ¿Usa pool compartido o stock propio?
  shared_pool_id UUID REFERENCES shared_stock_pools(id) NULL,
  -- Si NULL → usa stock propio | Si tiene valor → comparte stock con el pool
  
  -- Stock propio (usado solo si shared_pool_id es NULL)
  stock INTEGER DEFAULT 0,
  
  -- Precio (SIEMPRE propio por tenant, aunque comparta stock)
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  
  -- Visibilidad
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_id)
);

CREATE INDEX idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX idx_tenant_products_pool ON tenant_products(shared_pool_id);
CREATE INDEX idx_tenant_products_visible ON tenant_products(tenant_id, is_visible);
CREATE INDEX idx_shared_pool_stock_pool ON shared_pool_stock(pool_id);
```


**Ejemplo de uso:**

```sql
-- 1. Crear pool compartido para Córdoba
INSERT INTO shared_stock_pools (name, code, city) 
VALUES ('Pool Córdoba Central', 'POOL-CBA', 'Córdoba');

-- 2. Pinteya y Pintemas comparten el pool
INSERT INTO tenant_products (tenant_id, product_id, price, shared_pool_id)
VALUES 
  ('pinteya-uuid', 123, 15000, 'pool-cba-uuid'),
  ('pintemas-uuid', 123, 15000, 'pool-cba-uuid');

-- 3. TenantX tiene stock independiente
INSERT INTO tenant_products (tenant_id, product_id, price, stock, shared_pool_id)
VALUES ('tenantx-uuid', 123, 17000, 45, NULL);
```

### 1.3 Sistema de Integración con ERPs Externos (Aikon, SAP, etc.)

Permite que cada tenant tenga su propio sistema ERP con códigos de producto diferentes.

```sql
-- Sistemas ERP disponibles en la plataforma
CREATE TABLE external_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,     -- "AIKON", "SAP", "TANGO", "MANUAL"
  name VARCHAR(100) NOT NULL,           -- "Aikon ERP", "SAP Business One"
  
  -- Configuración de la integración
  api_base_url TEXT,
  sync_frequency_minutes INTEGER DEFAULT 60,
  supports_stock_sync BOOLEAN DEFAULT false,
  supports_price_sync BOOLEAN DEFAULT false,
  supports_order_push BOOLEAN DEFAULT false,
  
  -- Mapeo de campos
  field_mappings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instancias de sistemas por tenant
CREATE TABLE tenant_external_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  external_system_id UUID REFERENCES external_systems(id),
  
  -- Identificador de la instancia
  instance_id VARCHAR(100),             -- "AIKON_CORDOBA", "SAP_TENANTX"
  
  -- Credenciales (encriptadas)
  api_credentials JSONB DEFAULT '{}',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, external_system_id, instance_id)
);

-- Códigos externos de productos por tenant
CREATE TABLE tenant_product_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  external_system_id UUID REFERENCES external_systems(id),
  
  -- Código en el sistema externo
  external_code VARCHAR(100) NOT NULL,  -- "50001" (Aikon), "MAT-123" (SAP)
  
  -- Metadatos del ERP
  external_metadata JSONB DEFAULT '{}',
  
  -- Sincronización
  last_synced_at TIMESTAMPTZ,
  sync_hash VARCHAR(64),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_id, external_system_id)
);

-- Índices
CREATE INDEX idx_tpei_tenant ON tenant_product_external_ids(tenant_id);
CREATE INDEX idx_tpei_external_code ON tenant_product_external_ids(external_code);
CREATE INDEX idx_tes_tenant ON tenant_external_systems(tenant_id);
```

**Ejemplos de configuración:**

```sql
-- Sistemas disponibles
INSERT INTO external_systems (code, name, supports_stock_sync, supports_price_sync) VALUES
  ('AIKON', 'Aikon ERP', true, true),
  ('SAP_B1', 'SAP Business One', true, true),
  ('TANGO', 'Tango Gestión', true, true),
  ('MANUAL', 'Gestión Manual', false, false);

-- Pinteya y Pintemas usan la MISMA instancia de Aikon
INSERT INTO tenant_external_systems (tenant_id, external_system_id, instance_id) VALUES
  ('pinteya-uuid', 'aikon-uuid', 'AIKON_CORDOBA'),
  ('pintemas-uuid', 'aikon-uuid', 'AIKON_CORDOBA');  -- Misma instancia!

-- Códigos Aikon (idénticos porque comparten ERP)
INSERT INTO tenant_product_external_ids (tenant_id, product_id, external_system_id, external_code) VALUES
  ('pinteya-uuid', 123, 'aikon-uuid', '50001'),
  ('pintemas-uuid', 123, 'aikon-uuid', '50001');  -- Mismo código!

-- TenantX usa SAP con sus propios códigos
INSERT INTO tenant_external_systems (tenant_id, external_system_id, instance_id) VALUES
  ('tenantx-uuid', 'sap-uuid', 'SAP_TENANTX');

INSERT INTO tenant_product_external_ids (tenant_id, product_id, external_system_id, external_code) VALUES
  ('tenantx-uuid', 123, 'sap-uuid', 'MAT-00123');

-- TenantY sin ERP (gestión manual)
INSERT INTO tenant_external_systems (tenant_id, external_system_id, instance_id) VALUES
  ('tenanty-uuid', 'manual-uuid', 'MANUAL');
```

**Tabla resumen de escenarios:**

| Tenant | ERP | Instancia | Código Prod 123 | Stock | Precio |

|--------|-----|-----------|-----------------|-------|--------|

| Pinteya | Aikon | AIKON_CORDOBA | 50001 | Pool compartido (150) | $15.000 |

| Pintemas | Aikon | AIKON_CORDOBA | 50001 | Pool compartido (150) | $15.000 |

| TenantX | SAP | SAP_TENANTX | MAT-00123 | Propio (45) | $17.000 |

| TenantY | Manual | - | - | Propio (120) | $14.000 |

### 1.4 Agregar tenant_id a Tablas Existentes

```sql
-- Orders
ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);

-- Analytics
ALTER TABLE analytics_events_optimized ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_analytics_tenant ON analytics_events_optimized(tenant_id);

-- User profiles
ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_users_tenant ON user_profiles(tenant_id);

-- Cart
ALTER TABLE cart_items ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_cart_tenant ON cart_items(tenant_id);
```

### 1.5 RLS Policies para Aislamiento de Datos

```sql
-- Policy para orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders isolated by tenant" ON orders
FOR ALL USING (
  tenant_id = (current_setting('app.current_tenant_id', true))::uuid
  OR current_setting('app.current_tenant_id', true) IS NULL
);

-- Similar para otras tablas con tenant_id
```

### 1.6 Seed del Tenant Inicial (Pinteya)

```sql
INSERT INTO tenants (
  slug, name, domain,
  logo_url, logo_dark_url, favicon_url,
  primary_color, primary_dark, header_bg_color,
  ga4_measurement_id, meta_pixel_id,
  site_title, site_description,
  whatsapp_number
) VALUES (
  'pinteya',
  'Pinteya',
  'www.pinteya.com',
  '/images/logo/LOGO POSITIVO.svg',
  '/images/logo/LOGO NEGATIVO.svg',
  '/favicon.svg',
  '#f27a1d', '#bd4811', '#bd4811',
  -- Copiar valores actuales de .env
  NULL, NULL,
  'Pinteya - Tu Pinturería Online',
  'Pinturería online especializada en productos de pintura...',
  '5493516323002'
);
```

---

## FASE 2: Sistema de Detección y Contexto de Tenant

### 2.1 Middleware de Detección de Tenant

Modificar `middleware.ts` para detectar el tenant basado en el dominio:

```typescript
// middleware.ts - Agregar detección de tenant
export default async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const domain = host.split(':')[0] // Remover puerto
  
  // Agregar dominio como header para uso posterior
  const response = NextResponse.next()
  response.headers.set('x-tenant-domain', domain)
  
  // ... resto del middleware existente
}
```

### 2.2 Servicio de Tenant (Server-Side)

Crear `src/lib/tenant/tenant-service.ts`:

```typescript
import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface TenantConfig {
  id: string
  slug: string
  name: string
  domain: string
  
  // Branding
  logoUrl: string
  logoDarkUrl: string
  faviconUrl: string
  
  // Colores
  primaryColor: string
  primaryDark: string
  primaryLight: string
  secondaryColor: string
  accentColor: string
  backgroundGradientStart: string
  backgroundGradientEnd: string
  headerBgColor: string
  
  // Analytics
  ga4MeasurementId: string | null
  metaPixelId: string | null
  googleMerchantId: string | null
  
  // SEO
  siteTitle: string
  siteDescription: string
  siteKeywords: string[]
  ogImageUrl: string | null
  
  // WhatsApp
  whatsappNumber: string | null
}

// Cache por request (React cache)
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  const headersList = headers()
  const domain = headersList.get('x-tenant-domain') 
    || headersList.get('host')?.split(':')[0] 
    || 'www.pinteya.com'
  
  const supabase = createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('domain', domain)
    .eq('is_active', true)
    .single()
  
  if (!tenant) {
    // Fallback a Pinteya
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', 'pinteya')
      .single()
    
    return mapTenantToConfig(defaultTenant!)
  }
  
  return mapTenantToConfig(tenant)
})
```

### 2.3 Provider de Tenant (Client-Side)

Crear `src/contexts/TenantContext.tsx`:

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { TenantConfig } from '@/lib/tenant/tenant-service'

const TenantContext = createContext<TenantConfig | null>(null)

export function TenantProvider({ 
  tenant, 
  children 
}: { 
  tenant: TenantConfig
  children: ReactNode 
}) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantConfig {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
```

### 2.4 Integrar en Layout Principal

Modificar `src/app/layout.tsx`:

```typescript
import { getTenantConfig } from '@/lib/tenant/tenant-service'
import { TenantProvider } from '@/contexts/TenantContext'
import { TenantThemeStyles } from '@/components/theme/TenantThemeStyles'

export default async function RootLayout({ children }) {
  const tenant = await getTenantConfig()
  
  return (
    <html lang="es">
      <head>
        <TenantThemeStyles tenant={tenant} />
        {/* Metadata dinámico por tenant */}
      </head>
      <body>
        <TenantProvider tenant={tenant}>
          <Providers>{children}</Providers>
        </TenantProvider>
      </body>
    </html>
  )
}
```

---

## FASE 3: Sistema de Theming Dinámico

### 3.1 Componente de CSS Variables Dinámicas

Crear `src/components/theme/TenantThemeStyles.tsx`:

```typescript
import { TenantConfig } from '@/lib/tenant/tenant-service'

export function TenantThemeStyles({ tenant }: { tenant: TenantConfig }) {
  const cssVariables = `
    :root {
      /* Colores del tenant */
      --tenant-primary: ${tenant.primaryColor};
      --tenant-primary-dark: ${tenant.primaryDark};
      --tenant-primary-light: ${tenant.primaryLight};
      --tenant-secondary: ${tenant.secondaryColor};
      --tenant-accent: ${tenant.accentColor};
      --tenant-header-bg: ${tenant.headerBgColor};
      --tenant-gradient-start: ${tenant.backgroundGradientStart};
      --tenant-gradient-end: ${tenant.backgroundGradientEnd};
      
      /* Mapeo a variables existentes de Tailwind */
      --blaze-orange-500: ${tenant.primaryColor};
      --blaze-orange-600: ${tenant.primaryDark};
      --blaze-orange-700: ${tenant.primaryDark};
    }
    
    body {
      background: linear-gradient(
        to bottom,
        ${tenant.backgroundGradientStart} 0%,
        ${tenant.backgroundGradientStart} 60%,
        ${tenant.backgroundGradientEnd} 100%
      );
    }
    
    header {
      background-color: ${tenant.headerBgColor};
    }
    
    .btn-primary {
      background: ${tenant.primaryColor};
      border-color: ${tenant.primaryDark};
    }
    .btn-primary:hover {
      background: ${tenant.primaryDark};
    }
  `
  
  return (
    <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
  )
}
```

### 3.2 Modificar Tailwind para Variables CSS

Actualizar `tailwind.config.ts` para usar variables CSS del tenant:

```typescript
colors: {
  'blaze-orange': {
    '500': 'var(--tenant-primary, #f27a1d)',
    '600': 'var(--tenant-primary-dark, #eb6313)',
    '700': 'var(--tenant-primary-dark, #bd4811)',
    // ...
  },
  primary: {
    DEFAULT: 'var(--tenant-primary, #f27a1d)',
    dark: 'var(--tenant-primary-dark, #bd4811)',
    // ...
  }
}
```

### 3.3 Estructura de Assets por Tenant

```
public/
├── tenants/
│   ├── pinteya/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── favicon.svg
│   │   ├── hero/
│   │   │   ├── hero1.webp
│   │   │   ├── hero2.webp
│   │   │   └── promo-banner.webp
│   │   └── og-image.png
│   │
│   ├── pintemas/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── favicon.svg
│   │   ├── hero/
│   │   │   ├── hero1.webp
│   │   │   └── promo-banner.webp
│   │   └── og-image.png
│   │
│   └── [tenant-slug]/
│       └── ...
```

### 3.4 Hook para Assets del Tenant

Crear `src/hooks/useTenantAssets.ts`:

```typescript
import { useTenant } from '@/contexts/TenantContext'

export function useTenantAssets() {
  const tenant = useTenant()
  
  return {
    logo: tenant.logoUrl || `/tenants/${tenant.slug}/logo.svg`,
    logoDark: tenant.logoDarkUrl || `/tenants/${tenant.slug}/logo-dark.svg`,
    favicon: tenant.faviconUrl || `/tenants/${tenant.slug}/favicon.svg`,
    heroImages: (index: number) => 
      `/tenants/${tenant.slug}/hero/hero${index}.webp`,
    ogImage: tenant.ogImageUrl || `/tenants/${tenant.slug}/og-image.png`,
  }
}
```

---

## FASE 4: Refactorizar Componentes para Multitenancy

### 4.1 Componentes a Modificar

| Componente | Cambios Necesarios |

|------------|-------------------|

| `Header/index.tsx` | Logo dinámico, colores del tema |

| `layout/Footer.tsx` | Nombre tienda, WhatsApp, links |

| `Home/Hero/*` | Imágenes hero del tenant |

| `SEO/StructuredData.tsx` | Datos de organización dinámicos |

| `Analytics/MetaPixel.tsx` | Pixel ID del tenant |

| `Analytics/GoogleAnalytics.tsx` | GA4 ID del tenant |

| `Common/WhatsAppPopup.tsx` | Número WhatsApp del tenant |

| `ui/OptimizedLogo.tsx` | Logo del tenant |

### 4.2 Ejemplo: Header con Tenant

```typescript
// Header/index.tsx
import { useTenant } from '@/contexts/TenantContext'
import { useTenantAssets } from '@/hooks/useTenantAssets'

const Header = () => {
  const tenant = useTenant()
  const assets = useTenantAssets()
  
  return (
    <header style={{ backgroundColor: tenant.headerBgColor }}>
      <Link href="/">
        <Image 
          src={assets.logo} 
          alt={tenant.name}
          // ...
        />
      </Link>
      {/* ... */}
    </header>
  )
}
```

### 4.3 Ejemplo: Footer con Tenant

```typescript
// layout/Footer.tsx
import { useTenant } from '@/contexts/TenantContext'

const Footer = () => {
  const tenant = useTenant()
  
  return (
    <footer>
      <p>&copy; {new Date().getFullYear()} {tenant.name}</p>
      {tenant.whatsappNumber && (
        <a href={`https://wa.me/${tenant.whatsappNumber}`}>
          WhatsApp
        </a>
      )}
    </footer>
  )
}
```

---

## FASE 5: Analytics Multitenant

### 5.1 Componente de Analytics Dinámico

Modificar `src/components/Analytics/TenantAnalytics.tsx`:

```typescript
'use client'

import Script from 'next/script'
import { useTenant } from '@/contexts/TenantContext'

export function TenantAnalytics() {
  const tenant = useTenant()
  
  return (
    <>
      {/* Google Analytics 4 */}
      {tenant.ga4MeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tenant.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tenant.ga4MeasurementId}', {
                send_page_view: true,
                custom_map: { 'dimension1': 'tenant_id' }
              });
              gtag('set', 'user_properties', { tenant_id: '${tenant.id}' });
            `}
          </Script>
        </>
      )}
      
      {/* Meta Pixel */}
      {tenant.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${tenant.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
```

### 5.2 Modificar APIs de Analytics Externas

Actualizar `src/lib/integrations/meta-marketing-api.ts`:

```typescript
import { getTenantConfig } from '@/lib/tenant/tenant-service'

async function getMetaConfig() {
  const tenant = await getTenantConfig()
  
  if (!tenant.metaAccessToken) {
    throw new Error(`META_ACCESS_TOKEN no configurado para ${tenant.slug}`)
  }
  
  return {
    accessToken: tenant.metaAccessToken,
    pixelId: tenant.metaPixelId,
    adAccountId: tenant.metaAdAccountId,
    tenantId: tenant.id,
  }
}
```

### 5.3 Guardar Analytics con tenant_id

Modificar los endpoints de analytics para incluir tenant_id:

```typescript
// api/analytics/events/optimized/route.ts
const tenant = await getTenantConfig()

await supabase.from('analytics_events_optimized').insert({
  ...eventData,
  tenant_id: tenant.id,
})
```

---

## FASE 6: Feeds de Google Merchant y Meta por Tenant

### 6.1 Feed de Google Merchant Dinámico

Crear `src/app/api/[tenantSlug]/google-merchant/feed.xml/route.ts`:

```typescript
import { getTenantBySlug } from '@/lib/tenant/tenant-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const tenant = await getTenantBySlug(params.tenantSlug)
  
  if (!tenant) {
    return new NextResponse('Tenant not found', { status: 404 })
  }
  
  const products = await getProductsForTenant(tenant.id)
  const baseUrl = `https://${tenant.domain}`
  
  const xml = generateGoogleMerchantFeed(products, baseUrl, tenant)
  
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

### 6.2 Feed de Meta Catalog por Tenant

Similar estructura para `src/app/api/[tenantSlug]/meta-catalog/feed.xml/route.ts`

---

## FASE 7: Metadata y SEO Dinámico

### 7.1 Metadata Dinámico en Layout

```typescript
// src/app/layout.tsx
import { getTenantConfig } from '@/lib/tenant/tenant-service'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig()
  
  return {
    title: {
      default: tenant.siteTitle,
      template: `%s | ${tenant.name}`,
    },
    description: tenant.siteDescription,
    keywords: tenant.siteKeywords,
    openGraph: {
      title: tenant.siteTitle,
      description: tenant.siteDescription,
      url: `https://${tenant.domain}`,
      siteName: tenant.name,
      images: [{ url: tenant.ogImageUrl }],
    },
    // ...
  }
}
```

### 7.2 Structured Data Dinámico

Modificar `src/lib/structured-data.ts`:

```typescript
export function getOrganizationStructuredData(tenant: TenantConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.name,
    url: `https://${tenant.domain}`,
    logo: `https://${tenant.domain}${tenant.logoUrl}`,
    // ...
  }
}
```

---

## FASE 8: Panel de Super Admin

### 8.1 Estructura de Rutas

```
src/app/super-admin/
├── layout.tsx          # Layout con auth de super admin
├── page.tsx            # Dashboard
├── tenants/
│   ├── page.tsx        # Lista de tenants
│   ├── new/
│   │   └── page.tsx    # Crear tenant
│   └── [id]/
│       ├── page.tsx    # Detalle
│       ├── branding/
│       │   └── page.tsx
│       ├── analytics/
│       │   └── page.tsx
│       ├── payments/
│       │   └── page.tsx
│       └── products/
│           └── page.tsx # Config de productos
```

### 8.2 Formulario de Configuración de Tenant

Componentes necesarios:

- `TenantBrandingForm`: Logo, colores, favicon
- `TenantAnalyticsForm`: GA4, Meta Pixel
- `TenantPaymentsForm`: MercadoPago config
- `TenantProductsConfig`: Visibilidad y precios

---

## FASE 9: Órdenes y Checkout Multitenant

### 9.1 Modificar Creación de Órdenes

```typescript
// api/orders/create-cash-order/route.ts
const tenant = await getTenantConfig()

const order = await supabase.from('orders').insert({
  ...orderData,
  tenant_id: tenant.id,
})
```

### 9.2 MercadoPago por Tenant

```typescript
// Obtener credenciales del tenant
const tenant = await getTenantConfig()

const mercadopago = new MercadoPagoConfig({
  accessToken: tenant.mercadopagoAccessToken,
})
```

---

## FASE 10: Migración y Deploy

### 10.1 Pasos de Migración

1. Ejecutar migraciones de DB en orden
2. Crear tenant "pinteya" con config actual
3. Mover imágenes a `public/tenants/pinteya/`
4. Migrar variables de .env a tabla tenants
5. Actualizar órdenes existentes con `tenant_id`
6. Deploy y verificar

### 10.2 Configuración de Vercel

```
vercel.json:
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Agregar dominios en Vercel Dashboard:

- www.pinteya.com
- www.pintemas.com

### 10.3 Variables de Entorno

Las variables sensibles ahora se guardan en la tabla `tenants` encriptadas. Solo necesitas:

```env
# Supabase (compartido)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth (compartido)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

---

## FASE 0: Rebranding de Infraestructura

### 0.1 Renombrar Proyecto en Supabase

1. Ir a **Project Settings > General**
2. Cambiar nombre a "pintureria-digital"
3. Las URLs y keys NO cambian (solo el nombre display)

### 0.2 Crear/Renombrar Proyecto en Vercel

En Vercel Dashboard > Project Settings > General > Project Name cambiar a `pintureria-digital`

### 0.3 Configurar Dominios de la Plataforma

En Vercel Dashboard agregar:

- `pintureriadigital.com` (apex)
- `*.pintureriadigital.com` (wildcard para subdominios)
- `admin.pintureriadigital.com`

### 0.4 Actualizar Referencias en Código

Buscar y reemplazar (~700 referencias de `process.env` y nombres hardcodeados)

---

## FASE 8: Sistema de Administración Híbrido

### 8.1 Tabla de Roles por Tenant

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'tenant_staff', 'customer');

CREATE TABLE tenant_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  permissions JSONB DEFAULT '{
    "orders": {"view": true, "edit": false, "delete": false},
    "products": {"view": true, "edit": false, "delete": false},
    "analytics": {"view": true},
    "settings": {"view": false, "edit": false}
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Estructura de Rutas Admin

```
src/app/
├── (storefront)/              # Rutas públicas de tiendas
│   ├── layout.tsx             # TenantProvider + TenantTheme
│   └── ...
├── admin/                     # Admin de cada tenant
│   ├── layout.tsx             # TenantAdminGuard
│   └── ...
└── super-admin/               # Super Admin central
    ├── layout.tsx             # SuperAdminGuard
    ├── tenants/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/
    ├── products/
    └── users/
```

---

## FASE 9B: WhatsApp Multitenant

Agregar campos a tabla `tenants`:

```sql
ALTER TABLE tenants ADD COLUMN whatsapp_business_number VARCHAR(20);
ALTER TABLE tenants ADD COLUMN whatsapp_message_template TEXT;
```

Modificar `src/lib/integrations/whatsapp/*` para leer número del tenant.

---

## FASE 9C: Servicio de Productos por Tenant

Crear `src/lib/products/tenant-product-service.ts`:

```typescript
export async function getTenantProducts(tenantId: string) {
  // 1. Obtener configuración de productos del tenant
  const { data: tenantProducts } = await supabase
    .from('tenant_products')
    .select(`
      *,
      products (*),
      shared_stock_pools (*)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_visible', true)
  
  // 2. Para cada producto, resolver el stock correcto
  return tenantProducts.map(tp => ({
    ...tp.products,
    price: tp.price,
    discountedPrice: tp.discounted_price,
    // Si tiene pool compartido, obtener stock del pool
    stock: tp.shared_pool_id 
      ? await getPoolStock(tp.shared_pool_id, tp.product_id)
      : tp.stock,
    isSharedStock: !!tp.shared_pool_id,
  }))
}

export async function getPoolStock(poolId: string, productId: number) {
  const { data } = await supabase
    .from('shared_pool_stock')
    .select('stock, reserved_stock')
    .eq('pool_id', poolId)
    .eq('product_id', productId)
    .single()
  
  return (data?.stock ?? 0) - (data?.reserved_stock ?? 0)
}

// Buscar producto por código externo (para sincronización ERP)
export async function findByExternalCode(
  tenantId: string,
  systemCode: string,  // "AIKON"
  externalCode: string // "50001"
) {
  const { data } = await supabase
    .from('tenant_product_external_ids')
    .select(`
      product_id,
      external_code,
      products (*),
      tenant_products (*)
    `)
    .eq('tenant_id', tenantId)
    .eq('external_code', externalCode)
    .single()
  
  return data
}
```

---

## FASE 9D: API de Sincronización de ERPs

Crear `src/app/api/sync/[system]/route.ts`:

```typescript
// POST /api/sync/aikon
// Body: { products: [{ code: "50001", stock: 200, price: 15000 }, ...] }
export async function POST(
  request: NextRequest,
  { params }: { params: { system: string } }
) {
  const systemCode = params.system.toUpperCase() // "AIKON"
  
  // 1. Verificar API key del sistema
  const apiKey = request.headers.get('x-api-key')
  const { data: tenantSystem } = await supabase
    .from('tenant_external_systems')
    .select('*, tenants(*)')
    .eq('api_credentials->api_key', apiKey)
    .single()
  
  if (!tenantSystem) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  
  // 2. Procesar productos
  const body = await request.json()
  const results = []
  
  for (const item of body.products) {
    // Buscar producto por código externo
    const product = await findByExternalCode(
      tenantSystem.tenant_id,
      systemCode,
      item.code
    )
    
    if (!product) continue
    
    // Actualizar stock (pool o propio)
    if (product.tenant_products.shared_pool_id) {
      // Actualizar pool compartido
      await supabase
        .from('shared_pool_stock')
        .upsert({
          pool_id: product.tenant_products.shared_pool_id,
          product_id: product.product_id,
          stock: item.stock,
          last_sync_at: new Date().toISOString(),
        })
    } else {
      // Actualizar stock propio
      await supabase
        .from('tenant_products')
        .update({ stock: item.stock })
        .eq('tenant_id', tenantSystem.tenant_id)
        .eq('product_id', product.product_id)
    }
    
    // Actualizar precio si viene
    if (item.price) {
      await supabase
        .from('tenant_products')
        .update({ price: item.price })
        .eq('tenant_id', tenantSystem.tenant_id)
        .eq('product_id', product.product_id)
    }
    
    results.push({ code: item.code, status: 'updated' })
  }
  
  return NextResponse.json({ results })
}
```

**Flujo de sincronización Aikon → PintureríaDigital:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIKON CÓRDOBA                                │
│  Producto 50001 → Stock: 200, Precio: $15.000                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ POST /api/sync/aikon
                            │ x-api-key: [key de AIKON_CORDOBA]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validar API key → encuentra tenant_external_systems         │
│  2. Buscar productos por código "50001"                        │
│  3. Encuentra: Pinteya y Pintemas (misma instancia AIKON_CBA)  │
│  4. Detecta shared_pool_id → actualiza shared_pool_stock       │
│  5. Actualiza precio en tenant_products de ambos               │
└─────────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│    PINTEYA      │                   │    PINTEMAS     │
│  Stock: 200     │                   │  Stock: 200     │
│  Precio: $15k   │                   │  Precio: $15k   │
└─────────────────┘                   └─────────────────┘
```

---

## FASE 10: Variables de Entorno a Migrar

### Variables que van a tabla `tenants`

| Variable Actual | Campo en Tenants |

|-----------------|------------------|

| `NEXT_PUBLIC_META_PIXEL_ID` | `meta_pixel_id` |

| `META_ACCESS_TOKEN` | `meta_access_token` |

| `GA4_PROPERTY_ID` | `ga4_property_id` |

| `MERCADOPAGO_ACCESS_TOKEN` | `mercadopago_access_token` |

| `WHATSAPP_BUSINESS_NUMBER` | `whatsapp_business_number` |

### Variables globales (permanecen en .env)

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://pintureriadigital.com
REDIS_URL=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

---

## FASE 11: Configuración de Vercel

### 11.1 Estructura de Dominios

```
Proyecto: pintureria-digital

Dominios:
├── pintureriadigital.com           (landing)
├── *.pintureriadigital.com         (wildcard)
│   ├── pinteya.pintureriadigital.com
│   ├── pintemas.pintureriadigital.com
│   └── admin.pintureriadigital.com
└── Dominios custom por tenant:
    ├── www.pinteya.com
    └── www.pintemas.com
```

### 11.2 vercel.json

```json
{
  "framework": "nextjs",
  "regions": ["gru1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## FASE 12: Migración de Datos

### 12.1 Crear tenant Pinteya con datos actuales

```sql
INSERT INTO tenants (slug, name, domain, subdomain, custom_domain, ...)
VALUES ('pinteya', 'Pinteya', 'pinteya.pintureriadigital.com', 
        'pinteya', 'www.pinteya.com', ...);
```

### 12.2 Actualizar registros existentes

```sql
UPDATE orders SET tenant_id = '[PINTEYA_ID]' WHERE tenant_id IS NULL;
UPDATE analytics_events_optimized SET tenant_id = '[PINTEYA_ID]';
UPDATE user_profiles SET tenant_id = '[PINTEYA_ID]';
```

### 12.3 Mover assets

```bash
mkdir -p public/tenants/pinteya/hero
cp public/images/logo/*.svg public/tenants/pinteya/
cp public/images/hero/hero2/*.webp public/tenants/pinteya/hero/
```

---

## Archivos Principales

### Nuevos (~25-30 archivos)

| Archivo | Descripción |

|---------|-------------|

| `supabase/migrations/XXXX_create_tenants.sql` | Tabla tenants |

| `supabase/migrations/XXXX_tenant_roles.sql` | Sistema de roles |

| `src/lib/tenant/tenant-service.ts` | Servicio principal |

| `src/contexts/TenantContext.tsx` | Context y Provider |

| `src/hooks/useTenant.ts` | Hook cliente |

| `src/hooks/useTenantAssets.ts` | Hook de assets |

| `src/components/theme/TenantThemeStyles.tsx` | CSS dinámico |

| `src/components/Analytics/TenantAnalytics.tsx` | Analytics unificado |

| `src/lib/auth/guards/super-admin-guard.ts` | Guard super admin |

| `src/app/super-admin/*` | Panel super admin |

| `vercel.json` | Config de Vercel |

### Modificados (~60-70 archivos)

| Archivo | Cambios |

|---------|---------|

| `middleware.ts` | Detección de tenant |

| `src/app/layout.tsx` | TenantProvider |

| `tailwind.config.ts` | CSS variables |

| `src/components/Header/index.tsx` | Logo, colores |

| `src/components/layout/Footer.tsx` | Nombre, WhatsApp |

| `src/lib/integrations/mercadopago/*` | Credenciales tenant |

| `src/lib/integrations/whatsapp/*` | Número tenant |

| `src/components/Analytics/*` | IDs dinámicos |

| `+50 archivos con process.env` | Migrar a tenant |

---

## ITERACIÓN 6: Migración APIs Carrito y Órdenes Multitenant

### Objetivo

Completar la migración de APIs públicas transaccionales (carrito y órdenes) para soporte multitenant, asegurando que todas las operaciones respeten el aislamiento por tenant y manejen correctamente las variantes de productos.

### Cambios Implementados

#### 6.1 API `/api/cart/update/route.ts`

**Cambios realizados:**

- ✅ Agregado soporte para parámetro `variantId` opcional en el body
- ✅ Búsqueda de items del carrito actualizada para incluir `variant_id`:
  - Si se proporciona `variantId`, busca por `variant_id` específico
  - Si no, busca items con `variant_id IS NULL` (productos sin variantes)
- ✅ Validación de stock actualizada para considerar variantes:
  - Si hay `variantId`, valida stock de la variante desde `product_variants`
  - Si no, valida stock del producto padre desde `products`
- ✅ Filtrado por `tenant_id` en todas las operaciones (búsqueda, actualización, eliminación)
- ✅ Mantiene compatibilidad hacia atrás (funciona sin `variantId`)

**Código clave:**

```typescript
// Búsqueda con soporte de variantes
let existingItemQuery = supabase
  .from('cart_items')
  .select('id, quantity, variant_id')
  .eq('user_id', userId)
  .eq('product_id', productId)
  .eq('tenant_id', tenantId)

if (variantId) {
  existingItemQuery = existingItemQuery.eq('variant_id', variantId)
} else {
  existingItemQuery = existingItemQuery.is('variant_id', null)
}
```

#### 6.2 API `/api/cart/remove/route.ts`

**Cambios realizados:**

- ✅ Agregado soporte para parámetro `variantId` opcional en el body
- ✅ Búsqueda de items del carrito actualizada para incluir `variant_id` (misma lógica que update)
- ✅ Filtrado por `tenant_id` en todas las operaciones
- ✅ Mantiene compatibilidad hacia atrás

#### 6.3 API `/api/orders/[id]/route.ts`

**Cambios realizados:**

- ✅ Agregado import de `getTenantConfig` para obtener `tenant_id` del tenant actual
- ✅ Filtro por `tenant_id` agregado en la consulta de órdenes
- ✅ Previene acceso a órdenes de otros tenants (seguridad crítica)
- ✅ Soporta búsqueda por `id`, `order_number` y `external_reference` con filtro de tenant

**Código clave:**

```typescript
// Obtener tenant_id del tenant actual
const tenant = await getTenantConfig()
const tenantId = tenant.id

// Filtrar por tenant_id en la consulta
const { data: order, error: orderError } = await supabase
  .from('orders')
  .select(...)
  .eq(searchField, searchValue)
  .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
  .single()
```

#### 6.4 API `/api/payments/webhook/route.ts`

**Cambios realizados:**

- ✅ Validación de `tenant_id` al procesar webhooks de MercadoPago
- ✅ Obtiene `tenant_id` de la orden encontrada por `external_reference`
- ✅ Valida que la orden tenga `tenant_id` antes de procesar (previene errores)
- ✅ Filtra todas las actualizaciones por `tenant_id`:
  - Actualización de `orders` con `.eq('tenant_id', orderTenantId)`
  - Consulta de `order_items` para email con filtro de tenant
  - Actualización de WhatsApp link con validación de tenant
  - Consulta de `order_items` para actualización de stock con filtro de tenant
- ✅ Logging de seguridad cuando falta `tenant_id`

**Código clave:**

```typescript
// Buscar orden y obtener tenant_id
const { data: order, error: orderError } = await supabase
  .from('orders')
  .select('*, tenant_id')
  .eq('external_reference', orderReference)
  .single()

// Validar que la orden tiene tenant_id
if (!order.tenant_id) {
  console.error('[WEBHOOK_ASYNC] Order found but missing tenant_id')
  logger.security(...)
  return
}

const orderTenantId = order.tenant_id

// Todas las actualizaciones filtran por tenant_id
await supabase
  .from('orders')
  .update({ ... })
  .eq('id', order.id)
  .eq('tenant_id', orderTenantId) // ⚡ MULTITENANT: Validar tenant
```

### Características de Seguridad

1. **Aislamiento de datos**: Todas las consultas filtran por `tenant_id`
2. **Validación de tenant**: El webhook valida `tenant_id` antes de actualizar órdenes
3. **Prevención de acceso cruzado**: No se puede acceder a órdenes de otros tenants
4. **Soporte de variantes**: Manejo correcto de productos con variantes en el carrito

### Compatibilidad

- ✅ **Backward compatible**: Las APIs funcionan sin `variantId` para productos sin variantes
- ✅ **Sin breaking changes**: Mantiene comportamiento actual para productos sin variantes
- ✅ **Validación robusta**: Maneja casos edge (variantes no encontradas, stock insuficiente)

### Estado de Migración

| API | Estado | Filtrado tenant_id | Soporte variant_id |

|-----|--------|-------------------|-------------------|

| `GET /api/cart` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `POST /api/cart` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `DELETE /api/cart` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `POST /api/cart/add` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `PUT /api/cart/update` | ✅ Completado (Iteración 6) | ✅ | ✅ |

| `DELETE /api/cart/remove` | ✅ Completado (Iteración 6) | ✅ | ✅ |

| `POST /api/orders/create-cash-order` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `POST /api/payments/create-preference` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `GET /api/user/orders` | ✅ Completado (Iteración 5) | ✅ | ✅ |

| `GET /api/orders/[id]` | ✅ Completado (Iteración 6) | ✅ | N/A |

| `POST /api/payments/webhook` | ✅ Completado (Iteración 6) | ✅ | N/A |

### Verificación Post-Migración

1. ✅ Probar actualización de items del carrito con y sin variantes
2. ✅ Probar eliminación de items del carrito con y sin variantes
3. ✅ Verificar que no se puede acceder a órdenes de otros tenants
4. ✅ Verificar que el webhook actualiza órdenes del tenant correcto
5. ✅ Verificar que las APIs mantienen compatibilidad hacia atrás

---

## ITERACIÓN 7: Migración APIs Admin y Analytics Multitenant

### Objetivo

Completar la migración de APIs administrativas y de analytics para soporte multitenant, asegurando que todas las operaciones respeten el aislamiento por tenant y proporcionen datos correctos por tenant.

### Estado de Migración

#### APIs Admin de Órdenes

- ✅ `GET /api/admin/orders` - Completado (Iteración 5)
- ✅ `GET /api/admin/orders/stats` - Completado (Iteración 5)
- ⚠️ `GET /api/admin/orders/analytics` - Tiene `getTenantConfig` pero necesita verificación completa
- ⚠️ `GET /api/admin/orders/[id] `- Usa `withTenantAdmin` pero necesita verificación de todas las operaciones
- ❌ `GET /api/admin/orders-simple` - **CRÍTICO**: NO filtra por `tenant_id` (riesgo de seguridad)

#### APIs Relacionadas con Órdenes

- ⚠️ `PUT /api/admin/orders/[id]/status/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/mark-paid/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/refund/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/payment-link/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/[id]/whatsapp/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/orders/bulk/route.ts` - Verificar filtro por `tenant_id` en operaciones bulk

#### APIs de Analytics

- ⚠️ `GET /api/admin/analytics/route.ts` - Necesita verificar filtrado por `tenant_id` en todas las métricas
- ❌ `GET /api/analytics/metrics/route.ts` - Probablemente no filtra por `tenant_id`

#### APIs de Usuarios Admin

- ⚠️ `GET /api/admin/users/route.ts` - Verificar si filtra por `tenant_id` en `user_profiles`
- ⚠️ `GET /api/admin/users/[id]/route.ts `- Verificar filtro por `tenant_id`
- ⚠️ `POST /api/admin/users/bulk/route.ts` - Verificar operaciones bulk respetan `tenant_id`

#### APIs de Reportes

- ⚠️ `GET /api/admin/reports/route.ts` - Verificar que todos los reportes filtren por `tenant_id`

### Priorización

#### Prioridad ALTA (Seguridad Crítica)

1. `/api/admin/orders-simple/route.ts` - Riesgo de acceso cruzado a órdenes de otros tenants
2. `/api/admin/orders/[id]/route.ts` - Operaciones críticas de órdenes
3. `/api/admin/orders/[id]/*/route.ts` - Operaciones relacionadas (status, mark-paid, refund, etc.)

#### Prioridad MEDIA (Funcionalidad)

4. `/api/admin/orders/analytics/route.ts` - Analytics por tenant
5. `/api/admin/analytics/route.ts` - Métricas por tenant
6. `/api/analytics/metrics/route.ts` - Métricas públicas
7. `/api/admin/users/*/route.ts` - Aislamiento de usuarios

#### Prioridad BAJA (Mejoras)

8. `/api/admin/reports/route.ts` - Reportes por tenant
9. `/api/admin/orders/bulk/route.ts` - Operaciones bulk

### Cambios Principales Requeridos

1. **Migrar `/api/admin/orders-simple/route.ts`** (CRÍTICO)

   - Agregar `getTenantConfig`
   - Filtrar consulta por `tenant_id`
   - Filtrar estadísticas por `tenant_id`

2. **Verificar `/api/admin/orders/analytics/route.ts`**

   - Confirmar que todas las queries filtran por `tenant_id`
   - Verificar agregaciones y métricas respetan el tenant

3. **Verificar `/api/admin/orders/[id]/route.ts`**

   - GET: Confirmar filtro por `tenant_id`
   - PUT/PATCH: Validar `tenant_id` antes de actualizar

4. **Migrar APIs de Analytics**

   - Agregar `getTenantConfig` donde falte
   - Filtrar todas las queries por `tenant_id`
   - Asegurar funciones helper reciben `tenantId`

5. **Verificar APIs de Usuarios**

   - Filtrar `user_profiles` por `tenant_id`
   - Validar `tenant_id` al obtener/actualizar usuarios

### Verificación Post-Migración

1. ✅ Probar que no se puede acceder a órdenes de otros tenants
2. ✅ Verificar que analytics muestran solo datos del tenant actual
3. ✅ Confirmar que usuarios solo ven usuarios de su tenant
4. ✅ Verificar que reportes respetan aislamiento
5. ✅ Probar operaciones bulk con múltiples tenants

---

## Estimación Final

- **Nuevos**: ~35-40 archivos
- **Modificados**: ~60-70 archivos
- **Migraciones SQL**: 6-8 archivos
- **Referencias a actualizar**: ~700
- **Tablas nuevas**: tenants, tenant_products, shared_stock_pools, shared_pool_stock, external_systems, tenant_external_systems, tenant_product_external_ids, tenant_user_roles, super_admins
- **APIs migradas a multitenant**: 11/11 (100% completado)