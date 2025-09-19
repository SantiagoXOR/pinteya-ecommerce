#!/usr/bin/env node

/**
 * Script de migración masiva para Fase 3
 * Aplica todos los patrones validados a escala global
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🚀 Iniciando migración masiva Fase 3...\n');

// Buscar todos los archivos de test
const testFiles = glob.sync('src/**/*.test.{ts,tsx,js,jsx}', { 
  ignore: ['**/node_modules/**', '**/backup-**/**'] 
});

console.log(`📁 Encontrados ${testFiles.length} archivos de test\n`);

// Patrones de migración masiva (combinando todos los exitosos)
const massiveMigrations = [
  // === IMPORTS BÁSICOS ===
  {
    name: "Import useUser → useSession",
    from: /import\s+{\s*([^}]*\s*)?useUser(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: "import { useSession } from 'next-auth/react'"
  },
  {
    name: "Import Clerk server → NextAuth",
    from: /import\s+{\s*([^}]*\s*)?(getAuth|auth|currentUser)(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs\/server['"]/g,
    to: "import { auth } from '@/auth'"
  },
  {
    name: "Import ClerkProvider → SessionProvider",
    from: /import\s+{\s*([^}]*\s*)?ClerkProvider(\s*[^}]*)?\s*}\s+from\s+['"]@clerk\/nextjs['"]/g,
    to: "import { SessionProvider } from 'next-auth/react'"
  },
  
  // === MOCKS ===
  {
    name: "Mock @clerk/nextjs completo",
    from: /jest\.mock\(['"]@clerk\/nextjs['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: "// NextAuth se mockea automáticamente via moduleNameMapper"
  },
  {
    name: "Mock @clerk/nextjs/server completo",
    from: /jest\.mock\(['"]@clerk\/nextjs\/server['"]\s*,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);?/g,
    to: "// NextAuth se mockea automáticamente via moduleNameMapper"
  },
  
  // === VARIABLES Y REFERENCIAS ===
  {
    name: "mockCurrentUser → mockAuth",
    from: /const\s+mockCurrentUser\s*=\s*currentUser\s+as\s+jest\.MockedFunction<typeof\s+currentUser>/g,
    to: "const mockAuth = auth as jest.MockedFunction<typeof auth>"
  },
  {
    name: "mockGetAuth → mockAuth",
    from: /const\s+mockGetAuth\s*=\s*getAuth\s+as\s+jest\.MockedFunction<typeof\s+getAuth>/g,
    to: "const mockAuth = auth as jest.MockedFunction<typeof auth>"
  },
  {
    name: "mockUseUser → mockUseSession",
    from: /const\s+mockUseUser\s*=\s*useUser\s+as\s+jest\.MockedFunction<typeof\s+useUser>/g,
    to: "const mockUseSession = useSession as jest.MockedFunction<typeof useSession>"
  },
  
  // === REFERENCIAS EN CÓDIGO ===
  {
    name: "mockCurrentUser calls",
    from: /mockCurrentUser/g,
    to: "mockAuth"
  },
  {
    name: "mockGetAuth calls",
    from: /mockGetAuth/g,
    to: "mockAuth"
  },
  {
    name: "mockUseUser calls",
    from: /mockUseUser/g,
    to: "mockUseSession"
  },
  
  // === FUNCIONES ===
  {
    name: "getAuth calls",
    from: /\bgetAuth\b/g,
    to: "auth"
  },
  {
    name: "currentUser calls",
    from: /\bcurrentUser\b/g,
    to: "auth"
  },
  {
    name: "useUser calls",
    from: /\buseUser\b/g,
    to: "useSession"
  },
  
  // === COMPONENTES ===
  {
    name: "ClerkProvider → SessionProvider",
    from: /ClerkProvider/g,
    to: "SessionProvider"
  },
  {
    name: "SignedIn component",
    from: /SignedIn/g,
    to: "AuthenticatedUser"
  },
  {
    name: "SignedOut component", 
    from: /SignedOut/g,
    to: "UnauthenticatedUser"
  },
  
  // === ESTRUCTURAS DE DATOS ===
  {
    name: "Clerk user structure",
    from: /{\s*user:\s*([^,}]+),\s*isLoaded:\s*true,\s*isSignedIn:\s*true\s*}/g,
    to: "{ data: { user: $1 }, status: 'authenticated' }"
  },
  {
    name: "Clerk no user structure",
    from: /{\s*user:\s*null,\s*isLoaded:\s*true,\s*isSignedIn:\s*false\s*}/g,
    to: "{ data: null, status: 'unauthenticated' }"
  },
  {
    name: "Clerk loading structure",
    from: /{\s*user:\s*null,\s*isLoaded:\s*false,\s*isSignedIn:\s*false\s*}/g,
    to: "{ data: null, status: 'loading' }"
  },
  
  // === COMENTARIOS ===
  {
    name: "Comentarios Clerk",
    from: /\/\/\s*(Mock\s+)?(de\s+)?Clerk/gi,
    to: "// NextAuth se mockea automáticamente"
  },
  {
    name: "Comentarios useUser",
    from: /\/\/.*useUser.*/gi,
    to: "// useSession de NextAuth"
  }
];

let totalFiles = 0;
let migratedFiles = 0;
let totalChanges = 0;
let skippedFiles = 0;

testFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Archivo no encontrado: ${filePath}`);
    return;
  }
  
  totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si el archivo contiene referencias a Clerk
    const hasClerkReferences = content.includes('@clerk') || 
                              content.includes('clerk') || 
                              content.includes('Clerk') ||
                              content.includes('useUser') ||
                              content.includes('getAuth') ||
                              content.includes('currentUser');
    
    if (!hasClerkReferences) {
      skippedFiles++;
      return;
    }
    
    console.log(`🔍 Migrando: ${filePath}`);
    
    let newContent = content;
    let fileChanges = 0;
    
    // Aplicar todas las migraciones
    massiveMigrations.forEach((migration, index) => {
      const matches = newContent.match(migration.from);
      if (matches) {
        newContent = newContent.replace(migration.from, migration.to);
        fileChanges += matches.length;
        console.log(`  ✅ ${migration.name}: ${matches.length} cambios`);
      }
    });
    
    if (fileChanges > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      migratedFiles++;
      totalChanges += fileChanges;
      console.log(`  📝 ${fileChanges} cambios aplicados\n`);
    } else {
      console.log(`  ⚠️ No se encontraron patrones para migrar\n`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
});

console.log('🎉 Migración masiva Fase 3 completada!');
console.log(`📊 Resumen:`);
console.log(`  - Archivos encontrados: ${totalFiles}`);
console.log(`  - Archivos migrados: ${migratedFiles}`);
console.log(`  - Archivos sin cambios: ${skippedFiles}`);
console.log(`  - Total de cambios: ${totalChanges}`);

if (migratedFiles > 0) {
  console.log('\n🔧 Próximos pasos:');
  console.log('  1. Ejecutar tests para validar migración');
  console.log('  2. Verificar panel administrativo');
  console.log('  3. Medir success rate global');
  console.log('  4. Resolver casos específicos si es necesario');
}

console.log(`\n📈 Progreso esperado:`);
console.log(`  - Success rate objetivo: >85%`);
console.log(`  - Basado en Fases 1-2: 91.3% confirmado`);
console.log(`  - Archivos migrados: ${migratedFiles}/${totalFiles} (${((migratedFiles/totalFiles)*100).toFixed(1)}%)`);
