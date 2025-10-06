#!/usr/bin/env node

/**
 * Script para actualizar configuraciones CORS inseguras en rutas API
 * Reemplaza 'Access-Control-Allow-Origin': '*' con configuración segura
 */

const fs = require('fs')
const path = require('path')

// Archivos que necesitan actualización CORS
const FILES_TO_UPDATE = [
  'src/app/api/seo/ab-testing/route.ts',
  'src/app/api/monitoring/stream/route.ts',
  'src/app/api/checkout/validate/route.ts',
  'src/app/api/seo/testing/route.ts',
  'src/app/api/seo/testing/metadata/route.ts',
  'src/app/api/seo/optimization/route.ts',
  'src/app/api/orders/create/route.ts',
]

// Configuración de reemplazos
const CORS_UPDATES = {
  // Importar la configuración CORS
  addImport: "import { generateCorsHeaders } from '@/lib/security/cors-config';",

  // Reemplazar OPTIONS handler inseguro
  oldOptionsPattern:
    /export async function OPTIONS\(request: NextRequest\) \{[\s\S]*?'Access-Control-Allow-Origin': '\*'[\s\S]*?\}\)/g,

  newOptionsHandler: `export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = generateCorsHeaders(origin, 'public');
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}`,
}

/**
 * Actualiza un archivo con configuración CORS segura
 */
function updateFileWithSecureCors(filePath) {
  const fullPath = path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let updated = false

  // Agregar import si no existe
  if (!content.includes('generateCorsHeaders')) {
    const importIndex = content.indexOf('import { logger')
    if (importIndex !== -1) {
      const beforeImport = content.substring(0, importIndex)
      const afterImport = content.substring(importIndex)
      content = beforeImport + CORS_UPDATES.addImport + '\n' + afterImport
      updated = true
    }
  }

  // Reemplazar OPTIONS handler
  if (CORS_UPDATES.oldOptionsPattern.test(content)) {
    content = content.replace(CORS_UPDATES.oldOptionsPattern, CORS_UPDATES.newOptionsHandler)
    updated = true
  }

  // Reemplazar headers CORS individuales
  const corsHeaderPattern = /'Access-Control-Allow-Origin': '\*'/g
  if (corsHeaderPattern.test(content)) {
    // Para casos donde se usan headers individuales, necesitamos un enfoque más específico
    console.log(`⚠️  ${filePath} contiene headers CORS individuales que requieren revisión manual`)
  }

  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Actualizado: ${filePath}`)
    return true
  }

  return false
}

/**
 * Función principal
 */
function main() {
  console.log('🔒 Iniciando actualización de seguridad CORS...\n')

  let updatedCount = 0

  for (const file of FILES_TO_UPDATE) {
    if (updateFileWithSecureCors(file)) {
      updatedCount++
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   - Archivos procesados: ${FILES_TO_UPDATE.length}`)
  console.log(`   - Archivos actualizados: ${updatedCount}`)
  console.log(`   - Archivos sin cambios: ${FILES_TO_UPDATE.length - updatedCount}`)

  if (updatedCount > 0) {
    console.log('\n✅ Actualización de seguridad CORS completada')
    console.log('🔍 Revisa los cambios y ejecuta las pruebas antes de hacer commit')
  } else {
    console.log('\nℹ️  No se realizaron cambios')
  }
}

// Ejecutar script
if (require.main === module) {
  main()
}

module.exports = { updateFileWithSecureCors, CORS_UPDATES }
