/**
 * Script para generar SQL que actualice las URLs de imágenes
 * Las imágenes deben subirse manualmente a Supabase Storage
 */

const fs = require('fs')
const path = require('path')

const WEBP_DIR = 'c:/Users/marti/Desktop/image-products-webp'
const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`
  : 'TU_SUPABASE_URL/storage/v1/object/public/product-images'

// Mapeo de archivos a carpetas de marca
const BRAND_FOLDERS = {
  'plavipint-fibrado-plavicon.webp': 'plavicon',
  'plavicon-fibrado-plavicon.webp': 'plavicon',
  'piscinas-solvente-plavipint-plavicon.webp': 'plavicon',
  'sellador-multi-uso-plavicon.webp': 'plavicon',
  'techos-poliuretanico.webp': 'plavicon',
  'removedor-gel-penta-petrilac.webp': 'petrilac',
  'protector-ladrillos-sellagres-petrilac.webp': 'petrilac',
  'impregnante-danzke-1l-petrilac.webp': 'petrilac',
  'lija-rubi-el-galgo.webp': 'galgo',
  'enduido-mas-color.webp': 'mas-color',
  'fijador-mas-color.webp': 'mas-color',
  'ladrillo-visto-mas-color.webp': 'mas-color',
  'latex-impulso-generico.webp': 'mas-color',
  'thinner-pintemas.webp': 'pintemas',
  'aguarras-pintemas.webp': 'pintemas',
  'diluyente-caucho-duxol.webp': 'duxol',
}

// Mapeo de imágenes a productos (por slug)
const IMAGE_TO_PRODUCT = {
  'plavipint-fibrado-plavicon.webp': { product_id: 97, slug: 'plavipint-fibrado-plavicon' },
  'plavicon-fibrado-plavicon.webp': { product_id: 98, slug: 'plavicon-fibrado-plavicon' },
  'piscinas-solvente-plavipint-plavicon.webp': { product_id: 99, slug: 'piscinas-solvente-plavipint-plavicon' },
  'sellador-multi-uso-plavicon.webp': { product_id: 100, slug: 'sellador-multi-uso-plavicon' },
  'removedor-gel-penta-petrilac.webp': { product_id: 101, slug: 'removedor-gel-penta-petrilac' },
  'protector-ladrillos-sellagres-petrilac.webp': { product_id: 102, slug: 'protector-ladrillos-sellagres-petrilac' },
  'diluyente-caucho-duxol.webp': { product_id: 103, slug: 'diluyente-caucho-duxol' },
  'lija-rubi-el-galgo.webp': { product_id: 104, slug: 'lija-rubi-el-galgo' },
  'enduido-mas-color.webp': { product_id: 105, slug: 'enduido-mas-color' },
  'fijador-mas-color.webp': { product_id: 106, slug: 'fijador-mas-color' },
  'latex-impulso-generico.webp': { product_id: 108, slug: 'latex-impulso-mas-color' },
  'ladrillo-visto-mas-color.webp': { product_id: 110, slug: 'ladrillo-visto-mas-color' },
  'aguarras-pintemas.webp': { product_id: 111, slug: 'aguarras-pintemas' },
  'thinner-pintemas.webp': { product_id: 112, slug: 'thinner-pintemas' },
}

function generateImageUploadInfo() {
  console.log('📋 INFORMACIÓN PARA SUBIDA MANUAL A SUPABASE STORAGE\n')
  console.log('=' .repeat(80))
  
  const files = fs.readdirSync(WEBP_DIR).filter(file => file.endsWith('.webp'))
  
  const uploadCommands = []
  const sqlUpdates = []

  files.forEach((fileName, index) => {
    const brandFolder = BRAND_FOLDERS[fileName] || 'genericos'
    const storagePath = `${brandFolder}/${fileName}`
    const publicUrl = `${BASE_URL}/${storagePath}`
    const filePath = path.join(WEBP_DIR, fileName).replace(/\\/g, '/')
    const productInfo = IMAGE_TO_PRODUCT[fileName]

    console.log(`\n${index + 1}. ${fileName}`)
    console.log(`   Marca: ${brandFolder}`)
    console.log(`   Ruta local: ${filePath}`)
    console.log(`   Ruta Storage: ${storagePath}`)
    if (productInfo) {
      console.log(`   Producto ID: ${productInfo.product_id}`)
      console.log(`   URL Pública: ${publicUrl}`)
    }

    uploadCommands.push({
      file: fileName,
      localPath: filePath,
      storagePath: storagePath,
      publicUrl: publicUrl,
      productId: productInfo?.product_id,
    })

    if (productInfo) {
      sqlUpdates.push(
        `-- ${fileName} → Producto ID ${productInfo.product_id}\n` +
        `UPDATE product_variants \n` +
        `SET image_url = '${publicUrl}', updated_at = NOW()\n` +
        `WHERE product_id = ${productInfo.product_id};`
      )
    }
  })

  // Guardar archivos de ayuda
  fs.writeFileSync(
    path.join(WEBP_DIR, 'upload-info.json'),
    JSON.stringify(uploadCommands, null, 2)
  )

  fs.writeFileSync(
    path.join(WEBP_DIR, 'update-urls.sql'),
    sqlUpdates.join('\n\n')
  )

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Archivos generados:')
  console.log(`   📄 ${WEBP_DIR}/upload-info.json`)
  console.log(`   📄 ${WEBP_DIR}/update-urls.sql`)
  console.log('\n🎯 Próximo paso: Subir imágenes a Supabase Storage y ejecutar el SQL')
}

generateImageUploadInfo()

