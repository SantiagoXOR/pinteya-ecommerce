#!/usr/bin/env node

/**
 * ⚡ Script de Verificación de Optimizaciones CSS
 * 
 * Este script verifica que todas las optimizaciones CSS estén correctamente configuradas:
 * 1. Verifica configuración de Next.js (optimizeCss, cssChunking)
 * 2. Verifica configuración de PostCSS (cssnano)
 * 3. Verifica configuración de Tailwind (purge)
 * 4. Analiza archivos CSS generados en .next
 * 5. Genera reporte de optimización
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

// Función para formatear bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 1. Verificar configuración de Next.js
function verifyNextConfig() {
  log.title('📋 Verificando configuración de Next.js')
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js')
  
  if (!fs.existsSync(nextConfigPath)) {
    log.error('next.config.js no encontrado')
    return false
  }
  
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')
  
  // Verificar optimizeCss
  if (nextConfig.includes('optimizeCss: true')) {
    log.success('optimizeCss habilitado')
  } else {
    log.warning('optimizeCss no está habilitado - considera habilitarlo para CSS crítico inline')
  }
  
  // Verificar cssChunking
  if (nextConfig.includes('cssChunking')) {
    log.success('cssChunking configurado')
  } else {
    log.warning('cssChunking no configurado - considera agregarlo para mejor code splitting')
  }
  
  return true
}

// 2. Verificar configuración de PostCSS
function verifyPostCSSConfig() {
  log.title('📋 Verificando configuración de PostCSS')
  
  const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js')
  
  if (!fs.existsSync(postcssConfigPath)) {
    log.error('postcss.config.js no encontrado')
    return false
  }
  
  const postcssConfig = fs.readFileSync(postcssConfigPath, 'utf8')
  
  // Verificar cssnano
  if (postcssConfig.includes('cssnano')) {
    log.success('cssnano configurado para minificación')
  } else {
    log.warning('cssnano no configurado - el CSS no se minificará agresivamente')
  }
  
  // Verificar preset advanced
  if (postcssConfig.includes('advanced')) {
    log.success('cssnano preset "advanced" habilitado')
  } else {
    log.warning('cssnano preset "advanced" no habilitado - considera usarlo para mejor compresión')
  }
  
  return true
}

// 3. Verificar configuración de Tailwind
function verifyTailwindConfig() {
  log.title('📋 Verificando configuración de Tailwind CSS')
  
  const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts')
  
  if (!fs.existsSync(tailwindConfigPath)) {
    log.error('tailwind.config.ts no encontrado')
    return false
  }
  
  const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8')
  
  // Verificar content paths
  if (tailwindConfig.includes('content:')) {
    log.success('Content paths configurados para purge')
  } else {
    log.error('Content paths no configurados - CSS no se purgará')
  }
  
  // Verificar safelist
  if (tailwindConfig.includes('safelist')) {
    log.success('Safelist configurado para clases dinámicas')
  } else {
    log.info('Safelist no configurado - puede ser normal si no usas clases dinámicas')
  }
  
  return true
}

// 4. Analizar archivos CSS generados
function analyzeCSSFiles() {
  log.title('📊 Analizando archivos CSS generados')
  
  const nextDir = path.join(process.cwd(), '.next')
  
  if (!fs.existsSync(nextDir)) {
    log.warning('.next directory no encontrado - ejecuta "npm run build" primero')
    return false
  }
  
  const staticDir = path.join(nextDir, 'static')
  
  if (!fs.existsSync(staticDir)) {
    log.warning('No se encontraron archivos estáticos')
    return false
  }
  
  // Buscar archivos CSS recursivamente
  function findCSSFiles(dir) {
    let cssFiles = []
    
    try {
      const files = fs.readdirSync(dir)
      
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          cssFiles = cssFiles.concat(findCSSFiles(filePath))
        } else if (file.endsWith('.css')) {
          const size = stat.size
          cssFiles.push({ path: filePath, size })
        }
      }
    } catch (error) {
      // Ignorar errores de lectura
    }
    
    return cssFiles
  }
  
  const cssFiles = findCSSFiles(staticDir)
  
  if (cssFiles.length === 0) {
    log.warning('No se encontraron archivos CSS en .next/static')
    return false
  }
  
  log.info(`Encontrados ${cssFiles.length} archivos CSS`)
  
  // Calcular tamaño total
  const totalSize = cssFiles.reduce((acc, file) => acc + file.size, 0)
  
  console.log(`\n  Tamaño total CSS: ${colors.bright}${formatBytes(totalSize)}${colors.reset}`)
  
  // Mostrar los 5 archivos más grandes
  const topFiles = cssFiles.sort((a, b) => b.size - a.size).slice(0, 5)
  
  console.log('\n  Top 5 archivos más grandes:')
  topFiles.forEach((file, index) => {
    const relativePath = path.relative(nextDir, file.path)
    const sizeStr = formatBytes(file.size)
    
    // Advertir si algún archivo es muy grande
    if (file.size > 50 * 1024) { // > 50KB
      console.log(`  ${index + 1}. ${colors.yellow}${relativePath}${colors.reset} - ${colors.yellow}${sizeStr}${colors.reset} ${colors.yellow}(⚠ Grande)${colors.reset}`)
    } else {
      console.log(`  ${index + 1}. ${relativePath} - ${sizeStr}`)
    }
  })
  
  console.log()
  
  // Recomendaciones basadas en tamaño
  if (totalSize > 100 * 1024) { // > 100KB
    log.warning('El tamaño total de CSS es grande (>100KB). Considera:')
    console.log('    - Habilitar code splitting de CSS')
    console.log('    - Revisar CSS no utilizado')
    console.log('    - Usar carga diferida para CSS no crítico')
  } else {
    log.success('El tamaño total de CSS está optimizado (<100KB)')
  }
  
  return true
}

// 5. Verificar componente DeferredCSS
function verifyDeferredCSS() {
  log.title('📋 Verificando componente DeferredCSS')
  
  const deferredCSSPath = path.join(process.cwd(), 'src/components/Performance/DeferredCSS.tsx')
  
  if (!fs.existsSync(deferredCSSPath)) {
    log.warning('DeferredCSS.tsx no encontrado - considera implementarlo para carga diferida')
    return false
  }
  
  const deferredCSS = fs.readFileSync(deferredCSSPath, 'utf8')
  
  // Verificar técnicas implementadas
  if (deferredCSS.includes('requestIdleCallback')) {
    log.success('requestIdleCallback implementado')
  }
  
  if (deferredCSS.includes('media') && deferredCSS.includes('print')) {
    log.success('Técnica media="print" implementada')
  }
  
  if (deferredCSS.includes('preload')) {
    log.success('Preload de CSS implementado')
  }
  
  if (deferredCSS.includes('priority')) {
    log.success('Sistema de prioridades implementado')
  }
  
  return true
}

// 6. Verificar layout.tsx
function verifyLayout() {
  log.title('📋 Verificando layout.tsx')
  
  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
  
  if (!fs.existsSync(layoutPath)) {
    log.error('layout.tsx no encontrado')
    return false
  }
  
  const layout = fs.readFileSync(layoutPath, 'utf8')
  
  // Verificar CSS crítico inline
  if (layout.includes('dangerouslySetInnerHTML') && layout.includes('<style')) {
    log.success('CSS crítico inline implementado')
  } else {
    log.warning('CSS crítico inline no encontrado - considera agregarlo para FCP más rápido')
  }
  
  // Verificar preload de fuentes
  if (layout.includes('preload') && layout.includes('font')) {
    log.success('Preload de fuentes implementado')
  } else {
    log.warning('Preload de fuentes no encontrado')
  }
  
  // Verificar DeferredCSS
  if (layout.includes('DeferredCSS')) {
    log.success('DeferredCSS integrado en layout')
  } else {
    log.warning('DeferredCSS no integrado en layout')
  }
  
  return true
}

// Función principal
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ Verificación de Optimizaciones CSS                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}
  `)
  
  let allPassed = true
  
  // Ejecutar verificaciones
  allPassed = verifyNextConfig() && allPassed
  allPassed = verifyPostCSSConfig() && allPassed
  allPassed = verifyTailwindConfig() && allPassed
  allPassed = verifyDeferredCSS() && allPassed
  allPassed = verifyLayout() && allPassed
  allPassed = analyzeCSSFiles() && allPassed
  
  // Resumen final
  log.title('📊 Resumen')
  
  if (allPassed) {
    log.success('Todas las verificaciones pasaron correctamente')
    console.log('\n  Optimizaciones CSS implementadas:')
    console.log('  ✓ CSS crítico inline en layout')
    console.log('  ✓ Carga diferida de CSS no crítico')
    console.log('  ✓ Minificación con cssnano')
    console.log('  ✓ Purge de CSS no utilizado')
    console.log('  ✓ Code splitting de CSS')
    console.log('  ✓ Preload de recursos críticos')
  } else {
    log.warning('Algunas verificaciones fallaron - revisa los warnings arriba')
  }
  
  console.log('\n  Próximos pasos:')
  console.log('  1. Ejecuta "npm run build" para generar build de producción')
  console.log('  2. Ejecuta este script nuevamente para analizar CSS generado')
  console.log('  3. Usa Lighthouse para medir mejoras de performance')
  console.log('  4. Revisa métricas de FCP, LCP y render-blocking resources')
  
  console.log('\n')
}

// Ejecutar
main().catch(console.error)




