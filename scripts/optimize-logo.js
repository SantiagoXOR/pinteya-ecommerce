/**
 * Script de optimización específico para el logo de Pinteya
 * Genera versiones optimizadas para diferentes usos (mobile, desktop, favicon)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_LOGO = path.join(__dirname, '../public/images/logo/LogoPinteYa.png');
const OUTPUT_DIR = path.join(__dirname, '../public/images/logo/optimized');

// Configuraciones de optimización
const OPTIMIZATIONS = {
  // Logo mobile cuadrado
  mobile: {
    width: 64,
    height: 64,
    quality: 90,
    format: 'webp',
    fallback: 'png',
    suffix: '-mobile'
  },
  
  // Logo desktop rectangular
  desktop: {
    width: 160,
    height: 40,
    quality: 90,
    format: 'webp',
    fallback: 'png',
    suffix: '-desktop'
  },
  
  // Logo grande para hero/landing
  hero: {
    width: 320,
    height: 80,
    quality: 95,
    format: 'webp',
    fallback: 'png',
    suffix: '-hero'
  },
  
  // Favicon
  favicon: {
    width: 32,
    height: 32,
    quality: 95,
    format: 'png',
    suffix: '-favicon'
  },
  
  // Favicon alta resolución
  faviconHD: {
    width: 192,
    height: 192,
    quality: 95,
    format: 'png',
    suffix: '-favicon-hd'
  }
};

async function optimizeLogo() {
  try {
    console.log('🎨 Iniciando optimización del logo de Pinteya...');
    
    // Verificar que el archivo de entrada existe
    if (!fs.existsSync(INPUT_LOGO)) {
      throw new Error(`Logo no encontrado en: ${INPUT_LOGO}`);
    }
    
    // Crear directorio de salida si no existe
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Obtener información del logo original
    const originalImage = sharp(INPUT_LOGO);
    const metadata = await originalImage.metadata();
    console.log(`📐 Logo original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${Math.round(metadata.size / 1024)}KB`);
    
    // Procesar cada optimización
    for (const [name, config] of Object.entries(OPTIMIZATIONS)) {
      console.log(`\n🔧 Procesando: ${name}`);
      
      const baseName = `LogoPinteYa${config.suffix}`;
      
      // Crear imagen redimensionada
      let pipeline = originalImage
        .clone()
        .resize(config.width, config.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });
      
      // Generar WebP si es compatible
      if (config.format === 'webp') {
        const webpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
        await pipeline
          .clone()
          .webp({ quality: config.quality, effort: 6 })
          .toFile(webpPath);
        
        const webpStats = fs.statSync(webpPath);
        console.log(`   ✅ WebP: ${Math.round(webpStats.size / 1024)}KB`);
      }
      
      // Generar fallback PNG
      const pngPath = path.join(OUTPUT_DIR, `${baseName}.png`);
      await pipeline
        .clone()
        .png({ quality: config.quality, compressionLevel: 9 })
        .toFile(pngPath);
      
      const pngStats = fs.statSync(pngPath);
      console.log(`   ✅ PNG: ${Math.round(pngStats.size / 1024)}KB`);
    }
    
    console.log('\n🎉 Optimización completada exitosamente!');
    console.log(`📁 Archivos generados en: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  optimizeLogo();
}

module.exports = { optimizeLogo, OPTIMIZATIONS };
