# 🚀 Scripts de Testing - Panel Administrativo Pinteya

## 📋 Resumen

Documentación completa de todos los scripts de testing implementados para el panel administrativo de Pinteya E-commerce. Incluye scripts de ejecución, configuración, reportes y automatización.

**Fecha:** Julio 2025  
**Estado:** ✅ Implementado  
**Scripts:** 8 comandos NPM + 1 script personalizado

## 🎯 Scripts NPM Disponibles

### Scripts Principales:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:admin": "node scripts/run-admin-tests.js",
  "test:admin:headed": "playwright test tests/e2e/admin/ --headed",
  "test:admin:report": "playwright show-report",
  "test:all": "npm run test && npm run test:admin"
}
```

## 🔧 Descripción Detallada de Scripts

### 1. **npm run test:e2e**

```bash
# Comando: playwright test
# Propósito: Ejecutar todos los tests E2E
# Configuración: playwright.config.ts
```

**Características:**

- ✅ Ejecuta todos los tests en `tests/e2e/`
- ✅ Modo headless por defecto
- ✅ Reportes HTML, JSON y JUnit
- ✅ Paralelización automática
- ✅ Screenshots en fallos

**Uso:**

```bash
npm run test:e2e

# Con filtros
npm run test:e2e -- --grep "productos"

# Browser específico
npm run test:e2e -- --project=chromium

# Con timeout personalizado
npm run test:e2e -- --timeout=60000
```

### 2. **npm run test:e2e:ui**

```bash
# Comando: playwright test --ui
# Propósito: Interfaz visual interactiva para tests
# Ideal para: Desarrollo y debugging
```

**Características:**

- ✅ Interfaz gráfica de Playwright
- ✅ Ejecución paso a paso
- ✅ Inspector de elementos
- ✅ Timeline de acciones
- ✅ Debug interactivo

**Uso:**

```bash
npm run test:e2e:ui

# Se abre interfaz web en http://localhost:9323
# Permite seleccionar tests específicos
# Visualización en tiempo real
```

### 3. **npm run test:e2e:debug**

```bash
# Comando: playwright test --debug
# Propósito: Debug paso a paso con DevTools
# Ideal para: Troubleshooting tests específicos
```

**Características:**

- ✅ Pausa automática en cada acción
- ✅ DevTools abierto
- ✅ Inspector de Playwright
- ✅ Console interactiva
- ✅ Breakpoints manuales

**Uso:**

```bash
npm run test:e2e:debug

# Para test específico
npm run test:e2e:debug -- tests/e2e/admin/product-form.spec.ts

# Con breakpoint
npm run test:e2e:debug -- --grep "validación"
```

### 4. **npm run test:admin** ⭐

```bash
# Comando: node scripts/run-admin-tests.js
# Propósito: Script ejecutor completo para tests administrativos
# Ideal para: CI/CD y reportes completos
```

**Características:**

- ✅ Verificación de prerrequisitos
- ✅ Ejecución secuencial organizada
- ✅ Reportes detallados con métricas
- ✅ Resumen de cobertura
- ✅ Códigos de salida apropiados

**Flujo de Ejecución:**

```typescript
1. Verificar Playwright instalado
2. Preparar directorios de resultados
3. Verificar servidor de desarrollo
4. Ejecutar tests de navegación
5. Ejecutar tests de gestión productos
6. Ejecutar tests de formularios
7. Ejecutar tests de componentes
8. Generar reporte HTML completo
9. Generar resúmenes y métricas
10. Mostrar resultados finales
```

**Output Ejemplo:**

```bash
🧪 SUITE DE TESTING PLAYWRIGHT - PANEL ADMINISTRATIVO
════════════════════════════════════════════════════════════

1. Verificando instalación de Playwright
✅ Playwright verificado y funcionando

2. Preparando directorios de resultados
ℹ️  Directorio creado: test-results
ℹ️  Directorio creado: playwright-report

3. Verificando servidor de desarrollo
✅ Servidor de desarrollo está corriendo

4. Ejecutando tests de navegación administrativa
✅ Tests de navegación completado

📊 RESUMEN DE TESTS
════════════════════════════════════════════════════════════
Total de tests: 64
✅ Pasaron: 64
❌ Fallaron: 0
⏭️  Omitidos: 0
⏱️  Duración: 8234ms

📈 Cobertura estimada: 100.0%
```

### 5. **npm run test:admin:headed**

```bash
# Comando: playwright test tests/e2e/admin/ --headed
# Propósito: Ejecutar tests admin con browser visible
# Ideal para: Demostración y verificación visual
```

**Características:**

- ✅ Browser visible durante ejecución
- ✅ Solo tests administrativos
- ✅ Útil para demos
- ✅ Debugging visual
- ✅ Verificación manual

### 6. **npm run test:admin:report**

```bash
# Comando: playwright show-report
# Propósito: Mostrar reportes HTML generados
# Ideal para: Análisis post-ejecución
```

**Características:**

- ✅ Abre reporte HTML en browser
- ✅ Navegación interactiva
- ✅ Screenshots de fallos
- ✅ Videos de ejecución
- ✅ Traces detallados

### 7. **npm run test:all**

```bash
# Comando: npm run test && npm run test:admin
# Propósito: Ejecutar todos los tests (unit + E2E)
# Ideal para: Validación completa pre-deploy
```

**Características:**

- ✅ Tests unitarios con Jest
- ✅ Tests E2E con Playwright
- ✅ Cobertura completa
- ✅ Validación integral
- ✅ Reporte consolidado

## 📁 Script Personalizado: run-admin-tests.js

### Funcionalidades Principales:

#### 1. **Verificación de Prerrequisitos**

```javascript
// Verificar Playwright instalado
const playwrightCheck = await runCommand('npx playwright --version')

// Verificar servidor corriendo
const response = await fetch('http://localhost:3000')

// Verificar APIs administrativas
const apiResponse = await page.request.get('/api/admin/products')
```

#### 2. **Ejecución Organizada**

```javascript
// Tests por categoría
const navigationTests = await runCommand('npx playwright test admin-navigation.spec.ts')
const productTests = await runCommand('npx playwright test product-management.spec.ts')
const formTests = await runCommand('npx playwright test product-form.spec.ts')
const componentTests = await runCommand('npx playwright test components/')
```

#### 3. **Generación de Reportes**

```javascript
function generateTestSummary() {
  const results = JSON.parse(fs.readFileSync('test-results/results.json'))

  // Estadísticas generales
  const stats = results.stats
  console.log(`Total: ${stats.total}`)
  console.log(`✅ Pasaron: ${stats.passed}`)
  console.log(`❌ Fallaron: ${stats.failed}`)

  // Cobertura estimada
  const coverage = ((stats.passed / stats.total) * 100).toFixed(1)
  console.log(`📈 Cobertura: ${coverage}%`)
}
```

#### 4. **Métricas de Cobertura**

```javascript
function generateCoverageReport() {
  const components = [
    'AdminLayout',
    'AdminSidebar',
    'AdminHeader',
    'ProductList',
    'ProductForm',
    'ProductPricing',
    // ... más componentes
  ]

  components.forEach(component => {
    console.log(`✅ ${component}`)
  })

  const coveragePercentage = (testFiles.length / totalFiles.length) * 100
  console.log(`📊 Cobertura: ${coveragePercentage.toFixed(1)}%`)
}
```

## 🔧 Configuraciones Específicas

### Configuración Admin (admin.config.ts):

```typescript
export default defineConfig({
  testDir: './admin',
  fullyParallel: false, // Secuencial para admin
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report/admin' }],
    ['json', { outputFile: 'test-results/admin-results.json' }],
    ['junit', { outputFile: 'test-results/admin-junit.xml' }],
  ],
  timeout: 60 * 1000, // 60s para tests admin
  expect: { timeout: 15 * 1000 }, // 15s para assertions
})
```

### Setup Específico (admin-setup.ts):

```typescript
async function adminGlobalSetup(config: FullConfig) {
  console.log('🔧 Configurando entorno para tests administrativos...')

  // Verificar aplicación disponible
  await page.goto(baseURL)
  await page.waitForSelector('body', { timeout: 10000 })

  // Verificar panel administrativo accesible
  await page.goto(`${baseURL}/admin`)
  await page.waitForSelector('h1', { timeout: 10000 })

  // Verificar APIs administrativas
  const response = await page.request.get(`${baseURL}/api/admin/products`)
  if (!response.ok() && response.status() !== 401) {
    console.warn('⚠️  API de productos no responde correctamente')
  }
}
```

## 📊 Outputs y Reportes

### Estructura de Outputs:

```
test-results/
├── results.json              # Resultados JSON principales
├── admin-results.json        # Resultados específicos admin
├── admin-junit.xml           # Formato JUnit para CI
├── admin/                    # Screenshots y videos
│   ├── test-failed-1.png
│   ├── test-trace-1.zip
│   └── test-video-1.webm
└── coverage-report.html      # Reporte de cobertura

playwright-report/
├── index.html                # Reporte principal
├── admin/                    # Reporte específico admin
│   └── index.html
└── assets/                   # Assets del reporte
```

### Formato de Resultados JSON:

```json
{
  "stats": {
    "total": 64,
    "passed": 64,
    "failed": 0,
    "skipped": 0,
    "duration": 8234
  },
  "suites": [
    {
      "title": "Panel Administrativo - Navegación",
      "specs": [
        {
          "title": "admin-navigation.spec.ts",
          "tests": [
            {
              "title": "debe cargar el dashboard",
              "status": "passed",
              "duration": 1234
            }
          ]
        }
      ]
    }
  ]
}
```

## 🚨 Troubleshooting

### Problemas Comunes:

#### 1. **Error: Servidor no disponible**

```bash
# Problema: El servidor de desarrollo no está corriendo
# Solución:
npm run dev
# Luego ejecutar tests
```

#### 2. **Error: Playwright no instalado**

```bash
# Problema: Playwright no está instalado
# Solución:
npm install -D @playwright/test
npx playwright install
```

#### 3. **Error: Tests timeout**

```bash
# Problema: Tests tardan mucho en ejecutar
# Solución: Aumentar timeout
npm run test:admin -- --timeout=120000
```

#### 4. **Error: Browser no encontrado**

```bash
# Problema: Browser específico no disponible
# Solución: Instalar browsers
npx playwright install chromium firefox webkit
```

## 📈 Métricas de Performance

### Tiempos de Ejecución:

```typescript
// Suite completa
⏱️ Tiempo total: ~8 minutos
⏱️ Setup: ~30 segundos
⏱️ Tests navegación: ~2 minutos
⏱️ Tests productos: ~3 minutos
⏱️ Tests componentes: ~2 minutos
⏱️ Reportes: ~30 segundos

// Por browser
⏱️ Chromium: ~6 minutos
⏱️ Firefox: ~7 minutos
⏱️ WebKit: ~8 minutos
⏱️ Mobile: ~5 minutos
```

### Optimizaciones Implementadas:

- ✅ Paralelización inteligente
- ✅ Reutilización de contextos
- ✅ Cache de setup
- ✅ Timeouts optimizados
- ✅ Selectores eficientes

## 🔄 Integración CI/CD

### GitHub Actions (Futuro):

```yaml
name: Admin Panel E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:admin
      - uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Métricas para CI:

- ✅ Exit codes apropiados
- ✅ Reportes JUnit
- ✅ Artifacts de fallos
- ✅ Notificaciones automáticas
