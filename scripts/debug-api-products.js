#!/usr/bin/env node
// Script para debuggear la API de productos

const fetch = require('node-fetch');

async function debugProductsAPI() {
  try {
    console.log('🔍 Consultando API de productos...');
    
    const response = await fetch('http://localhost:3000/api/products');
    
    if (!response.ok) {
      console.error('❌ Error en la respuesta:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('📦 Respuesta de la API:');
    console.log('- Success:', data.success);
    console.log('- Total productos:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n🔍 Verificando imágenes en los primeros 5 productos:');
      
      for (let i = 0; i < Math.min(5, data.data.length); i++) {
        const product = data.data[i];
        console.log(`\n📦 Producto ${i + 1}: ${product.name}`);
        console.log('- ID:', product.id);
        console.log('- Slug:', product.slug);
        
        if (product.images) {
          console.log('- Images (raw):', JSON.stringify(product.images, null, 2));
          
          // Verificar si hay referencias al placeholder incorrecto
          const imagesStr = JSON.stringify(product.images);
          if (imagesStr.includes('placeholder-bg.jpg') || imagesStr.includes('placeholder-sm.jpg')) {
            console.log('⚠️ ENCONTRADO: Referencias al placeholder incorrecto!');
          }
        }
        
        if (product.imgs) {
          console.log('- Imgs (raw):', JSON.stringify(product.imgs, null, 2));
          
          // Verificar si hay referencias al placeholder incorrecto
          const imgsStr = JSON.stringify(product.imgs);
          if (imgsStr.includes('placeholder-bg.jpg') || imgsStr.includes('placeholder-sm.jpg')) {
            console.log('⚠️ ENCONTRADO: Referencias al placeholder incorrecto en imgs!');
          }
        }
        
        if (product.image_url) {
          console.log('- Image URL:', product.image_url);
          if (product.image_url.includes('placeholder-bg.jpg') || product.image_url.includes('placeholder-sm.jpg')) {
            console.log('⚠️ ENCONTRADO: Referencias al placeholder incorrecto en image_url!');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el script
debugProductsAPI();
