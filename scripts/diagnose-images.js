#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - DIAGNÓSTICO DE IMÁGENES
 * ============================================
 * 
 * Script para diagnosticar problemas con las imágenes de productos
 * - Verifica el estado de las imágenes en la base de datos
 * - Comprueba la accesibilidad de las URLs de Supabase Storage
 * - Identifica productos sin imágenes o con URLs rotas
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        accessible: false
      });
    });
  });
}

/**
 * Función principal de diagnóstico
 */
async function diagnoseImages() {
  console.log('🔍 DIAGNÓSTICO DE IMÁGENES DE PRODUCTOS');
  console.log('=====================================\n');
  
  try {
    // Obtener todos los productos
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, images')
      .order('id');
      
    if (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }
    
    console.log(`📦 Encontrados ${products.length} productos\n`);
    
    const results = {
      total: products.length,
      withImages: 0,
      withoutImages: 0,
      brokenImages: 0,
      workingImages: 0,
      issues: []
    };
    
    console.log('🔍 Verificando estado de imágenes...\n');
    
    for (const product of products) {
      const productResult = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        hasImages: false,
        imageUrls: [],
        brokenUrls: [],
        workingUrls: []
      };
      
      const images = product.images || {};
      
      // Recopilar todas las URLs de imágenes
      const imageUrls = [];
      if (images.main) imageUrls.push(images.main);
      if (images.previews) imageUrls.push(...images.previews);
      if (images.thumbnails) imageUrls.push(...images.thumbnails);
      if (images.gallery) imageUrls.push(...images.gallery);
      
      // Eliminar duplicados
      const uniqueUrls = [...new Set(imageUrls)];
      productResult.imageUrls = uniqueUrls;
      
      if (uniqueUrls.length === 0) {
        results.withoutImages++;
        productResult.hasImages = false;
        console.log(`❌ ${product.id}. ${product.name} - SIN IMÁGENES`);
      } else {
        results.withImages++;
        productResult.hasImages = true;
        
        console.log(`🔍 ${product.id}. ${product.name}`);
        
        // Verificar accesibilidad de cada URL
        for (const url of uniqueUrls) {
          const check = await checkUrlAccessibility(url);
          
          if (check.accessible) {
            productResult.workingUrls.push(url);
            console.log(`   ✅ ${url} (${check.status})`);
          } else {
            productResult.brokenUrls.push(url);
            console.log(`   ❌ ${url} (${check.status})`);
          }
          
          // Pequeña pausa entre requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (productResult.brokenUrls.length > 0) {
          results.brokenImages++;
        } else {
          results.workingImages++;
        }
      }
      
      if (!productResult.hasImages || productResult.brokenUrls.length > 0) {
        results.issues.push(productResult);
      }
      
      console.log('');
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('==========================');
    console.log(`Total de productos: ${results.total}`);
    console.log(`Con imágenes: ${results.withImages}`);
    console.log(`Sin imágenes: ${results.withoutImages}`);
    console.log(`Con imágenes funcionando: ${results.workingImages}`);
    console.log(`Con imágenes rotas: ${results.brokenImages}`);
    console.log(`Productos con problemas: ${results.issues.length}\n`);
    
    // Detalles de problemas
    if (results.issues.length > 0) {
      console.log('🚨 PRODUCTOS CON PROBLEMAS:');
      console.log('===========================');
      
      for (const issue of results.issues) {
        console.log(`\n${issue.id}. ${issue.name}`);
        console.log(`   Slug: ${issue.slug}`);
        
        if (!issue.hasImages) {
          console.log('   ❌ Sin imágenes configuradas');
        } else {
          if (issue.workingUrls.length > 0) {
            console.log(`   ✅ URLs funcionando: ${issue.workingUrls.length}`);
          }
          if (issue.brokenUrls.length > 0) {
            console.log(`   ❌ URLs rotas: ${issue.brokenUrls.length}`);
            issue.brokenUrls.forEach(url => {
              console.log(`      - ${url}`);
            });
          }
        }
      }
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'image-diagnosis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
diagnoseImages().catch(console.error);
