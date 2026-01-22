# Roadmap para Alcanzar 100% de Cobertura

## Estado Actual: 39/52 tests pasando (75%)

### Tests que Faltan (13 tests)

#### tenant-service.test.ts (4 tests)
- `getTenantBySlug` - 2 tests
- `getTenantById` - 2 tests

**Problema**: Mock de `createAdminClient` no se aplica correctamente

**Solución**:
1. Verificar que el mock se ejecute antes de importar
2. Usar `jest.doMock` en lugar de `jest.mock` si es necesario
3. Asegurar que el mock retorne el objeto correcto

#### tenant-service-with-headers.test.ts (7 tests)
- `getTenantConfig` - 4 tests
- `getTenantPublicConfig` - 1 test
- `isAdminRequest` - 2 tests

**Problema**: Mock del módulo `@/lib/tenant` no funciona correctamente

**Solución**:
1. Mockear `@/lib/tenant/tenant-service` directamente
2. O usar tests de integración para estas funciones
3. O mockear `next/headers` de manera más agresiva

#### middleware-detection.test.ts (2 tests)
- Ya están pasando ✅

## Plan de Acción

### Paso 1: Corregir Mock de createAdminClient
- [ ] Verificar orden de mocks
- [ ] Asegurar que el mock se ejecute antes de importar
- [ ] Verificar que el mock retorne el objeto correcto

### Paso 2: Corregir Mock de @/lib/tenant
- [ ] Revisar cómo se re-exporta desde tenant-service
- [ ] Ajustar el mock para que funcione con re-exports
- [ ] O considerar tests de integración

### Paso 3: Verificar Todos los Tests
- [ ] Ejecutar suite completa
- [ ] Verificar que todos pasen
- [ ] Revisar cobertura

## Comandos Útiles

```bash
# Ejecutar todos los tests
npm run test:multitenant:unit

# Ejecutar un test específico
npm run test:multitenant:unit -- tenant-service.test.ts

# Ver detalles de fallos
npm run test:multitenant:unit -- --verbose

# Ver cobertura
npm run test:multitenant:coverage
```
