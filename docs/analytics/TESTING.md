# Guía de Testing: Sistema de Analytics

**Última actualización:** 16 de Enero, 2026  
**Estado:** ✅ Suite de Tests Completa

---

## 📋 Índice

1. [Estructura de Tests](#estructura-de-tests)
2. [Ejecutar Tests](#ejecutar-tests)
3. [Tipos de Tests](#tipos-de-tests)
4. [Cobertura](#cobertura)
5. [Agregar Nuevos Tests](#agregar-nuevos-tests)
6. [Troubleshooting](#troubleshooting)

---

## Estructura de Tests

### Unit Tests

**Ubicación:** `src/__tests__/lib/analytics/`

- `send-strategies.test.ts` - Estrategias de envío
- `adblock-detector.test.ts` - Detección de bloqueadores
- `event-persistence.test.ts` - Persistencia y retry
- `indexeddb-manager.test.ts` - Gestión de IndexedDB
- `metrics-calculator.test.ts` - Cálculo de métricas
- `metrics-cache.test.ts` - Cache Redis y memoria

### Component Tests

**Ubicación:** `src/__tests__/components/Analytics/`

- `UnifiedAnalyticsProvider.test.tsx` - Provider unificado

### Integration Tests

**Ubicación:** `src/__tests__/api/`

- `track/events.test.ts` - Endpoint alternativo
- `analytics/metrics.test.ts` - API de métricas

### E2E Tests

**Ubicación:** `tests/e2e/analytics/`

- `tracking-flow.spec.ts` - Flujo completo de tracking
- `adblock-resistance.spec.ts` - Resistencia a bloqueadores
- `dashboard.spec.ts` - Dashboard de analytics

### Database Tests

**Ubicación:** `tests/database/`

- `analytics-functions.test.ts` - Funciones SQL

---

## Ejecutar Tests

### Todos los Tests

```bash
npm test
```

### Tests Específicos

```bash
# Solo tests de analytics
npm test -- analytics

# Solo unit tests
npm test -- __tests__/lib/analytics

# Solo integration tests
npm test -- __tests__/api

# Con cobertura
npm run test:coverage
```

### E2E Tests

```bash
# Todos los E2E tests de analytics
npx playwright test tests/e2e/analytics

# Test específico
npx playwright test tests/e2e/analytics/tracking-flow.spec.ts

# Con UI
npx playwright test tests/e2e/analytics --ui
```

### Database Tests

```bash
# Requiere variables de entorno de Supabase configuradas
npm test -- tests/database/analytics-functions
```

---

## Tipos de Tests

### Unit Tests

**Objetivo:** Testear componentes individuales aislados

**Ejemplo:**
```typescript
describe('SendStrategies', () => {
  it('debería enviar evento exitosamente', async () => {
    const result = await sendStrategies.sendEvent(mockEvent)
    expect(result.success).toBe(true)
  })
})
```

**Características:**
- Mocks de dependencias
- Tests rápidos (< 100ms cada uno)
- Alta cobertura de código

### Integration Tests

**Objetivo:** Testear interacción entre componentes

**Ejemplo:**
```typescript
describe('POST /api/track/events', () => {
  it('debería insertar evento exitosamente', async () => {
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

**Características:**
- Mocks de servicios externos
- Tests moderados (< 1s cada uno)
- Verificación de flujos completos

### E2E Tests

**Objetivo:** Testear flujos completos end-to-end

**Ejemplo:**
```typescript
test('debería trackear flujo completo', async ({ page }) => {
  await page.goto('/')
  // ... verificar eventos
})
```

**Características:**
- Tests reales con navegador
- Tests más lentos (< 10s cada uno)
- Verificación de comportamiento real

### Database Tests

**Objetivo:** Testear funciones SQL directamente

**Ejemplo:**
```typescript
it('debería insertar evento correctamente', async () => {
  const { data, error } = await supabase.rpc('insert_analytics_event_optimized', {...})
  expect(error).toBeNull()
})
```

**Características:**
- Requiere conexión a base de datos
- Tests moderados (< 2s cada uno)
- Verificación de lógica SQL

---

## Cobertura

### Cobertura Actual

- **send-strategies.ts**: 95%+
- **adblock-detector.ts**: 90%+
- **event-persistence.ts**: 90%+
- **indexeddb-manager.ts**: 85%+
- **metrics-calculator.ts**: 85%+
- **metrics-cache.ts**: 90%+
- **UnifiedAnalyticsProvider.tsx**: 80%+
- **APIs**: 80%+

### Ver Cobertura

```bash
npm run test:coverage
```

El reporte se genera en `coverage/` y se puede abrir en el navegador.

---

## Agregar Nuevos Tests

### 1. Crear Archivo de Test

**Para unit tests:**
```typescript
// src/__tests__/lib/analytics/nuevo-componente.test.ts
import { nuevoComponente } from '@/lib/analytics/nuevo-componente'

describe('NuevoComponente', () => {
  it('debería funcionar correctamente', () => {
    // Test implementation
  })
})
```

**Para integration tests:**
```typescript
// src/__tests__/api/nueva-ruta.test.ts
import { GET } from '@/app/api/nueva-ruta/route'

describe('GET /api/nueva-ruta', () => {
  it('debería retornar datos correctos', async () => {
    // Test implementation
  })
})
```

### 2. Usar Mocks Compartidos

```typescript
import {
  setupAnalyticsMocks,
  cleanupAnalyticsMocks,
  createMockAnalyticsEvent,
} from '../../setup/analytics-mocks'

beforeEach(() => {
  setupAnalyticsMocks()
})

afterEach(() => {
  cleanupAnalyticsMocks()
})
```

### 3. Mockear Dependencias

```typescript
jest.mock('@/lib/analytics/dependencia', () => ({
  dependencia: {
    metodo: jest.fn().mockResolvedValue({ success: true }),
  },
}))
```

### 4. Ejecutar y Verificar

```bash
npm test -- nuevo-componente
```

---

## Troubleshooting

### Problema: Tests fallan con "IndexedDB no está disponible"

**Solución:** Asegúrate de que `fake-indexeddb` está instalado y el setup file está incluido en `jest.config.js`:

```javascript
setupFilesAfterEnv: [
  // ...
  '<rootDir>/__tests__/setup/indexeddb-setup.ts',
]
```

### Problema: Tests de base de datos fallan

**Solución:** Verifica que las variables de entorno están configuradas:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Los tests de base de datos se omiten automáticamente si no están configuradas.

### Problema: Mocks no funcionan correctamente

**Solución:** Asegúrate de limpiar mocks entre tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Problema: Tests E2E son lentos

**Solución:** 
- Usa `page.waitForLoadState('networkidle')` en lugar de timeouts largos
- Limita el número de tests E2E ejecutados en CI
- Usa `test.describe.parallel()` para tests independientes

### Problema: Tests flakey (intermitentes)

**Solución:**
- Aumenta timeouts si es necesario
- Usa `waitFor` en lugar de `waitForTimeout`
- Verifica que los mocks están correctamente configurados

---

## Mejores Prácticas

### 1. Nombres Descriptivos

```typescript
// ✅ Bueno
it('debería enviar evento exitosamente con estrategia alternativa', async () => {
  // ...
})

// ❌ Malo
it('test 1', () => {
  // ...
})
```

### 2. Un Test, Una Aserción (cuando sea posible)

```typescript
// ✅ Bueno
it('debería retornar métricas correctas', () => {
  expect(metrics.ecommerce.cartAdditions).toBe(10)
  expect(metrics.engagement.uniqueSessions).toBe(5)
})

// ❌ Malo (demasiadas aserciones no relacionadas)
it('debería hacer todo', () => {
  expect(a).toBe(1)
  expect(b).toBe(2)
  expect(c).toBe(3)
  expect(d).toBe(4)
  // ... 20 más
})
```

### 3. Usar Helpers y Mocks Compartidos

```typescript
// ✅ Bueno
import { createMockAnalyticsEvent } from '../../setup/analytics-mocks'

const event = createMockAnalyticsEvent({ event: 'page_view' })

// ❌ Malo
const event = {
  event: 'page_view',
  category: 'navigation',
  // ... repetido en cada test
}
```

### 4. Limpiar Después de Tests

```typescript
afterEach(() => {
  cleanupAnalyticsMocks()
  jest.clearAllMocks()
})
```

### 5. Tests Independientes

Cada test debe poder ejecutarse de forma independiente sin depender de otros tests.

---

## Comandos Útiles

### Ejecutar Tests en Modo Watch

```bash
npm run test:watch
```

### Ejecutar Tests con Verbose

```bash
npm test -- --verbose
```

### Ejecutar Solo Tests que Fallaron

```bash
npm test -- --onlyFailures
```

### Ejecutar Tests con Filtro

```bash
npm test -- --testNamePattern="debería enviar"
```

---

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Fake IndexedDB](https://github.com/dumbmatter/fakeIndexedDB)

---

**Mantenido por:** Equipo de Desarrollo Pinteya  
**Última revisión:** 16 de Enero, 2026
