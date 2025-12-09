const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Obtener lista de archivos con imports de lucide-react
const result = execSync('grep -r "from [\'\\"]lucide-react[\'\\"]" src --include="*.ts" --include="*.tsx" -l', { encoding: 'utf8', cwd: process.cwd() })
const files = result.trim().split('\n').filter(f => f && !f.includes('optimized-imports'))

console.log(`Encontrados ${files.length} archivos para migrar\n`)

let migrated = 0
for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8')
    
    // Solo migrar si no usa ya optimized-imports
    if (content.includes('@/lib/optimized-imports')) {
      continue
    }
    
    // Reemplazar imports
    content = content.replace(
      /from\s+['"]lucide-react['"]/g,
      "from '@/lib/optimized-imports'"
    )
    
    fs.writeFileSync(file, content, 'utf8')
    console.log(`✅ ${path.relative(process.cwd(), file)}`)
    migrated++
  } catch (err) {
    console.error(`❌ Error en ${file}:`, err.message)
  }
}

console.log(`\n✨ Migrados ${migrated} archivos`)


