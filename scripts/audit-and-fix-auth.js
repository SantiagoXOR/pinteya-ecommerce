#!/usr/bin/env node

/**
 * 🔐 SCRIPT DE AUDITORÍA Y CORRECCIÓN AUTOMÁTICA
 * Sistema de Autenticación Clerk & Supabase
 * 
 * Este script automatiza las correcciones identificadas en la auditoría
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colores para output
const colors = {
  reset: '\x1b[0m',
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

function header(title) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`  🔐 ${title}`, 'cyan')
  log('='.repeat(60), 'cyan')
}

function step(number, description) {
  log(`\n${number}. ${description}`, 'blue')
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

// Configuración
const CONFIG = {
  backupDir: 'backups/auth-migration',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
}

// Funciones auxiliares
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    success(`Directorio creado: ${dirPath}`)
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(CONFIG.backupDir, `${path.basename(filePath)}.${CONFIG.timestamp}`)
    ensureDir(CONFIG.backupDir)
    fs.copyFileSync(filePath, backupPath)
    success(`Backup creado: ${backupPath}`)
    return backupPath
  }
  return null
}

function runCommand(command, description) {
  try {
    log(`Ejecutando: ${command}`, 'magenta')
    execSync(command, { stdio: 'inherit' })
    success(description)
    return true
  } catch (err) {
    error(`Error en: ${description}`)
    error(err.message)
    return false
  }
}

// Análisis del estado actual
function analyzeCurrentState() {
  step('1', 'Analizando estado actual del sistema de autenticación')
  
  const issues = []
  const files = {
    middleware: 'src/middleware.ts',
    useUserRole: 'src/hooks/useUserRole.ts',
    providers: 'src/app/providers.tsx',
    supabaseClient: 'src/lib/supabase.ts',
  }
  
  // Verificar archivos críticos
  Object.entries(files).forEach(([name, filePath]) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Análisis específico por archivo
      switch (name) {
        case 'middleware':
          if (content.includes('clerkMiddleware(async (auth, request)')) {
            issues.push('❌ Middleware usa patrón obsoleto (277 líneas)')
          }
          if (content.includes('createClerkClient')) {
            issues.push('❌ Middleware hace doble verificación con API')
          }
          break
          
        case 'useUserRole':
          if (content.includes('TEMPORALMENTE DESHABILITADO')) {
            issues.push('❌ Hook useUserRole está deshabilitado')
          }
          break
          
        case 'providers':
          if (content.includes('signInFallbackRedirectUrl="/shop"')) {
            issues.push('⚠️  URLs de redirección inconsistentes')
          }
          break
          
        case 'supabaseClient':
          if (!content.includes('@supabase/ssr')) {
            issues.push('❌ Supabase no usa SSR (patrón legacy)')
          }
          break
      }
      
      success(`Encontrado: ${filePath}`)
    } else {
      issues.push(`❌ Archivo faltante: ${filePath}`)
    }
  })
  
  // Verificar dependencias
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (!packageJson.dependencies['@supabase/ssr']) {
    issues.push('❌ Dependencia @supabase/ssr faltante')
  }
  
  // Mostrar resumen
  log('\n📊 RESUMEN DEL ANÁLISIS:', 'yellow')
  if (issues.length === 0) {
    success('No se encontraron problemas críticos')
  } else {
    issues.forEach(issue => log(issue))
  }
  
  return issues
}

// Ejecutar tests para obtener estado actual
function runTests() {
  step('2', 'Ejecutando tests para evaluar estado actual')
  
  log('Ejecutando tests de hooks...', 'magenta')
  const testResult = runCommand('npm run test:hooks -- --passWithNoTests', 'Tests de hooks')
  
  if (!testResult) {
    warning('Tests fallaron - se procederá con las correcciones')
  }
  
  return testResult
}

// Instalar dependencias necesarias
function installDependencies() {
  step('3', 'Instalando dependencias necesarias')
  
  const dependencies = ['@supabase/ssr']
  
  dependencies.forEach(dep => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    if (!packageJson.dependencies[dep]) {
      runCommand(`npm install ${dep}`, `Instalación de ${dep}`)
    } else {
      success(`${dep} ya está instalado`)
    }
  })
}

// Crear estructura de directorios
function createDirectoryStructure() {
  step('4', 'Creando estructura de directorios necesaria')
  
  const dirs = [
    'utils/supabase',
    'src/hooks',
    'docs/audit',
    CONFIG.backupDir,
  ]
  
  dirs.forEach(ensureDir)
}

// Implementar correcciones automáticas
function implementFixes() {
  step('5', 'Implementando correcciones automáticas')
  
  // Backup de archivos críticos
  log('\n📋 Creando backups...', 'yellow')
  const criticalFiles = [
    'src/middleware.ts',
    'src/hooks/useUserRole.ts',
    'src/app/providers.tsx',
    'src/lib/supabase.ts',
  ]
  
  criticalFiles.forEach(backupFile)
  
  // Crear archivos de ejemplo si no existen
  log('\n🛠️  Creando archivos de ejemplo...', 'yellow')
  
  // Middleware moderno
  const modernMiddleware = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas admin con verificación automática
  if (isAdminRoute(req)) {
    await auth.protect({ role: 'admin' })
  }
  
  // Proteger otras rutas autenticadas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
`
  
  // Solo crear si no existe o si el usuario confirma
  if (!fs.existsSync('src/middleware.modern.ts')) {
    fs.writeFileSync('src/middleware.modern.ts', modernMiddleware)
    success('Creado: src/middleware.modern.ts (ejemplo de middleware moderno)')
  }
  
  // Cliente Supabase SSR
  const supabaseServerClient = `import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
`
  
  ensureDir('utils/supabase')
  if (!fs.existsSync('utils/supabase/server.ts')) {
    fs.writeFileSync('utils/supabase/server.ts', supabaseServerClient)
    success('Creado: utils/supabase/server.ts (cliente SSR)')
  }
  
  // Hook moderno de autenticación
  const modernAuthHook = `'use client'

import { useAuth, useUser } from '@clerk/nextjs'

export function useAuthWithRoles() {
  const { userId, has, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  
  const isLoaded = authLoaded && userLoaded
  
  // Verificaciones automáticas con Clerk
  const isAdmin = has({ role: 'admin' })
  const isModerator = has({ role: 'moderator' })
  const isCustomer = has({ role: 'customer' })
  
  // Permisos específicos
  const canManageProducts = has({ permission: 'products:manage' })
  const canManageOrders = has({ permission: 'orders:manage' })
  const canViewAnalytics = has({ permission: 'analytics:view' })
  const canAccessAdminPanel = isAdmin || isModerator
  
  return {
    userId,
    user,
    isLoaded,
    isAdmin,
    isModerator,
    isCustomer,
    canManageProducts,
    canManageOrders,
    canViewAnalytics,
    canAccessAdminPanel,
    hasRole: (role: string) => has({ role }),
    hasPermission: (permission: string) => has({ permission }),
  }
}
`
  
  if (!fs.existsSync('src/hooks/useAuthWithRoles.ts')) {
    fs.writeFileSync('src/hooks/useAuthWithRoles.ts', modernAuthHook)
    success('Creado: src/hooks/useAuthWithRoles.ts (hook moderno)')
  }
}

// Validar correcciones
function validateFixes() {
  step('6', 'Validando correcciones implementadas')
  
  log('Ejecutando tests después de las correcciones...', 'magenta')
  const testResult = runCommand('npm run test:hooks -- --passWithNoTests', 'Validación con tests')
  
  if (testResult) {
    success('Tests pasaron después de las correcciones')
  } else {
    warning('Algunos tests aún fallan - revisar manualmente')
  }
  
  // Verificar que los archivos de ejemplo existen
  const exampleFiles = [
    'src/middleware.modern.ts',
    'utils/supabase/server.ts',
    'src/hooks/useAuthWithRoles.ts',
  ]
  
  exampleFiles.forEach(file => {
    if (fs.existsSync(file)) {
      success(`Archivo de ejemplo creado: ${file}`)
    } else {
      warning(`Archivo de ejemplo faltante: ${file}`)
    }
  })
}

// Generar reporte final
function generateReport() {
  step('7', 'Generando reporte final')
  
  const reportPath = `docs/audit/AUTO_FIX_REPORT_${CONFIG.timestamp}.md`
  const report = `# 🔐 REPORTE DE CORRECCIÓN AUTOMÁTICA

**Fecha:** ${new Date().toLocaleString()}
**Timestamp:** ${CONFIG.timestamp}

## ✅ CORRECCIONES IMPLEMENTADAS

### 1. Dependencias Instaladas
- ✅ @supabase/ssr

### 2. Archivos de Ejemplo Creados
- ✅ src/middleware.modern.ts (middleware simplificado)
- ✅ utils/supabase/server.ts (cliente SSR)
- ✅ src/hooks/useAuthWithRoles.ts (hook moderno)

### 3. Backups Creados
- 📋 Todos los archivos críticos respaldados en: ${CONFIG.backupDir}

## 🚀 PRÓXIMOS PASOS MANUALES

1. **Revisar archivos de ejemplo** y compararlos con implementación actual
2. **Reemplazar middleware actual** con src/middleware.modern.ts
3. **Migrar hooks** de useUserRole a useAuthWithRoles
4. **Actualizar imports** en componentes que usan autenticación
5. **Ejecutar tests completos**: npm run test:all
6. **Probar en desarrollo**: npm run dev

## 📚 DOCUMENTACIÓN

- Ver: docs/audit/CLERK_SUPABASE_AUDIT_REPORT_2025.md
- Ver: docs/audit/IMPLEMENTATION_EXAMPLES_2025.md

## ⚠️ IMPORTANTE

Los archivos originales están respaldados. Las correcciones son ejemplos
que deben ser revisados e integrados manualmente según las necesidades
específicas del proyecto.
`
  
  ensureDir('docs/audit')
  fs.writeFileSync(reportPath, report)
  success(`Reporte generado: ${reportPath}`)
}

// Función principal
async function main() {
  header('AUDITORÍA Y CORRECCIÓN AUTOMÁTICA - CLERK & SUPABASE')
  
  try {
    // Análisis inicial
    const issues = analyzeCurrentState()
    
    if (issues.length === 0) {
      success('No se encontraron problemas críticos. Sistema en buen estado.')
      return
    }
    
    // Ejecutar correcciones
    runTests()
    installDependencies()
    createDirectoryStructure()
    implementFixes()
    validateFixes()
    generateReport()
    
    // Resumen final
    header('RESUMEN FINAL')
    success('Correcciones automáticas completadas')
    log('\n📋 PRÓXIMOS PASOS:', 'yellow')
    log('1. Revisar archivos de ejemplo creados')
    log('2. Integrar cambios manualmente')
    log('3. Ejecutar tests: npm run test:all')
    log('4. Probar en desarrollo: npm run dev')
    log('\n📚 Ver documentación completa en:')
    log('   - docs/audit/CLERK_SUPABASE_AUDIT_REPORT_2025.md')
    log('   - docs/audit/IMPLEMENTATION_EXAMPLES_2025.md')
    
  } catch (err) {
    error('Error durante la ejecución:')
    error(err.message)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main, analyzeCurrentState, implementFixes }
