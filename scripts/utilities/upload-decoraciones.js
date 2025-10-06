#!/usr/bin/env node

/**
 * Script para subir solo la imagen de decoraciones al storage de Supabase
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function uploadDecoraciones() {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'images', 'categories', 'decoraciones.png')

    console.log('📁 Verificando archivo:', imagePath)
    console.log('📁 Existe:', fs.existsSync(imagePath))

    if (!fs.existsSync(imagePath)) {
      console.log('❌ Archivo no encontrado')
      return
    }

    const imageBuffer = fs.readFileSync(imagePath)
    console.log('📊 Tamaño del archivo:', imageBuffer.length, 'bytes')

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/categories/decoraciones.png`
    console.log('🔗 URL de subida:', uploadUrl)

    console.log('📤 Subiendo decoraciones.png...')

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body: imageBuffer,
    })

    console.log('📡 Status de respuesta:', response.status)
    console.log('📡 Status text:', response.statusText)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ decoraciones.png subida exitosamente')
      console.log('📄 Respuesta:', result)
    } else {
      const errorText = await response.text()
      console.log('❌ Error:', response.status, '-', errorText)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('🔍 Stack:', error.stack)
  }
}

uploadDecoraciones()
