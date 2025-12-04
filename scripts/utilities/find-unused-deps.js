const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Lista de dependencias potencialmente no utilizadas basada en el análisis
const suspiciousDeps = [
  // Dependencias que podrían no estar en uso
  'critters',
  'isomorphic-dompurify',
  'maplibre-gl',
  'react-range-slider-input',
  'svix',
  'validator',
  'use-debounce',
  'usehooks-ts',
  'react-day-picker',
  'react-icons',
  'recharts',
  'resend',
  'sonner',

  // DevDependencies que podrían no estar en uso
  '@axe-core/react',
  'babel-plugin-import',
  'chrome-launcher',
  'glob',
  'jest-html-reporters',
  'jest-junit',
  'lighthouse',
]

// Función para buscar uso de una dependencia en el código
function searchDependencyUsage(depName) {
  const searchPatterns = [
    `import.*from.*['"]${depName}['"]`,
    `import.*['"]${depName}['"]`,
    `require\(['"]${depName}['"]\)`,
    `from.*['"]${depName}['"]`,
  ]

  let found = false

  for (const pattern of searchPatterns) {
    try {
      const result = execSync(
        `powershell -Command "Get-ChildItem -Path 'src' -Recurse -Include '*.ts','*.tsx','*.js','*.jsx' | Select-String -Pattern '${pattern}' -Quiet"`,
        { encoding: 'utf8', cwd: process.cwd() }
      )

      if (result.trim() === 'True') {
        found = true
        break
      }
    } catch (error) {
      // Continuar con el siguiente patrón
    }
  }

  return found
}

// Función principal
function findUnusedDependencies() {
  console.log('🔍 Analizando dependencias potencialmente no utilizadas...\n')

  const unused = []
  const used = []

  for (const dep of suspiciousDeps) {
    console.log(`Verificando: ${dep}`)

    const isUsed = searchDependencyUsage(dep)

    if (isUsed) {
      used.push(dep)
      console.log(`  ✅ En uso`)
    } else {
      unused.push(dep)
      console.log(`  ❌ Posiblemente no utilizada`)
    }
  }

  console.log('\n📊 Resumen:')
  console.log(`✅ Dependencias en uso: ${used.length}`)
  console.log(`❌ Dependencias posiblemente no utilizadas: ${unused.length}`)

  if (unused.length > 0) {
    console.log('\n🗑️  Dependencias que podrían ser removidas:')
    unused.forEach(dep => console.log(`  - ${dep}`))

    console.log('\n💡 Comando para remover:')
    console.log(`npm uninstall ${unused.join(' ')}`)
  }

  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    analyzed: suspiciousDeps.length,
    used: used,
    unused: unused,
    potentialSavings: unused.length,
  }

  fs.writeFileSync('unused-dependencies-report.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Reporte guardado en: unused-dependencies-report.json')
}

// Ejecutar análisis
findUnusedDependencies()
