const fs = require('fs')
const { execSync } = require('child_process')

// Dependencias confirmadas como NO utilizadas después de verificación manual
const safeToRemove = [
  // Dependencias principales no utilizadas
  'critters',
  'isomorphic-dompurify',
  'maplibre-gl',
  'svix',

  // DevDependencies no utilizadas
  '@axe-core/react',
  'babel-plugin-import',
  'chrome-launcher',
  'glob',
  'jest-html-reporters',
  'jest-junit',
  'lighthouse',
]

// Dependencias que SÍ están en uso (NO remover)
const inUse = [
  'use-debounce', // Usado en hooks de búsqueda
  'usehooks-ts', // Podría estar en uso
  'react-day-picker', // Usado en calendar.tsx
  'react-icons', // Usado en SignInForm
  'recharts', // Usado en PerformanceChart
  'resend', // Usado para emails
  'sonner', // Usado para toasts
  'validator', // Usado en sistema de validación
  'react-range-slider-input', // Usado en PriceDropdown
]

function cleanupDependencies() {
  console.log('🧹 Iniciando limpieza segura de dependencias...\n')

  console.log('✅ Dependencias confirmadas en uso (NO se removerán):')
  inUse.forEach(dep => console.log(`  - ${dep}`))

  console.log('\n🗑️  Dependencias que se removerán:')
  safeToRemove.forEach(dep => console.log(`  - ${dep}`))

  console.log(`\n📊 Total a remover: ${safeToRemove.length} dependencias`)

  // Crear backup del package.json
  console.log('\n💾 Creando backup de package.json...')
  fs.copyFileSync('package.json', 'package.json.backup')

  // Remover dependencias en lotes pequeños para evitar errores
  const batchSize = 5
  for (let i = 0; i < safeToRemove.length; i += batchSize) {
    const batch = safeToRemove.slice(i, i + batchSize)
    console.log(`\n🔄 Removiendo lote ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`)

    try {
      execSync(`npm uninstall ${batch.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('✅ Lote removido exitosamente')
    } catch (error) {
      console.error(`❌ Error removiendo lote: ${error.message}`)
      console.log('🔄 Continuando con el siguiente lote...')
    }
  }

  console.log('\n🎉 Limpieza completada!')
  console.log('💡 Si algo falla, restaura con: cp package.json.backup package.json && npm install')

  // Generar reporte final
  const report = {
    timestamp: new Date().toISOString(),
    removed: safeToRemove,
    kept: inUse,
    totalRemoved: safeToRemove.length,
    backupCreated: 'package.json.backup',
  }

  fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2))
  console.log('📄 Reporte guardado en: cleanup-report.json')
}

// Ejecutar limpieza
cleanupDependencies()
