# Framework de Testing Automatizado

## 📋 Descripción

Framework completo de testing automatizado que incluye:

- ✅ Generación de reportes detallados
- 📸 Captura automática de pantallas en pasos críticos
- 📝 Documentación automática de cada acción
- ⏰ Marcas de tiempo para cada paso y captura
- 🎯 Tests E2E completos del flujo de compra

## 🚀 Instalación

### Instalar dependencias

```bash
npm install cross-env
```

### Verificar que Playwright esté configurado

```bash
npx playwright install
```

## 📁 Estructura del Framework

```
src/lib/testing/
├── automated-test-framework.ts    # Framework base
├── screenshot-manager.ts          # Gestión de capturas
├── report-generator.ts           # Generación de reportes
├── sample-e2e-test.ts           # Test de ejemplo E2E
├── test-runner.ts               # Ejecutor de tests
└── README.md                    # Esta documentación
```

## 🎯 Uso Rápido

### Ejecutar todos los tests

```bash
npm run test:automated
```

### Ejecutar test específico

```bash
npm run test:automated:e2e
npm run test:automated:sample
```

### Ejecutar en modo headless

```bash
npm run test:automated:headless
```

### Ver ayuda

```bash
npm run test:automated:help
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# URL base para los tests
TEST_BASE_URL=http://localhost:3000

# Ejecutar sin interfaz gráfica
TEST_HEADLESS=true

# Navegador a usar
TEST_BROWSER=chromium  # chromium, firefox, webkit
```

### Ejemplo de uso con configuración personalizada

```bash
TEST_BASE_URL=http://localhost:4000 TEST_HEADLESS=true npm run test:automated
```

## 📊 Reportes Generados

### Ubicaciones por defecto

- **Reportes JSON**: `./test-reports/`
- **Reportes HTML**: `./test-reports/`
- **Screenshots**: `./test-screenshots/`

### Tipos de reportes

1. **Reporte individual** (JSON): Cada test genera su propio reporte
2. **Reporte consolidado** (JSON): Resumen de todos los tests ejecutados
3. **Reporte HTML** (opcional): Visualización web interactiva

### Estructura del reporte JSON

```json
{
  "testInfo": {
    "name": "E2E Test - Flujo de Compra Completo",
    "description": "Test automatizado...",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:30.000Z",
    "duration": 330000,
    "status": "completed"
  },
  "summary": {
    "totalSteps": 7,
    "completedSteps": 7,
    "failedSteps": 0,
    "successRate": 100
  },
  "steps": [
    {
      "id": "step-1",
      "name": "Navegar a la página principal",
      "status": "completed",
      "startTime": "2024-01-15T10:30:05.000Z",
      "endTime": "2024-01-15T10:30:08.000Z",
      "duration": 3000,
      "category": "action",
      "severity": "high",
      "result": { "url": "http://localhost:3000", "title": "Pinteya" },
      "screenshots": ["homepage-loaded.png"]
    }
  ],
  "environment": {
    "browser": "Chromium",
    "viewport": { "width": 1920, "height": 1080 },
    "url": "http://localhost:3000"
  }
}
```

## 📸 Capturas de Pantalla

### Capturas automáticas

El framework captura pantallas automáticamente en:

- ✅ Cada paso crítico del test
- ❌ Cuando ocurre un error
- 🎯 Elementos específicos cuando se requiere
- 📄 Estado final del test

### Tipos de capturas

1. **Página completa**: Captura toda la página
2. **Elemento específico**: Captura solo un elemento
3. **Viewport**: Captura solo la parte visible

### Metadatos de capturas

Cada captura incluye:

- 📅 Timestamp exacto
- 📝 Descripción del paso
- 🎯 Contexto del test
- 📐 Dimensiones de la captura

## 🧪 Crear Tests Personalizados

### Ejemplo básico

```typescript
import { AutomatedTestFramework } from './automated-test-framework'
import { ScreenshotManager } from './screenshot-manager'

class MiTestPersonalizado {
  private testFramework: AutomatedTestFramework
  private screenshotManager: ScreenshotManager

  constructor() {
    this.testFramework = new AutomatedTestFramework('Mi Test Personalizado', 'Descripción del test')

    this.screenshotManager = new ScreenshotManager()
  }

  async ejecutarTest(): Promise<void> {
    try {
      // Inicializar navegador
      await this.screenshotManager.initialize()

      // Ejecutar paso del test
      await this.testFramework.executeStep(
        'Nombre del paso',
        async () => {
          // Lógica del paso
          await this.screenshotManager.navigateTo('http://localhost:3000')

          // Capturar screenshot
          await this.screenshotManager.captureScreenshot('mi-captura', 'Descripción de la captura')

          return { success: true }
        },
        {
          category: 'action',
          severity: 'high',
          captureScreenshot: true,
        }
      )

      // Finalizar test
      await this.testFramework.finishTest('completed')
    } catch (error) {
      console.error('Error en el test:', error)
    } finally {
      await this.screenshotManager.close()
    }
  }
}
```

## 🔍 Debugging y Troubleshooting

### Problemas comunes

#### 1. Error: "Browser not found"

```bash
# Instalar navegadores de Playwright
npx playwright install
```

#### 2. Error: "Port already in use"

```bash
# Cambiar puerto del servidor de desarrollo
TEST_BASE_URL=http://localhost:4000 npm run test:automated
```

#### 3. Tests muy lentos

```bash
# Ejecutar en modo headless
npm run test:automated:headless
```

#### 4. Permisos de escritura

```bash
# Verificar permisos de directorios
ls -la test-reports/
ls -la test-screenshots/
```

### Logs de debugging

El framework genera logs detallados en la consola:

- 🚀 Inicio de tests
- ✅ Pasos completados
- ❌ Errores encontrados
- 📊 Resúmenes finales

### Modo verbose

```bash
# Para más información de debugging
DEBUG=true npm run test:automated
```

## 📈 Métricas y Análisis

### Métricas incluidas en reportes

- ⏱️ **Tiempo de ejecución**: Por paso y total
- 📊 **Tasa de éxito**: Porcentaje de pasos exitosos
- 🎯 **Cobertura**: Elementos y funcionalidades probadas
- 📸 **Capturas**: Cantidad y tipos de screenshots
- 🔄 **Reintentos**: Número de reintentos por paso

### Análisis de tendencias

Los reportes consolidados permiten:

- 📈 Comparar rendimiento entre ejecuciones
- 🎯 Identificar pasos problemáticos
- ⏰ Analizar tiempos de respuesta
- 📊 Generar métricas de calidad

## 🚀 Integración CI/CD

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start application
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:automated:headless
        env:
          TEST_BASE_URL: http://localhost:3000
          TEST_HEADLESS: true

      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: |
            test-reports/
            test-screenshots/
```

## 🤝 Contribuir

### Agregar nuevos tests

1. Crear archivo en `src/lib/testing/`
2. Extender `AutomatedTestFramework`
3. Implementar pasos del test
4. Agregar al `TestRunner`
5. Documentar en este README

### Mejoras sugeridas

- [ ] Soporte para tests paralelos
- [ ] Integración con bases de datos de test
- [ ] Reportes en formato PDF
- [ ] Dashboard web para visualizar resultados
- [ ] Integración con herramientas de monitoreo

## 📞 Soporte

Para problemas o preguntas:

1. Revisar este README
2. Verificar logs de consola
3. Revisar reportes generados
4. Consultar documentación de Playwright

---

**¡Happy Testing! 🧪✨**
