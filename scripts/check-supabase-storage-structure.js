/**
 * Script para verificar la estructura real de Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllFolders() {
  console.log('📁 Listando carpetas en product-images...\n')
  
  const { data: folders, error } = await supabase
    .storage
    .from('product-images')
    .list('', {
      limit: 100,
      offset: 0
    })
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`✅ Encontradas ${folders.length} carpetas/archivos\n`)
  
  for (const folder of folders) {
    if (!folder.name.includes('.')) {
      console.log(`📂 Carpeta: ${folder.name}`)
      
      // Listar archivos dentro de esta carpeta
      const { data: files, error: filesError } = await supabase
        .storage
        .from('product-images')
        .list(folder.name, {
          limit: 100
        })
      
      if (!filesError && files) {
        files.forEach(file => {
          if (file.name.includes('.')) {
            console.log(`   └─ ${file.name}`)
          }
        })
      }
      console.log('')
    }
  }
  
  // Verificar específicamente las imágenes problem áticas
  console.log('\n🔍 VERIFICANDO IMÁGENES ESPECÍFICAS:\n')
  
  const urlsToCheck = [
    'genericos/thinner-generico.webp',
    'genericos/aguarras-generico.webp',
    'pintemas/thinner-pintemas.webp',
    'pintemas/aguarras-pintemas.webp',
    '+color/thinner-pintemas.webp',
    '+color/aguarras-pintemas.webp'
  ]
  
  for (const path of urlsToCheck) {
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${path}`
    
    try {
      const response = await fetch(fullUrl, { method: 'HEAD' })
      const status = response.status
      const exists = status === 200
      
      console.log(`${exists ? '✅' : '❌'} ${path} (HTTP ${status})`)
    } catch (error) {
      console.log(`❌ ${path} (Error: ${error.message})`)
    }
  }
}

listAllFolders().catch(console.error)

