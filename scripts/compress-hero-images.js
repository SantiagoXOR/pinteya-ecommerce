#!/usr/bin/env node

/**
 * ⚡ Script de Compresión de Imágenes Hero
 * 
 * Problema: Imágenes del hero son 5-7x más grandes de lo necesario
 * - hero1.webp: 758 KB → Objetivo: < 100-150 KB
 * 
 * Solución:
 * - Redimensionar a dimensiones exactas
 * - Comprimir con Sharp
 * - Generar versiones WebP y AVIF
 * - Mantener respaldos de originales
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Configuración
const HERO_DIR = path.join(process.cwd(), 'public', 'images', 'hero', 'hero2')
const BACKUP_DIR = path.join(HERO_DIR, 'originales')

// Dimensiones objetivo para diferentes breakpoints
const SIZES = {
  mobile: { width: 640, height: 320 },    // Mobile
  tablet: { width: 1024, height: 400 },   // Tablet
  desktop: { width: 1200, height: 433 },  // Desktop (aspect ratio 2.77)
}

// Calidad de compresión
const QUALITY = {
  webp: 85,  // Balance óptimo calidad/tamaño
  avif: 80,  // AVIF comprime mejor, puede usar calidad menor
}

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Crear directorio de backup
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    log(`✓ Directorio de backup creado: ${BACKUP_DIR}`, 'green')
  }
}

// Hacer backup de originales
function backupOriginals() {
  log('\n📦 Haciendo backup de imágenes originales...', 'cyan')
  
  const files = fs.readdirSync(HERO_DIR).filter(f => f.endsWith('.webp'))
  
  for (const file of files) {
    const src = path.join(HERO_DIR, file)
    const dest = path.join(BACKUP_DIR, file)
    
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest)
      const size = fs.statSync(src).size
      log(`  ✓ ${file} (${formatBytes(size)})`, 'green')
    }
  }
}

// Comprimir imagen
async function compressImage(filename, size = 'desktop') {
  const inputPath = path.join(BACKUP_DIR, filename)
  const outputPath = path.join(HERO_DIR, filename)
  
  if (!fs.existsSync(inputPath)) {
    log(`  ✗ No se encontró: ${filename}`, 'red')
    return null
  }
  
  const { width, height } = SIZES[size]
  
  try {
    // Comprimir WebP
    const webpInfo = await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false, // Permitir resize si es necesario
      })
      .webp({
        quality: QUALITY.webp,
        effort: 6, // Máximo esfuerzo (más lento pero mejor compresión)
        smartSubsample: true,
      })
      .toFile(outputPath)
    
    // Generar versión AVIF (mejor compresión)
    const avifPath = outputPath.replace('.webp', '.avif')
    const avifInfo = await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false,
      })
      .avif({
        quality: QUALITY.avif,
        effort: 6,
      })
      .toFile(avifPath)
    
    const originalSize = fs.statSync(inputPath).size
    const webpSize = webpInfo.size
    const avifSize = avifInfo.size
    const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1)
    const avifSavings = ((originalSize - avifSize) / originalSize * 100).toFixed(1)
    
    return {
      filename,
      originalSize,
      webpSize,
      avifSize,
      webpSavings,
      avifSavings,
    }
  } catch (error) {
    log(`  ✗ Error comprimiendo ${filename}: ${error.message}`, 'red')
    return null
  }
}

// Main
async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan')
  log('║                                                           ║', 'cyan')
  log('║   ⚡ Compresión de Imágenes Hero                         ║', 'cyan')
  log('║                                                           ║', 'cyan')
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan')
  
  // Crear backup
  createBackupDir()
  backupOriginals()
  
  log('\n⚡ Comprimiendo imágenes hero...', 'cyan')
  log('  Dimensiones objetivo: 1200x433 (desktop)', 'yellow')
  log(`  Calidad WebP: ${QUALITY.webp}`, 'yellow')
  log(`  Calidad AVIF: ${QUALITY.avif}`, 'yellow')
  log('')
  
  // Archivos a comprimir
  const heroFiles = ['hero1.webp', 'hero2.webp', 'hero3.webp']
  const results = []
  
  for (const file of heroFiles) {
    log(`  Procesando ${file}...`, 'yellow')
    const result = await compressImage(file, 'desktop')
    if (result) {
      results.push(result)
      log(`    WebP: ${formatBytes(result.originalSize)} → ${formatBytes(result.webpSize)} (-${result.webpSavings}%)`, 'green')
      log(`    AVIF: ${formatBytes(result.originalSize)} → ${formatBytes(result.avifSize)} (-${result.avifSavings}%)`, 'green')
    }
    log('')
  }
  
  // Resumen
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan')
  log('║                    RESUMEN                                ║', 'cyan')
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan')
  log('')
  
  const totalOriginal = results.reduce((acc, r) => acc + r.originalSize, 0)
  const totalWebP = results.reduce((acc, r) => acc + r.webpSize, 0)
  const totalAVIF = results.reduce((acc, r) => acc + r.avifSize, 0)
  const webpSavings = ((totalOriginal - totalWebP) / totalOriginal * 100).toFixed(1)
  const avifSavings = ((totalOriginal - totalAVIF) / totalOriginal * 100).toFixed(1)
  
  log(`  Original total:  ${formatBytes(totalOriginal)}`, 'yellow')
  log(`  WebP total:      ${formatBytes(totalWebP)} (-${webpSavings}%)`, 'green')
  log(`  AVIF total:      ${formatBytes(totalAVIF)} (-${avifSavings}%)`, 'green')
  log('')
  log(`  Ahorro WebP:     ${formatBytes(totalOriginal - totalWebP)}`, 'green')
  log(`  Ahorro AVIF:     ${formatBytes(totalOriginal - totalAVIF)}`, 'green')
  log('')
  
  // Impacto estimado en LCP
  const avgLoadTime = (totalOriginal / 1024 / 1024) / 0.4 // ~0.4 MB/s en 4G lenta
  const newLoadTime = (totalWebP / 1024 / 1024) / 0.4
  const timeSaved = avgLoadTime - newLoadTime
  
  log(`  Tiempo de carga estimado (4G lenta):`, 'yellow')
  log(`    Original: ~${avgLoadTime.toFixed(1)}s`, 'red')
  log(`    Optimizado: ~${newLoadTime.toFixed(1)}s`, 'green')
  log(`    Ahorro: ~${timeSaved.toFixed(1)}s`, 'green')
  log('')
  
  log('✨ ¡Compresión completada!', 'green')
  log('')
  log('📋 Próximos pasos:', 'yellow')
  log('  1. Verificar imágenes visualmente', 'reset')
  log('  2. npm run build', 'reset')
  log('  3. npm start', 'reset')
  log('  4. Lighthouse local para verificar LCP', 'reset')
  log('  5. Deploy a producción', 'reset')
  log('')
}

// Ejecutar
main().catch(console.error)












