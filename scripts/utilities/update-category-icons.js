#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - ACTUALIZACIÓN DE ICONOS DE CATEGORÍAS
 *
 * Este script actualiza los iconos de las categorías subiendo los archivos PNG
 * a Supabase Storage y actualizando las URLs en la base de datos.
 *
 * Uso: node scripts/update-category-icons.js
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// ===================================
// CONFIGURACIÓN
// ===================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error(
    'Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env.local'
  )
  process.exit(1)
}

// Cliente de Supabase con permisos administrativos
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Configuración del bucket
const BUCKET_NAME = 'product-images'
const ICONS_FOLDER = 'categories'

// Directorio local de iconos
const LOCAL_ICONS_DIR = path.join(process.cwd(), 'public', 'images', 'categories')

// ===================================
// MAPEO DE ICONOS PNG DISPONIBLES
// ===================================

const iconMapping = {
  // Iconos PNG disponibles
  'accesorios-pintura': 'accesorios.png',
  antioxidos: 'antioxidos.png',
  'bandejas-cubetas': 'bandejas.png',
  'barnices-lacas': 'barnices.png',
  'adhesivos-selladores': 'selladores.png',
  'esmaltes-sinteticos': 'sinteticos.png',

  // Usar imágenes existentes para categorías sin PNG específico
  pinturas: 'decoraciones.png',
  herramientas: 'decoraciones.png',
  'preparacion-superficies': 'preparaciones.png',
  'proteccion-seguridad': 'decoraciones.png',
  'pinturas-latex': 'interiores.png',
  impermeabilizantes: 'humedades.png',
  'pinturas-especiales': 'decoraciones.png',

  // Para categorías sin PNG específico, usar imágenes existentes
  pinceles: 'decoraciones.png',
  rodillos: 'decoraciones.png',
  'extensores-mangos': 'decoraciones.png',
  espatulas: 'decoraciones.png',
  'lijas-abrasivos': 'preparaciones.png',
  'pistolas-pintura': 'decoraciones.png',
  'herramientas-pintura': 'decoraciones.png',
  'pinturas-techos': 'techos.png',
  'pinturas-exteriores': 'exteriores.png',
  'pinturas-interiores': 'interiores.png',
  'pinturas-madera': 'maderas.png',
  'tratamientos-madera': 'maderas.png',
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    return false
  }
}

/**
 * Sube un archivo a Supabase Storage
 */
async function uploadIcon(localPath, fileName) {
  try {
    console.log(`📤 Subiendo ${fileName}...`)

    const fileBuffer = fs.readFileSync(localPath)
    const storagePath = `${ICONS_FOLDER}/${fileName}`

    // Verificar si el archivo ya existe
    const { data: existingFile } = await supabase.storage
      .from(BUCKET_NAME)
      .list(ICONS_FOLDER, { search: fileName })

    if (existingFile && existingFile.length > 0) {
      console.log(`⚠️ ${fileName} ya existe, reemplazando...`)

      // Eliminar archivo existente
      await supabase.storage.from(BUCKET_NAME).remove([storagePath])
    }

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      console.error(`❌ Error subiendo ${fileName}:`, error.message)
      return null
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

    console.log(`✅ ${fileName} subido exitosamente`)
    return publicUrl.publicUrl
  } catch (error) {
    console.error(`❌ Error procesando ${fileName}:`, error.message)
    return null
  }
}

/**
 * Actualiza la URL del icono en la base de datos
 */
async function updateCategoryIcon(categorySlug, iconUrl) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ image_url: iconUrl })
      .eq('slug', categorySlug)
      .select('id, name, slug')

    if (error) {
      console.error(`❌ Error actualizando categoría ${categorySlug}:`, error.message)
      return false
    }

    if (data && data.length > 0) {
      console.log(`✅ Categoría "${data[0].name}" actualizada con nuevo icono`)
      return true
    } else {
      console.warn(`⚠️ No se encontró categoría con slug: ${categorySlug}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error actualizando categoría ${categorySlug}:`, error.message)
    return false
  }
}

// ===================================
// FUNCIÓN PRINCIPAL
// ===================================

async function updateCategoryIcons() {
  console.log('🎨 PINTEYA E-COMMERCE - Actualización de Iconos de Categorías')
  console.log('================================================================')

  let uploadedCount = 0
  let updatedCount = 0
  let errorCount = 0

  // Procesar cada mapeo de icono
  for (const [categorySlug, iconFileName] of Object.entries(iconMapping)) {
    console.log(`\n📂 Procesando categoría: ${categorySlug}`)

    const localIconPath = path.join(LOCAL_ICONS_DIR, iconFileName)

    // Verificar si el archivo existe localmente
    if (!fileExists(localIconPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${iconFileName}`)
      errorCount++
      continue
    }

    // Subir icono a Supabase Storage
    const iconUrl = await uploadIcon(localIconPath, iconFileName)

    if (!iconUrl) {
      errorCount++
      continue
    }

    uploadedCount++

    // Actualizar categoría en la base de datos
    const updated = await updateCategoryIcon(categorySlug, iconUrl)

    if (updated) {
      updatedCount++
    } else {
      errorCount++
    }

    // Pequeña pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // ===================================
  // RESUMEN FINAL
  // ===================================

  console.log('\n🎯 RESUMEN DE ACTUALIZACIÓN')
  console.log('============================')
  console.log(`📤 Iconos subidos: ${uploadedCount}`)
  console.log(`✅ Categorías actualizadas: ${updatedCount}`)
  console.log(`❌ Errores: ${errorCount}`)

  if (errorCount === 0) {
    console.log('\n🎉 ¡Actualización completada exitosamente!')
  } else {
    console.log(`\n⚠️ Actualización completada con ${errorCount} errores`)
  }

  console.log('\n📋 Próximos pasos:')
  console.log('- Verificar que los iconos se muestren correctamente en la aplicación')
  console.log('- Limpiar archivos SVG antiguos si es necesario')
  console.log('- Optimizar iconos PNG para mejor rendimiento')
}

// ===================================
// EJECUCIÓN
// ===================================

if (require.main === module) {
  updateCategoryIcons()
    .then(() => {
      console.log('\n✨ Script completado')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = { updateCategoryIcons }
