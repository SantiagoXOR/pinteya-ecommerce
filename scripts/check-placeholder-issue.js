#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - VERIFICACIÓN DE PROBLEMA DE PLACEHOLDERS
 * ============================================================
 * 
 * Script para investigar por qué algunos productos muestran placeholders
 * en lugar de sus imágenes reales
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Verifica si una URL es accesible
 */
function checkUrlAccessibility(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode >= 200 && res.statusCode < 400,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length']
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        accessible: false,
        error: 'Timeout'
      });
    });
  });
}

/**
 * Función principal
 */
async function checkPlaceholderIssue() {
  console.log('🔍 INVESTIGANDO PROBLEMA DE PLACEHOLDERS');
  console.log('========================================\n');
  
  try {
    // Obtener productos específicos que podrían tener problemas
    const problematicSlugs = [
      'lija-al-agua-grano-180-el-galgo',
      'lija-al-agua-grano-120-el-galgo', 
      'lija-al-agua-grano-80-el-galgo',
      'lija-al-agua-grano-50-el-galgo',
      'lija-al-agua-grano-40-el-galgo',
      'poximix-exterior-5kg-poxipol',
      'bandeja-chata-para-pintura',
      'pinceleta-para-obra'
    ];
    
    console.log('📦 Verificando productos específicos...\n');
    
    for (const slug of problematicSlugs) {
      console.log(`🔍 Verificando: ${slug}`);
      
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, slug, images')
        .eq('slug', slug)
        .single();
        
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }
      
      if (!product) {
        console.log(`   ❌ Producto no encontrado`);
        continue;
      }
      
      console.log(`   📋 ID: ${product.id} | Nombre: ${product.name}`);
      
      if (!product.images) {
        console.log(`   ❌ Sin configuración de imágenes`);
        continue;
      }
      
      // Verificar estructura de imágenes
      const images = product.images;
      console.log(`   📸 Estructura de imágenes:`);
      console.log(`      - Main: ${images.main ? '✅' : '❌'} ${images.main || 'N/A'}`);
      console.log(`      - Previews: ${images.previews?.length || 0} imágenes`);
      console.log(`      - Thumbnails: ${images.thumbnails?.length || 0} imágenes`);
      console.log(`      - Gallery: ${images.gallery?.length || 0} imágenes`);
      
      // Verificar accesibilidad de la imagen principal
      if (images.previews && images.previews.length > 0) {
        const mainImageUrl = images.previews[0];
        console.log(`   🌐 Verificando accesibilidad: ${mainImageUrl}`);
        
        const check = await checkUrlAccessibility(mainImageUrl);
        
        if (check.accessible) {
          console.log(`   ✅ Imagen accesible (${check.status})`);
          console.log(`      - Tipo: ${check.contentType}`);
          console.log(`      - Tamaño: ${check.contentLength} bytes`);
        } else {
          console.log(`   ❌ Imagen NO accesible (${check.status})`);
          if (check.error) {
            console.log(`      - Error: ${check.error}`);
          }
        }
      } else {
        console.log(`   ❌ Sin imagen preview configurada`);
      }
      
      console.log('');
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Verificar también algunos productos que SÍ funcionan para comparar
    console.log('\n🔍 Verificando productos que SÍ funcionan (para comparar)...\n');
    
    const workingSlugs = [
      'plavipint-techos-poliuretanico-20l-plavicon',
      'membrana-performa-20l-plavicon'
    ];
    
    for (const slug of workingSlugs) {
      console.log(`✅ Verificando producto funcional: ${slug}`);
      
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, slug, images')
        .eq('slug', slug)
        .single();
        
      if (product && product.images) {
        const images = product.images;
        console.log(`   📸 Estructura:`);
        console.log(`      - Main: ${images.main ? '✅' : '❌'}`);
        console.log(`      - Previews: ${images.previews?.length || 0}`);
        console.log(`      - Primera preview: ${images.previews?.[0] || 'N/A'}`);
        
        if (images.previews && images.previews.length > 0) {
          const check = await checkUrlAccessibility(images.previews[0]);
          console.log(`   🌐 Estado: ${check.accessible ? '✅' : '❌'} (${check.status})`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar verificación
checkPlaceholderIssue().catch(console.error);
