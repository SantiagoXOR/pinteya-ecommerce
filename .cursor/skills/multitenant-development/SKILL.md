---
name: multitenant-development
description: Specialized skill for working with the multitenant system including tenant detection, data isolation, tenant-specific configuration, and RLS policies. Use when implementing multitenant features, creating APIs that handle multiple tenants, configuring tenant assets, or debugging data isolation issues.
---

# Multitenant Development

## Quick Start

When working with multitenant features:

1. Always verify tenant with `getTenantFromRequest()` in APIs and middleware
2. Never make queries without filtering by `tenant_id`
3. Ensure RLS policies include tenant verification
4. Configure tenant-specific assets in `public/tenants/{tenant_slug}/`

## Key Files

- `src/lib/tenant/tenant-service.ts` - Main tenant service
- `src/middleware.ts` - Tenant detection
- `src/components/TenantThemeStyles.tsx` - Tenant styles
- `supabase/migrations/*` - RLS migrations

## Common Patterns

### API with Tenant Isolation

```typescript
import { getTenantFromRequest } from '@/lib/tenant/tenant-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  const supabase = createClient();
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

### RLS Policy

```sql
CREATE POLICY "tenant_isolation_products" ON products
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants 
      WHERE slug = current_setting('app.tenant_slug', true)
    )
  );
```

### Tenant Assets

```typescript
const tenant = useTenant();
const logoPath = `/tenants/${tenant.slug}/logo.svg`;
const primaryColor = tenant.primary_color || '#ea5a17';
```

## Checklist

- [ ] Verify tenant in each request
- [ ] Include `tenant_id` in all queries
- [ ] Verify RLS policies are active
- [ ] Test with multiple tenants
- [ ] Verify data isolation
- [ ] Configure tenant assets if needed
