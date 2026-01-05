/**
 * ⚡ OPTIMIZACIÓN: Script para verificar y comprimir imágenes hero
 * 
 * Verifica el tamaño de las imágenes hero y comprime si son >150KB
 * Considera formato AVIF además de WebP para mejor compresión
 * 
 * Impacto esperado: -0.3s a -0.5s en Speed Index si las imágenes son muy pesadas
 */

const fs = require('fs')
const path = require('path')

const heroImagesDir = path.join(process.cwd(), 'public', 'images', 'hero', 'hero2')
const maxSizeKB = 150 // Tamaño máximo recomendado: 150 KB

const heroImages = [
  'hero1.webp',
  'hero2.webp',
  'hero3.webp'
]

console.log('🔍 Verificando tamaño de imágenes hero...\n')

let needsOptimization = false

heroImages.forEach(imageName => {
  const imagePath = path.join(heroImagesDir, imageName)
  
  if (!fs.existsSync(imagePath)) {
    console.log(`⚠️  ${imageName}: No encontrada`)
    return
  }
  
  const stats = fs.statSync(imagePath)
  const sizeKB = Math.round(stats.size / 1024)
  
  if (sizeKB > maxSizeKB) {
    console.log(`🔴 ${imageName}: ${sizeKB} KB (EXCEDE ${maxSizeKB} KB - NECESITA OPTIMIZACIÓN)`)
    needsOptimization = true
  } else {
    console.log(`✅ ${imageName}: ${sizeKB} KB (OK)`)
  }
})

console.log('\n')

if (needsOptimization) {
  console.log('⚠️  ALGUNAS IMÁGENES NECESITAN OPTIMIZACIÓN')
  console.log('📝 Recomendaciones:')
  console.log('   1. Usar herramienta como Squoosh (https://squoosh.app/)')
  console.log('   2. Comprimir a WebP con quality 80-85')
  console.log('   3. Considerar formato AVIF para mejor compresión')
  console.log('   4. Asegurar dimensiones correctas (no más grandes de lo necesario)')
  console.log('   5. Objetivo: <150 KB por imagen')
} else {
  console.log('✅ TODAS LAS IMÁGENES ESTÁN OPTIMIZADAS')
}

console.log('\n💡 Para comprimir manualmente:')
console.log('   - Usar Squoosh: https://squoosh.app/')
console.log('   - O ImageOptim: https://imageoptim.com/')
console.log('   - O sharp CLI: npx sharp-cli --input hero1.webp --output hero1-optimized.webp --quality 85')

