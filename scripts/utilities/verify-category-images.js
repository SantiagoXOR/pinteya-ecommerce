#!/usr/bin/env node

/**
 * Script para verificar que todas las imágenes de categorías estén disponibles
 * Pinteya E-commerce - Enero 2025
 */

require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Lista de imágenes de categorías
const categoryImages = [
  'decoraciones.png',
  'exteriores.png',
  'humedades.png',
  'interiores.png',
  'maderas.png',
  'preparaciones.png',
  'profesionales.png',
  'reparaciones.png',
  'sinteticos.png',
  'techos.png',
  'terminaciones.png'
];

/**
 * Verifica si una imagen está disponible
 */
async function verifyImage(imageName) {
  try {
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/categories/${imageName}`;
    
    console.log(`🔍 Verificando: ${imageName}`);
    console.log(`   URL: ${imageUrl}`);
    
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`✅ ${imageName} - Disponible (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${imageName} - No disponible (${response.status})`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${imageName} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Verificando disponibilidad de imágenes de categorías...\n');
  
  let availableCount = 0;
  let unavailableCount = 0;
  
  for (const imageName of categoryImages) {
    const isAvailable = await verifyImage(imageName);
    if (isAvailable) {
      availableCount++;
    } else {
      unavailableCount++;
    }
    console.log(''); // Línea en blanco
  }
  
  console.log('📊 Resumen:');
  console.log(`✅ Disponibles: ${availableCount}`);
  console.log(`❌ No disponibles: ${unavailableCount}`);
  console.log(`📁 Total: ${categoryImages.length}`);
  
  if (availableCount === categoryImages.length) {
    console.log('\n🎉 ¡Todas las imágenes están disponibles!');
  } else {
    console.log('\n⚠️  Algunas imágenes no están disponibles.');
  }
}

// Ejecutar el script
main().catch(console.error);
