#!/usr/bin/env node

/**
 * Script para verificar que los assets de Pintemas estén en git
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ASSETS_DIR = 'public/tenants/pintemas'

// Assets esperados según la documentación
const EXPECTED_ASSETS = [
  'public/tenants/pintemas/logo.svg',
  'public/tenants/pintemas/logo-dark.svg',
  'public/tenants/pintemas/favicon.svg',
  'public/tenants/pintemas/og-image.png',
  'public/tenants/pintemas/hero/hero1.webp',
  'public/tenants/pintemas/hero/hero2.webp',
  'public/tenants/pintemas/hero/hero3.webp',
]

function checkAssetsInGit() {
  console.log('🔍 Verificando assets de Pintemas en git...\n')

  try {
    // 1. Verificar archivos en git
    console.log('1️⃣ Verificando archivos rastreados por git...')
    const gitFiles = execSync(`git ls-files ${ASSETS_DIR}/`, { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean)

    console.log(`   ✅ ${gitFiles.length} archivo(s) encontrado(s) en git:\n`)
    gitFiles.forEach(file => {
      const stats = fs.statSync(file)
      const sizeKB = (stats.size / 1024).toFixed(2)
      console.log(`   📄 ${file} (${sizeKB} KB)`)
    })

    // 2. Verificar que todos los assets esperados estén en git
    console.log('\n2️⃣ Verificando assets esperados...')
    const missingAssets = EXPECTED_ASSETS.filter(asset => !gitFiles.includes(asset))
    
    if (missingAssets.length === 0) {
      console.log('   ✅ Todos los assets esperados están en git')
    } else {
      console.log(`   ⚠️  ${missingAssets.length} asset(s) faltante(s):`)
      missingAssets.forEach(asset => {
        console.log(`   ❌ ${asset}`)
      })
    }

    // 3. Verificar que los archivos físicos existan
    console.log('\n3️⃣ Verificando archivos físicos...')
    const missingFiles = EXPECTED_ASSETS.filter(asset => !fs.existsSync(asset))
    
    if (missingFiles.length === 0) {
      console.log('   ✅ Todos los archivos físicos existen')
    } else {
      console.log(`   ⚠️  ${missingFiles.length} archivo(s) físico(s) faltante(s):`)
      missingFiles.forEach(file => {
        console.log(`   ❌ ${file}`)
      })
    }

    // 4. Verificar que los archivos no estén vacíos
    console.log('\n4️⃣ Verificando que los archivos tengan contenido...')
    const emptyFiles = gitFiles.filter(file => {
      if (!fs.existsSync(file)) return false
      const stats = fs.statSync(file)
      return stats.size === 0
    })
    
    if (emptyFiles.length === 0) {
      console.log('   ✅ Todos los archivos tienen contenido')
    } else {
      console.log(`   ⚠️  ${emptyFiles.length} archivo(s) vacío(s):`)
      emptyFiles.forEach(file => {
        console.log(`   ❌ ${file} (0 bytes)`)
      })
    }

    // 5. Verificar estado de git
    console.log('\n5️⃣ Verificando estado de git...')
    try {
      const gitStatus = execSync(`git status ${ASSETS_DIR}/ --porcelain`, { encoding: 'utf-8' }).trim()
      if (!gitStatus) {
        console.log('   ✅ No hay cambios sin commitear')
      } else {
        console.log('   ⚠️  Hay cambios sin commitear:')
        console.log(gitStatus)
      }
    } catch (error) {
      // Si hay cambios, git status retorna algo
      console.log('   ⚠️  Hay cambios sin commitear')
    }

    // 6. Verificar último commit
    console.log('\n6️⃣ Verificando último commit que incluyó estos archivos...')
    try {
      const lastCommit = execSync(
        `git log -1 --oneline --name-only -- ${ASSETS_DIR}/`,
        { encoding: 'utf-8' }
      ).trim()
      
      if (lastCommit) {
        const lines = lastCommit.split('\n')
        console.log(`   📝 Commit: ${lines[0]}`)
        console.log(`   📄 Archivos modificados: ${lines.length - 1}`)
      } else {
        console.log('   ⚠️  No se encontraron commits para estos archivos')
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo obtener el historial de commits')
    }

    // Resumen
    console.log('\n📊 RESUMEN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const issues = []
    if (missingAssets.length > 0) {
      issues.push(`❌ ${missingAssets.length} asset(s) esperado(s) no está(n) en git`)
    }
    if (missingFiles.length > 0) {
      issues.push(`❌ ${missingFiles.length} archivo(s) físico(s) faltante(s)`)
    }
    if (emptyFiles.length > 0) {
      issues.push(`❌ ${emptyFiles.length} archivo(s) vacío(s)`)
    }
    
    if (issues.length === 0) {
      console.log('✅ Todos los assets están correctamente en git!')
      console.log(`   - ${gitFiles.length} archivo(s) rastreado(s) por git`)
      console.log(`   - Todos los archivos físicos existen`)
      console.log(`   - Todos los archivos tienen contenido`)
    } else {
      console.log('⚠️  Problemas encontrados:')
      issues.forEach(issue => console.log(`   ${issue}`))
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Error verificando assets:', error.message)
    process.exit(1)
  }
}

checkAssetsInGit()
