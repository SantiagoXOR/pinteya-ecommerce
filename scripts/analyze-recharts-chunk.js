#!/usr/bin/env node

/**
 * ⚡ ANÁLISIS ESPECÍFICO DEL CHUNK DE RECHARTS
 * 
 * Este script analiza específicamente el chunk de Recharts para verificar
 * que las optimizaciones estén funcionando correctamente.
 * 
 * Uso:
 *   node scripts/analyze-recharts-chunk.js
 * 
 * Requiere que se haya ejecutado `npm run build` previamente.
 */

const fs = require('fs')
const path = require('path')

const BUILD_DIR = path.join(process.cwd(), '.next')
const CHUNKS_DIR = path.join(BUILD_DIR, 'static', 'chunks')
const BUILD_MANIFEST_PATH = path.join(BUILD_DIR, 'build-manifest.json')

// Límites de tamaño
const MAX_RECOMMENDED_SIZE = 200 * 1024 // 200KB
const IDEAL_SIZE = 100 * 1024 // 100KB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function findRechartsChunks() {
  if (!fs.existsSync(CHUNKS_DIR)) {
    console.error('❌ Directorio .next/static/chunks no encontrado')
    console.error('   Ejecuta "npm run build" primero')
    process.exit(1)
  }

  const chunks = fs.readdirSync(CHUNKS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(CHUNKS_DIR, file)
      const stats = fs.statSync(filePath)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Buscar referencias a recharts en el contenido
      const hasRecharts = /recharts|Recharts/i.test(content)
      const rechartsMatches = content.match(/recharts/gi)
      const matchCount = rechartsMatches ? rechartsMatches.length : 0
      
      return {
        name: file,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024 * 100) / 100,
        hasRecharts,
        matchCount,
        path: filePath
      }
    })
    .filter(chunk => chunk.hasRecharts)
    .sort((a, b) => b.size - a.size)

  return chunks
}

function analyzeBuildManifest() {
  if (!fs.existsSync(BUILD_MANIFEST_PATH)) {
    return null
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST_PATH, 'utf8'))
    return manifest
  } catch (error) {
    console.warn('⚠️  No se pudo leer build-manifest.json:', error.message)
    return null
  }
}

function checkAsyncLoading(chunks) {
  // Verificar si hay chunks de recharts que sean async
  // Los chunks async generalmente tienen nombres diferentes o están en rutas específicas
  const asyncChunks = chunks.filter(chunk => {
    // Los chunks async pueden tener nombres que incluyen el hash pero no están en el bundle inicial
    // Esto es una heurística - la verificación real requiere análisis del build manifest
    return true // Por ahora asumimos que si están separados, son async
  })

  return {
    total: chunks.length,
    async: asyncChunks.length,
    isAsync: chunks.length > 0 && chunks.every(c => c.size < MAX_RECOMMENDED_SIZE)
  }
}

function main() {
  console.log('🔍 ANÁLISIS DEL CHUNK DE RECHARTS\n')
  console.log('='.repeat(60))

  // Verificar que existe el build
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Directorio .next no encontrado')
    console.error('   Ejecuta "npm run build" primero')
    process.exit(1)
  }

  // Buscar chunks de recharts
  console.log('\n📊 Buscando chunks de Recharts...')
  const rechartsChunks = findRechartsChunks()

  if (rechartsChunks.length === 0) {
    console.log('✅ No se encontraron chunks de Recharts')
    console.log('   Esto puede significar que:')
    console.log('   1. Recharts no se está usando en el build')
    console.log('   2. Recharts está tree-shaken completamente')
    console.log('   3. Recharts está en un chunk con otro nombre')
    console.log('\n💡 Verifica que Recharts se esté usando en algún componente')
    process.exit(0)
  }

  // Análisis de chunks encontrados
  console.log(`\n📦 Se encontraron ${rechartsChunks.length} chunk(s) de Recharts:\n`)

  let totalSize = 0
  let largestChunk = null

  rechartsChunks.forEach((chunk, index) => {
    totalSize += chunk.size
    if (!largestChunk || chunk.size > largestChunk.size) {
      largestChunk = chunk
    }

    const status = chunk.size > MAX_RECOMMENDED_SIZE ? '🔴' : 
                   chunk.size > IDEAL_SIZE ? '🟡' : '🟢'
    
    console.log(`${status} Chunk ${index + 1}: ${chunk.name}`)
    console.log(`   Tamaño: ${formatBytes(chunk.size)} (${chunk.sizeKB} KB)`)
    console.log(`   Referencias a Recharts: ${chunk.matchCount}`)
    
    if (chunk.size > MAX_RECOMMENDED_SIZE) {
      console.log(`   ⚠️  EXCEDE el límite recomendado de ${formatBytes(MAX_RECOMMENDED_SIZE)}`)
    } else if (chunk.size > IDEAL_SIZE) {
      console.log(`   ⚠️  Excede el tamaño ideal de ${formatBytes(IDEAL_SIZE)}`)
    } else {
      console.log(`   ✅ Dentro del tamaño ideal`)
    }
    console.log()
  })

  // Resumen
  console.log('='.repeat(60))
  console.log('📈 RESUMEN\n')
  console.log(`Total de chunks de Recharts: ${rechartsChunks.length}`)
  console.log(`Tamaño total: ${formatBytes(totalSize)} (${Math.round(totalSize / 1024 * 100) / 100} KB)`)
  
  if (largestChunk) {
    console.log(`Chunk más grande: ${largestChunk.name} (${formatBytes(largestChunk.size)})`)
  }

  // Verificaciones
  console.log('\n✅ VERIFICACIONES:\n')

  // 1. Tamaño del chunk más grande
  if (largestChunk) {
    if (largestChunk.size <= IDEAL_SIZE) {
      console.log('✅ Tamaño del chunk: EXCELENTE (<100KB)')
    } else if (largestChunk.size <= MAX_RECOMMENDED_SIZE) {
      console.log('🟡 Tamaño del chunk: ACEPTABLE (<200KB)')
    } else {
      console.log('🔴 Tamaño del chunk: EXCEDE LÍMITE (>200KB)')
      console.log(`   Reducir en al menos ${formatBytes(largestChunk.size - MAX_RECOMMENDED_SIZE)}`)
    }
  }

  // 2. Carga async
  const asyncCheck = checkAsyncLoading(rechartsChunks)
  if (asyncCheck.total > 0) {
    console.log('✅ Chunks de Recharts encontrados (probablemente async)')
    console.log('   💡 Verifica en Network tab que se carguen bajo demanda')
  }

  // 3. Múltiples chunks
  if (rechartsChunks.length > 1) {
    console.log(`🟡 Múltiples chunks de Recharts (${rechartsChunks.length})`)
    console.log('   Considerar consolidar si es posible')
  } else {
    console.log('✅ Un solo chunk de Recharts (óptimo)')
  }

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:\n')

  if (largestChunk && largestChunk.size > MAX_RECOMMENDED_SIZE) {
    console.log('1. ⚠️  El chunk de Recharts es demasiado grande')
    console.log('   - Verificar que chunks: "async" esté configurado en next.config.js')
    console.log('   - Verificar que se use el wrapper @/lib/recharts-lazy')
    console.log('   - Considerar usar imports más específicos')
    console.log('   - Ejecutar: ANALYZE=true npm run build para análisis detallado')
  } else if (largestChunk && largestChunk.size > IDEAL_SIZE) {
    console.log('1. 🟡 El chunk está dentro del límite pero puede optimizarse más')
    console.log('   - Verificar imports modulares en next.config.js')
    console.log('   - Considerar tree shaking más agresivo')
  } else {
    console.log('1. ✅ El chunk de Recharts está bien optimizado')
  }

  console.log('\n2. Verificar carga async:')
  console.log('   - Abrir DevTools > Network tab')
  console.log('   - Navegar a una página que use Recharts')
  console.log('   - Verificar que el chunk se carga bajo demanda (no en bundle inicial)')

  console.log('\n3. Verificar uso del wrapper:')
  console.log('   - Todos los imports deben ser desde @/lib/recharts-lazy')
  console.log('   - No debe haber imports directos de "recharts"')

  // Resultado final
  console.log('\n' + '='.repeat(60))
  
  if (largestChunk && largestChunk.size <= MAX_RECOMMENDED_SIZE) {
    console.log('✅ ANÁLISIS COMPLETADO: Chunk de Recharts dentro de límites')
    process.exit(0)
  } else if (largestChunk && largestChunk.size <= MAX_RECOMMENDED_SIZE * 1.5) {
    console.log('🟡 ANÁLISIS COMPLETADO: Chunk de Recharts aceptable pero puede mejorarse')
    process.exit(0)
  } else {
    console.log('🔴 ANÁLISIS COMPLETADO: Chunk de Recharts excede límites recomendados')
    process.exit(1)
  }
}

// Ejecutar análisis
main()
