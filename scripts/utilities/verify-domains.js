#!/usr/bin/env node

/**
 * 🔍 Script de Verificación de Dominios - Pinteya E-commerce
 *
 * Verifica que todos los dominios estén correctamente configurados
 * entre Vercel, Clerk y Google OAuth
 */

const https = require('https')
const dns = require('dns').promises

// 🎯 Dominios a verificar
const DOMAINS = ['pinteya.com', 'www.pinteya.com', 'clerk.pinteya.com', 'accounts.pinteya.com']

// 🔧 Función para verificar HTTPS
function checkHTTPS(domain) {
  return new Promise(resolve => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000,
    }

    const req = https.request(options, res => {
      resolve({
        domain,
        status: res.statusCode,
        headers: res.headers,
        success: res.statusCode < 400,
      })
    })

    req.on('error', err => {
      resolve({
        domain,
        status: 'ERROR',
        error: err.message,
        success: false,
      })
    })

    req.on('timeout', () => {
      resolve({
        domain,
        status: 'TIMEOUT',
        error: 'Request timeout',
        success: false,
      })
    })

    req.end()
  })
}

// 🔧 Función para verificar DNS
async function checkDNS(domain) {
  try {
    const records = await dns.resolve(domain, 'A')
    return {
      domain,
      records,
      success: true,
    }
  } catch (error) {
    return {
      domain,
      error: error.message,
      success: false,
    }
  }
}

// 🚀 Función principal
async function main() {
  console.log('🔍 Verificando configuración de dominios...\n')

  // Verificar HTTPS
  console.log('📡 Verificando conectividad HTTPS...')
  for (const domain of DOMAINS) {
    const result = await checkHTTPS(domain)
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${domain}: ${result.status}`)

    if (!result.success) {
      console.log(`   Error: ${result.error || 'Unknown error'}`)
    }
  }

  console.log('\n🌐 Verificando resolución DNS...')
  for (const domain of DOMAINS) {
    const result = await checkDNS(domain)
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${domain}`)

    if (result.success) {
      console.log(`   IPs: ${result.records.join(', ')}`)
    } else {
      console.log(`   Error: ${result.error}`)
    }
  }

  console.log('\n📋 CHECKLIST DE CONFIGURACIÓN:')
  console.log('□ Dominios configurados en Vercel')
  console.log('□ Dominios autorizados en Clerk')
  console.log('□ Google OAuth configurado')
  console.log('□ Variables de entorno actualizadas')
  console.log('□ DNS records apuntando correctamente')

  console.log('\n📖 Para más información, consulta:')
  console.log('   docs/GOOGLE_OAUTH_SETUP.md')
  console.log('   docs/CLERK_PRODUCTION_SETUP.md')
}

// Ejecutar
main().catch(console.error)
