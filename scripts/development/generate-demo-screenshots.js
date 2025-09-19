#!/usr/bin/env node

// ===================================
// SCRIPT PARA GENERAR SCREENSHOTS DE DEMOSTRACIÓN
// ===================================

const fs = require('fs/promises');
const path = require('path');

// Configuración
const CONFIG = {
  screenshotsDir: path.join(__dirname, '..', 'public', 'test-screenshots'),
  width: 1920,
  height: 1080,
  thumbWidth: 300,
  thumbHeight: 200
};

// Datos de screenshots de demostración
const DEMO_SCREENSHOTS = [
  {
    id: 'setup-shop-page',
    name: 'Página de tienda cargada',
    description: 'Usuario navega a la página de productos',
    color: '#3b82f6', // blue
    icon: '🛍️'
  },
  {
    id: 'setup-product-added',
    name: 'Producto agregado al carrito',
    description: 'Usuario agrega un producto al carrito',
    color: '#10b981', // green
    icon: '➕'
  },
  {
    id: 'step1-cart-sidebar',
    name: 'Sidebar del carrito abierto',
    description: 'Sidebar del carrito con productos visibles',
    color: '#3b82f6', // blue
    icon: '🛒'
  },
  {
    id: 'step1-checkout-transition',
    name: 'Transición a página de checkout',
    description: 'Usuario hace clic en botón de checkout',
    color: '#8b5cf6', // purple
    icon: '➡️'
  },
  {
    id: 'step1-checkout-page',
    name: 'Página de checkout cargada',
    description: 'Formulario de checkout completamente cargado',
    color: '#10b981', // green
    icon: '💳'
  },
  {
    id: 'step2-form-initial',
    name: 'Formulario de checkout inicial',
    description: 'Estado inicial del formulario de checkout',
    color: '#6b7280', // gray
    icon: '📝'
  },
  {
    id: 'step2-form-sections',
    name: 'Secciones del formulario verificadas',
    description: 'Secciones principales del formulario resaltadas',
    color: '#3b82f6', // blue
    icon: '✅'
  },
  {
    id: 'step3-validation-errors',
    name: 'Errores de validación mostrados',
    description: 'Errores de validación visibles en formulario vacío',
    color: '#ef4444', // red
    icon: '❌'
  },
  {
    id: 'step3-email-error',
    name: 'Error de email inválido',
    description: 'Error específico de validación de email',
    color: '#f97316', // orange
    icon: '📧'
  },
  {
    id: 'step4-personal-filled',
    name: 'Información personal completada',
    description: 'Campos de información personal completados',
    color: '#10b981', // green
    icon: '👤'
  },
  {
    id: 'step4-address-filled',
    name: 'Dirección de envío completada',
    description: 'Formulario completo con dirección de envío',
    color: '#10b981', // green
    icon: '🏠'
  },
  {
    id: 'step4-pre-submit',
    name: 'Formulario completo antes del envío',
    description: 'Formulario completamente listo para envío',
    color: '#059669', // emerald
    icon: '🚀'
  },
  {
    id: 'step4-loading-state',
    name: 'Estado de carga del checkout',
    description: 'Loading state durante procesamiento',
    color: '#3b82f6', // blue
    icon: '⏳'
  },
  {
    id: 'step4-final-redirect',
    name: 'Redirección final exitosa',
    description: 'Redirección a MercadoPago o página de éxito',
    color: '#10b981', // green
    icon: '🎉'
  }
];

// Función para generar SVG de screenshot
function generateScreenshotSVG(screenshot, isThumb = false) {
  const width = isThumb ? CONFIG.thumbWidth : CONFIG.width;
  const height = isThumb ? CONFIG.thumbHeight : CONFIG.height;
  const fontSize = isThumb ? 14 : 48;
  const iconSize = isThumb ? 24 : 120;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo con gradiente -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${screenshot.color};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${screenshot.color};stop-opacity:0.3" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.1)"/>
    </filter>
  </defs>
  
  <!-- Fondo principal -->
  <rect width="100%" height="100%" fill="url(#grad)" />
  
  <!-- Borde -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" 
        fill="none" stroke="${screenshot.color}" stroke-width="4" rx="8" />
  
  <!-- Contenido central -->
  <g transform="translate(${width/2}, ${height/2})">
    <!-- Icono -->
    <text x="0" y="-${iconSize/4}" text-anchor="middle" 
          font-size="${iconSize}" font-family="Arial, sans-serif">
      ${screenshot.icon}
    </text>
    
    <!-- Título -->
    <text x="0" y="${fontSize}" text-anchor="middle" 
          font-size="${fontSize}" font-weight="bold" 
          font-family="Arial, sans-serif" fill="${screenshot.color}">
      ${screenshot.name}
    </text>
    
    ${!isThumb ? `
    <!-- Descripción -->
    <text x="0" y="${fontSize * 2.5}" text-anchor="middle" 
          font-size="${fontSize * 0.6}" font-family="Arial, sans-serif" 
          fill="#6b7280">
      ${screenshot.description}
    </text>
    
    <!-- ID -->
    <text x="0" y="${fontSize * 3.5}" text-anchor="middle" 
          font-size="${fontSize * 0.4}" font-family="monospace" 
          fill="#9ca3af">
      ${screenshot.id}
    </text>
    ` : ''}
  </g>
  
  <!-- Timestamp en esquina -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" 
        font-size="${fontSize * 0.3}" font-family="monospace" 
        fill="#9ca3af">
    ${new Date().toISOString()}
  </text>
</svg>`;
}

// Función para convertir SVG a PNG usando Canvas (Node.js)
async function svgToPng(svgContent, outputPath) {
  try {
    // En un entorno real, usarías una librería como 'sharp' o 'canvas'
    // Por ahora, guardamos como SVG y luego podemos convertir
    await fs.writeFile(outputPath.replace('.png', '.svg'), svgContent);
    
    // Crear un PNG simple usando datos base64
    const canvas = createSimpleCanvas(svgContent);
    await fs.writeFile(outputPath, canvas);
    
    console.log(`✅ Screenshot generado: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generando ${outputPath}:`, error.message);
    return false;
  }
}

// Función para crear un canvas simple (simulado)
function createSimpleCanvas(svgContent) {
  // En lugar de un PNG real, creamos un archivo de datos que simule una imagen
  // Esto es solo para demostración - en producción usarías una librería real
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x07, 0x80, // width: 1920
    0x00, 0x00, 0x04, 0x38, // height: 1080
    0x08, 0x02, 0x00, 0x00, 0x00 // bit depth, color type, etc.
  ]);
  
  // Datos de imagen simulados (en producción esto sería el PNG real)
  const imageData = Buffer.alloc(1920 * 1080 * 3); // RGB data
  
  return Buffer.concat([header, imageData]);
}

// Función principal para generar todos los screenshots
async function generateDemoScreenshots() {
  console.log('🎨 Iniciando generación de screenshots de demostración...');
  
  try {
    // Crear directorios
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true });
    await fs.mkdir(path.join(CONFIG.screenshotsDir, 'thumbs'), { recursive: true });
    
    console.log(`📁 Directorios creados en: ${CONFIG.screenshotsDir}`);
    
    const results = [];
    
    // Generar cada screenshot
    for (const screenshot of DEMO_SCREENSHOTS) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${screenshot.id}-${timestamp}.png`;
      const thumbFilename = `${screenshot.id}-${timestamp}-thumb.png`;
      
      // Rutas de archivos
      const fullPath = path.join(CONFIG.screenshotsDir, filename);
      const thumbPath = path.join(CONFIG.screenshotsDir, 'thumbs', thumbFilename);
      
      // Generar SVG content
      const fullSvg = generateScreenshotSVG(screenshot, false);
      const thumbSvg = generateScreenshotSVG(screenshot, true);
      
      // Convertir a PNG
      const fullSuccess = await svgToPng(fullSvg, fullPath);
      const thumbSuccess = await svgToPng(thumbSvg, thumbPath);
      
      if (fullSuccess && thumbSuccess) {
        results.push({
          id: screenshot.id,
          name: screenshot.name,
          description: screenshot.description,
          filename,
          thumbFilename,
          url: `/test-screenshots/${filename}`,
          previewUrl: `/test-screenshots/thumbs/${thumbFilename}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          metadata: {
            width: CONFIG.width,
            height: CONFIG.height,
            size: Math.floor(Math.random() * 500000) + 100000 // Tamaño simulado
          }
        });
      }
    }
    
    // Guardar metadata
    const metadata = {
      generated: new Date().toISOString(),
      total: results.length,
      type: 'demo-screenshots',
      screenshots: results
    };
    
    const metadataPath = path.join(CONFIG.screenshotsDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`\n🎉 Generación completada:`);
    console.log(`   - ${results.length} screenshots generados`);
    console.log(`   - Metadata guardada en: ${metadataPath}`);
    console.log(`   - Accesibles en: http://localhost:3000/test-screenshots/`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error en generación:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateDemoScreenshots()
    .then(results => {
      console.log('\n📊 Resumen de screenshots generados:');
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name}`);
        console.log(`     URL: ${result.url}`);
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error general:', error);
      process.exit(1);
    });
}

module.exports = { generateDemoScreenshots, DEMO_SCREENSHOTS, CONFIG };
