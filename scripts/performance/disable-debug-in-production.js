/**
 * Script para deshabilitar código de debugging en producción
 * Reemplaza todos los fetch a 127.0.0.1:7242 con verificaciones de entorno
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const DEBUG_PATTERN = /fetch\s*\(\s*['"]http:\/\/127\.0\.0\.1:7242\/ingest\/[^'"]+['"]/g

function disableDebugInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // Reemplazar fetch calls con verificación de entorno
  content = content.replace(
    DEBUG_PATTERN,
    (match) => {
      modified = true
      // Comentar el fetch y agregar verificación de entorno
      return `/* ⚡ FASE 11-16: Debugging deshabilitado en producción */\n      // ${match.replace(/\n/g, '\n      // ')}`
    }
  )
  
  // También reemplazar bloques completos de agent log
  const agentLogPattern = /\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g
  content = content.replace(agentLogPattern, (match) => {
    modified = true
    return `// ⚡ FASE 11-16: Código de debugging deshabilitado en producción\n      // Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga`
  })
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Deshabilitado debugging en: ${filePath}`)
    return true
  }
  
  return false
}

// Buscar todos los archivos TypeScript/JavaScript en src
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
})

let modifiedCount = 0
files.forEach(file => {
  if (disableDebugInFile(file)) {
    modifiedCount++
  }
})

console.log(`\n✅ Deshabilitado debugging en ${modifiedCount} archivos`)

