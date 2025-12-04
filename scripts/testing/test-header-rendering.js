#!/usr/bin/env node

/**
 * SCRIPT DE TESTING - HEADER RENDERING
 * ===================================
 * Verifica que el Header se renderice correctamente después de las correcciones
 * Pinteya E-commerce - Diagnóstico de renderizado
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 DIAGNÓSTICO DE RENDERIZADO DEL HEADER')
console.log('========================================\n')

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

const log = {
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: msg => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`),
}

/**
 * Verifica que los archivos de corrección existan
 */
function checkCorrectionFiles() {
  log.title('1. VERIFICANDO ARCHIVOS DE CORRECCIÓN')

  const files = [
    'src/styles/header-fixes.css',
    'src/styles/mobile-safety.css',
    'src/components/Header/index.tsx',
  ]

  let allFilesExist = true

  files.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`Archivo encontrado: ${file}`)
    } else {
      log.error(`Archivo faltante: ${file}`)
      allFilesExist = false
    }
  })

  return allFilesExist
}

/**
 * Verifica que las correcciones de transform scale estén aplicadas
 */
function checkTransformScaleFixes() {
  log.title('\n2. VERIFICANDO CORRECCIONES DE TRANSFORM SCALE')

  const headerFile = 'src/components/Header/index.tsx'

  if (!fs.existsSync(headerFile)) {
    log.error('Archivo Header no encontrado')
    return false
  }

  const content = fs.readFileSync(headerFile, 'utf8')

  // Buscar problemas de transform scale
  const problematicPatterns = [
    'hover:scale-110',
    'group-hover:scale-110',
    'transform hover:scale',
    'active:scale-95',
  ]

  let hasProblems = false

  problematicPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      log.error(`Patrón problemático encontrado: ${pattern}`)
      hasProblems = true
    }
  })

  if (!hasProblems) {
    log.success('No se encontraron patrones problemáticos de transform scale')
  }

  // Verificar que se usen alternativas
  const goodPatterns = [
    'group-hover:brightness-110',
    'hover:brightness-110',
    'group-hover:drop-shadow-lg',
  ]

  let hasAlternatives = false

  goodPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      log.success(`Alternativa encontrada: ${pattern}`)
      hasAlternatives = true
    }
  })

  return !hasProblems && hasAlternatives
}

/**
 * Verifica las correcciones de positioning relativo
 */
function checkRelativePositioningFixes() {
  log.title('\n3. VERIFICANDO CORRECCIONES DE POSITIONING')

  const headerFile = 'src/components/Header/index.tsx'
  const content = fs.readFileSync(headerFile, 'utf8')

  // Verificar que se hayan removido posicionamientos problemáticos
  const problematicPatterns = ['relative z-10', 'className="relative"']

  let hasProblems = false

  problematicPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      log.warning(`Posicionamiento relativo encontrado: ${pattern}`)
      hasProblems = true
    }
  })

  // Verificar alternativas
  if (content.includes('cart-icon-container')) {
    log.success('Contenedor de carrito optimizado encontrado')
  }

  if (content.includes('search-focus-ring') && !content.includes('relative z-10')) {
    log.success('Contenedor de búsqueda optimizado')
  }

  return !hasProblems
}

/**
 * Verifica la configuración CSS
 */
function checkCSSConfiguration() {
  log.title('\n4. VERIFICANDO CONFIGURACIÓN CSS')

  const headerFixesFile = 'src/styles/header-fixes.css'
  const mobileSafetyFile = 'src/styles/mobile-safety.css'
  const layoutFile = 'src/app/layout.tsx'

  let allCorrect = true

  // Verificar header-fixes.css
  if (fs.existsSync(headerFixesFile)) {
    const content = fs.readFileSync(headerFixesFile, 'utf8')

    if (content.includes('--z-header: 1000')) {
      log.success('Variables CSS de z-index configuradas')
    } else {
      log.error('Variables CSS de z-index faltantes')
      allCorrect = false
    }

    if (content.includes('overflow: visible !important')) {
      log.success('Correcciones de overflow configuradas')
    } else {
      log.error('Correcciones de overflow faltantes')
      allCorrect = false
    }
  } else {
    log.error('Archivo header-fixes.css no encontrado')
    allCorrect = false
  }

  // Verificar mobile-safety.css
  if (fs.existsSync(mobileSafetyFile)) {
    const content = fs.readFileSync(mobileSafetyFile, 'utf8')

    if (content.includes('overflow-y: visible !important')) {
      log.success('Correcciones móviles configuradas')
    } else {
      log.warning('Correcciones móviles podrían necesitar actualización')
    }
  }

  // Verificar importación en layout
  if (fs.existsSync(layoutFile)) {
    const content = fs.readFileSync(layoutFile, 'utf8')

    if (content.includes('header-fixes.css')) {
      log.success('header-fixes.css importado en layout')
    } else {
      log.error('header-fixes.css NO importado en layout')
      allCorrect = false
    }
  }

  return allCorrect
}

/**
 * Genera reporte HTML de diagnóstico
 */
function generateDiagnosticReport(results) {
  log.title('\n5. GENERANDO REPORTE DE DIAGNÓSTICO')

  const reportContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico Header - Pinteya E-commerce</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        .warning { color: #f59e0b; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f8fafc; }
        .status { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Diagnóstico de Renderizado del Header</h1>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="section">
            <div class="status ${results.overall ? 'success' : 'error'}">
                Estado General: ${results.overall ? '✅ CORRECTO' : '❌ REQUIERE ATENCIÓN'}
            </div>
        </div>
        
        <div class="section">
            <h3>📁 Archivos de Corrección</h3>
            <p class="${results.files ? 'success' : 'error'}">
                ${results.files ? '✅ Todos los archivos presentes' : '❌ Archivos faltantes'}
            </p>
        </div>
        
        <div class="section">
            <h3>🎯 Transform Scale</h3>
            <p class="${results.transforms ? 'success' : 'error'}">
                ${results.transforms ? '✅ Correcciones aplicadas' : '❌ Requiere corrección'}
            </p>
        </div>
        
        <div class="section">
            <h3>📍 Positioning</h3>
            <p class="${results.positioning ? 'success' : 'warning'}">
                ${results.positioning ? '✅ Optimizado' : '⚠️ Revisar posicionamiento'}
            </p>
        </div>
        
        <div class="section">
            <h3>🎨 Configuración CSS</h3>
            <p class="${results.css ? 'success' : 'error'}">
                ${results.css ? '✅ Configuración correcta' : '❌ Configuración incompleta'}
            </p>
        </div>
        
        <div class="section">
            <h3>📋 Próximos Pasos</h3>
            ${
              results.overall
                ? '<p class="success">✅ El Header debería renderizarse correctamente. Prueba la aplicación en el navegador.</p>'
                : '<p class="error">❌ Revisa los elementos marcados como incorrectos y aplica las correcciones necesarias.</p>'
            }
        </div>
    </div>
</body>
</html>
  `

  fs.writeFileSync('header-diagnostic-report.html', reportContent)
  log.success('Reporte generado: header-diagnostic-report.html')
}

/**
 * Función principal
 */
function main() {
  const results = {
    files: checkCorrectionFiles(),
    transforms: checkTransformScaleFixes(),
    positioning: checkRelativePositioningFixes(),
    css: checkCSSConfiguration(),
  }

  results.overall = results.files && results.transforms && results.positioning && results.css

  generateDiagnosticReport(results)

  log.title('\n📊 RESUMEN FINAL')

  if (results.overall) {
    log.success('¡Todas las correcciones aplicadas correctamente!')
    log.info('El Header debería renderizarse sin problemas.')
    log.info('Ejecuta: npm run dev y verifica en el navegador.')
  } else {
    log.error('Se encontraron problemas que requieren atención.')
    log.info('Revisa el reporte HTML para más detalles.')
  }

  console.log('\n========================================')
  console.log('🏁 Diagnóstico completado')
}

// Ejecutar el script
main()
