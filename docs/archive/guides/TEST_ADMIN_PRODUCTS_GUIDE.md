# 🧪 Guía de Testing E2E - Panel Administrativo de Productos

**Versión:** 1.0  
**Última actualización:** 27 de Octubre, 2025

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración](#configuración)
4. [Ejecutar Tests](#ejecutar-tests)
5. [Estructura de Tests](#estructura-de-tests)
6. [Helpers y Utilidades](#helpers-y-utilidades)
7. [Solución de Problemas](#solución-de-problemas)
8. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

Suite completa de tests E2E con Playwright para el panel administrativo de productos. Cubre:

- ✅ CRUD completo de productos
- ✅ Gestión avanzada de variantes (expandir, crear, editar, duplicar, activar/desactivar, marcar default, eliminar)
- ✅ Tests responsive (móvil y desktop)
- ✅ Tests de performance con carga de productos/variantes
- ✅ Tests de integración end-to-end

**Cobertura:** ~150+ tests individuales

---

## 🔧 Requisitos Previos

1. **Node.js:** v18+ instalado
2. **Servidor desarrollo:** `npm run dev` debe estar corriendo en `localhost:3000`
3. **Variables de entorno:** `.env.local` con BYPASS_AUTH=true
4. **Base de datos:** Supabase configurado con datos de prueba

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crear `.env.test` en la raíz del proyecto:

```env
# Testing Environment
BYPASS_AUTH=true
NODE_ENV=development
PLAYWRIGHT_TEST=true

# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Base URL
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

---

## 🚀 Ejecutar Tests

### Ejecutar Suite Completa

```bash
npm run test:admin:products
```

### Modo UI (Playwright UI)

```bash
npm run test:admin:products:ui
```

### Modo Debug

```bash
npm run test:admin:products:debug
```

### Modo Headed (con navegador visible)

```bash
npm run test:admin:products:headed
```

### Solo Tests de Variantes

```bash
npm run test:admin:variants
```

### Solo Tests Móviles

```bash
npm run test:admin:products:mobile
```

### Solo Tests de Performance

```bash
npm run test:admin:products:performance
```

---

## 📁 Estructura de Tests

```
e2e/
├── admin/
│   └── products/
│       ├── products-list.spec.ts          # Lista de productos
│       ├── product-create.spec.ts         # Crear producto
│       ├── product-edit.spec.ts           # Editar producto
│       ├── product-delete.spec.ts          # Eliminar producto
│       ├── variants-expand.spec.ts        # Expandir/colapsar variantes
│       ├── variant-create.spec.ts         # Crear variante
│       ├── variant-edit.spec.ts           # Editar variante
│       ├── variant-duplicate.spec.ts       # Duplicar variante
│       ├── variant-toggle-active.spec.ts   # Toggle activo/inactivo
│       ├── variant-set-default.spec.ts    # Marcar como default
│       ├── variant-delete.spec.ts         # Eliminar variante
│       ├── mobile/                         # Tests responsive
│       │   ├── products-list-mobile.spec.ts
│       │   ├── variants-mobile.spec.ts
│       │   └── tablet-view.spec.ts
│       ├── performance/                    # Tests de performance
│       │   ├── products-load.spec.ts
│       │   ├── variants-load.spec.ts
│       │   └── bulk-operations.spec.ts
│       └── integration/                   # Tests de integración
│           ├── complete-product-flow.spec.ts
│           └── bulk-variants-edit.spec.ts
├── helpers/
│   ├── admin-auth.helper.ts               # Autenticación bypass
│   ├── test-data.helper.ts                # Datos de prueba
│   ├── screenshot.helper.ts               # Screenshots
│   ├── wait.helper.ts                     # Esperas inteligentes
│   └── assertions.helper.ts               # Assertions personalizados
└── fixtures/
    └── products.fixture.ts                # Fixtures de datos
```

---

## 🛠️ Helpers y Utilidades

### Autenticación

```typescript
import { setupAdminBypass, navigateToAdminPanel } from '../helpers/admin-auth.helper'

// Configurar bypass de auth
await setupAdminBypass(page)

// Navegar al panel
await navigateToAdminPanel(page)
```

### Datos de Prueba

```typescript
import { TEST_PRODUCT_IDS, generateTestProduct } from '../helpers/test-data.helper'

// Usar IDs de productos existentes
const productId = TEST_PRODUCT_IDS.PRODUCT_WITH_VARIANTS

// Generar datos aleatorios
const productData = generateTestProduct()
```

### Screenshots

```typescript
import { takeStepScreenshot, takeFullPageScreenshot } from '../helpers/screenshot.helper'

// Screenshot de elemento
await takeStepScreenshot(page, 'product-created')

// Screenshot completo
await takeFullPageScreenshot(page, 'admin-panel')
```

### Esperas

```typescript
import { waitForTableLoad, waitForVariantsExpand, waitForNotification } from '../helpers/wait.helper'

// Esperar a que cargue tabla
await waitForTableLoad(page)

// Esperar a que se expandan variantes
await waitForVariantsExpand(page, productId)

// Esperar notificación
await waitForNotification(page, 'success')
```

### Assertions

```typescript
import { assertProductInList, assertVariantCount, assertVariantDefault } from '../helpers/assertions.helper'

// Verificar producto en lista
await assertProductInList(page, 'Nombre Producto')

// Verificar contador de variantes
await assertVariantCount(page, productId, 10)

// Verificar variante default
await assertVariantDefault(page, variantId)
```

---

## ❌ Solución de Problemas

### Error: "Servidor no disponible"

**Solución:** Asegúrate de que `npm run dev` esté corriendo en puerto 3000.

```bash
npm run dev
```

### Error: "BYPASS_AUTH no configurado"

**Solución:** Verifica que `.env.test` existe con `BYPASS_AUTH=true`.

### Error: "Timeout en carga de variantes"

**Solución:** Aumenta timeout en config o verifica rendimiento de BD.

### Error: "Imágenes no cargan en tests"

**Solución:** Verifica que URLs de imágenes de placeholder estén disponibles.

---

## 💡 Mejores Prácticas

### 1. Uso de Data-TestIDs

Siempre usa `data-testid` para localizar elementos:

```typescript
// ❌ MAL - Selector frágil
await page.click('.button-class')

// ✅ BIEN - Selector estable
await page.click('[data-testid="new-product-button"]')
```

### 2. Esperas Inteligentes

Evita `waitForTimeout` fijos. Usa helpers de espera:

```typescript
// ❌ MAL
await page.waitForTimeout(3000)

// ✅ BIEN
await waitForTableLoad(page)
```

### 3. Screenshots en Pasos Importantes

Captura screenshots en pasos críticos:

```typescript
await page.fill('[data-testid="product-name"]', 'Test Product')
await takeStepScreenshot(page, 'product-form-filled')
```

### 4. Cleanup de Datos

Siempre limpia datos de test creados:

```typescript
test.afterEach(async ({ page }) => {
  await cleanupTestData()
})
```

### 5. Tests Independientes

Cada test debe ser independiente y no depender de otros:

```typescript
// ❌ MAL - Depende de ejecución anterior
test('Editar producto', async () => {
  await page.goto('/admin/products/1/edit')
})

// ✅ BIEN - Independiente
test('Editar producto', async () => {
  await createTestProduct()
  await page.goto(`/admin/products/${productId}/edit`)
})
```

---

## 📊 Cobertura Esperada

- **Productos:** 100% CRUD
- **Variantes:** 100% operaciones
- **UI:** 100% componentes principales
- **Responsive:** Mobile, Tablet, Desktop
- **Performance:** Carga con datasets grandes (60+ variantes)
- **Total:** ~150+ tests individuales

---

## 🎓 Ejemplos de Tests

### Test de Lista de Productos

```typescript
test('Debe cargar la página de productos', async ({ page }) => {
  await setupAdminBypass(page)
  await navigateToAdminPanel(page)
  
  await expect(page.getByText('Gestión de Productos')).toBeVisible()
  await takeFullPageScreenshot(page, 'products-page-loaded')
})
```

### Test de Crear Variante

```typescript
test('Debe crear nueva variante', async ({ page }) => {
  await setupAdminBypass(page)
  await navigateToAdminPanel(page)
  
  // Expandir producto
  await page.click(`[data-testid="variant-count-92"]`)
  await waitForVariantsExpand(page, '92')
  
  // Click en "Nueva Variante"
  await page.click('[data-testid="new-variant-button"]')
  
  // Llenar formulario
  await page.fill('[data-testid="variant-color"]', 'Blanco Test')
  await page.fill('[data-testid="variant-measure"]', '4L')
  await page.fill('[data-testid="variant-aikon-id"]', 'TEST-BLANCO-4L')
  
  // Guardar
  await page.click('[data-testid="save-variant-button"]')
  
  // Verificar notificación
  await waitForNotification(page, 'success')
  
  // Verificar aparece en tabla
  await expect(page.getByText('Blanco Test')).toBeVisible()
})
```

---

**¡Happy Testing! 🎉**

Para más información, ver `TEST_ADMIN_PRODUCTS_E2E_STATUS.md`

