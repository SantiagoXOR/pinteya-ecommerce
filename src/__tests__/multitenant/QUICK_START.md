# Quick Start - Tests Multitenant

## Ejecución Rápida

```bash
# Todos los tests
npm run test:multitenant

# Solo unitarios (más rápidos)
npm run test:multitenant:unit

# Solo integración
npm run test:multitenant:integration

# Solo seguridad
npm run test:multitenant:security

# Con cobertura
npm run test:multitenant:coverage
```

## Tests E2E

```bash
# Asegúrate de tener el servidor corriendo en localhost:3000
npm run dev

# En otra terminal, ejecuta los tests E2E
npm run test:multitenant:e2e
```

## Estructura Rápida

- **unit/** - Tests unitarios (servicios, hooks, componentes)
- **integration/** - Tests de integración (APIs, feeds, analytics)
- **security/** - Tests de seguridad (RLS, acceso cruzado, guards)
- **e2e/** - Tests end-to-end (Playwright)

## Datos de Prueba

Los tests usan dos tenants de ejemplo:
- **Pinteya** (`pinteya-uuid-1234`)
- **Pintemas** (`pintemas-uuid-5678`)

Ver `fixtures.ts` para datos completos.

## Troubleshooting Rápido

**Error: Cannot find module**
- Verificar que los mocks estén en `setup.ts`
- Verificar imports en los tests

**Error: getTenantConfig is not a function**
- Verificar que el mock esté configurado antes de importar

**Tests E2E fallan**
- Asegurar que el servidor esté corriendo en `localhost:3000`
- Verificar que los dominios estén configurados en `/etc/hosts` o usar IPs
