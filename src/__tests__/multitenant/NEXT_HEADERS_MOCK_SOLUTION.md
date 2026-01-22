# Solución para Mockear next/headers en Tests

## Problema

Next.js `headers()` verifica el request store internamente y lanza un error si se llama fuera de un contexto de request. Esto hace difícil testear funciones que usan `headers()`.

## Soluciones Posibles

### Opción 1: Mockear el módulo completo (Recomendado para funciones que no usan headers)

Para funciones como `getTenantBySlug`, `getTenantById`, `getAllTenants`, `getTenantBaseUrl` que NO usan `headers()`, podemos testearlas directamente sin problemas.

### Opción 2: Tests de integración para funciones que usan headers

Para funciones como `getTenantConfig()`, `getTenantPublicConfig()`, `isAdminRequest()` que SÍ usan `headers()`, es mejor:
- Testearlas como tests de integración usando el servidor real
- O mockear el módulo `@/lib/tenant` completo en lugar de `next/headers`

### Opción 3: Usar __mocks__ directory

Crear `__mocks__/next/headers.ts`:

```typescript
export const headers = jest.fn(() => Promise.resolve(new Headers()))
```

Y en el test:
```typescript
jest.mock('next/headers')
```

## Estado Actual

- ✅ Funciones sin `headers()`: Testeables directamente
- ⚠️ Funciones con `headers()`: Requieren tests de integración o mocks más complejos

## Recomendación

Separar los tests:
1. Tests unitarios para funciones que NO usan `headers()`
2. Tests de integración para funciones que SÍ usan `headers()`
