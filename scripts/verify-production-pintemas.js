#!/usr/bin/env node

/**
 * Script para verificar el tenant Pintemas en producción
 * Verifica assets, headers HTTP, y configuración
 */

const https = require('https')
const http = require('http')

const PRODUCTION_URL = 'https://www.pintemas.com'

/**
 * Hace una request HTTP/HTTPS y retorna los headers
 */
function fetchHeaders(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      const headers = res.headers
      const statusCode = res.statusCode
      
      // Leer el body para cerrar la conexión
      res.on('data', () => {})
      res.on('end', () => {
        resolve({ statusCode, headers })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

/**
 * Verifica si una URL retorna 200
 */
async function checkAsset(url) {
  try {
    const { statusCode } = await fetchHeaders(url)
    return {
      url,
      status: statusCode,
      accessible: statusCode === 200,
    }
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      accessible: false,
      error: error.message,
    }
  }
}

async function verifyProductionPintemas() {
  console.log('🔍 Verificando tenant Pintemas en producción...\n')
  console.log(`📍 URL: ${PRODUCTION_URL}\n`)

  try {
    // 1. Verificar página principal
    console.log('1️⃣ Verificando página principal...')
    const mainPage = await fetchHeaders(PRODUCTION_URL)
    console.log(`   Status: ${mainPage.statusCode}`)
    
    // Verificar headers de tenant
    console.log('\n2️⃣ Verificando headers HTTP del tenant...')
    const tenantHeaders = {
      'x-tenant-domain': mainPage.headers['x-tenant-domain'],
      'x-tenant-custom-domain': mainPage.headers['x-tenant-custom-domain'],
      'x-tenant-subdomain': mainPage.headers['x-tenant-subdomain'],
    }
    
    console.log('   Headers encontrados:')
    Object.entries(tenantHeaders).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌'
      console.log(`   ${icon} ${key}: ${value || 'NO ENCONTRADO'}`)
    })
    
    // Verificar que el custom domain es correcto
    if (tenantHeaders['x-tenant-custom-domain'] === 'www.pintemas.com') {
      console.log('   ✅ Custom domain detectado correctamente')
    } else {
      console.log('   ⚠️  Custom domain no coincide con el esperado')
    }
    
    // 3. Verificar assets
    console.log('\n3️⃣ Verificando assets del tenant...')
    const assets = [
      '/tenants/pintemas/logo.svg',
      '/tenants/pintemas/logo-dark.svg',
      '/tenants/pintemas/favicon.svg',
      '/tenants/pintemas/og-image.png',
    ]
    
    const assetChecks = await Promise.all(
      assets.map(asset => checkAsset(`${PRODUCTION_URL}${asset}`))
    )
    
    console.log('   Resultados:')
    assetChecks.forEach(({ url, status, accessible, error }) => {
      const icon = accessible ? '✅' : '❌'
      const statusText = typeof status === 'number' ? status : error || status
      console.log(`   ${icon} ${url.split('/').pop()}: ${statusText}`)
    })
    
    const failedAssets = assetChecks.filter(a => !a.accessible)
    if (failedAssets.length > 0) {
      console.log(`\n   ⚠️  ${failedAssets.length} asset(s) no accesible(s)`)
      console.log('   💡 Verifica que los assets estén en git y en el build de Vercel')
    } else {
      console.log('\n   ✅ Todos los assets son accesibles')
    }
    
    // 4. Resumen
    console.log('\n📊 RESUMEN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const issues = []
    if (mainPage.statusCode !== 200) {
      issues.push(`❌ Página principal retorna ${mainPage.statusCode}`)
    }
    if (!tenantHeaders['x-tenant-custom-domain']) {
      issues.push('❌ Header x-tenant-custom-domain no encontrado')
    }
    if (tenantHeaders['x-tenant-custom-domain'] !== 'www.pintemas.com') {
      issues.push('⚠️  Custom domain no coincide')
    }
    if (failedAssets.length > 0) {
      issues.push(`❌ ${failedAssets.length} asset(s) no accesible(s)`)
    }
    
    if (issues.length === 0) {
      console.log('✅ Todo está funcionando correctamente en producción!')
    } else {
      console.log('⚠️  Problemas encontrados:')
      issues.forEach(issue => console.log(`   ${issue}`))
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 5. Instrucciones para verificación manual
    console.log('\n📋 PRÓXIMOS PASOS PARA VERIFICACIÓN MANUAL:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Abre https://www.pintemas.com en tu navegador')
    console.log('2. Abre DevTools (F12) → Console')
    console.log('3. Busca logs que contengan "TenantService" (solo en desarrollo)')
    console.log('4. Ve a DevTools → Network')
    console.log('5. Filtra por "pintemas" o "logo"')
    console.log('6. Recarga la página (Ctrl+Shift+R)')
    console.log('7. Verifica que los requests a /tenants/pintemas/* retornen 200')
    console.log('8. Inspecciona el header en Elements')
    console.log('9. Verifica en Computed Styles que --tenant-primary es #1e88e5')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Error verificando producción:', error.message)
    process.exit(1)
  }
}

verifyProductionPintemas()
