#!/usr/bin/env node

/**
 * Script para probar APIs directamente sin pasar por el browser
 * Útil para verificar si las APIs funcionan correctamente
 */

const https = require('https')
const http = require('http')

async function testAPI(url, description) {
  return new Promise(resolve => {
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`📡 URL: ${url}`)

    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const req = client.get(url, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`)
        console.log(`📋 Headers:`, res.headers)

        try {
          const jsonData = JSON.parse(data)
          console.log(`✅ Response (JSON):`, JSON.stringify(jsonData, null, 2))
        } catch (e) {
          console.log(`📄 Response (Text):`, data.substring(0, 500))
        }

        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300,
        })
      })
    })

    req.on('error', error => {
      console.error(`❌ Error:`, error.message)
      resolve({
        status: 0,
        data: null,
        success: false,
        error: error.message,
      })
    })

    req.setTimeout(10000, () => {
      console.error(`⏰ Timeout`)
      req.destroy()
      resolve({
        status: 0,
        data: null,
        success: false,
        error: 'Timeout',
      })
    })
  })
}

async function main() {
  console.log('🚀 TESTING PINTEYA E-COMMERCE APIs')
  console.log('=====================================')

  const tests = [
    {
      url: 'http://localhost:3000/api/search/trending',
      description: 'Trending Searches API (should work - public)',
    },
    {
      url: 'http://localhost:3000/api/products',
      description: 'Products API (should work - public)',
    },
    {
      url: 'http://localhost:3000/api/categories',
      description: 'Categories API (should work - public)',
    },
    {
      url: 'http://localhost:3000/api/admin/products/stats',
      description: 'Admin Products Stats API (should fail - requires auth)',
    },
  ]

  const results = []

  for (const test of tests) {
    const result = await testAPI(test.url, test.description)
    results.push({ ...test, ...result })

    // Esperar un poco entre requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n📊 SUMMARY')
  console.log('==========')

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.description}: ${result.status}`)
  })

  const publicAPIsWorking = results.slice(0, 3).every(r => r.success)
  const adminAPIBlocked = results[3].status === 401 || results[3].status === 403

  console.log('\n🎯 ANALYSIS')
  console.log('===========')
  console.log(`Public APIs working: ${publicAPIsWorking ? '✅' : '❌'}`)
  console.log(`Admin API properly blocked: ${adminAPIBlocked ? '✅' : '❌'}`)

  if (publicAPIsWorking && adminAPIBlocked) {
    console.log('\n🎉 APIs are working correctly!')
    console.log('✅ Public APIs accessible')
    console.log('✅ Admin APIs properly protected')
  } else {
    console.log('\n⚠️ Issues detected:')
    if (!publicAPIsWorking) {
      console.log('❌ Public APIs not working')
    }
    if (!adminAPIBlocked) {
      console.log('❌ Admin APIs not properly protected')
    }
  }
}

main().catch(console.error)
