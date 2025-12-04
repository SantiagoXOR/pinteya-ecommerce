/**
 * Script para actualizar las imágenes de productos con URLs reales
 * Pinteya E-commerce - Actualización de imágenes del catálogo
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Leer variables de entorno desde .env.local
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
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
  console.log('Asegúrate de que .env.local contenga:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de imágenes reales por producto
const productImages = {
  // PLAVICON - URLs oficiales del sitio web
  'plavipint-techos-poliuretanico-10l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/127.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/127.png'],
  },
  'plavipint-techos-poliuretanico-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/127.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/127.png'],
  },
  'membrana-performa-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/126.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/126.png'],
  },
  'latex-frentes-4l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/39.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/39.png'],
  },
  'latex-frentes-10l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/39.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/39.png'],
  },
  'latex-frentes-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/39.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/39.png'],
  },
  'latex-interior-4l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/41.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/41.png'],
  },
  'latex-interior-10l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/41.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/41.png'],
  },
  'latex-interior-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/41.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/41.png'],
  },
  'cielorraso-1l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/43.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/43.png'],
  },
  'cielorraso-4l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/43.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/43.png'],
  },
  'cielorraso-10l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/43.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/43.png'],
  },
  'cielorraso-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/43.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/43.png'],
  },
  'latex-muros-4l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/93.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/93.png'],
  },
  'latex-muros-10l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/93.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/93.png'],
  },
  'latex-muros-20l-plavicon': {
    main: 'https://www.plavicon.com/site/Latas_Sombra/93.png',
    gallery: ['https://www.plavicon.com/site/Latas_Sombra/93.png'],
  },

  // PETRILAC - URLs oficiales del sitio web
  'sintetico-converlux-1l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/RR5QMNSnOkQ2PI50An38r2QXH351s6qtiGn5Vrcf.png',
    gallery: [
      'https://www.petrilac.com.ar/storage/productos/RR5QMNSnOkQ2PI50An38r2QXH351s6qtiGn5Vrcf.png',
    ],
  },
  'sintetico-converlux-4l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/RR5QMNSnOkQ2PI50An38r2QXH351s6qtiGn5Vrcf.png',
    gallery: [
      'https://www.petrilac.com.ar/storage/productos/RR5QMNSnOkQ2PI50An38r2QXH351s6qtiGn5Vrcf.png',
    ],
  },
  'impregnante-danzke-1l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/danzke-impregnante.png',
    gallery: ['https://www.petrilac.com.ar/storage/productos/danzke-impregnante.png'],
  },
  'impregnante-danzke-4l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/danzke-impregnante.png',
    gallery: ['https://www.petrilac.com.ar/storage/productos/danzke-impregnante.png'],
  },
  'barniz-campbell-1l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/campbell-barniz.png',
    gallery: ['https://www.petrilac.com.ar/storage/productos/campbell-barniz.png'],
  },
  'barniz-campbell-4l-petrilac': {
    main: 'https://www.petrilac.com.ar/storage/productos/campbell-barniz.png',
    gallery: ['https://www.petrilac.com.ar/storage/productos/campbell-barniz.png'],
  },

  // POXIPOL - URLs oficiales del sitio web
  'poximix-interior-05kg-poxipol': {
    main: 'https://www.poxipol.com.ar/images/p-metalico-21g.png',
    gallery: ['https://www.poxipol.com.ar/images/p-metalico-21g.png'],
  },
  'poximix-interior-125kg-poxipol': {
    main: 'https://www.poxipol.com.ar/images/p-metalico-108g.png',
    gallery: ['https://www.poxipol.com.ar/images/p-metalico-108g.png'],
  },
  'poximix-interior-3kg-poxipol': {
    main: 'https://www.poxipol.com.ar/images/p-metalico-1kg.png',
    gallery: ['https://www.poxipol.com.ar/images/p-metalico-1kg.png'],
  },
  'poximix-interior-5kg-poxipol': {
    main: 'https://www.poxipol.com.ar/images/p-metalico-1kg.png',
    gallery: ['https://www.poxipol.com.ar/images/p-metalico-1kg.png'],
  },

  // SINTEPLAST - URLs de productos
  'recuplast-interior-1l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-1l.jpg',
    gallery: ['https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-1l.jpg'],
  },
  'recuplast-interior-4l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-4l.jpg',
    gallery: ['https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-4l.jpg'],
  },
  'recuplast-interior-10l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-10l.jpg',
    gallery: ['https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-10l.jpg'],
  },
  'recuplast-interior-20l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-20l.jpg',
    gallery: ['https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-interior-20l.jpg'],
  },
  'recuplast-bano-cocina-1l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-bano-cocina-1l.jpg',
    gallery: [
      'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-bano-cocina-1l.jpg',
    ],
  },
  'recuplast-bano-cocina-4l-sinteplast': {
    main: 'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-bano-cocina-4l.jpg',
    gallery: [
      'https://www.sinteplast.com.ar/admin/uploaded/productos/recuplast-bano-cocina-4l.jpg',
    ],
  },

  // CINTA PAPEL - Imágenes de productos de ferretería
  'cinta-papel-blanca-18mm': {
    main: 'https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop'],
  },
  'cinta-papel-blanca-24mm': {
    main: 'https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop'],
  },
  'cinta-papel-blanca-36mm': {
    main: 'https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop'],
  },
  'cinta-papel-blanca-48mm': {
    main: 'https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1609205264511-b0b3e5e5b5e5?w=400&h=400&fit=crop'],
  },

  // GALGO - Herramientas de pintura
  'pincel-persianero-n10-galgo': {
    main: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop'],
  },
  'pincel-persianero-n15-galgo': {
    main: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop'],
  },
  'pincel-persianero-n20-galgo': {
    main: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop'],
  },
  'pincel-persianero-n25-galgo': {
    main: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop'],
  },
  'pincel-persianero-n30-galgo': {
    main: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop'],
  },
  'rodillo-22cm-lanar-elefante-galgo': {
    main: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop'],
  },
}

// Función para actualizar las imágenes de un producto
async function updateProductImages(slug, images) {
  try {
    const imageData = {
      main: images.main,
      gallery: images.gallery,
      thumbnail: images.main,
    }

    const { data, error } = await supabase
      .from('products')
      .update({ images: imageData })
      .eq('slug', slug)

    if (error) {
      console.error(`Error actualizando ${slug}:`, error)
      return false
    }

    console.log(`✅ Actualizado: ${slug}`)
    return true
  } catch (error) {
    console.error(`Error en ${slug}:`, error)
    return false
  }
}

// Función principal
async function updateAllProductImages() {
  console.log('🚀 Iniciando actualización de imágenes de productos...\n')

  let successCount = 0
  let errorCount = 0

  for (const [slug, images] of Object.entries(productImages)) {
    const success = await updateProductImages(slug, images)
    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Pequeña pausa entre actualizaciones
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📊 Resumen de actualización:')
  console.log(`✅ Productos actualizados: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log(`📦 Total procesados: ${successCount + errorCount}`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateAllProductImages()
    .then(() => {
      console.log('\n🎉 Actualización completada!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error en la actualización:', error)
      process.exit(1)
    })
}

module.exports = { updateAllProductImages, updateProductImages }
