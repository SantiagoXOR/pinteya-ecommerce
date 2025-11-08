/**
 * Script para Corregir URLs de Imágenes Malformadas
 * 
 * Este script:
 * 1. Lee el archivo JSON generado por debug-image-urls.js
 * 2. Corrige las URLs malformadas en la base de datos
 * 3. Genera un reporte de correcciones realizadas
 * 
 * NOTA: Según el análisis, la BD está limpia. Este script es preventivo.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

// Configuración
const CORRECT_HOSTNAME = 'aakzspzfulgftqlgwkpb.supabase.co'
const INCORRECT_HOSTNAME = 'aaklgwkpb.supabase.co'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Función para corregir una URL
function fixUrl(url) {
  if (!url || typeof url !== 'string') return url
  return url.replace(INCORRECT_HOSTNAME, CORRECT_HOSTNAME)
}

// Función para corregir imágenes en formato complejo (objeto o array)
function fixImagesField(images) {
  if (!images) return images
  
  // Si es string
  if (typeof images === 'string') {
    return fixUrl(images)
  }
  
  // Si es array
  if (Array.isArray(images)) {
    return images.map(item => {
      if (typeof item === 'string') {
        return fixUrl(item)
      } else if (item && typeof item === 'object') {
        const fixed = { ...item }
        if (fixed.url) fixed.url = fixUrl(fixed.url)
        if (fixed.image_url) fixed.image_url = fixUrl(fixed.image_url)
        return fixed
      }
      return item
    })
  }
  
  // Si es objeto
  if (typeof images === 'object') {
    const fixed = { ...images }
    if (fixed.main) fixed.main = fixUrl(fixed.main)
    if (fixed.previews) {
      fixed.previews = Array.isArray(fixed.previews) 
        ? fixed.previews.map(fixUrl) 
        : fixed.previews
    }
    if (fixed.gallery) {
      fixed.gallery = Array.isArray(fixed.gallery) 
        ? fixed.gallery.map(fixUrl) 
        : fixed.gallery
    }
    if (fixed.thumbnails) {
      fixed.thumbnails = Array.isArray(fixed.thumbnails) 
        ? fixed.thumbnails.map(fixUrl) 
        : fixed.thumbnails
    }
    return fixed
  }
  
  return images
}

// Corregir tabla products
async function fixProductsTable(dryRun = true) {
  console.log('\n📦 Corrigiendo tabla PRODUCTS...\n')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, images')
  
  if (error) {
    console.error('❌ Error al obtener productos:', error.message)
    return { fixed: 0, errors: 0 }
  }
  
  let fixed = 0
  let errors = 0
  const corrections = []
  
  for (const product of products) {
    try {
      const originalImages = JSON.stringify(product.images)
      const fixedImages = fixImagesField(product.images)
      const fixedImagesStr = JSON.stringify(fixedImages)
      
      if (originalImages !== fixedImagesStr) {
        console.log(`🔧 Producto: ${product.name} (${product.slug})`)
        console.log(`   Original: ${originalImages.substring(0, 100)}...`)
        console.log(`   Corregido: ${fixedImagesStr.substring(0, 100)}...`)
        
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: fixedImages })
            .eq('id', product.id)
          
          if (updateError) {
            console.error(`   ❌ Error actualizando: ${updateError.message}`)
            errors++
          } else {
            console.log('   ✅ Actualizado correctamente')
            fixed++
            corrections.push({
              table: 'products',
              id: product.id,
              name: product.name,
              slug: product.slug
            })
          }
        } else {
          console.log('   ℹ️  (Modo DRY RUN - no se aplicaron cambios)')
          fixed++
        }
      }
    } catch (err) {
      console.error(`❌ Error procesando producto ${product.id}:`, err.message)
      errors++
    }
  }
  
  console.log(`\n${dryRun ? '📊' : '✅'} Resumen PRODUCTS:`)
  console.log(`   - URLs corregidas: ${fixed}`)
  console.log(`   - Errores: ${errors}`)
  
  return { fixed, errors, corrections }
}

// Corregir tabla product_variants
async function fixProductVariantsTable(dryRun = true) {
  console.log('\n🎨 Corrigiendo tabla PRODUCT_VARIANTS...\n')
  
  try {
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, product_id, image_url, measure')
    
    if (error) {
      console.log('ℹ️  No se pudo acceder a product_variants:', error.message)
      return { fixed: 0, errors: 0 }
    }
    
    let fixed = 0
    let errors = 0
    const corrections = []
    
    for (const variant of variants) {
      if (variant.image_url && variant.image_url.includes(INCORRECT_HOSTNAME)) {
        const fixedUrl = fixUrl(variant.image_url)
        
        console.log(`🔧 Variante ID: ${variant.id} (Producto: ${variant.product_id})`)
        console.log(`   Original: ${variant.image_url}`)
        console.log(`   Corregido: ${fixedUrl}`)
        
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ image_url: fixedUrl })
            .eq('id', variant.id)
          
          if (updateError) {
            console.error(`   ❌ Error actualizando: ${updateError.message}`)
            errors++
          } else {
            console.log('   ✅ Actualizado correctamente')
            fixed++
            corrections.push({
              table: 'product_variants',
              id: variant.id,
              product_id: variant.product_id,
              measure: variant.measure
            })
          }
        } else {
          console.log('   ℹ️  (Modo DRY RUN - no se aplicaron cambios)')
          fixed++
        }
      }
    }
    
    console.log(`\n${dryRun ? '📊' : '✅'} Resumen PRODUCT_VARIANTS:`)
    console.log(`   - URLs corregidas: ${fixed}`)
    console.log(`   - Errores: ${errors}`)
    
    return { fixed, errors, corrections }
  } catch (error) {
    console.error('❌ Error al corregir product_variants:', error.message)
    return { fixed: 0, errors: 0 }
  }
}

// Generar reporte de correcciones
function generateReport(results, dryRun) {
  const totalFixed = results.products.fixed + results.productVariants.fixed
  const totalErrors = results.products.errors + results.productVariants.errors
  
  const reportContent = `# Reporte de Correcciones de URLs de Imágenes
Fecha: ${new Date().toISOString()}
Modo: ${dryRun ? 'DRY RUN (sin aplicar cambios)' : 'CORRECCIÓN REAL'}

## Resumen Ejecutivo

### Estado: ${totalFixed === 0 ? '✅ NO SE REQUIRIERON CORRECCIONES' : dryRun ? '📊 SIMULACIÓN COMPLETADA' : '✅ CORRECCIONES APLICADAS'}

- **URLs corregidas**: ${totalFixed}
- **Errores**: ${totalErrors}

## Detalle por Tabla

### Products
- URLs corregidas: ${results.products.fixed}
- Errores: ${results.products.errors}

### Product Variants
- URLs corregidas: ${results.productVariants.fixed}
- Errores: ${results.productVariants.errors}

## Correcciones Realizadas

${totalFixed === 0 ? 'No se encontraron URLs malformadas. ✅' : ''}

${results.products.corrections.length > 0 ? `
### Products
${results.products.corrections.map((c, i) => `
${i + 1}. **${c.name}** (slug: ${c.slug})
   - ID: ${c.id}
`).join('\n')}
` : ''}

${results.productVariants.corrections.length > 0 ? `
### Product Variants
${results.productVariants.corrections.map((c, i) => `
${i + 1}. Variante ID: ${c.id} (Producto: ${c.product_id}, Medida: ${c.measure})
`).join('\n')}
` : ''}

---

**Hostname Correcto**: \`${CORRECT_HOSTNAME}\`
**Hostname Incorrecto**: \`${INCORRECT_HOSTNAME}\`
`
  
  // Guardar reporte
  const filename = dryRun ? 'fix-urls-dry-run-report.md' : 'fix-urls-corrections-report.md'
  const reportPath = path.join(__dirname, filename)
  fs.writeFileSync(reportPath, reportContent)
  console.log(`\n📄 Reporte guardado en: ${reportPath}`)
}

// Función principal
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  
  console.log('🚀 SCRIPT DE CORRECCIÓN DE URLs DE IMÁGENES')
  console.log('━'.repeat(60))
  console.log(`\nModo: ${dryRun ? '📊 DRY RUN (simulación)' : '🔧 APLICAR CORRECCIONES'}`)
  
  if (dryRun) {
    console.log('\n⚠️  Este es un modo de simulación.')
    console.log('   Para aplicar los cambios realmente, ejecuta:')
    console.log('   node scripts/fix-malformed-image-urls.js --apply\n')
  } else {
    console.log('\n⚠️  ¡ATENCIÓN! Este script modificará la base de datos.')
    console.log('   Asegúrate de tener un backup antes de continuar.\n')
  }
  
  console.log('━'.repeat(60))
  
  const results = {
    products: await fixProductsTable(dryRun),
    productVariants: await fixProductVariantsTable(dryRun)
  }
  
  console.log('\n' + '━'.repeat(60))
  console.log('\n📊 GENERANDO REPORTE...\n')
  
  generateReport(results, dryRun)
  
  const totalFixed = results.products.fixed + results.productVariants.fixed
  
  console.log('\n' + '═'.repeat(60))
  if (totalFixed === 0) {
    console.log('✅ ¡PERFECTO! No se encontraron URLs malformadas.')
  } else if (dryRun) {
    console.log(`📊 Se encontraron ${totalFixed} URLs que necesitan corrección.`)
    console.log('   Ejecuta con --apply para aplicar los cambios.')
  } else {
    console.log(`✅ Se corrigieron ${totalFixed} URLs exitosamente.`)
  }
  console.log('═'.repeat(60) + '\n')
}

// Ejecutar
main().catch(console.error)

