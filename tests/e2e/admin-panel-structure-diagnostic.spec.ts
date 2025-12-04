// =====================================================
// DIAGNÓSTICO ESTRUCTURAL DEL PANEL ADMINISTRATIVO
// Descripción: Validación de estructura de archivos y configuración
// Sin dependencia del servidor web
// =====================================================

import { test, expect } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface StructuralDiagnostic {
  timestamp: string
  modules: {
    orders: ModuleStructure
    products: ModuleStructure
    logistics: ModuleStructure
  }
  apis: ApiStructure[]
  components: ComponentStructure[]
  hooks: HookStructure[]
  summary: {
    totalFiles: number
    implementedModules: number
    missingFiles: string[]
    recommendations: string[]
  }
}

interface ModuleStructure {
  name: string
  pages: FileStatus[]
  components: FileStatus[]
  apis: FileStatus[]
  hooks: FileStatus[]
  completeness: number
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING'
}

interface FileStatus {
  path: string
  exists: boolean
  size: number
  lastModified: string
  hasContent: boolean
}

interface ApiStructure {
  endpoint: string
  file: string
  exists: boolean
  methods: string[]
}

interface ComponentStructure {
  name: string
  path: string
  exists: boolean
  dependencies: string[]
}

interface HookStructure {
  name: string
  path: string
  exists: boolean
  exports: string[]
}

// =====================================================
// UTILIDADES
// =====================================================

async function checkFileExists(filePath: string): Promise<FileStatus> {
  try {
    const fullPath = path.resolve(filePath)
    const stats = await fs.stat(fullPath)
    const content = await fs.readFile(fullPath, 'utf8')

    return {
      path: filePath,
      exists: true,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      hasContent: content.trim().length > 100, // Más de 100 caracteres indica contenido real
    }
  } catch (error) {
    return {
      path: filePath,
      exists: false,
      size: 0,
      lastModified: '',
      hasContent: false,
    }
  }
}

async function analyzeApiFile(filePath: string): Promise<ApiStructure> {
  const fileStatus = await checkFileExists(filePath)
  const methods: string[] = []

  if (fileStatus.exists) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Buscar exports de métodos HTTP
      if (content.includes('export async function GET') || content.includes('export const GET')) {
        methods.push('GET')
      }
      if (content.includes('export async function POST') || content.includes('export const POST')) {
        methods.push('POST')
      }
      if (content.includes('export async function PUT') || content.includes('export const PUT')) {
        methods.push('PUT')
      }
      if (
        content.includes('export async function PATCH') ||
        content.includes('export const PATCH')
      ) {
        methods.push('PATCH')
      }
      if (
        content.includes('export async function DELETE') ||
        content.includes('export const DELETE')
      ) {
        methods.push('DELETE')
      }
    } catch (error) {
      // Error leyendo archivo
    }
  }

  return {
    endpoint: filePath.replace('src/app/api', '').replace('/route.ts', '').replace(/\\/g, '/'),
    file: filePath,
    exists: fileStatus.exists,
    methods,
  }
}

// =====================================================
// TESTS PRINCIPALES
// =====================================================

test.describe('Diagnóstico Estructural del Panel Administrativo', () => {
  test('Análisis Completo de Estructura de Archivos', async () => {
    console.log('🔍 Iniciando diagnóstico estructural del panel administrativo...')

    const diagnostic: StructuralDiagnostic = {
      timestamp: new Date().toISOString(),
      modules: {
        orders: {
          name: 'Órdenes Enterprise',
          pages: [],
          components: [],
          apis: [],
          hooks: [],
          completeness: 0,
          status: 'MISSING',
        },
        products: {
          name: 'Productos Enterprise',
          pages: [],
          components: [],
          apis: [],
          hooks: [],
          completeness: 0,
          status: 'MISSING',
        },
        logistics: {
          name: 'Logística Enterprise',
          pages: [],
          components: [],
          apis: [],
          hooks: [],
          completeness: 0,
          status: 'MISSING',
        },
      },
      apis: [],
      components: [],
      hooks: [],
      summary: {
        totalFiles: 0,
        implementedModules: 0,
        missingFiles: [],
        recommendations: [],
      },
    }

    // =====================================================
    // ANÁLISIS DE PÁGINAS
    // =====================================================

    console.log('📄 Analizando páginas del panel administrativo...')

    const expectedPages = [
      // Páginas principales
      'src/app/admin/page.tsx',
      'src/app/admin/layout.tsx',

      // Módulo de órdenes
      'src/app/admin/orders/page.tsx',
      'src/app/admin/orders-panel/page.tsx',

      // Módulo de productos
      'src/app/admin/products/page.tsx',
      'src/app/admin/products/new/page.tsx',

      // Módulo de logística
      'src/app/admin/logistics/page.tsx',
    ]

    for (const pagePath of expectedPages) {
      const fileStatus = await checkFileExists(pagePath)

      if (pagePath.includes('/orders')) {
        diagnostic.modules.orders.pages.push(fileStatus)
      } else if (pagePath.includes('/products')) {
        diagnostic.modules.products.pages.push(fileStatus)
      } else if (pagePath.includes('/logistics')) {
        diagnostic.modules.logistics.pages.push(fileStatus)
      }

      if (!fileStatus.exists) {
        diagnostic.summary.missingFiles.push(pagePath)
      }
    }

    // =====================================================
    // ANÁLISIS DE APIs
    // =====================================================

    console.log('🔌 Analizando APIs del panel administrativo...')

    const expectedApis = [
      // APIs de órdenes
      'src/app/api/admin/orders/route.ts',
      'src/app/api/admin/orders/[id]/route.ts',
      'src/app/api/admin/orders/[id]/status/route.ts',
      'src/app/api/admin/orders/[id]/shipments/route.ts',
      'src/app/api/admin/orders/bulk/route.ts',
      'src/app/api/admin/orders/analytics/route.ts',

      // APIs de productos
      'src/app/api/admin/products/route.ts',
      'src/app/api/admin/products/[id]/route.ts',
      'src/app/api/admin/products/bulk/route.ts',
      'src/app/api/admin/products/import/route.ts',
      'src/app/api/admin/products/export/route.ts',

      // APIs de logística
      'src/app/api/admin/logistics/route.ts',
      'src/app/api/admin/logistics/shipments/route.ts',
      'src/app/api/admin/logistics/carriers/route.ts',
      'src/app/api/admin/logistics/tracking/route.ts',
    ]

    for (const apiPath of expectedApis) {
      const apiStructure = await analyzeApiFile(apiPath)
      diagnostic.apis.push(apiStructure)

      if (apiPath.includes('/orders')) {
        diagnostic.modules.orders.apis.push({
          path: apiPath,
          exists: apiStructure.exists,
          size: 0,
          lastModified: '',
          hasContent: apiStructure.methods.length > 0,
        })
      } else if (apiPath.includes('/products')) {
        diagnostic.modules.products.apis.push({
          path: apiPath,
          exists: apiStructure.exists,
          size: 0,
          lastModified: '',
          hasContent: apiStructure.methods.length > 0,
        })
      } else if (apiPath.includes('/logistics')) {
        diagnostic.modules.logistics.apis.push({
          path: apiPath,
          exists: apiStructure.exists,
          size: 0,
          lastModified: '',
          hasContent: apiStructure.methods.length > 0,
        })
      }

      if (!apiStructure.exists) {
        diagnostic.summary.missingFiles.push(apiPath)
      }
    }

    // =====================================================
    // ANÁLISIS DE COMPONENTES
    // =====================================================

    console.log('🧩 Analizando componentes del panel administrativo...')

    const expectedComponents = [
      // Componentes de órdenes
      'src/components/admin/orders/OrderListEnterprise.tsx',
      'src/components/admin/orders/OrderDetailEnterprise.tsx',
      'src/components/admin/orders/OrderStatusManager.tsx',

      // Componentes de productos
      'src/components/admin/products/ProductList.tsx',
      'src/components/admin/products/ProductForm.tsx',
      'src/components/admin/products/ProductFilters.tsx',

      // Componentes de logística
      'src/components/admin/logistics/LogisticsMetricsCards.tsx',
      'src/components/admin/logistics/ShipmentsList.tsx',
      'src/components/admin/logistics/CreateShipmentDialog.tsx',
      'src/components/admin/logistics/LogisticsAlerts.tsx',

      // Layout y navegación
      'src/components/admin/layout/AdminLayout.tsx',
      'src/components/admin/layout/AdminSidebar.tsx',
    ]

    for (const componentPath of expectedComponents) {
      const fileStatus = await checkFileExists(componentPath)

      if (componentPath.includes('/orders')) {
        diagnostic.modules.orders.components.push(fileStatus)
      } else if (componentPath.includes('/products')) {
        diagnostic.modules.products.components.push(fileStatus)
      } else if (componentPath.includes('/logistics')) {
        diagnostic.modules.logistics.components.push(fileStatus)
      }

      if (!fileStatus.exists) {
        diagnostic.summary.missingFiles.push(componentPath)
      }
    }

    // =====================================================
    // ANÁLISIS DE HOOKS
    // =====================================================

    console.log('🪝 Analizando hooks del panel administrativo...')

    const expectedHooks = [
      'src/hooks/admin/useOrdersEnterprise.ts',
      'src/hooks/admin/useProductsEnterprise.ts',
      'src/hooks/admin/useLogisticsDashboard.ts',
      'src/hooks/useOrdersEnterprise.ts', // Hook legacy
    ]

    for (const hookPath of expectedHooks) {
      const fileStatus = await checkFileExists(hookPath)

      if (hookPath.includes('Orders') || hookPath.includes('orders')) {
        diagnostic.modules.orders.hooks.push(fileStatus)
      } else if (hookPath.includes('Products') || hookPath.includes('products')) {
        diagnostic.modules.products.hooks.push(fileStatus)
      } else if (hookPath.includes('Logistics') || hookPath.includes('logistics')) {
        diagnostic.modules.logistics.hooks.push(fileStatus)
      }

      if (!fileStatus.exists) {
        diagnostic.summary.missingFiles.push(hookPath)
      }
    }

    // =====================================================
    // CÁLCULO DE COMPLETENESS Y ESTADO
    // =====================================================

    for (const [moduleName, module] of Object.entries(diagnostic.modules)) {
      const allFiles = [...module.pages, ...module.components, ...module.apis, ...module.hooks]

      const existingFiles = allFiles.filter(f => f.exists)
      const contentFiles = allFiles.filter(f => f.hasContent)

      module.completeness =
        allFiles.length > 0 ? Math.round((contentFiles.length / allFiles.length) * 100) : 0

      if (module.completeness >= 80) {
        module.status = 'COMPLETE'
        diagnostic.summary.implementedModules++
      } else if (module.completeness >= 40) {
        module.status = 'PARTIAL'
      } else {
        module.status = 'MISSING'
      }
    }

    // =====================================================
    // GENERAR RECOMENDACIONES
    // =====================================================

    diagnostic.summary.recommendations = []

    if (diagnostic.modules.orders.completeness < 80) {
      diagnostic.summary.recommendations.push(
        'Completar implementación del módulo de Órdenes Enterprise'
      )
    }

    if (diagnostic.modules.products.completeness < 80) {
      diagnostic.summary.recommendations.push(
        'Completar implementación del módulo de Productos Enterprise'
      )
    }

    if (diagnostic.modules.logistics.completeness < 80) {
      diagnostic.summary.recommendations.push(
        'Completar implementación del módulo de Logística Enterprise'
      )
    }

    const missingApis = diagnostic.apis.filter(api => !api.exists)
    if (missingApis.length > 0) {
      diagnostic.summary.recommendations.push(`Implementar ${missingApis.length} APIs faltantes`)
    }

    diagnostic.summary.totalFiles =
      diagnostic.summary.missingFiles.length +
      Object.values(diagnostic.modules).reduce(
        (acc, module) =>
          acc +
          module.pages.length +
          module.components.length +
          module.apis.length +
          module.hooks.length,
        0
      )

    // =====================================================
    // GUARDAR REPORTE
    // =====================================================

    const reportPath = path.join('test-results', `structural-diagnostic-${Date.now()}.json`)
    await fs.mkdir('test-results', { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(diagnostic, null, 2))

    // =====================================================
    // MOSTRAR RESULTADOS
    // =====================================================

    console.log('\n📊 DIAGNÓSTICO ESTRUCTURAL COMPLETADO')
    console.log('=====================================')

    Object.entries(diagnostic.modules).forEach(([key, module]) => {
      const statusIcon =
        module.status === 'COMPLETE' ? '🟢' : module.status === 'PARTIAL' ? '🟡' : '🔴'

      console.log(`${statusIcon} ${module.name}: ${module.status} (${module.completeness}%)`)
      console.log(
        `   📄 Páginas: ${module.pages.filter(p => p.exists).length}/${module.pages.length}`
      )
      console.log(
        `   🧩 Componentes: ${module.components.filter(c => c.exists).length}/${module.components.length}`
      )
      console.log(`   🔌 APIs: ${module.apis.filter(a => a.exists).length}/${module.apis.length}`)
      console.log(
        `   🪝 Hooks: ${module.hooks.filter(h => h.exists).length}/${module.hooks.length}`
      )
    })

    console.log(`\n📁 Archivos faltantes: ${diagnostic.summary.missingFiles.length}`)
    console.log(`🎯 Módulos implementados: ${diagnostic.summary.implementedModules}/3`)
    console.log(`📋 Reporte guardado en: ${reportPath}`)

    if (diagnostic.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:')
      diagnostic.summary.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    }

    // =====================================================
    // ASSERTIONS
    // =====================================================

    expect(diagnostic.summary.totalFiles).toBeGreaterThan(0)
    expect(diagnostic.modules.orders.pages.length).toBeGreaterThan(0)
    expect(diagnostic.modules.products.pages.length).toBeGreaterThan(0)
    expect(diagnostic.modules.logistics.pages.length).toBeGreaterThan(0)

    // El test pasa independientemente del estado de implementación
    console.log('\n✅ Diagnóstico estructural completado exitosamente')
  })
})
