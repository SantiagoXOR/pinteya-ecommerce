#!/usr/bin/env node

/**
 * Script de migración global para Fase 5
 * Aplica toda la metodología validada de Fases 1-4 a escala masiva
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

console.log('🚀 Iniciando migración global Fase 5...\n')

// Buscar todos los archivos de test y componentes
const allFiles = [
  ...glob.sync('src/**/*.test.{ts,tsx,js,jsx}', { ignore: ['**/node_modules/**'] }),
  ...glob.sync('src/**/*.spec.{ts,tsx,js,jsx}', { ignore: ['**/node_modules/**'] }),
  ...glob.sync('src/components/**/*.{ts,tsx}', { ignore: ['**/node_modules/**'] }),
  ...glob.sync('src/pages/**/*.{ts,tsx}', { ignore: ['**/node_modules/**'] }),
]

console.log(`📁 Encontrados ${allFiles.length} archivos para procesar\n`)

// Patrones de migración global (metodología completa validada)
const globalMigrations = [
  // === IMPORTS BÁSICOS ===
  {
    name: 'Import useUser → useSession',
    from: /import\s+{\s*([^}]*\s*)?useUser(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: "import { useSession } from 'next-auth/react'",
  },
  {
    name: 'Import Clerk server → NextAuth',
    from: /import\s+{\s*([^}]*\s*)?(getAuth|auth|currentUser)(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs\/server['"]/g,
    to: "import { auth } from '@/auth'",
  },
  {
    name: 'Import ClerkProvider → SessionProvider',
    from: /import\s+{\s*([^}]*\s*)?ClerkProvider(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: "import { SessionProvider } from 'next-auth/react'",
  },
  {
    name: 'Import Clerk components',
    from: /import\s+{\s*([^}]*\s*)?(SignedIn|SignedOut|UserButton)(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: '// Clerk components migrados a NextAuth - usar componentes personalizados',
  },

  // === MOCKS ===
  {
    name: 'Mock @clerk/nextjs completo',
    from: /jest\.mock\(['"]@clerk\/nextjs['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: '// NextAuth se mockea automáticamente via moduleNameMapper',
  },
  {
    name: 'Mock @clerk/nextjs/server completo',
    from: /jest\.mock\(['"]@clerk\/nextjs\/server['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: '// NextAuth se mockea automáticamente via moduleNameMapper',
  },
  {
    name: 'Mock @clerk/nextjs simple',
    from: /jest\.mock\(['"]@clerk\/nextjs['"]\);?/g,
    to: '// NextAuth se mockea automáticamente via moduleNameMapper',
  },

  // === VARIABLES Y REFERENCIAS ===
  {
    name: 'mockCurrentUser → mockAuth',
    from: /const\s+mockCurrentUser\s*=\s*currentUser\s+as\s+jest\.MockedFunction<typeof\s+currentUser>/g,
    to: 'const mockAuth = auth as jest.MockedFunction<typeof auth>',
  },
  {
    name: 'mockGetAuth → mockAuth',
    from: /const\s+mockGetAuth\s*=\s*getAuth\s+as\s+jest\.MockedFunction<typeof\s+getAuth>/g,
    to: 'const mockAuth = auth as jest.MockedFunction<typeof auth>',
  },
  {
    name: 'mockUseUser → mockUseSession',
    from: /const\s+mockUseUser\s*=\s*useUser\s+as\s+jest\.MockedFunction<typeof\s+useUser>/g,
    to: 'const mockUseSession = useSession as jest.MockedFunction<typeof useSession>',
  },

  // === REFERENCIAS EN CÓDIGO ===
  {
    name: 'mockCurrentUser calls',
    from: /\bmockCurrentUser\b/g,
    to: 'mockAuth',
  },
  {
    name: 'mockGetAuth calls',
    from: /\bmockGetAuth\b/g,
    to: 'mockAuth',
  },
  {
    name: 'mockUseUser calls',
    from: /\bmockUseUser\b/g,
    to: 'mockUseSession',
  },

  // === FUNCIONES ===
  {
    name: 'getAuth calls',
    from: /\bgetAuth\s*\(/g,
    to: 'auth(',
  },
  {
    name: 'currentUser calls',
    from: /\bcurrentUser\s*\(/g,
    to: 'auth(',
  },
  {
    name: 'useUser calls',
    from: /\buseUser\s*\(/g,
    to: 'useSession(',
  },

  // === COMPONENTES ===
  {
    name: 'ClerkProvider → SessionProvider',
    from: /<ClerkProvider/g,
    to: '<SessionProvider',
  },
  {
    name: 'ClerkProvider closing',
    from: /<\/ClerkProvider>/g,
    to: '</SessionProvider>',
  },
  {
    name: 'SignedIn component',
    from: /<SignedIn>/g,
    to: '<!-- SignedIn migrado a NextAuth -->',
  },
  {
    name: 'SignedOut component',
    from: /<SignedOut>/g,
    to: '<!-- SignedOut migrado a NextAuth -->',
  },

  // === ESTRUCTURAS DE DATOS ===
  {
    name: 'Clerk user structure authenticated',
    from: /{\s*user:\s*([^,}]+),\s*isLoaded:\s*true,\s*isSignedIn:\s*true\s*}/g,
    to: "{ data: { user: $1 }, status: 'authenticated' }",
  },
  {
    name: 'Clerk no user structure',
    from: /{\s*user:\s*null,\s*isLoaded:\s*true,\s*isSignedIn:\s*false\s*}/g,
    to: "{ data: null, status: 'unauthenticated' }",
  },
  {
    name: 'Clerk loading structure',
    from: /{\s*user:\s*null,\s*isLoaded:\s*false,\s*isSignedIn:\s*false\s*}/g,
    to: "{ data: null, status: 'loading' }",
  },

  // === PROPIEDADES ===
  {
    name: 'isLoaded property',
    from: /\.isLoaded/g,
    to: ".status !== 'loading'",
  },
  {
    name: 'isSignedIn property',
    from: /\.isSignedIn/g,
    to: ".status === 'authenticated'",
  },
  {
    name: 'user property in session',
    from: /session\.user/g,
    to: 'session?.user',
  },

  // === COMENTARIOS ===
  {
    name: 'Comentarios Clerk',
    from: /\/\/\s*(Mock\s+)?(de\s+)?Clerk/gi,
    to: '// NextAuth se mockea automáticamente',
  },
  {
    name: 'Comentarios useUser',
    from: /\/\/.*useUser.*/gi,
    to: '// useSession de NextAuth',
  },

  // === CASOS ESPECÍFICOS ===
  {
    name: 'mockClerkHooks references',
    from: /mockClerkHooks/g,
    to: 'mockNextAuthHooks',
  },
  {
    name: 'ClerkProvider props',
    from: /publishableKey=['"][^'"]*['"]/g,
    to: 'session={mockSession}',
  },
]

let totalFiles = 0
let migratedFiles = 0
let totalChanges = 0
let skippedFiles = 0
let errorFiles = 0

allFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Archivo no encontrado: ${filePath}`)
    return
  }

  totalFiles++

  try {
    const content = fs.readFileSync(filePath, 'utf8')

    // Verificar si el archivo contiene referencias a Clerk
    const hasClerkReferences =
      content.includes('@clerk') ||
      content.includes('clerk') ||
      content.includes('Clerk') ||
      content.includes('useUser') ||
      content.includes('getAuth') ||
      content.includes('currentUser') ||
      content.includes('SignedIn') ||
      content.includes('SignedOut') ||
      content.includes('ClerkProvider')

    if (!hasClerkReferences) {
      skippedFiles++
      return
    }

    console.log(`🔍 Migrando: ${filePath}`)

    let newContent = content
    let fileChanges = 0

    // Aplicar todas las migraciones
    globalMigrations.forEach((migration, index) => {
      const matches = newContent.match(migration.from)
      if (matches) {
        newContent = newContent.replace(migration.from, migration.to)
        fileChanges += matches.length
        console.log(`  ✅ ${migration.name}: ${matches.length} cambios`)
      }
    })

    if (fileChanges > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      migratedFiles++
      totalChanges += fileChanges
      console.log(`  📝 ${fileChanges} cambios aplicados\n`)
    } else {
      console.log(`  ⚠️ No se encontraron patrones para migrar\n`)
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message)
    errorFiles++
  }
})

console.log('🎉 Migración global Fase 5 completada!')
console.log(`📊 Resumen:`)
console.log(`  - Archivos encontrados: ${totalFiles}`)
console.log(`  - Archivos migrados: ${migratedFiles}`)
console.log(`  - Archivos sin cambios: ${skippedFiles}`)
console.log(`  - Archivos con errores: ${errorFiles}`)
console.log(`  - Total de cambios: ${totalChanges}`)

const migrationRate = ((migratedFiles / totalFiles) * 100).toFixed(1)
console.log(`\n📈 Progreso de migración:`)
console.log(`  - Tasa de migración: ${migrationRate}%`)
console.log(`  - Cambios por archivo: ${(totalChanges / Math.max(migratedFiles, 1)).toFixed(1)}`)

if (migratedFiles > 0) {
  console.log('\n🔧 Próximos pasos:')
  console.log('  1. Ejecutar tests para validar migración global')
  console.log('  2. Medir success rate global')
  console.log('  3. Identificar casos específicos restantes')
  console.log('  4. Aplicar metodología Fase 4 si es necesario')
}

console.log(`\n🎯 Objetivo Fase 5:`)
console.log(`  - Success rate objetivo: >90%`)
console.log(`  - Basado en metodología validada: 100% en core`)
console.log(`  - Archivos procesados: ${totalFiles} (escala masiva)`)
