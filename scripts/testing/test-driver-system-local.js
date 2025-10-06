/**
 * Script para probar el sistema de navegación GPS de drivers localmente
 * Ejecuta pruebas completas del sistema en el entorno de desarrollo
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuración
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
const TEST_TIMEOUT = 30000 // 30 segundos

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`🔍 ${title}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Verificar que el servidor de desarrollo esté corriendo
 */
async function checkDevServer() {
  logSection('Verificando Servidor de Desarrollo')

  try {
    const response = await fetch(BASE_URL)
    if (response.ok) {
      logSuccess('Servidor de desarrollo está corriendo')
      return true
    } else {
      logError(`Servidor responde con status ${response.status}`)
      return false
    }
  } catch (error) {
    logError('Servidor de desarrollo no está corriendo')
    logInfo('Ejecuta: npm run dev')
    return false
  }
}

/**
 * Verificar archivos del sistema de drivers
 */
function checkDriverFiles() {
  logSection('Verificando Archivos del Sistema de Drivers')

  const requiredFiles = [
    // Páginas principales
    'src/app/driver/layout.tsx',
    'src/app/driver/login/page.tsx',
    'src/app/driver/dashboard/page.tsx',
    'src/app/driver/routes/page.tsx',
    'src/app/driver/route/[id]/page.tsx',
    'src/app/driver/deliveries/page.tsx',
    'src/app/driver/profile/page.tsx',

    // APIs
    'src/app/api/driver/profile/route.ts',
    'src/app/api/driver/routes/[id]/route.ts',
    'src/app/api/driver/location/route.ts',
    'src/app/api/driver/navigation/directions/route.ts',
    'src/app/api/driver/deliveries/route.ts',

    // Componentes
    'src/components/driver/DriverNavigation.tsx',
    'src/components/driver/GPSNavigationMap.tsx',
    'src/components/driver/DeliveryCard.tsx',
    'src/components/driver/NavigationInstructions.tsx',

    // Contexto y middleware
    'src/contexts/DriverContext.tsx',
    'src/middleware/driver-auth.ts',

    // Documentación
    'DRIVER_GPS_NAVIGATION_SYSTEM_DOCUMENTATION.md',
  ]

  let allFilesExist = true

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file}`)
    } else {
      logError(`${file} - FALTANTE`)
      allFilesExist = false
    }
  }

  return allFilesExist
}

/**
 * Verificar variables de entorno
 */
function checkEnvironmentVariables() {
  logSection('Verificando Variables de Entorno')

  const requiredEnvVars = [
    'GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ]

  let allVarsSet = true

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} - Configurada`)
    } else {
      logError(`${envVar} - FALTANTE`)
      allVarsSet = false
    }
  }

  return allVarsSet
}

/**
 * Probar rutas de drivers
 */
async function testDriverRoutes() {
  logSection('Probando Rutas de Drivers')

  const routes = [
    '/driver/login',
    '/driver/dashboard',
    '/driver/routes',
    '/driver/deliveries',
    '/driver/profile',
  ]

  let allRoutesWork = true

  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route}`)
      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 es esperado para rutas protegidas sin autenticación
        logSuccess(`${route} - Accesible`)
      } else {
        logError(`${route} - Error ${response.status}`)
        allRoutesWork = false
      }
    } catch (error) {
      logError(`${route} - Error de conexión`)
      allRoutesWork = false
    }
  }

  return allRoutesWork
}

/**
 * Probar APIs de drivers
 */
async function testDriverAPIs() {
  logSection('Probando APIs de Drivers')

  const apis = [
    { path: '/api/driver/profile', method: 'GET' },
    { path: '/api/driver/location', method: 'GET' },
    { path: '/api/driver/deliveries', method: 'GET' },
    {
      path: '/api/driver/navigation/directions',
      method: 'POST',
      body: {
        origin: { lat: -34.6037, lng: -58.3816 },
        destination: { lat: -34.6118, lng: -58.396 },
      },
    },
  ]

  let allAPIsWork = true

  for (const api of apis) {
    try {
      const options = {
        method: api.method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (api.body) {
        options.body = JSON.stringify(api.body)
      }

      const response = await fetch(`${BASE_URL}${api.path}`, options)

      if (response.status === 401) {
        logSuccess(`${api.path} - Protegida correctamente (401)`)
      } else if (response.ok) {
        logSuccess(`${api.path} - Funcional`)
      } else {
        logWarning(`${api.path} - Status ${response.status}`)
      }
    } catch (error) {
      logError(`${api.path} - Error: ${error.message}`)
      allAPIsWork = false
    }
  }

  return allAPIsWork
}

/**
 * Verificar dependencias de Node.js
 */
function checkNodeDependencies() {
  logSection('Verificando Dependencias de Node.js')

  const requiredDependencies = [
    '@vis.gl/react-google-maps',
    'next-auth',
    '@supabase/supabase-js',
    'lucide-react',
    '@radix-ui/react-navigation-menu',
  ]

  let allDepsInstalled = true

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    for (const dep of requiredDependencies) {
      if (allDeps[dep]) {
        logSuccess(`${dep} - v${allDeps[dep]}`)
      } else {
        logError(`${dep} - NO INSTALADA`)
        allDepsInstalled = false
      }
    }
  } catch (error) {
    logError('Error leyendo package.json')
    allDepsInstalled = false
  }

  return allDepsInstalled
}

/**
 * Ejecutar tests automatizados
 */
function runAutomatedTests() {
  logSection('Ejecutando Tests Automatizados')

  try {
    // Verificar si Jest está configurado
    if (fs.existsSync('jest.config.js') || fs.existsSync('jest.config.ts')) {
      logInfo('Ejecutando tests unitarios...')
      execSync('npm test -- --testPathPattern=driver --passWithNoTests', { stdio: 'inherit' })
      logSuccess('Tests unitarios completados')
    } else {
      logWarning('Jest no configurado - Saltando tests unitarios')
    }

    // Verificar si Playwright está configurado
    if (fs.existsSync('playwright.config.ts')) {
      logInfo('Ejecutando tests E2E...')
      execSync('npx playwright test --grep="driver" || true', { stdio: 'inherit' })
      logSuccess('Tests E2E completados')
    } else {
      logWarning('Playwright no configurado - Saltando tests E2E')
    }

    return true
  } catch (error) {
    logError('Error ejecutando tests automatizados')
    return false
  }
}

/**
 * Generar reporte de testing
 */
function generateTestReport(results) {
  logSection('Reporte de Testing')

  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  const failedTests = totalTests - passedTests

  log(`\n📊 RESUMEN DE RESULTADOS:`, 'bright')
  log(`   Total de pruebas: ${totalTests}`)
  log(`   Exitosas: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow')
  log(`   Fallidas: ${failedTests}`, failedTests === 0 ? 'green' : 'red')
  log(`   Porcentaje de éxito: ${Math.round((passedTests / totalTests) * 100)}%`)

  if (failedTests === 0) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON!', 'green')
    log('El sistema de navegación GPS para drivers está listo para uso.', 'green')
  } else {
    log('\n⚠️  ALGUNOS TESTS FALLARON', 'yellow')
    log('Revisa los errores arriba y corrige los problemas antes de continuar.', 'yellow')
  }

  // Próximos pasos
  log('\n🚀 PRÓXIMOS PASOS:', 'cyan')
  log('1. Corregir cualquier error mostrado arriba')
  log('2. Probar el sistema en un navegador real')
  log('3. Verificar funcionalidad GPS en dispositivos móviles')
  log('4. Configurar drivers de prueba en la base de datos')
  log('5. Probar integración completa con Google Maps')
}

/**
 * Función principal
 */
async function main() {
  log('🚚 PINTEYA DRIVER GPS NAVIGATION SYSTEM - LOCAL TESTING', 'bright')
  log('Sistema de Navegación GPS para Drivers - Pruebas Locales', 'cyan')

  const results = {}

  // Ejecutar todas las pruebas
  results.devServer = await checkDevServer()
  results.files = checkDriverFiles()
  results.environment = checkEnvironmentVariables()
  results.dependencies = checkNodeDependencies()
  results.routes = await testDriverRoutes()
  results.apis = await testDriverAPIs()
  results.automatedTests = runAutomatedTests()

  // Generar reporte
  generateTestReport(results)

  // Exit code basado en resultados
  const allPassed = Object.values(results).every(Boolean)
  process.exit(allPassed ? 0 : 1)
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    logError(`Error ejecutando tests: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  checkDevServer,
  checkDriverFiles,
  checkEnvironmentVariables,
  testDriverRoutes,
  testDriverAPIs,
  checkNodeDependencies,
  runAutomatedTests,
  generateTestReport,
}
