#!/usr/bin/env node

/**
 * ⚡ VERIFICACIÓN DE IMPORTS DE RECHARTS
 * 
 * Este script verifica que todos los imports de Recharts usen el wrapper
 * centralizado @/lib/recharts-lazy en lugar de imports directos.
 * 
 * Uso:
 *   node scripts/verify-recharts-imports.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SRC_DIR = path.join(process.cwd(), 'src')
const WRAPPER_PATH = '@/lib/recharts-lazy'
const EXCLUDED_PATTERNS = [
  'node_modules',
  '.next',
  'recharts-lazy.tsx', // El wrapper mismo puede importar tipos
]

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Excluir directorios
      if (!EXCLUDED_PATTERNS.some(pattern => filePath.includes(pattern))) {
        findFiles(filePath, fileList)
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const issues = []

  // Excluir el wrapper mismo
  if (filePath.includes('recharts-lazy.tsx')) {
    return issues // El wrapper puede usar dynamic imports de recharts
  }

  // Buscar imports directos de recharts (excluyendo tipos y comentarios)
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const trimmedLine = line.trim()
    
    // Saltar líneas comentadas
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return
    }
    
    // Buscar imports directos de recharts (excluyendo tipos)
    const directImportRegex = /import\s+.*\s+from\s+['"]recharts['"]/
    if (directImportRegex.test(trimmedLine)) {
      // Permitir imports de tipos (type imports)
      if (!trimmedLine.includes('type ') && !trimmedLine.includes('import type')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          import: trimmedLine,
          type: 'direct-import'
        })
      }
    }
  })

  return issues
}

function main() {
  console.log('🔍 VERIFICACIÓN DE IMPORTS DE RECHARTS\n')
  console.log('='.repeat(60))

  // Buscar todos los archivos TypeScript/TSX
  console.log('📂 Buscando archivos...')
  const files = findFiles(SRC_DIR)
  console.log(`   Encontrados ${files.length} archivos\n`)

  // Verificar cada archivo
  console.log('🔍 Verificando imports...\n')
  const allIssues = []
  
  files.forEach(file => {
    const issues = checkFile(file)
    if (issues.length > 0) {
      allIssues.push(...issues)
    }
  })

  // Mostrar resultados
  if (allIssues.length === 0) {
    console.log('✅ No se encontraron imports directos de Recharts')
    console.log('   Todos los imports usan el wrapper centralizado @/lib/recharts-lazy\n')
    console.log('='.repeat(60))
    process.exit(0)
  }

  // Agrupar por archivo
  const issuesByFile = {}
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = []
    }
    issuesByFile[issue.file].push(issue)
  })

  console.log(`⚠️  Se encontraron ${allIssues.length} problema(s) en ${Object.keys(issuesByFile).length} archivo(s):\n`)

  Object.entries(issuesByFile).forEach(([file, issues]) => {
    const relativePath = path.relative(process.cwd(), file)
    console.log(`📄 ${relativePath}`)
    
    issues.forEach(issue => {
      const icon = issue.type === 'direct-import' ? '🔴' : '🟡'
      console.log(`   ${icon} Línea ${issue.line}: ${issue.import}`)
      
      if (issue.type === 'direct-import') {
        console.log(`      → Debe usar: import { ... } from '@/lib/recharts-lazy'`)
      } else {
        console.log(`      → Debe usar el wrapper centralizado en lugar de dynamic() directo`)
      }
    })
    console.log()
  })

  // Recomendaciones
  console.log('='.repeat(60))
  console.log('💡 RECOMENDACIONES:\n')
  console.log('1. Reemplazar imports directos de "recharts" por imports desde "@/lib/recharts-lazy"')
  console.log('2. El wrapper centralizado asegura lazy loading consistente')
  console.log('3. Los tipos TypeScript pueden importarse directamente desde "recharts" (no afecta bundle)')
  console.log('\n📝 Ejemplo de migración:')
  console.log('   ❌ import { BarChart, Bar } from "recharts"')
  console.log('   ✅ import { BarChart, Bar } from "@/lib/recharts-lazy"')

  console.log('\n' + '='.repeat(60))
  console.log('❌ VERIFICACIÓN FALLIDA: Se encontraron imports directos de Recharts')
  process.exit(1)
}

main()
