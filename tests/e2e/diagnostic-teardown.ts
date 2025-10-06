// =====================================================
// TEARDOWN GLOBAL: DIAGNÓSTICO PANEL ADMINISTRATIVO
// Descripción: Limpieza y reporte final para suite de diagnóstico enterprise
// =====================================================

import { FullConfig } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Iniciando teardown global para diagnóstico del panel administrativo...')

  try {
    // Leer metadatos del diagnóstico
    const metadataPath = 'test-results/diagnostic-reports/diagnostic-metadata.json'
    let metadata: any = {}

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8')
      metadata = JSON.parse(metadataContent)
    } catch (error) {
      console.log('⚠️ No se pudieron leer los metadatos del diagnóstico')
    }

    // Actualizar metadatos con información de finalización
    metadata.endTime = new Date().toISOString()
    metadata.duration = metadata.startTime
      ? Math.round((new Date().getTime() - new Date(metadata.startTime).getTime()) / 1000)
      : 'unknown'

    // Recopilar información de archivos generados
    const diagnosticFiles = {
      screenshots: [],
      videos: [],
      traces: [],
      reports: [],
    }

    // Buscar screenshots
    try {
      const screenshotFiles = await fs.readdir('test-results/screenshots')
      diagnosticFiles.screenshots = screenshotFiles.filter(
        f => f.includes('admin-panel') && f.endsWith('.png')
      )
    } catch (error) {
      console.log('⚠️ No se pudieron listar screenshots')
    }

    // Buscar videos
    try {
      const videoFiles = await fs.readdir('test-results/videos')
      diagnosticFiles.videos = videoFiles.filter(f => f.endsWith('.webm'))
    } catch (error) {
      console.log('⚠️ No se pudieron listar videos')
    }

    // Buscar traces
    try {
      const traceFiles = await fs.readdir('test-results/traces')
      diagnosticFiles.traces = traceFiles.filter(f => f.endsWith('.zip'))
    } catch (error) {
      console.log('⚠️ No se pudieron listar traces')
    }

    // Buscar reportes de diagnóstico
    try {
      const reportFiles = await fs.readdir('test-results/diagnostic-reports')
      diagnosticFiles.reports = reportFiles.filter(
        f => f.includes('admin-panel-diagnostic') && (f.endsWith('.json') || f.endsWith('.html'))
      )
    } catch (error) {
      console.log('⚠️ No se pudieron listar reportes')
    }

    // Actualizar metadatos con archivos generados
    metadata.generatedFiles = diagnosticFiles
    metadata.fileCount = {
      screenshots: diagnosticFiles.screenshots.length,
      videos: diagnosticFiles.videos.length,
      traces: diagnosticFiles.traces.length,
      reports: diagnosticFiles.reports.length,
    }

    // Guardar metadatos actualizados
    try {
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    } catch (error) {
      console.log('⚠️ Error actualizando metadatos:', error.message)
    }

    // Generar resumen final en consola
    console.log('\n📊 RESUMEN FINAL DEL DIAGNÓSTICO')
    console.log('================================')
    console.log(`⏱️ Duración total: ${metadata.duration} segundos`)
    console.log(`📸 Screenshots capturadas: ${metadata.fileCount.screenshots}`)
    console.log(`🎥 Videos generados: ${metadata.fileCount.videos}`)
    console.log(`🔍 Traces creados: ${metadata.fileCount.traces}`)
    console.log(`📋 Reportes generados: ${metadata.fileCount.reports}`)

    // Mostrar ubicación de archivos importantes
    if (diagnosticFiles.reports.length > 0) {
      console.log('\n📁 ARCHIVOS IMPORTANTES:')

      // Buscar el reporte HTML más reciente
      const htmlReports = diagnosticFiles.reports.filter(f => f.endsWith('.html'))
      if (htmlReports.length > 0) {
        const latestHtml = htmlReports.sort().reverse()[0]
        const htmlPath = path.resolve('test-results/diagnostic-reports', latestHtml)
        console.log(`🌐 Reporte HTML: file://${htmlPath}`)
      }

      // Buscar el reporte JSON más reciente
      const jsonReports = diagnosticFiles.reports.filter(
        f => f.endsWith('.json') && f !== 'diagnostic-metadata.json'
      )
      if (jsonReports.length > 0) {
        const latestJson = jsonReports.sort().reverse()[0]
        console.log(`📄 Reporte JSON: test-results/diagnostic-reports/${latestJson}`)
      }
    }

    // Buscar reporte HTML de Playwright
    try {
      const playwrightHtmlPath = 'test-results/diagnostic-reports/playwright-html/index.html'
      await fs.access(playwrightHtmlPath)
      console.log(`🎭 Reporte Playwright: file://${path.resolve(playwrightHtmlPath)}`)
    } catch (error) {
      // No existe el reporte de Playwright
    }

    // Calcular tamaño total de archivos generados
    let totalSize = 0
    const allFiles = [
      ...diagnosticFiles.screenshots.map(f => path.join('test-results/screenshots', f)),
      ...diagnosticFiles.videos.map(f => path.join('test-results/videos', f)),
      ...diagnosticFiles.traces.map(f => path.join('test-results/traces', f)),
      ...diagnosticFiles.reports.map(f => path.join('test-results/diagnostic-reports', f)),
    ]

    for (const file of allFiles) {
      try {
        const stats = await fs.stat(file)
        totalSize += stats.size
      } catch (error) {
        // Archivo no existe o no accesible
      }
    }

    const totalSizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100
    console.log(`💾 Tamaño total de archivos: ${totalSizeMB} MB`)

    // Recomendaciones finales
    console.log('\n💡 PRÓXIMOS PASOS:')
    console.log('1. Revisa el reporte HTML para análisis detallado')
    console.log('2. Examina screenshots de errores si los hay')
    console.log('3. Usa traces para debugging profundo si es necesario')
    console.log('4. Comparte reportes con el equipo de desarrollo')

    // Limpiar archivos temporales si es necesario
    if (process.env.CLEANUP_TEMP_FILES === 'true') {
      console.log('\n🧹 Limpiando archivos temporales...')
      // Aquí se podría implementar limpieza de archivos temporales
    }

    console.log('\n✅ Teardown global completado')
    console.log('🎉 Diagnóstico del panel administrativo finalizado exitosamente')
  } catch (error) {
    console.log('❌ Error durante teardown:', error.message)
  }
}

export default globalTeardown
