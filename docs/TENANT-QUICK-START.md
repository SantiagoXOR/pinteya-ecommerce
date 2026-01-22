# Guía Rápida - Sistema Multitenant

## TL;DR

```typescript
// Server Component - obtener config del tenant
import { getTenantConfig } from '@/lib/tenant'
const tenant = await getTenantConfig()

// Client Component - usar hook
import { useTenant } from '@/contexts/TenantContext'
const tenant = useTenant()

// Colores dinámicos en Tailwind
<button className="bg-tenant-primary hover:bg-tenant-primary-dark">
```

---

## Acceso a Datos del Tenant

### En Server Components

```typescript
import { getTenantConfig, getTenantPublicConfig } from '@/lib/tenant'

export default async function Page() {
  // Config completa (incluye secretos - solo server)
  const tenant = await getTenantConfig()
  
  // Config pública (safe para pasar a client)
  const publicConfig = await getTenantPublicConfig()
  
  return (
    <div>
      <h1>{tenant.name}</h1>
      <p>WhatsApp: {tenant.whatsappNumber}</p>
    </div>
  )
}
```

### En Client Components

```typescript
'use client'
import { 
  useTenant,
  useTenantTheme,
  useTenantAssets,
  useTenantContact,
  useTenantAnalytics 
} from '@/contexts/TenantContext'

function MyComponent() {
  // Datos generales
  const tenant = useTenant()
  
  // Solo colores
  const { primaryColor, secondaryColor } = useTenantTheme()
  
  // Solo assets (logos, favicon)
  const { logoUrl, faviconUrl } = useTenantAssets()
  
  // Solo contacto
  const { whatsappNumber, email, phone } = useTenantContact()
  
  // Solo analytics IDs
  const { ga4MeasurementId, metaPixelId } = useTenantAnalytics()
}
```

### En API Routes

```typescript
import { NextResponse } from 'next/server'
import { getTenantConfig } from '@/lib/tenant'

export async function GET() {
  const tenant = await getTenantConfig()
  
  // Filtrar datos por tenant
  const data = await db.query(
    'SELECT * FROM orders WHERE tenant_id = $1',
    [tenant.id]
  )
  
  return NextResponse.json(data)
}
```

---

## Estilos Dinámicos

### CSS Variables Disponibles

```css
:root {
  --tenant-primary: #f27a1d;
  --tenant-primary-dark: #bd4811;
  --tenant-primary-light: #ff9248;
  --tenant-secondary: #1f2937;
  --tenant-accent: #10b981;
  --tenant-border-radius: 0.5rem;
  --tenant-font-family: "Inter", sans-serif;
}
```

### Uso en Tailwind

```html
<!-- Colores del tenant -->
<button class="bg-tenant-primary text-white">Comprar</button>
<div class="border-tenant-secondary">...</div>

<!-- Hover states -->
<a class="hover:text-tenant-primary">Link</a>

<!-- También disponible como blaze-orange (legacy) -->
<span class="text-blaze-orange-500">Precio</span>
```

### Uso en CSS-in-JS / Inline Styles

```typescript
const tenant = useTenant()

<div style={{ 
  backgroundColor: tenant.primaryColor,
  borderRadius: tenant.themeConfig.borderRadius 
}}>
```

---

## Estructura de Assets

```
public/tenants/
├── pinteya/
│   ├── logo.svg          # Logo principal
│   ├── logo-dark.svg     # Logo para fondos oscuros
│   ├── favicon.svg       # Favicon
│   └── hero/
│       ├── banner-1.webp # Banners del carousel
│       └── banner-2.webp
└── pintemas/
    └── ...
```

### Acceso a Assets

```typescript
const { logoUrl, logoDarkUrl, faviconUrl } = useTenantAssets()

// Resultado: '/tenants/pinteya/logo.svg'
```

---

## Productos por Tenant

```typescript
import { 
  getTenantProducts,
  getTenantProductBySlug,
  getTenantProductStock 
} from '@/lib/products/tenant-product-service'

// Listar productos
const products = await getTenantProducts(tenantId, {
  categoryId: 'uuid',
  onlyVisible: true,
  onlyInStock: true,
  limit: 20
})

// Obtener producto con detalles
const product = await getTenantProductBySlug('latex-20l')

// Solo verificar stock
const stock = await getTenantProductStock(productId, tenantId)
```

---

## Guards de Autenticación

### Super Admin

```typescript
import { requireSuperAdmin } from '@/lib/auth/guards'

export async function GET() {
  // Redirige si no es super admin
  const { user, permissions } = await requireSuperAdmin()
  
  // Solo super admins llegan aquí
}
```

### Tenant Admin

```typescript
import { 
  requireTenantAdmin, 
  checkTenantPermission 
} from '@/lib/auth/guards'

export async function GET() {
  const { user, tenant, role, permissions } = await requireTenantAdmin()
  
  // Verificar permiso específico
  if (await checkTenantPermission('products', 'edit')) {
    // Puede editar productos
  }
}
```

---

## Testing Local

### Configurar hosts

Agregar a `/etc/hosts` (Mac/Linux) o `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 pinteya.localhost
127.0.0.1 pintemas.localhost
127.0.0.1 admin.localhost
```

### Acceder

```
http://pinteya.localhost:3000   → Tenant Pinteya
http://pintemas.localhost:3000  → Tenant Pintemas
http://admin.localhost:3000     → Admin Panel
```

---

## Crear Nuevo Tenant

### 1. Migración SQL

```sql
-- supabase/migrations/xxx_create_tenant_nuevo.sql
INSERT INTO tenants (
  slug,
  name,
  subdomain,
  logo_url,
  primary_color,
  primary_dark,
  whatsapp_number,
  ga4_measurement_id
) VALUES (
  'nuevo',
  'Tienda Nueva',
  'nuevo',
  '/tenants/nuevo/logo.svg',
  '#ff0000',
  '#cc0000',
  '+5493511234567',
  'G-XXXXXXXXXX'
);
```

### 2. Crear assets

```
public/tenants/nuevo/
├── logo.svg
├── logo-dark.svg
├── favicon.svg
└── hero/
    └── banner-1.webp
```

### 3. Aplicar migración

```bash
npx supabase db push
```

### 4. Configurar dominio (Vercel)

- Dashboard → Project → Settings → Domains
- Agregar `nuevo.pintureriadigital.com`

---

## Checklist de Componentes Multitenant

Cuando crees un nuevo componente, verifica:

- [ ] ¿Usa colores hardcodeados? → Cambiar a `tenant-primary`
- [ ] ¿Tiene logo/favicon fijo? → Usar `useTenantAssets()`
- [ ] ¿Muestra nombre de tienda? → Usar `tenant.name`
- [ ] ¿Tiene links de contacto? → Usar `useTenantContact()`
- [ ] ¿Trackea analytics? → Incluir `tenant_id` en eventos

---

## Debugging

### Ver tenant actual

```typescript
// En consola del navegador
console.log(window.__TENANT_CONFIG__)
```

### Ver headers del middleware

```typescript
// En un API route
export async function GET(request) {
  console.log({
    domain: request.headers.get('x-tenant-domain'),
    subdomain: request.headers.get('x-tenant-subdomain'),
    customDomain: request.headers.get('x-tenant-custom-domain'),
  })
}
```

### Forzar tenant en desarrollo

```typescript
// src/lib/tenant/tenant-service.ts
// Descomentar para testing:
// return getHardcodedDefaultTenant() // Siempre retorna Pinteya
```
