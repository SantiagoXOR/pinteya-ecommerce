# 🧪 SEO Testing Suite - Documentación Completa

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Tipos de Tests](#tipos-de-tests)
5. [APIs Disponibles](#apis-disponibles)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Configuración Avanzada](#configuración-avanzada)
8. [Métricas y Monitoreo](#métricas-y-monitoreo)
9. [Troubleshooting](#troubleshooting)

## 🎯 Introducción

La **SEO Testing Suite** es un sistema automatizado de testing SEO que valida y optimiza múltiples aspectos del SEO técnico en el e-commerce Pinteya. Proporciona análisis comprehensivos de metadata, structured data, robots.txt, enlaces internos, compliance y performance.

### ✨ Características Principales

- **6 Tipos de Tests Especializados**: Metadata, Structured Data, Robots.txt, Internal Links, Compliance, Performance
- **Ejecución Paralela**: Tests concurrentes con límites configurables
- **Cache Inteligente**: Redis + memoria para optimización de performance
- **APIs RESTful**: Endpoints completos para integración
- **Métricas Detalladas**: Scoring, recomendaciones y analytics
- **Configuración Flexible**: Umbrales y parámetros personalizables

## 🏗️ Arquitectura

### Componentes Principales

```
Enhanced SEO Testing Suite
├── MetadataTestEngine          # Tests de títulos, descripciones, keywords, OG
├── StructuredDataValidator     # Validación de Schema.org y JSON-LD
├── RobotsTxtValidator         # Análisis de robots.txt
├── InternalLinksAuditor       # Auditoría de enlaces internos
├── SEOComplianceChecker       # Tests de compliance (HTTPS, mobile, a11y)
├── PerformanceTestEngine      # Core Web Vitals y métricas de performance
└── AutomatedTestRunner        # Orquestación y gestión de tests
```

### Patrones de Diseño

- **Singleton Pattern**: Instancia única del testing suite
- **Strategy Pattern**: Diferentes estrategias de testing por tipo
- **Factory Pattern**: Creación de tests específicos
- **Observer Pattern**: Notificaciones y métricas en tiempo real

## ⚙️ Instalación y Configuración

### Configuración Básica

```typescript
import { enhancedSEOTestingSuite } from '@/lib/seo/seo-testing-suite'

// Configuración por defecto
const config = {
  enableMetadataTests: true,
  enableStructuredDataTests: true,
  enableRobotsTxtTests: true,
  enableInternalLinksTests: true,
  enableComplianceTests: true,
  enablePerformanceTests: true,
  testTimeout: 30,
  maxConcurrentTests: 5,
  cacheEnabled: true,
  cacheTTL: 3600,
  testUrls: ['/', '/shop', '/products/example'],
  thresholds: {
    titleMinLength: 30,
    titleMaxLength: 60,
    descriptionMinLength: 120,
    descriptionMaxLength: 160,
    minInternalLinksPerPage: 5,
    maxInternalLinksPerPage: 100,
    maxPageLoadTime: 3000,
    minSEOScore: 80,
  },
}

enhancedSEOTestingSuite.configure(config)
```

### Variables de Entorno

```env
# Redis Configuration (opcional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password

# Testing Configuration
SEO_TESTING_ENABLED=true
SEO_TESTING_TIMEOUT=30
SEO_TESTING_MAX_CONCURRENT=5
```

## 🧪 Tipos de Tests

### 1. Metadata Tests

Valida elementos críticos de metadata SEO:

- **Title Tags**: Longitud, unicidad, keywords
- **Meta Descriptions**: Longitud, call-to-action, relevancia
- **Keywords**: Cantidad, relevancia, distribución
- **Open Graph**: og:title, og:description, og:image, og:url
- **Twitter Cards**: twitter:card, twitter:title, twitter:description

```typescript
// Ejecutar solo tests de metadata
const results = await enhancedSEOTestingSuite.runTestsByType('metadata', ['/products/pintura']);

// Resultado ejemplo
{
  testId: 'metadata_title_123',
  testName: 'Title Tag Validation',
  testType: 'metadata',
  url: '/products/pintura',
  status: 'passed',
  score: 90,
  details: {
    description: 'Validates title tag length and optimization',
    expectedValue: '30-60 characters',
    actualValue: '45 characters',
    impact: 'high',
    category: 'metadata'
  },
  suggestions: ['Title looks good'],
  executionTime: 150,
  timestamp: '2024-01-15T10:30:00Z'
}
```

### 2. Structured Data Tests

Valida implementación de Schema.org:

- **Presencia**: Detección de structured data
- **Validación**: Sintaxis JSON-LD correcta
- **Tipos de Schema**: Organization, WebSite, Product, BreadcrumbList
- **Compliance**: Validación contra Schema.org

```typescript
const results = await enhancedSEOTestingSuite.runTestsByType('structured_data', [
  '/products/pintura',
])
```

### 3. Robots.txt Tests

Analiza configuración de robots.txt:

- **Existencia**: Verificación de archivo robots.txt
- **Sintaxis**: Validación de directivas
- **Sitemap**: Referencia a sitemap.xml
- **Bloqueos**: Verificación de páginas importantes no bloqueadas

```typescript
const results = await enhancedSEOTestingSuite.runTestsByType('robots_txt', ['/'])
```

### 4. Internal Links Tests

Audita estructura de enlaces internos:

- **Cantidad**: Número óptimo de enlaces por página
- **Enlaces Rotos**: Detección de links 404
- **Anchor Text**: Descriptividad y optimización
- **Jerarquía**: Estructura de navegación

```typescript
const results = await enhancedSEOTestingSuite.runTestsByType('internal_links', ['/shop'])
```

### 5. Compliance Tests

Verifica cumplimiento técnico:

- **HTTPS**: Implementación de SSL/TLS
- **Mobile-Friendly**: Optimización móvil
- **Accessibility**: Cumplimiento WCAG 2.1
- **Security**: Headers de seguridad

```typescript
const results = await enhancedSEOTestingSuite.runTestsByType('compliance', ['/'])
```

### 6. Performance Tests

Mide métricas de rendimiento:

- **Core Web Vitals**: LCP, FID, CLS
- **Page Speed**: Tiempo de carga
- **SEO Score**: Puntuación general SEO
- **Technical Performance**: Métricas técnicas

```typescript
const results = await enhancedSEOTestingSuite.runTestsByType('performance', ['/'])
```

## 🔌 APIs Disponibles

### API Principal: `/api/seo/testing`

#### GET - Información y Estadísticas

```bash
# Información general
GET /api/seo/testing

# Estadísticas de testing
GET /api/seo/testing?action=stats

# Historial de tests
GET /api/seo/testing?action=history&limit=10

# Tests activos
GET /api/seo/testing?action=active

# Ejecutar tests por tipo
GET /api/seo/testing?action=run-by-type&testType=metadata&urls=/shop,/products
```

#### POST - Ejecutar Tests

```bash
# Suite completa
POST /api/seo/testing
{
  "action": "run-full-suite",
  "urls": ["/", "/shop", "/products/pintura"]
}

# Tests específicos
POST /api/seo/testing
{
  "action": "run-specific-tests",
  "testTypes": ["metadata", "structured_data"],
  "urls": ["/products/pintura"]
}

# Validar metadata
POST /api/seo/testing
{
  "action": "validate-metadata",
  "urls": ["/products/pintura"]
}
```

#### PUT - Configuración

```bash
PUT /api/seo/testing
{
  "config": {
    "enableMetadataTests": true,
    "testTimeout": 60,
    "thresholds": {
      "titleMinLength": 30,
      "titleMaxLength": 60
    }
  }
}
```

#### DELETE - Limpiar Cache

```bash
DELETE /api/seo/testing
```

### API Especializada: `/api/seo/testing/metadata`

```bash
# Validar metadata de URL específica
GET /api/seo/testing/metadata?url=/products/pintura

# Validar múltiples URLs
GET /api/seo/testing/metadata?urls=/,/shop,/products

# Validación batch con configuración personalizada
POST /api/seo/testing/metadata
{
  "urls": ["/products/pintura", "/categories/pinturas"],
  "thresholds": {
    "titleMinLength": 25,
    "titleMaxLength": 65
  },
  "includeRecommendations": true
}
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Suite Completa

```typescript
import { enhancedSEOTestingSuite } from '@/lib/seo/seo-testing-suite'

async function runCompleteSEOAudit() {
  try {
    // Configurar suite
    enhancedSEOTestingSuite.configure({
      testUrls: ['/', '/shop', '/products/pintura-interior', '/about'],
      maxConcurrentTests: 3,
    })

    // Ejecutar suite completa
    const testSuite = await enhancedSEOTestingSuite.runFullTestSuite()

    console.log('SEO Audit Results:')
    console.log(`Total Tests: ${testSuite.summary.totalTests}`)
    console.log(`Overall Score: ${testSuite.summary.overallScore}/100`)
    console.log(`Execution Time: ${testSuite.summary.executionTime}ms`)

    // Analizar resultados por tipo
    const failedTests = testSuite.tests.filter(test => test.status === 'failed')
    if (failedTests.length > 0) {
      console.log('\nFailed Tests:')
      failedTests.forEach(test => {
        console.log(`- ${test.testName} (${test.url}): ${test.details.description}`)
      })
    }

    return testSuite
  } catch (error) {
    console.error('SEO audit failed:', error)
    throw error
  }
}
```

### Ejemplo 2: Tests Específicos con API

```typescript
// Cliente para API de testing
class SEOTestingClient {
  private baseUrl = '/api/seo/testing'

  async runMetadataValidation(urls: string[]) {
    const response = await fetch(`${this.baseUrl}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls,
        includeRecommendations: true,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  }

  async getTestingStats() {
    const response = await fetch(`${this.baseUrl}?action=stats`)
    const result = await response.json()
    return result.data
  }
}

// Uso
const client = new SEOTestingClient()
const metadataResults = await client.runMetadataValidation(['/products/pintura'])
const stats = await client.getTestingStats()
```

### Ejemplo 3: Integración con CI/CD

```typescript
// scripts/seo-tests.ts
import { enhancedSEOTestingSuite } from '@/lib/seo/seo-testing-suite'

async function runSEOTestsForCI() {
  const criticalUrls = ['/', '/shop', '/products/featured']

  try {
    // Configurar para CI
    enhancedSEOTestingSuite.configure({
      testTimeout: 60,
      maxConcurrentTests: 2,
      cacheEnabled: false,
    })

    // Ejecutar tests críticos
    const results = await Promise.all([
      enhancedSEOTestingSuite.runTestsByType('metadata', criticalUrls),
      enhancedSEOTestingSuite.runTestsByType('structured_data', criticalUrls),
      enhancedSEOTestingSuite.runTestsByType('compliance', criticalUrls),
    ])

    const allTests = results.flat()
    const failedTests = allTests.filter(test => test.status === 'failed')
    const averageScore = allTests.reduce((sum, test) => sum + test.score, 0) / allTests.length

    // Criterios de fallo para CI
    if (failedTests.length > 0) {
      console.error(`❌ ${failedTests.length} SEO tests failed`)
      process.exit(1)
    }

    if (averageScore < 80) {
      console.error(`❌ SEO score too low: ${averageScore}/100`)
      process.exit(1)
    }

    console.log(`✅ All SEO tests passed. Average score: ${averageScore}/100`)
  } catch (error) {
    console.error('❌ SEO testing failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runSEOTestsForCI()
}
```

## ⚡ Configuración Avanzada

### Umbrales Personalizados

```typescript
const customThresholds = {
  // Metadata
  titleMinLength: 25,
  titleMaxLength: 65,
  descriptionMinLength: 100,
  descriptionMaxLength: 180,

  // Enlaces internos
  minInternalLinksPerPage: 3,
  maxInternalLinksPerPage: 150,

  // Performance
  maxPageLoadTime: 2500,
  minSEOScore: 85,

  // Core Web Vitals
  maxLCP: 2.5,
  maxFID: 100,
  maxCLS: 0.1,
}

enhancedSEOTestingSuite.configure({ thresholds: customThresholds })
```

### Cache Avanzado

```typescript
const cacheConfig = {
  cacheEnabled: true,
  cacheTTL: 7200, // 2 horas
  cacheStrategy: 'redis-first', // redis-first | memory-first | redis-only
  cacheKeyPrefix: 'seo_testing_prod',
  maxCacheSize: 1000, // máximo items en memoria
}

enhancedSEOTestingSuite.configure(cacheConfig)
```

### Exclusiones y Filtros

```typescript
const filterConfig = {
  excludeUrls: ['/admin/*', '/api/*', '/test/*'],
  includeOnlyUrls: ['/products/*', '/categories/*'],
  skipTestsForUrls: {
    '/maintenance': ['performance', 'compliance'],
    '/coming-soon': ['structured_data', 'internal_links'],
  },
}

enhancedSEOTestingSuite.configure(filterConfig)
```

## 📊 Métricas y Monitoreo

### Estadísticas Disponibles

```typescript
const stats = enhancedSEOTestingSuite.getTestingStats()

console.log(stats)
// {
//   totalTestsRun: 1250,
//   averageScore: 87,
//   testsByType: {
//     metadata: 400,
//     structured_data: 200,
//     robots_txt: 50,
//     internal_links: 300,
//     compliance: 200,
//     performance: 100
//   },
//   mostCommonIssues: [
//     'Missing meta description',
//     'Title too long',
//     'No structured data'
//   ],
//   cacheHitRate: 0.85
// }
```

### Integración con Analytics

```typescript
// La suite se integra automáticamente con SEO Analytics Manager
import { enhancedSEOAnalyticsManager } from '@/lib/seo/seo-analytics-manager'

// Los resultados se envían automáticamente para tracking
const testSuite = await enhancedSEOTestingSuite.runFullTestSuite()

// También se pueden consultar métricas históricas
const metrics = await enhancedSEOAnalyticsManager.getSEOMetrics({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  includeTestingMetrics: true,
})
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Tests Lentos

```typescript
// Reducir concurrencia
enhancedSEOTestingSuite.configure({
  maxConcurrentTests: 2,
  testTimeout: 60,
})

// Habilitar cache
enhancedSEOTestingSuite.configure({
  cacheEnabled: true,
  cacheTTL: 3600,
})
```

#### 2. Errores de Memoria

```typescript
// Limpiar cache periódicamente
setInterval(async () => {
  await enhancedSEOTestingSuite.clearCache()
}, 3600000) // cada hora

// Limitar URLs de test
enhancedSEOTestingSuite.configure({
  testUrls: criticalUrls.slice(0, 10),
})
```

#### 3. Falsos Positivos

```typescript
// Ajustar umbrales
enhancedSEOTestingSuite.configure({
  thresholds: {
    titleMinLength: 20, // más permisivo
    descriptionMinLength: 100,
  },
})

// Deshabilitar tests problemáticos temporalmente
enhancedSEOTestingSuite.configure({
  enablePerformanceTests: false,
})
```

### Logs y Debugging

```typescript
import { logger, LogLevel } from '@/lib/enterprise/logger'

// Habilitar logs detallados
logger.setLevel(LogLevel.DEBUG)

// Los logs incluyen:
// - Inicio/fin de cada test
// - Errores detallados
// - Métricas de performance
// - Cache hits/misses
```

### Monitoreo de Salud

```typescript
// Verificar estado del sistema
const healthCheck = {
  async checkSEOTestingSuite() {
    try {
      const stats = enhancedSEOTestingSuite.getTestingStats()
      const activeSuites = enhancedSEOTestingSuite.getActiveTestSuites()

      return {
        status: 'healthy',
        totalTestsRun: stats.totalTestsRun,
        activeSuites: activeSuites.length,
        cacheHitRate: stats.cacheHitRate,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }
  },
}
```

---

## 📝 Notas Finales

La SEO Testing Suite está diseñada para ser:

- **Escalable**: Maneja desde sitios pequeños hasta grandes e-commerce
- **Confiable**: Tests consistentes y reproducibles
- **Flexible**: Configuración adaptable a diferentes necesidades
- **Integrada**: Funciona seamlessly con el ecosistema SEO existente

Para soporte adicional o reportar issues, consulta la documentación del proyecto o contacta al equipo de desarrollo.

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Compatibilidad**: Next.js 15, TypeScript 5.x, Node.js 18+
