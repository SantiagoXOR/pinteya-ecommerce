// =====================================================
// SETUP GLOBAL: DIAGNÓSTICO PANEL ADMINISTRATIVO
// Descripción: Configuración inicial para suite de diagnóstico enterprise
// =====================================================

import { chromium, FullConfig } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Iniciando setup global para diagnóstico del panel administrativo...')

  // Crear directorios necesarios
  const directories = [
    'test-results',
    'test-results/diagnostic-reports',
    'test-results/diagnostic-output',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
  ]

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true })
      console.log(`✅ Directorio creado: ${dir}`)
    } catch (error) {
      console.log(`⚠️ Error creando directorio ${dir}:`, error)
    }
  }

  // Verificar conectividad con el servidor
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  console.log(`🌐 Verificando conectividad con: ${baseURL}`)

  try {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    // Intentar conectar al servidor
    const response = await page.goto(baseURL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    if (response?.ok()) {
      console.log('✅ Servidor accesible y respondiendo correctamente')

      // Verificar que las rutas admin existen
      const adminRoutes = ['/admin', '/admin/orders', '/admin/products', '/admin/logistics']

      for (const route of adminRoutes) {
        try {
          const routeResponse = await page.goto(`${baseURL}${route}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000,
          })

          if (routeResponse?.status() === 200) {
            console.log(`✅ Ruta accesible: ${route}`)
          } else if (routeResponse?.status() === 401 || routeResponse?.status() === 403) {
            console.log(
              `🔒 Ruta protegida (esperado): ${route} - Status: ${routeResponse.status()}`
            )
          } else {
            console.log(`⚠️ Ruta con problemas: ${route} - Status: ${routeResponse?.status()}`)
          }
        } catch (error) {
          console.log(`❌ Error accediendo a ${route}:`, error.message)
        }
      }
    } else {
      console.log(`❌ Servidor no responde correctamente. Status: ${response?.status()}`)
    }

    await browser.close()
  } catch (error) {
    console.log('❌ Error verificando conectividad:', error.message)
    console.log('⚠️ Continuando con el diagnóstico - el servidor podría no estar iniciado')
  }

  // Crear archivo de metadatos del diagnóstico
  const diagnosticMetadata = {
    startTime: new Date().toISOString(),
    baseURL,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    playwrightVersion: require('@playwright/test/package.json').version,
    testSuite: 'Admin Panel Enterprise Diagnostic',
    purpose: 'Validación completa del estado de implementación del panel administrativo',
    expectedModules: [
      'Órdenes Enterprise',
      'Productos Enterprise',
      'Logística Enterprise',
      'Integración Órdenes-Logística',
    ],
    expectedFeatures: [
      'Métricas en tiempo real',
      'Filtros avanzados',
      'Operaciones masivas',
      'APIs REST funcionales',
      'Responsividad móvil',
      'Navegación fluida',
    ],
  }

  try {
    await fs.writeFile(
      'test-results/diagnostic-reports/diagnostic-metadata.json',
      JSON.stringify(diagnosticMetadata, null, 2)
    )
    console.log('✅ Metadatos de diagnóstico creados')
  } catch (error) {
    console.log('⚠️ Error creando metadatos:', error.message)
  }

  // Limpiar reportes anteriores (opcional)
  try {
    const reportFiles = await fs.readdir('test-results/diagnostic-reports')
    const oldReports = reportFiles.filter(
      f => f.includes('admin-panel-diagnostic') && (f.endsWith('.json') || f.endsWith('.html'))
    )

    if (oldReports.length > 5) {
      // Mantener solo los 5 reportes más recientes
      const sortedReports = oldReports.sort().slice(0, -5)
      for (const report of sortedReports) {
        await fs.unlink(path.join('test-results/diagnostic-reports', report))
      }
      console.log(`🧹 Limpieza: ${sortedReports.length} reportes antiguos eliminados`)
    }
  } catch (error) {
    console.log('⚠️ Error en limpieza de reportes:', error.message)
  }

  console.log('✅ Setup global completado para diagnóstico del panel administrativo')
  console.log('🚀 Iniciando suite de diagnóstico enterprise...\n')
}

export default globalSetup
