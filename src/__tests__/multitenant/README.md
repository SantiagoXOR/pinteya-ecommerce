# Tests Multitenant - Sistema de Testing Completo

Este directorio contiene la suite completa de tests para validar todas las funcionalidades del sistema multitenant.

## Estructura

```
src/__tests__/multitenant/
├── setup.ts                    # Configuración global de mocks
├── helpers.ts                  # Funciones utilitarias
├── fixtures.ts                 # Datos de prueba por tenant
├── unit/                       # Tests unitarios
│   ├── tenant-service.test.ts
│   ├── tenant-context.test.tsx
│   ├── middleware-detection.test.ts
│   └── tenant-theme.test.ts
├── integration/                # Tests de integración
│   ├── api-isolation.test.ts
│   ├── feeds-multitenant.test.ts
│   ├── analytics-multitenant.test.ts
│   └── products-multitenant.test.ts
├── security/                   # Tests de seguridad
│   ├── rls-policies.test.ts
│   ├── cross-tenant-access.test.ts
│   └── tenant-guards.test.ts
└── e2e/                        # Tests E2E (Playwright)
    ├── tenant-navigation.spec.ts
    ├── tenant-branding.spec.ts
    ├── tenant-checkout.spec.ts
    └── tenant-admin.spec.ts
```

## Ejecutar Tests

### Todos los Tests Multitenant
```bash
npm run test:multitenant
```

### Tests Unitarios
```bash
npm run test:multitenant:unit
```

### Tests de Integración
```bash
npm run test:multitenant:integration
```

### Tests de Seguridad
```bash
npm run test:multitenant:security
```

### Tests E2E
```bash
npm run test:multitenant:e2e
```

### Con Cobertura
```bash
npm run test:multitenant:coverage
```

### Modo Watch
```bash
npm run test:multitenant:watch
```

## Tests E2E con Playwright

### Modo UI (Interactivo)
```bash
npm run test:multitenant:e2e:ui
```

### Modo Headed (Con navegador visible)
```bash
npm run test:multitenant:e2e:headed
```

### Modo Debug
```bash
npm run test:multitenant:e2e:debug
```

## Configuración

Los tests usan mocks de:
- `getTenantConfig()` - Servicio de tenant
- `headers()` - Headers de Next.js
- `createAdminClient()` - Cliente de Supabase
- `getServerSession()` - Sesión de NextAuth

Los datos de prueba están en `fixtures.ts` y `setup.ts` con dos tenants de ejemplo:
- **Pinteya** (`pinteya-uuid-1234`)
- **Pintemas** (`pintemas-uuid-5678`)

## Cobertura

Los tests cubren:
- ✅ Detección de tenant por dominio/subdomain
- ✅ Aislamiento de datos entre tenants
- ✅ APIs públicas y admin
- ✅ Branding dinámico
- ✅ Analytics y feeds por tenant
- ✅ RLS policies y seguridad
- ✅ Guards de autenticación

## Notas

- Los tests E2E requieren que el servidor esté corriendo en `localhost:3000`
- Los tests de seguridad pueden requerir configuración adicional de Supabase
- Los mocks pueden necesitar ajustes según cambios en la implementación
