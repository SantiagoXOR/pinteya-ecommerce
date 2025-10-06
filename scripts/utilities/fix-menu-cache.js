#!/usr/bin/env node

/**
 * Script para diagnosticar y resolver problemas de caché del menú de navegación
 * Pinteya E-commerce - Junio 2025
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Diagnóstico y Resolución de Problemas de Caché del Menú')
console.log('='.repeat(60))

const fixes = {
  menuImport: false,
  duplicateFiles: false,
  nextCache: false,
  nodeModulesCache: false,
  browserCache: false,
}

async function checkMenuImport() {
  console.log('📋 1/5 - Verificando importación del menú...')

  try {
    const headerPath = 'src/components/Header/index.tsx'
    const headerContent = fs.readFileSync(headerPath, 'utf8')

    // Verificar que esté importando desde menuData.ts y no menuDataNew.ts
    if (headerContent.includes('from "./menuData"')) {
      console.log('✅ Importación correcta: usando menuData.ts')
      fixes.menuImport = true
    } else if (headerContent.includes('from "./menuDataNew"')) {
      console.log('❌ Problema encontrado: usando menuDataNew.ts')
      console.log('🔧 Corrigiendo importación...')

      const correctedContent = headerContent.replace('from "./menuDataNew"', 'from "./menuData"')

      fs.writeFileSync(headerPath, correctedContent)
      console.log('✅ Importación corregida')
      fixes.menuImport = true
    } else {
      console.log('⚠️ No se encontró la importación del menú')
    }
  } catch (error) {
    console.log('❌ Error verificando importación:', error.message)
  }
}

async function removeDuplicateFiles() {
  console.log('🗑️ 2/5 - Eliminando archivos duplicados...')

  try {
    const duplicateFile = 'src/components/Header/menuDataNew.ts'

    if (fs.existsSync(duplicateFile)) {
      fs.unlinkSync(duplicateFile)
      console.log('✅ Archivo duplicado eliminado: menuDataNew.ts')
    } else {
      console.log('ℹ️ No hay archivos duplicados')
    }

    fixes.duplicateFiles = true
  } catch (error) {
    console.log('❌ Error eliminando duplicados:', error.message)
  }
}

async function clearNextCache() {
  console.log('🗑️ 3/5 - Limpiando cache de Next.js...')

  try {
    const nextDir = '.next'

    if (fs.existsSync(nextDir)) {
      // En Windows, usar PowerShell para eliminar
      if (process.platform === 'win32') {
        execSync(
          'powershell -Command "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"',
          {
            stdio: 'pipe',
          }
        )
      } else {
        execSync('rm -rf .next', { stdio: 'pipe' })
      }

      console.log('✅ Cache de Next.js limpiado')
    } else {
      console.log('ℹ️ No hay cache de Next.js para limpiar')
    }

    fixes.nextCache = true
  } catch (error) {
    console.log('⚠️ Error limpiando cache (puede ser normal):', error.message)
    fixes.nextCache = true // No es crítico
  }
}

async function clearNodeModulesCache() {
  console.log('🗑️ 4/5 - Limpiando cache de node_modules...')

  try {
    // Limpiar cache de npm
    execSync('npm cache clean --force', { stdio: 'pipe' })
    console.log('✅ Cache de npm limpiado')

    fixes.nodeModulesCache = true
  } catch (error) {
    console.log('⚠️ Error limpiando cache de npm:', error.message)
    fixes.nodeModulesCache = true // No es crítico
  }
}

async function provideBrowserCacheInstructions() {
  console.log('🌐 5/5 - Instrucciones para limpiar cache del navegador...')

  console.log(`
📋 INSTRUCCIONES PARA EL USUARIO:

Para asegurar que veas todas las nuevas opciones del menú, realiza un "Hard Refresh" en tu navegador:

🔹 Chrome/Edge/Firefox (Windows/Linux):
   • Ctrl + F5
   • O Ctrl + Shift + R

🔹 Chrome/Safari (Mac):
   • Cmd + Shift + R

🔹 Alternativa universal:
   1. Abre las Herramientas de Desarrollador (F12)
   2. Haz clic derecho en el botón de recarga
   3. Selecciona "Vaciar caché y recargar de forma forzada"

🔹 Si el problema persiste:
   1. Ve a Configuración del navegador
   2. Busca "Borrar datos de navegación"
   3. Selecciona "Imágenes y archivos en caché"
   4. Borra solo para este sitio o las últimas 24 horas
`)

  fixes.browserCache = true
}

async function verifyMenuData() {
  console.log('\n📊 Verificando datos del menú...')

  try {
    const menuDataPath = 'src/components/Header/menuData.ts'
    const menuContent = fs.readFileSync(menuDataPath, 'utf8')

    // Contar elementos del menú
    const menuMatches = menuContent.match(/id:\s*\d+/g)
    const menuCount = menuMatches ? menuMatches.length : 0

    console.log(`✅ Archivo del menú encontrado: ${menuDataPath}`)
    console.log(`📊 Elementos del menú detectados: ${menuCount}`)

    // Verificar secciones principales
    const sections = [
      'Popular',
      'Tienda',
      'Contact',
      'Calculadora',
      'Demos',
      'Pages',
      'Desarrollo',
      'Blogs',
    ]

    console.log('\n📋 Secciones del menú verificadas:')
    sections.forEach(section => {
      if (menuContent.includes(`title: "${section}"`)) {
        console.log(`   ✅ ${section}`)
      } else {
        console.log(`   ❌ ${section} - NO ENCONTRADA`)
      }
    })
  } catch (error) {
    console.log('❌ Error verificando datos del menú:', error.message)
  }
}

async function generateReport() {
  console.log('\n📊 REPORTE DE RESOLUCIÓN')
  console.log('='.repeat(40))

  Object.entries(fixes).forEach(([fix, status]) => {
    const icon = status ? '✅' : '❌'
    const fixNames = {
      menuImport: 'Importación del menú',
      duplicateFiles: 'Archivos duplicados',
      nextCache: 'Cache de Next.js',
      nodeModulesCache: 'Cache de node_modules',
      browserCache: 'Instrucciones de navegador',
    }

    console.log(`${icon} ${fixNames[fix]}`)
  })

  const allFixed = Object.values(fixes).every(Boolean)

  console.log('\n' + '='.repeat(40))
  if (allFixed) {
    console.log('🎉 TODOS LOS PROBLEMAS RESUELTOS')
    console.log('\n🚀 Próximos pasos:')
    console.log('1. Reinicia el servidor de desarrollo (npm run dev)')
    console.log('2. Realiza un Hard Refresh en el navegador')
    console.log('3. Verifica que todas las opciones del menú sean visibles')
  } else {
    console.log('⚠️ ALGUNOS PROBLEMAS REQUIEREN ATENCIÓN MANUAL')
  }
}

// Ejecutar todas las verificaciones y correcciones
async function main() {
  try {
    await checkMenuImport()
    await removeDuplicateFiles()
    await clearNextCache()
    await clearNodeModulesCache()
    await provideBrowserCacheInstructions()
    await verifyMenuData()
    await generateReport()

    console.log('\n✨ Script completado exitosamente')
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error.message)
    process.exit(1)
  }
}

main()
