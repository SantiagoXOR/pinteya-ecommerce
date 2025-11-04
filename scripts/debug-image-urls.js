/**
 * Script para Debuggear URLs de Imágenes en Supabase
 * 
 * Este script:
 * 1. Verifica todas las URLs de imágenes en la BD
 * 2. Detecta URLs malformadas (hostname incorrecto)
 * 3. Genera reporte detallado de problemas
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

// URL correcta e incorrecta
const CORRECT_HOSTNAME = 'aakzspzfulgftqlgwkpb.supabase.co'
const INCORRECT_HOSTNAME = 'aaklgwkpb.supabase.co' // Falta 'zspzful'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

console.log('🔍 URL de Supabase configurada:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

// Función para extraer URLs de diferentes formatos
function extractUrls(imagesField) {
  const urls = []
  
  if (!imagesField) return urls
  
  // Si es un string, podría ser una URL directa
  if (typeof imagesField === 'string') {
    if (imagesField.includes('http')) {
      urls.push(imagesField)
    }
    return urls
  }
  
  // Si es un array
  if (Array.isArray(imagesField)) {
    imagesField.forEach(item => {
      if (typeof item === 'string' && item.includes('http')) {
        urls.push(item)
      } else if (item?.url) {
        urls.push(item.url)
      } else if (item?.image_url) {
        urls.push(item.image_url)
      }
    })
    return urls
  }
  
  // Si es un objeto con estructura {main, previews, gallery, thumbnails}
  if (typeof imagesField === 'object') {
    if (imagesField.main) urls.push(imagesField.main)
    if (imagesField.previews) {
      if (Array.isArray(imagesField.previews)) {
        imagesField.previews.forEach(url => {
          if (url && typeof url === 'string') urls.push(url)
        })
      }
    }
    if (imagesField.gallery) {
      if (Array.isArray(imagesField.gallery)) {
        imagesField.gallery.forEach(url => {
          if (url && typeof url === 'string') urls.push(url)
        })
      }
    }
    if (imagesField.thumbnails) {
      if (Array.isArray(imagesField.thumbnails)) {
        imagesField.thumbnails.forEach(url => {
          if (url && typeof url === 'string') urls.push(url)
        })
      }
    }
  }
  
  return urls
}

// Función para verificar si una URL está malformada
function checkUrlHostname(url) {
  if (!url || typeof url !== 'string') return { valid: true, url }
  
  const hasIncorrectHostname = url.includes(INCORRECT_HOSTNAME)
  const hasCorrectHostname = url.includes(CORRECT_HOSTNAME)
  
  if (hasIncorrectHostname) {
    const fixedUrl = url.replace(INCORRECT_HOSTNAME, CORRECT_HOSTNAME)
    return {
      valid: false,
      url,
      fixedUrl,
      issue: 'hostname_incorrecto',
      message: `Hostname incorrecto: ${INCORRECT_HOSTNAME} -> ${CORRECT_HOSTNAME}`
    }
  }
  
  if (!hasCorrectHostname && url.includes('supabase.co')) {
    return {
      valid: false,
      url,
      issue: 'hostname_desconocido',
      message: 'URL de Supabase con hostname diferente'
    }
  }
  
  return { valid: true, url }
}

// Verificar tabla products
async function checkProductsTable() {
  console.log('\n📦 Verificando tabla PRODUCTS...\n')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, images')
  
  if (error) {
    console.error('❌ Error al obtener productos:', error.message)
    return { total: 0, issues: [] }
  }
  
  const issues = []
  let totalUrls = 0
  let malformedUrls = 0
  
  products.forEach(product => {
    const urls = extractUrls(product.images)
    totalUrls += urls.length
    
    urls.forEach(url => {
      const check = checkUrlHostname(url)
      if (!check.valid) {
        malformedUrls++
        issues.push({
          table: 'products',
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          ...check
        })
      }
    })
  })
  
  console.log(`✅ Total de productos: ${products.length}`)
  console.log(`📊 Total de URLs extraídas: ${totalUrls}`)
  console.log(`${malformedUrls > 0 ? '❌' : '✅'} URLs malformadas: ${malformedUrls}`)
  
  return { total: products.length, totalUrls, malformedUrls, issues }
}

// Verificar tabla product_images (si existe)
async function checkProductImagesTable() {
  console.log('\n🖼️  Verificando tabla PRODUCT_IMAGES...\n')
  
  try {
    const { data: images, error } = await supabase
      .from('product_images')
      .select('id, product_id, url, image_url')
    
    if (error) {
      if (error.code === '42P01') {
        console.log('ℹ️  Tabla product_images no existe (esto es normal)')
        return { total: 0, issues: [] }
      }
      throw error
    }
    
    const issues = []
    let malformedUrls = 0
    
    images.forEach(image => {
      const urlToCheck = image.url || image.image_url
      if (urlToCheck) {
        const check = checkUrlHostname(urlToCheck)
        if (!check.valid) {
          malformedUrls++
          issues.push({
            table: 'product_images',
            imageId: image.id,
            productId: image.product_id,
            ...check
          })
        }
      }
    })
    
    console.log(`✅ Total de imágenes: ${images.length}`)
    console.log(`${malformedUrls > 0 ? '❌' : '✅'} URLs malformadas: ${malformedUrls}`)
    
    return { total: images.length, malformedUrls, issues }
  } catch (error) {
    console.error('❌ Error al verificar product_images:', error.message)
    return { total: 0, issues: [] }
  }
}

// Verificar tabla product_variants
async function checkProductVariantsTable() {
  console.log('\n🎨 Verificando tabla PRODUCT_VARIANTS...\n')
  
  try {
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, product_id, image_url, measure')
    
    if (error) {
      console.log('ℹ️  No se pudo acceder a product_variants:', error.message)
      return { total: 0, issues: [] }
    }
    
    const issues = []
    let malformedUrls = 0
    
    variants.forEach(variant => {
      if (variant.image_url) {
        const check = checkUrlHostname(variant.image_url)
        if (!check.valid) {
          malformedUrls++
          issues.push({
            table: 'product_variants',
            variantId: variant.id,
            productId: variant.product_id,
            measure: variant.measure,
            ...check
          })
        }
      }
    })
    
    console.log(`✅ Total de variantes: ${variants.length}`)
    console.log(`${malformedUrls > 0 ? '❌' : '✅'} URLs malformadas: ${malformedUrls}`)
    
    return { total: variants.length, malformedUrls, issues }
  } catch (error) {
    console.error('❌ Error al verificar product_variants:', error.message)
    return { total: 0, issues: [] }
  }
}

// Generar reporte
function generateReport(results) {
  const allIssues = [
    ...results.products.issues,
    ...results.productImages.issues,
    ...results.productVariants.issues
  ]
  
  const reportContent = `# Reporte de URLs de Imágenes - Debug
Fecha: ${new Date().toISOString()}

## Resumen Ejecutivo

### Estado General: ${allIssues.length === 0 ? '✅ PERFECTO' : '❌ PROBLEMAS DETECTADOS'}

- **Total de productos**: ${results.products.total}
- **Total de URLs analizadas**: ${results.products.totalUrls}
- **URLs malformadas detectadas**: ${allIssues.length}

## Detalle por Tabla

### Products
- Total productos: ${results.products.total}
- URLs extraídas: ${results.products.totalUrls}
- URLs malformadas: ${results.products.malformedUrls}

### Product Images
- Total imágenes: ${results.productImages.total}
- URLs malformadas: ${results.productImages.malformedUrls}

### Product Variants
- Total variantes: ${results.productVariants.total}
- URLs malformadas: ${results.productVariants.malformedUrls}

## Problemas Detectados

${allIssues.length === 0 ? 'No se detectaron problemas. ✅' : ''}

${allIssues.map((issue, index) => `
### ${index + 1}. ${issue.table.toUpperCase()} - ${issue.issue}

- **Producto**: ${issue.productName || issue.productId}
- **URL Original**: \`${issue.url}\`
${issue.fixedUrl ? `- **URL Corregida**: \`${issue.fixedUrl}\`` : ''}
- **Mensaje**: ${issue.message}

`).join('\n')}

## Acciones Recomendadas

${allIssues.length > 0 ? `
1. Ejecutar script de corrección para actualizar las ${allIssues.length} URLs malformadas
2. Implementar validación en el código para prevenir futuros errores
3. Verificar el origen de estas URLs incorrectas
` : `
✅ No se requieren acciones. Todas las URLs son correctas.
`}

---

**Hostname Correcto**: \`${CORRECT_HOSTNAME}\`
**Hostname Incorrecto Detectado**: \`${INCORRECT_HOSTNAME}\`
`
  
  // Guardar reporte
  const reportPath = path.join(__dirname, 'debug-image-urls-report.md')
  fs.writeFileSync(reportPath, reportContent)
  console.log(`\n📄 Reporte guardado en: ${reportPath}`)
  
  // También guardar JSON para el script de corrección
  const jsonPath = path.join(__dirname, 'debug-image-urls-issues.json')
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: allIssues.length,
      products: results.products.total,
      totalUrls: results.products.totalUrls
    },
    issues: allIssues
  }, null, 2))
  console.log(`📄 Datos JSON guardados en: ${jsonPath}`)
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO DEBUG DE URLs DE IMÁGENES\n')
  console.log('━'.repeat(60))
  
  const results = {
    products: await checkProductsTable(),
    productImages: await checkProductImagesTable(),
    productVariants: await checkProductVariantsTable()
  }
  
  console.log('\n' + '━'.repeat(60))
  console.log('\n📊 GENERANDO REPORTE...\n')
  
  generateReport(results)
  
  const totalIssues = results.products.malformedUrls + 
                      results.productImages.malformedUrls + 
                      results.productVariants.malformedUrls
  
  console.log('\n' + '═'.repeat(60))
  if (totalIssues === 0) {
    console.log('✅ ¡PERFECTO! No se encontraron URLs malformadas.')
  } else {
    console.log(`❌ Se encontraron ${totalIssues} URLs malformadas.`)
    console.log('   Revisa el reporte para más detalles.')
  }
  console.log('═'.repeat(60) + '\n')
}

// Ejecutar
main().catch(console.error)

