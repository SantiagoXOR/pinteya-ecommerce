# Rules: Sistema Multitenant

## Contexto del Sistema Multitenant

Este proyecto implementa un sistema multitenant completo donde múltiples tiendas (tenants) comparten la misma instancia de la aplicación pero con datos y configuraciones separadas.

## Reglas de Implementación Multitenant

### 1. Detección de Tenant

- **SIEMPRE** verificar el tenant en cada request usando `TenantService`
- Usar `getTenantFromRequest()` en middleware y APIs
- El tenant se detecta por:
  - Dominio personalizado (custom_domain)
  - Subdominio (subdomain)
  - Header `x-tenant-id` (para desarrollo/testing)

### 2. Aislamiento de Datos

- **NUNCA** hacer queries sin filtrar por `tenant_id`
- **SIEMPRE** incluir `tenant_id` en:
  - SELECT queries: `WHERE tenant_id = $1`
  - INSERT queries: Incluir `tenant_id` en los valores
  - UPDATE queries: `WHERE tenant_id = $1 AND ...`
  - DELETE queries: `WHERE tenant_id = $1 AND ...`

### 3. RLS Policies en Supabase

- **TODAS** las tablas deben tener RLS habilitado
- **TODAS** las policies deben incluir verificación de `tenant_id`
- Ejemplo de policy:
  ```sql
  CREATE POLICY "tenant_isolation" ON products
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```

### 4. Assets y Configuración por Tenant

- Assets en `public/tenants/{tenant_slug}/`
- Configuración de colores y branding por tenant
- CSS variables dinámicas: `--tenant-primary`, `--tenant-primary-dark`
- Favicon y logos específicos por tenant

### 5. APIs y Rutas

- **TODAS** las APIs deben validar tenant antes de procesar
- Usar `validateTenantAccess()` antes de operaciones sensibles
- Headers de respuesta deben incluir `x-tenant-domain`

### 6. Testing Multitenant

- **SIEMPRE** probar con múltiples tenants
- Verificar aislamiento de datos entre tenants
- Tests deben incluir escenarios de tenant inválido/no encontrado

## Ejemplos de Código Correcto

### ✅ Query Correcta
```typescript
const products = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenant.id)
  .eq('category_id', categoryId);
```

### ✅ API Route Correcta
```typescript
export async function GET(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  // Procesar con tenant.id
}
```

### ❌ Query Incorrecta (SIN tenant_id)
```typescript
// NUNCA hacer esto
const products = await supabase
  .from('products')
  .select('*')
  .eq('category_id', categoryId);
```

## Archivos Clave

- `src/lib/tenant/tenant-service.ts` - Servicio principal de tenants
- `src/middleware.ts` - Detección de tenant en middleware
- `src/components/TenantThemeStyles.tsx` - Inyección de estilos por tenant
- `supabase/migrations/*` - Migraciones con RLS policies
