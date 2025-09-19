#!/usr/bin/env node

// ===================================
// SCRIPT SIMPLE PARA CREAR SCREENSHOTS SVG DE DEMOSTRACIÓN
// ===================================

const fs = require('fs/promises');
const path = require('path');

// Configuración
const CONFIG = {
  screenshotsDir: path.join(__dirname, '..', 'public', 'test-screenshots'),
  width: 1200,
  height: 800
};

// Screenshots de demostración
const SCREENSHOTS = [
  { id: 'setup-shop-page', name: 'Página de tienda', icon: '🛍️', color: '#3b82f6' },
  { id: 'setup-product-added', name: 'Producto agregado', icon: '➕', color: '#10b981' },
  { id: 'step1-cart-sidebar', name: 'Carrito sidebar', icon: '🛒', color: '#3b82f6' },
  { id: 'step1-checkout-transition', name: 'Transición checkout', icon: '➡️', color: '#8b5cf6' },
  { id: 'step1-checkout-page', name: 'Página checkout', icon: '💳', color: '#10b981' },
  { id: 'step2-form-initial', name: 'Formulario inicial', icon: '📝', color: '#6b7280' },
  { id: 'step2-form-sections', name: 'Secciones formulario', icon: '✅', color: '#3b82f6' },
  { id: 'step3-validation-errors', name: 'Errores validación', icon: '❌', color: '#ef4444' },
  { id: 'step3-email-error', name: 'Error email', icon: '📧', color: '#f97316' },
  { id: 'step4-personal-filled', name: 'Info personal', icon: '👤', color: '#10b981' },
  { id: 'step4-address-filled', name: 'Dirección completa', icon: '🏠', color: '#10b981' },
  { id: 'step4-pre-submit', name: 'Listo para envío', icon: '🚀', color: '#059669' },
  { id: 'step4-loading-state', name: 'Estado carga', icon: '⏳', color: '#3b82f6' },
  { id: 'step4-final-redirect', name: 'Redirección exitosa', icon: '🎉', color: '#10b981' }
];

// Función para generar SVG
function generateSVG(screenshot) {
  return `<svg width="${CONFIG.width}" height="${CONFIG.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${screenshot.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${screenshot.color};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${screenshot.color};stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="100%" height="100%" fill="url(#grad-${screenshot.id})" />
  
  <!-- Borde -->
  <rect x="4" y="4" width="${CONFIG.width-8}" height="${CONFIG.height-8}" 
        fill="none" stroke="${screenshot.color}" stroke-width="3" rx="12" />
  
  <!-- Contenido -->
  <g transform="translate(${CONFIG.width/2}, ${CONFIG.height/2})">
    <!-- Icono -->
    <text x="0" y="-40" text-anchor="middle" font-size="80" font-family="Arial">
      ${screenshot.icon}
    </text>
    
    <!-- Título -->
    <text x="0" y="20" text-anchor="middle" font-size="32" font-weight="bold" 
          font-family="Arial" fill="${screenshot.color}">
      ${screenshot.name}
    </text>
    
    <!-- ID -->
    <text x="0" y="60" text-anchor="middle" font-size="16" 
          font-family="monospace" fill="#666">
      ${screenshot.id}
    </text>
  </g>
  
  <!-- Timestamp -->
  <text x="${CONFIG.width-10}" y="${CONFIG.height-10}" text-anchor="end" 
        font-size="12" font-family="monospace" fill="#999">
    ${new Date().toLocaleString()}
  </text>
  
  <!-- Marca de agua -->
  <text x="10" y="30" font-size="14" font-family="Arial" fill="#999">
    Pinteya E-commerce - Test Screenshot
  </text>
</svg>`;
}

// Función principal
async function createScreenshots() {
  console.log('🎨 Creando screenshots de demostración...');
  
  try {
    // Crear directorio
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true });
    await fs.mkdir(path.join(CONFIG.screenshotsDir, 'thumbs'), { recursive: true });
    
    const results = [];
    
    for (const screenshot of SCREENSHOTS) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Generar SVG principal
      const svgContent = generateSVG(screenshot);
      const filename = `${screenshot.id}-${timestamp}.svg`;
      const filepath = path.join(CONFIG.screenshotsDir, filename);
      
      await fs.writeFile(filepath, svgContent);
      
      // Generar thumbnail (versión más pequeña)
      const thumbSvg = generateSVG({
        ...screenshot,
        id: screenshot.id + '-thumb'
      }).replace(`width="${CONFIG.width}"`, 'width="300"')
        .replace(`height="${CONFIG.height}"`, 'height="200"')
        .replace(`translate(${CONFIG.width/2}, ${CONFIG.height/2})`, 'translate(150, 100)')
        .replace('font-size="80"', 'font-size="40"')
        .replace('font-size="32"', 'font-size="16"')
        .replace('font-size="16"', 'font-size="10"');
      
      const thumbFilename = `${screenshot.id}-${timestamp}-thumb.svg`;
      const thumbPath = path.join(CONFIG.screenshotsDir, 'thumbs', thumbFilename);
      
      await fs.writeFile(thumbPath, thumbSvg);
      
      results.push({
        id: screenshot.id,
        stepName: screenshot.name,
        url: `/test-screenshots/${filename}`,
        previewUrl: `/test-screenshots/thumbs/${thumbFilename}`,
        timestamp: new Date(),
        status: 'success',
        metadata: {
          width: CONFIG.width,
          height: CONFIG.height,
          size: svgContent.length
        }
      });
      
      console.log(`✅ Creado: ${filename}`);
    }
    
    // Guardar metadata
    const metadata = {
      generated: new Date().toISOString(),
      total: results.length,
      screenshots: results
    };
    
    await fs.writeFile(
      path.join(CONFIG.screenshotsDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`\n🎉 Completado: ${results.length} screenshots creados`);
    console.log(`📁 Ubicación: ${CONFIG.screenshotsDir}`);
    console.log(`🌐 Acceso: http://localhost:3000/test-screenshots/`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  createScreenshots()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { createScreenshots };
