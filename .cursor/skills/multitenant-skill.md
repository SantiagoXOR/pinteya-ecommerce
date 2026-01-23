# Skill: Desarrollo Multitenant

## Descripción

Habilidad especializada para trabajar con el sistema multitenant del proyecto, incluyendo detección de tenants, aislamiento de datos, configuración por tenant y RLS policies.

## Cuándo Usar

- Implementar nuevas funcionalidades que requieren aislamiento por tenant
- Crear APIs que manejan datos de múltiples tenants
- Configurar assets o branding por tenant
- Implementar RLS policies en Supabase
- Debuggear problemas de aislamiento de datos

## Archivos Clave

- `src/lib/tenant/tenant-service.ts` - Servicio principal de tenants
- `src/middleware.ts` - Detección de tenant
- `src/components/TenantThemeStyles.tsx` - Estilos por tenant
- `supabase/migrations/*` - Migraciones con RLS

## Comandos Útiles

```bash
# Verificar tenant en desarrollo
node scripts/verify-tenant-pintemas.js

# Verificar RLS policies
psql -h [host] -U [user] -d [db] -c "\d+ products"
```

## Ejemplos de Uso

### Crear API con Aislamiento de Tenant

```typescript
import { getTenantFromRequest } from '@/lib/tenant/tenant-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 1. Obtener tenant
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  // 2. Crear cliente Supabase con tenant context
  const supabase = createClient();
  await supabase.rpc('set_tenant_id', { tenant_id: tenant.id });
  
  // 3. Query con tenant_id
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Agregar RLS Policy

```sql
-- En migración Supabase
CREATE POLICY "tenant_isolation_products" ON products
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants 
      WHERE slug = current_setting('app.tenant_slug', true)
    )
  );
```

### Configurar Assets por Tenant

```typescript
// En componente
const tenant = useTenant();
const logoPath = `/tenants/${tenant.slug}/logo.svg`;
const primaryColor = tenant.primary_color || '#ea5a17';
```

## Checklist de Implementación

- [ ] Verificar tenant en cada request
- [ ] Incluir `tenant_id` en todas las queries
- [ ] Verificar RLS policies están activas
- [ ] Probar con múltiples tenants
- [ ] Verificar aislamiento de datos
- [ ] Configurar assets por tenant si es necesario
