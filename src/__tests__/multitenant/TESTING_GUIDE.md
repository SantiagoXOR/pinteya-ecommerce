# Guía de Testing - Sistema Multitenant

## Resumen

Esta suite de tests valida todas las funcionalidades del sistema multitenant implementado, asegurando:
- ✅ Detección correcta de tenant por dominio/subdomain
- ✅ Aislamiento completo de datos entre tenants
- ✅ Funcionamiento correcto de APIs públicas y admin
- ✅ Branding dinámico por tenant
- ✅ Analytics y feeds por tenant
- ✅ Seguridad y RLS policies

## Ejecución Rápida

```bash
# Todos los tests
npm run test:multitenant

# Solo unitarios
npm run test:multitenant:unit

# Solo integración
npm run test:multitenant:integration

# Solo seguridad
npm run test:multitenant:security

# E2E
npm run test:multitenant:e2e
```

## Estructura de Tests

### Tests Unitarios (`unit/`)

**tenant-service.test.ts**
- `getTenantConfig()` - Obtiene configuración por dominio
- `getTenantConfig()` - Fallback a tenant por defecto
- `getTenantBySlug()` - Obtiene tenant por slug
- `getTenantById()` - Obtiene tenant por ID
- `getAllTenants()` - Lista todos los tenants activos
- `getTenantBaseUrl()` - Genera URL base del tenant
- `isAdminRequest()` - Detecta requests de admin
- Cache de configuración de tenant

**tenant-context.test.tsx**
- `TenantProvider` - Provee configuración correctamente
- `useTenant()` - Retorna configuración del tenant
- `useTenantSafe()` - Retorna null si no hay provider
- `useTenantTheme()` - Retorna colores del tema
- `useTenantAssets()` - Retorna paths de assets
- `useTenantAnalytics()` - Retorna configuración de analytics
- `useTenantContact()` - Retorna información de contacto
- `useTenantSEO()` - Retorna configuración SEO

**middleware-detection.test.ts**
- Detección por subdomain (`pinteya.pintureriadigital.com`)
- Detección por custom domain (`www.pinteya.com`)
- Fallback a tenant por defecto (localhost)
- Detección de dominio admin (`admin.pintureriadigital.com`)
- Manejo de subdominios especiales (www, api)
- Headers `x-tenant-domain` y `x-tenant-subdomain` correctos

**tenant-theme.test.ts**
- Generación de CSS variables correctas
- Aplicación de colores del tenant
- Fallback a valores por defecto
- Variables CSS en formato correcto
- Conversión HEX a HSL

### Tests de Integración (`integration/`)

**api-isolation.test.ts**
- `/api/products` - Filtra por `tenant_products.is_visible`
- `/api/cart/*` - Filtra por `tenant_id`
- `/api/orders/*` - Filtra por `tenant_id`
- `/api/admin/orders` - Filtra por `tenant_id`
- `/api/admin/products` - Filtra por `tenant_id`
- `/api/admin/analytics` - Filtra por `tenant_id`
- `/api/admin/users` - Filtra por `tenant_id` en `user_profiles`
- Asignación correcta de `tenant_id` en INSERTs
- Validación de `tenant_id` en UPDATEs y DELETEs

**feeds-multitenant.test.ts**
- Feed de Google Merchant solo incluye productos del tenant actual
- Feed de Meta Catalog solo incluye productos del tenant actual
- Sitemap solo incluye URLs del tenant actual
- Precios y stock correctos por tenant
- URLs base correctas por tenant

**analytics-multitenant.test.ts**
- Analytics solo registra eventos del tenant actual
- GA4 Measurement ID correcto por tenant
- Meta Pixel ID correcto por tenant
- Eventos filtrados por `tenant_id` en queries
- Agregaciones respetan `tenant_id`

**products-multitenant.test.ts**
- `TenantProductService` - Obtiene productos con stock/precio del tenant
- Stock compartido vs stock independiente
- Precios por tenant
- Visibilidad por tenant (`is_visible`)
- Productos destacados por tenant (`is_featured`)

### Tests de Seguridad (`security/`)

**rls-policies.test.ts**
- RLS policy en `orders` filtra por `tenant_id`
- RLS policy en `cart_items` filtra por `tenant_id`
- RLS policy en `analytics_events_optimized` filtra por `tenant_id`
- RLS policy en `user_profiles` filtra por `tenant_id`
- RLS policy en `categories` filtra por `tenant_id`
- `service_role` puede acceder a todos los datos (admin)
- Función `get_current_tenant_id()` funciona correctamente

**cross-tenant-access.test.ts**
- No se puede acceder a órdenes de otro tenant por ID
- No se puede acceder a carrito de otro tenant
- No se puede acceder a productos de otro tenant (si no están visibles)
- No se puede acceder a analytics de otro tenant
- No se puede modificar datos de otro tenant
- Escenarios: Pinteya intenta acceder a datos de Pintemas

**tenant-guards.test.ts**
- `TenantAdminGuard` valida permisos correctamente
- `SuperAdminGuard` valida permisos correctamente
- Guards rechazan acceso sin autenticación
- Guards rechazan acceso con tenant incorrecto
- Guards permiten acceso con permisos correctos
- Validación de permisos específicos (orders, products, settings, etc.)

### Tests E2E (`e2e/`)

**tenant-navigation.spec.ts**
- Navegación a `pinteya.pintureriadigital.com` muestra tenant Pinteya
- Navegación a `pintemas.pintureriadigital.com` muestra tenant Pintemas
- Navegación a `www.pinteya.com` muestra tenant Pinteya
- Navegación a `www.pintemas.com` muestra tenant Pintemas
- Localhost muestra tenant por defecto (Pinteya)
- Headers correctos en requests

**tenant-branding.spec.ts**
- Logo correcto por tenant
- Colores del tema correctos por tenant
- Favicon correcto por tenant
- Imágenes hero correctas por tenant
- Footer muestra nombre correcto del tenant
- WhatsApp number correcto por tenant
- CSS variables aplicadas correctamente

**tenant-checkout.spec.ts**
- Crear orden asigna `tenant_id` correcto
- Carrito filtra por `tenant_id`
- MercadoPago usa credenciales del tenant correcto
- Webhook de pagos valida `tenant_id`

**tenant-admin.spec.ts**
- Admin solo ve órdenes de su tenant
- Admin solo ve productos de su tenant
- Admin solo ve usuarios de su tenant
- Admin solo ve analytics de su tenant
- Super admin ve todos los tenants

## Mocks y Fixtures

### Mocks Disponibles

Los tests usan mocks de:
- `getTenantConfig()` - Servicio de tenant
- `headers()` - Headers de Next.js
- `createAdminClient()` - Cliente de Supabase
- `getServerSession()` - Sesión de NextAuth
- `checkSuperAdmin()` - Guard de super admin

### Fixtures de Datos

Los fixtures incluyen datos de prueba para:
- **Pinteya** (`pinteya-uuid-1234`)
  - Órdenes, productos, usuarios, cart items, analytics events, categorías
- **Pintemas** (`pintemas-uuid-5678`)
  - Órdenes, productos, usuarios, cart items, analytics events, categorías

## Troubleshooting

### Tests fallan con errores de importación

Verificar que los mocks estén correctamente configurados en `setup.ts` y que los imports en los tests coincidan con la estructura real del proyecto.

### Tests E2E no encuentran el servidor

Asegurarse de que el servidor esté corriendo en `localhost:3000` antes de ejecutar los tests E2E.

### Errores de RLS policies

Los tests de RLS requieren que las políticas estén aplicadas en la base de datos. Verificar que las migraciones estén ejecutadas.

### Mocks no funcionan correctamente

Verificar que los mocks estén definidos antes de importar los módulos que los usan. Usar `jest.mock()` al inicio del archivo de test.

## Mejoras Futuras

- [ ] Agregar tests de performance para queries multitenant
- [ ] Agregar tests de carga con múltiples tenants simultáneos
- [ ] Agregar tests de migración de datos entre tenants
- [ ] Agregar tests de sincronización ERP por tenant
- [ ] Agregar tests de cache de configuración de tenant
