#!/usr/bin/env node

/**
 * ANÁLISIS REAL DE BUNDLE
 * Analiza el build de Next.js para identificar optimizaciones
 */

const fs = require('fs')
const path = require('path')

const BUILD_DIR = '.next'
const OUTPUT_DIR = 'performance-reports'

async function analyzeBuild() {
  console.log('🔍 Analizando build de Next.js...\n')

  try {
    // Leer el manifest del build
    const buildManifestPath = path.join(BUILD_DIR, 'build-manifest.json')
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))

    // Analizar chunks
    const chunks = {}
    let totalSize = 0

    // Recorrer el directorio de static/chunks
    const chunksDir = path.join(BUILD_DIR, 'static', 'chunks')
    if (fs.existsSync(chunksDir)) {
      const files = fs.readdirSync(chunksDir, { recursive: true })

      files.forEach(file => {
        const filePath = path.join(chunksDir, file)
        const stat = fs.statSync(filePath)

        if (stat.isFile() && file.endsWith('.js')) {
          const size = stat.size
          totalSize += size
          chunks[file] = {
            size,
            sizeKB: (size / 1024).toFixed(2),
            path: filePath
          }
        }
      })
    }

    // Ordenar chunks por tamaño
    const sortedChunks = Object.entries(chunks)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 20) // Top 20 chunks más grandes

    console.log('📊 Top 20 Chunks más grandes:\n')
    console.log('Chunk'.padEnd(50) + 'Size'.padStart(15))
    console.log('-'.repeat(65))

    sortedChunks.forEach(([name, data]) => {
      console.log(`${name.padEnd(50)}${data.sizeKB.padStart(10)} KB`)
    })

    console.log('\n')
    console.log('📈 Resumen:')
    console.log(`Total JS: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Total Chunks: ${Object.keys(chunks).length}`)
    console.log(`Promedio por chunk: ${(totalSize / Object.keys(chunks).length / 1024).toFixed(2)} KB`)

    // Generar reporte JSON
    const report = {
      timestamp: new Date().toISOString(),
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalChunks: Object.keys(chunks).length,
      averageChunkSize: totalSize / Object.keys(chunks).length,
      topChunks: sortedChunks.map(([name, data]) => ({
        name,
        size: data.size,
        sizeKB: parseFloat(data.sizeKB)
      })),
      buildManifest
    }

    // Crear directorio de output si no existe
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Guardar reporte
    const reportPath = path.join(OUTPUT_DIR, 'bundle-analysis-real.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`\n✅ Reporte guardado en: ${reportPath}`)

    // Identificar oportunidades de optimización
    console.log('\n💡 Oportunidades de Optimización:\n')

    const largeChunks = sortedChunks.filter(([, data]) => data.size > 100 * 1024)
    if (largeChunks.length > 0) {
      console.log(`⚠️  ${largeChunks.length} chunks mayores a 100KB detectados:`)
      largeChunks.forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.sizeKB} KB`)
      })
      console.log('   Considera implementar code splitting o lazy loading\n')
    }

    const vendorChunks = sortedChunks.filter(([name]) => name.includes('vendor'))
    if (vendorChunks.length > 0) {
      const vendorSize = vendorChunks.reduce((sum, [, data]) => sum + data.size, 0)
      console.log(`📦 Vendor chunks: ${(vendorSize / 1024).toFixed(2)} KB`)
      console.log('   Considera optimizar dependencias o usar CDN\n')
    }

    // Analizar páginas específicas
    console.log('📄 Análisis de Páginas:\n')

    const pages = buildManifest.pages || {}
    const pagesSizes = {}

    Object.entries(pages).forEach(([route, files]) => {
      const pageSize = files.reduce((sum, file) => {
        const chunkName = path.basename(file)
        const chunk = chunks[chunkName]
        return sum + (chunk ? chunk.size : 0)
      }, 0)

      if (pageSize > 0) {
        pagesSizes[route] = {
          size: pageSize,
          sizeKB: (pageSize / 1024).toFixed(2),
          files: files.length
        }
      }
    })

    const sortedPages = Object.entries(pagesSizes)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 10)

    console.log('Página'.padEnd(40) + 'Size'.padStart(15) + 'Files'.padStart(10))
    console.log('-'.repeat(65))

    sortedPages.forEach(([route, data]) => {
      const routeName = route.length > 38 ? route.slice(0, 35) + '...' : route
      console.log(`${routeName.padEnd(40)}${data.sizeKB.padStart(10)} KB${String(data.files).padStart(10)}`)
    })

    console.log('\n✨ Análisis completado\n')

  } catch (error) {
    console.error('❌ Error analizando build:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  analyzeBuild()
}

module.exports = { analyzeBuild }

