/**
 * Script para analizar y normalizar el campo images (JSONB) en la tabla products
 * Estandarizar todos los registros al formato: {"previews": [...], "thumbnails": [...]}
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Leer variables de entorno desde .env.local
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '..', '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })

    return envVars
  } catch (error) {
    console.error('❌ Error leyendo .env.local:', error.message)
    return {}
  }
}

const envVars = loadEnvVars()

// Configuración de Supabase
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos de formato encontrados
const formatosEncontrados = {
  correcto: [], // {"previews": [...], "thumbnails": [...]}
  arraySimple: [], // ["url1", "url2"]
  vacio: [], // null, undefined, {}
  arraysVacios: [], // {"previews": [], "thumbnails": []}
  otros: []
}

function analizarFormatoImagen(images) {
  // Caso 1: null o undefined
  if (!images) {
    return 'vacio'
  }

  // Caso 2: Array simple de URLs
  if (Array.isArray(images)) {
    return 'arraySimple'
  }

  // Caso 3: Objeto con estructura correcta
  if (typeof images === 'object' && !Array.isArray(images)) {
    // Verificar si tiene las propiedades correctas
    if (images.hasOwnProperty('previews') && images.hasOwnProperty('thumbnails')) {
      // Verificar si ambos arrays están vacíos
      if (
        Array.isArray(images.previews) && 
        Array.isArray(images.thumbnails) &&
        images.previews.length === 0 && 
        images.thumbnails.length === 0
      ) {
        return 'arraysVacios'
      }
      return 'correcto'
    }
    
    // Objeto pero sin la estructura correcta
    return 'otros'
  }

  return 'otros'
}

function normalizarImagen(images) {
  const formato = analizarFormatoImagen(images)
  
  switch (formato) {
    case 'arraySimple':
      // Convertir array simple a formato correcto
      return {
        previews: Array.isArray(images) ? images : [],
        thumbnails: Array.isArray(images) ? images : []
      }
    
    case 'vacio':
      // Retornar estructura vacía pero válida
      return {
        previews: [],
        thumbnails: []
      }
    
    case 'arraysVacios':
      // Ya está en formato correcto aunque vacío
      return images
    
    case 'correcto':
      // Ya está correcto, no cambiar
      return images
    
    case 'otros':
      // Intentar recuperar lo que se pueda
      if (typeof images === 'object') {
        return {
          previews: images.previews || [],
          thumbnails: images.thumbnails || []
        }
      }
      return {
        previews: [],
        thumbnails: []
      }
    
    default:
      return {
        previews: [],
        thumbnails: []
      }
  }
}

async function analizarTodosLosProductos() {
  console.log('🔍 Analizando campo images de todos los productos...')
  console.log('═'.repeat(70))
  
  try {
    const { data: productos, error } = await supabase
      .from('products')
      .select('id, name, slug, images')
      .order('id')
    
    if (error) {
      console.error('❌ Error obteniendo productos:', error)
      return
    }
    
    console.log(`📦 Total de productos: ${productos.length}\n`)
    
    // Analizar cada producto
    productos.forEach(producto => {
      const formato = analizarFormatoImagen(producto.images)
      
      const item = {
        id: producto.id,
        name: producto.name,
        slug: producto.slug,
        images: producto.images
      }
      
      switch (formato) {
        case 'correcto':
          formatosEncontrados.correcto.push(item)
          break
        case 'arraySimple':
          formatosEncontrados.arraySimple.push(item)
          break
        case 'vacio':
          formatosEncontrados.vacio.push(item)
          break
        case 'arraysVacios':
          formatosEncontrados.arraysVacios.push(item)
          break
        default:
          formatosEncontrados.otros.push(item)
      }
    })
    
    // Mostrar resultados del análisis
    console.log('📊 RESULTADOS DEL ANÁLISIS')
    console.log('═'.repeat(70))
    console.log(`✅ Formato correcto (con imágenes):        ${formatosEncontrados.correcto.length}`)
    console.log(`⚠️  Array simple (necesita conversión):    ${formatosEncontrados.arraySimple.length}`)
    console.log(`📭 Arrays vacíos (sin imágenes):           ${formatosEncontrados.arraysVacios.length}`)
    console.log(`❌ Campo vacío (null/undefined):           ${formatosEncontrados.vacio.length}`)
    console.log(`🔸 Otros formatos:                         ${formatosEncontrados.otros.length}`)
    console.log('')
    
    // Mostrar detalles de productos con array simple
    if (formatosEncontrados.arraySimple.length > 0) {
      console.log('\n🔍 PRODUCTOS CON ARRAY SIMPLE (necesitan normalización):')
      console.log('─'.repeat(70))
      formatosEncontrados.arraySimple.forEach(p => {
        console.log(`ID ${p.id}: ${p.name}`)
        console.log(`   Formato actual: ${JSON.stringify(p.images)}`)
      })
    }
    
    // Mostrar detalles de otros formatos
    if (formatosEncontrados.otros.length > 0) {
      console.log('\n🔸 PRODUCTOS CON OTROS FORMATOS:')
      console.log('─'.repeat(70))
      formatosEncontrados.otros.forEach(p => {
        console.log(`ID ${p.id}: ${p.name}`)
        console.log(`   Formato actual: ${JSON.stringify(p.images)}`)
      })
    }
    
    // Mostrar productos sin imágenes
    if (formatosEncontrados.vacio.length > 0) {
      console.log('\n❌ PRODUCTOS SIN IMÁGENES (campo null/undefined):')
      console.log('─'.repeat(70))
      formatosEncontrados.vacio.slice(0, 10).forEach(p => {
        console.log(`ID ${p.id}: ${p.name}`)
      })
      if (formatosEncontrados.vacio.length > 10) {
        console.log(`   ... y ${formatosEncontrados.vacio.length - 10} más`)
      }
    }
    
    return productos
  } catch (error) {
    console.error('❌ Error en análisis:', error)
    return []
  }
}

async function normalizarTodosLosProductos(aplicarCambios = false) {
  console.log('\n\n🔧 NORMALIZACIÓN DE IMÁGENES')
  console.log('═'.repeat(70))
  
  if (!aplicarCambios) {
    console.log('⚠️  MODO SIMULACIÓN - No se aplicarán cambios reales')
    console.log('   Para aplicar cambios reales, ejecuta: node script.js --aplicar')
  } else {
    console.log('✅ MODO APLICACIÓN - Se aplicarán cambios a la base de datos')
  }
  console.log('')
  
  const productosParaNormalizar = [
    ...formatosEncontrados.arraySimple,
    ...formatosEncontrados.vacio,
    ...formatosEncontrados.otros
  ]
  
  if (productosParaNormalizar.length === 0) {
    console.log('✨ ¡Todos los productos ya tienen el formato correcto!')
    return
  }
  
  console.log(`📝 Productos a normalizar: ${productosParaNormalizar.length}\n`)
  
  let actualizados = 0
  let errores = 0
  
  for (const producto of productosParaNormalizar) {
    const imagenNormalizada = normalizarImagen(producto.images)
    
    console.log(`📦 ID ${producto.id}: ${producto.name}`)
    console.log(`   Antes:  ${JSON.stringify(producto.images)}`)
    console.log(`   Después: ${JSON.stringify(imagenNormalizada)}`)
    
    if (aplicarCambios) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            images: imagenNormalizada,
            updated_at: new Date().toISOString()
          })
          .eq('id', producto.id)
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`)
          errores++
        } else {
          console.log(`   ✅ Actualizado`)
          actualizados++
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        errores++
      }
    } else {
      console.log(`   ℹ️  Simulación - no se aplicó`)
    }
    console.log('')
  }
  
  console.log('═'.repeat(70))
  console.log('📊 RESUMEN DE NORMALIZACIÓN')
  console.log('═'.repeat(70))
  if (aplicarCambios) {
    console.log(`✅ Productos actualizados: ${actualizados}`)
    console.log(`❌ Errores: ${errores}`)
    console.log(`📊 Total procesados: ${productosParaNormalizar.length}`)
  } else {
    console.log(`📋 Productos que se normalizarían: ${productosParaNormalizar.length}`)
    console.log(`✅ Productos que ya están correctos: ${formatosEncontrados.correcto.length + formatosEncontrados.arraysVacios.length}`)
  }
}

async function main() {
  const aplicarCambios = process.argv.includes('--aplicar')
  
  console.log('🚀 ANÁLISIS Y NORMALIZACIÓN DE IMÁGENES JSONB')
  console.log('═'.repeat(70))
  console.log('')
  
  // Fase 1: Analizar
  await analizarTodosLosProductos()
  
  // Fase 2: Normalizar (simulación o aplicación)
  await normalizarTodosLosProductos(aplicarCambios)
  
  console.log('\n✨ Proceso completado')
  
  if (!aplicarCambios && 
      (formatosEncontrados.arraySimple.length > 0 || 
       formatosEncontrados.vacio.length > 0 || 
       formatosEncontrados.otros.length > 0)) {
    console.log('\n💡 Para aplicar los cambios reales, ejecuta:')
    console.log('   node scripts/utilities/normalizar-imagenes-jsonb.js --aplicar')
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })

