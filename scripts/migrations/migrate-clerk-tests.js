#!/usr/bin/env node

/**
 * Script para migrar tests de Clerk a NextAuth
 * Automatiza la migración de referencias en archivos de test
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

console.log('🔄 Iniciando migración de tests Clerk → NextAuth...\n')

// Patrones de migración
const migrations = [
  // Imports
  {
    from: /import\s+{\s*useUser\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: "import { useSession } from 'next-auth/react'",
  },
  {
    from: /import\s+{\s*getAuth,?\s*auth\s*}\s+from\s+['"]@clerk\/nextjs\/server['"]/g,
    to: "import { auth } from '@/auth'",
  },
  {
    from: /import\s+{\s*auth\s*}\s+from\s+['"]@clerk\/nextjs\/server['"]/g,
    to: "import { auth } from '@/auth'",
  },

  // Mocks
  {
    from: /jest\.mock\(['"]@clerk\/nextjs['"]\s*,\s*\(\)\s*=>\s*\(\{[^}]*useUser:\s*jest\.fn\(\)[^}]*\}\)\)/g,
    to: "jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))",
  },
  {
    from: /jest\.mock\(['"]@clerk\/nextjs\/server['"]\s*,\s*\(\)\s*=>\s*\(\{[^}]*\}\)\)/g,
    to: "jest.mock('@/auth', () => ({ auth: jest.fn() }))",
  },

  // Variables
  {
    from: /const\s+mockUseUser\s*=\s*useUser\s+as\s+jest\.MockedFunction<typeof\s+useUser>/g,
    to: 'const mockUseSession = useSession as jest.MockedFunction<typeof useSession>',
  },

  // Llamadas a mocks
  {
    from: /mockUseUser\.mockReturnValue\(\{[\s\S]*?user:\s*null,[\s\S]*?isLoaded:\s*true,[\s\S]*?isSignedIn:\s*false[\s\S]*?\}\s*as\s*any\)/g,
    to: "mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as any)",
  },
  {
    from: /mockUseUser\.mockReturnValue\(\{[\s\S]*?user:\s*mockUser,[\s\S]*?isLoaded:\s*true,[\s\S]*?isSignedIn:\s*true[\s\S]*?\}\s*as\s*any\)/g,
    to: "mockUseSession.mockReturnValue({ data: { user: mockUser }, status: 'authenticated' } as any)",
  },
  {
    from: /mockUseUser\.mockReturnValue\(\{[\s\S]*?user:\s*null,[\s\S]*?isLoaded:\s*false,[\s\S]*?isSignedIn:\s*false[\s\S]*?\}\s*as\s*any\)/g,
    to: "mockUseSession.mockReturnValue({ data: null, status: 'loading' } as any)",
  },

  // Comentarios y nombres
  {
    from: /\/\/\s*Mock\s+Clerk/g,
    to: '// Mock NextAuth',
  },
  {
    from: /TESTS?\s+UNITARIOS?\s+PARA\s+USECART\s+WITH\s+CLERK\s+HOOK/g,
    to: 'TESTS UNITARIOS PARA USECART WITH NEXTAUTH HOOK',
  },
  {
    from: /describe\(['"]useCartWithClerk\s+Hook['"]/g,
    to: "describe('useCartWithNextAuth Hook'",
  },

  // Estructura de datos de usuario
  {
    from: /firstName:\s*['"][^'"]*['"],[\s\S]*?lastName:\s*['"][^'"]*['"],[\s\S]*?emailAddresses:\s*\[\s*\{\s*emailAddress:\s*['"][^'"]*['"]\s*\}\s*\]/g,
    to: "name: 'Juan Pérez', email: 'juan@example.com'",
  },
]

// Buscar archivos de test
const testFiles = glob.sync('src/**/*.test.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**'],
})

console.log(`📁 Encontrados ${testFiles.length} archivos de test\n`)

let migratedFiles = 0
let totalChanges = 0

testFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')

    // Verificar si el archivo contiene referencias a Clerk
    if (!content.includes('@clerk') && !content.includes('clerk') && !content.includes('Clerk')) {
      return
    }

    console.log(`🔍 Migrando: ${filePath}`)

    let newContent = content
    let fileChanges = 0

    // Aplicar migraciones
    migrations.forEach((migration, index) => {
      const matches = newContent.match(migration.from)
      if (matches) {
        newContent = newContent.replace(migration.from, migration.to)
        fileChanges += matches.length
        console.log(`  ✅ Patrón ${index + 1}: ${matches.length} cambios`)
      }
    })

    // Migración manual para casos específicos
    newContent = newContent.replace(/mockUseUser/g, 'mockUseSession')

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
  }
})

console.log('🎉 Migración completada!')
console.log(`📊 Resumen:`)
console.log(`  - Archivos migrados: ${migratedFiles}`)
console.log(`  - Total de cambios: ${totalChanges}`)
console.log(`  - Archivos procesados: ${testFiles.length}`)

if (migratedFiles > 0) {
  console.log('\n🔧 Próximos pasos:')
  console.log('  1. Revisar los cambios manualmente')
  console.log('  2. Ejecutar tests para verificar')
  console.log('  3. Ajustar casos específicos si es necesario')
}
