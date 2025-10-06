#!/usr/bin/env node

/**
 * Script específico para migrar tests de autenticación en Fase 2
 * Enfocado en los archivos que aún tienen referencias a Clerk
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 Iniciando migración específica de tests de autenticación...\n')

// Archivos específicos que necesitan migración
const authTestFiles = [
  'src/components/Header/__tests__/unit/AuthSection.unit.test.tsx',
  'src/components/Header/__tests__/AuthSection.test.tsx',
  'src/__tests__/auth/require-admin-auth-fix.test.ts',
  'src/__tests__/auth/admin-auth-401-fix.test.ts',
  'src/__tests__/enterprise-auth-utils.test.ts',
  'src/__tests__/auth-migration.test.ts',
  'src/__tests__/admin-auth-improved.test.ts',
]

// Patrones de migración específicos para archivos de auth
const authMigrations = [
  // Imports básicos
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
  {
    from: /import\s+{\s*currentUser\s*}\s+from\s+['"]@clerk\/nextjs\/server['"]/g,
    to: '// currentUser migrado a NextAuth - usar auth() en su lugar',
  },

  // Mocks
  {
    from: /jest\.mock\(['"]@clerk\/nextjs['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: '// NextAuth se mockea automáticamente via moduleNameMapper',
  },
  {
    from: /jest\.mock\(['"]@clerk\/nextjs\/server['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: '// NextAuth se mockea automáticamente via moduleNameMapper',
  },

  // Variables y referencias
  {
    from: /const\s+mockCurrentUser\s*=\s*currentUser\s+as\s+jest\.MockedFunction<typeof\s+currentUser>/g,
    to: '// currentUser no existe en NextAuth - usar mockAuth en su lugar',
  },
  {
    from: /const\s+mockGetAuth\s*=\s*getAuth\s+as\s+jest\.MockedFunction<typeof\s+getAuth>/g,
    to: '// getAuth no existe en NextAuth - usar mockAuth en su lugar',
  },
  {
    from: /mockCurrentUser/g,
    to: 'mockAuth',
  },
  {
    from: /mockGetAuth/g,
    to: 'mockAuth',
  },
  {
    from: /getAuth/g,
    to: 'auth',
  },
  {
    from: /currentUser/g,
    to: 'auth',
  },

  // Comentarios y descripciones
  {
    from: /\/\/\s*Mock\s+de\s+Clerk/g,
    to: '// NextAuth se mockea automáticamente',
  },
  {
    from: /\/\/\s*Mocks?\s+Clerk/g,
    to: '// NextAuth se mockea automáticamente',
  },
]

let totalFiles = 0
let migratedFiles = 0
let totalChanges = 0

authTestFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Archivo no encontrado: ${filePath}`)
    return
  }

  totalFiles++

  try {
    const content = fs.readFileSync(filePath, 'utf8')

    // Verificar si el archivo contiene referencias a Clerk
    if (!content.includes('@clerk') && !content.includes('clerk') && !content.includes('Clerk')) {
      console.log(`✅ ${filePath} - Ya migrado`)
      return
    }

    console.log(`🔍 Migrando: ${filePath}`)

    let newContent = content
    let fileChanges = 0

    // Aplicar migraciones
    authMigrations.forEach((migration, index) => {
      const matches = newContent.match(migration.from)
      if (matches) {
        newContent = newContent.replace(migration.from, migration.to)
        fileChanges += matches.length
        console.log(`  ✅ Patrón ${index + 1}: ${matches.length} cambios`)
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
  }
})

console.log('🎉 Migración de tests de autenticación completada!')
console.log(`📊 Resumen:`)
console.log(`  - Archivos procesados: ${totalFiles}`)
console.log(`  - Archivos migrados: ${migratedFiles}`)
console.log(`  - Total de cambios: ${totalChanges}`)

if (migratedFiles > 0) {
  console.log('\n🔧 Próximos pasos:')
  console.log('  1. Revisar archivos migrados manualmente')
  console.log('  2. Ejecutar tests para verificar')
  console.log('  3. Ajustar casos específicos si es necesario')
  console.log('  4. Crear mocks específicos para funciones faltantes')
}
