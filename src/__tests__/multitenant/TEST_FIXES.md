# Correcciones Necesarias para Tests

## Problemas Identificados

### 1. React cache() no está siendo mockeado correctamente
**Problema**: El módulo `@/lib/tenant/tenant-service.ts` usa `cache()` de React, pero el mock no se aplica antes de que se importe el módulo.

**Solución**: Mockear `react` en `setup.ts` ANTES de cualquier import, o mockear completamente el módulo `@/lib/tenant` en cada test que lo necesite.

### 2. Middleware importa next-auth/jwt que tiene problemas con ESM
**Problema**: `next-auth/jwt` usa ESM y Jest no lo puede procesar correctamente.

**Solución**: Mockear completamente el middleware en lugar de importarlo directamente.

### 3. Test de tenant-theme necesita extensión .tsx
**Solución**: Ya corregido - renombrado a `.tsx`

## Estado Actual

- ✅ `tenant-context.test.tsx` - PASANDO
- ✅ `tenant-theme.test.tsx` - PASANDO  
- ❌ `tenant-service.test.ts` - FALLA: React cache no mockeado
- ❌ `middleware-detection.test.ts` - FALLA: next-auth/jwt ESM

## Próximos Pasos

1. Mockear `react` en `jest.setup.js` globalmente
2. O mockear completamente `@/lib/tenant` en cada test
3. Mejorar mock del middleware para evitar importar next-auth/jwt
