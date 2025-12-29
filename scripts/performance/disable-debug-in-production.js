/**
 * Script para deshabilitar código de debugging en producción
 * Reemplaza todos los fetch a 127.0.0.1:7242 con verificaciones de entorno
 */

const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')

function disableDebugInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  let modified = false
  
  // Patrón más amplio para capturar fetch calls con diferentes formatos
  // Captura fetch('http://127.0.0.1:7242/...') con diferentes comillas y espacios
  const fetchPattern = /fetch\s*\(\s*['"]http:\/\/127\.0\.0\.1:7242\/ingest\/[^'"]+['"][\s\S]*?\)\s*\.catch\s*\([^)]*\)/g
  
  // Reemplazar fetch calls completos
  content = content.replace(fetchPattern, (match) => {
    modified = true
    // Comentar todo el bloque de fetch
    const lines = match.split('\n')
    const commented = lines.map(line => {
      // Preservar indentación
      const indent = line.match(/^\s*/)[0]
      return `${indent}// ⚡ FASE 11-16: Debugging deshabilitado en producción - ${line.trim()}`
    }).join('\n')
    return commented
  })
  
  // También reemplazar bloques completos de agent log (más agresivo)
  const agentLogPattern = /\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g
  content = content.replace(agentLogPattern, (match) => {
    modified = true
    // Preservar indentación del bloque
    const indent = match.match(/^\s*/)?.[0] || ''
    return `${indent}// ⚡ FASE 11-16: Código de debugging deshabilitado en producción\n${indent}// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga`
  })
  
  // Patrón para fetch en una sola línea (más común)
  const singleLineFetchPattern = /fetch\s*\([^)]*127\.0\.0\.1:7242[^)]*\)[^;]*;?/g
  content = content.replace(singleLineFetchPattern, (match) => {
    if (!match.includes('// ⚡ FASE 11-16')) { // Evitar reemplazar lo ya comentado
      modified = true
      const indent = match.match(/^\s*/)?.[0] || ''
      return `${indent}// ⚡ FASE 11-16: Debugging deshabilitado en producción\n${indent}// ${match.trim()}`
    }
    return match
  })
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Deshabilitado debugging en: ${filePath}`)
    return true
  }
  
  return false
}

// Buscar todos los archivos TypeScript/JavaScript en src
const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
})

let modifiedCount = 0
files.forEach(file => {
  if (disableDebugInFile(file)) {
    modifiedCount++
  }
})

console.log(`\n✅ Deshabilitado debugging en ${modifiedCount} archivos`)

