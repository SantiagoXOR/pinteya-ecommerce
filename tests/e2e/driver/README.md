# Tests E2E para Sistema de Drivers

Este directorio contiene los tests end-to-end (E2E) para el sistema de drivers usando Playwright.

## Archivos de Tests

### `driver-system.spec.ts`
Tests E2E completos para el sistema de drivers que incluyen:

- **Authentication Flow**: Flujos de autenticación y redirección
- **Driver Dashboard**: Verificación de estructura y funcionalidad del dashboard
- **Driver Navigation**: Navegación entre páginas
- **Driver Routes Page**: Gestión de rutas
- **Driver Deliveries Page**: Gestión de entregas
- **Driver Profile Page**: Perfil del driver
- **GPS and Location Features**: Funcionalidades de geolocalización
- **Responsive Design**: Tests en diferentes viewports (mobile, tablet, desktop)
- **API Integration**: Integración con APIs y manejo de errores
- **Performance**: Métricas de rendimiento
- **Accessibility**: Accesibilidad y navegación por teclado

### `driver-admin.spec.ts`
Tests E2E para el panel de administración de drivers:

- **Driver Management**: CRUD de drivers
- **Routes Management**: Gestión de rutas
- **Driver Assignment**: Asignación de drivers a rutas

## Ejecutar Tests

### Ejecutar todos los tests de drivers
```bash
npx playwright test tests/e2e/driver
```

### Ejecutar un archivo específico
```bash
npx playwright test tests/e2e/driver/driver-system.spec.ts
```

### Ejecutar en modo UI (interactivo)
```bash
npx playwright test tests/e2e/driver --ui
```

### Ejecutar en modo headed (con navegador visible)
```bash
npx playwright test tests/e2e/driver --headed
```

### Ejecutar en modo debug
```bash
npx playwright test tests/e2e/driver --debug
```

### Ejecutar en un navegador específico
```bash
# Chrome
npx playwright test tests/e2e/driver --project=ui-public

# Firefox
npx playwright test tests/e2e/driver --project=firefox

# WebKit (Safari)
npx playwright test tests/e2e/driver --project=webkit
```

## Configuración

Los tests utilizan la configuración de Playwright definida en `playwright.config.ts`.

### Variables de Entorno

Los tests pueden requerir las siguientes variables de entorno:
- `PLAYWRIGHT_BASE_URL`: URL base de la aplicación (default: `http://localhost:3000`)
- `NODE_ENV`: Entorno de ejecución

### Permisos de Geolocalización

Los tests configuran automáticamente permisos de geolocalización mock para probar funcionalidades GPS.

## Estructura de Tests

Cada test sigue esta estructura:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup común para cada test
  })

  test('should do something', async ({ page }) => {
    // Test específico
  })
})
```

## Mejores Prácticas

1. **Usar `waitForLoadState`**: Esperar a que la página cargue completamente antes de interactuar
2. **Verificar elementos antes de interactuar**: Usar `isVisible()` antes de hacer clic
3. **Usar selectores robustos**: Preferir `data-testid` sobre selectores CSS frágiles
4. **Manejar errores gracefully**: Los tests deben verificar que la aplicación maneja errores sin crashear
5. **Tests independientes**: Cada test debe poder ejecutarse de forma independiente

## Debugging

### Ver trace de un test fallido
```bash
npx playwright show-trace test-results/trace.zip
```

### Ver screenshots de fallos
Los screenshots se guardan automáticamente en `test-results/` cuando un test falla.

### Ver video de ejecución
Los videos se guardan automáticamente en `test-results/` cuando un test falla (si está configurado).

## CI/CD

Los tests están configurados para ejecutarse en CI/CD con:
- Retry automático en caso de fallos
- Reportes HTML y JSON
- Screenshots y videos en fallos
- Timeouts apropiados para entornos CI

## Notas

- Los tests están diseñados para ser resilientes y no depender de datos específicos
- Algunos tests pueden requerir autenticación, que se maneja automáticamente
- Los tests de geolocalización usan mocks para evitar depender de GPS real





