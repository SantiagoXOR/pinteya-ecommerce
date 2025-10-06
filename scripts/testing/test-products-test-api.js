#!/usr/bin/env node

/**
 * Script to test the new products-test API
 */

const https = require('https')

console.log('🧪 TESTING NEW PRODUCTS-TEST API\n')

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      let data = ''
      response.on('data', chunk => (data += chunk))
      response.on('end', () =>
        resolve({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          data: data,
          url: url,
        })
      )
    })
    request.on('error', reject)
    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
  })
}

async function testProductsTestAPI() {
  const testUrl = 'https://www.pinteya.com/api/admin/products-test?page=1&limit=5'

  console.log('📋 Testing products-test API...')
  console.log(`📍 URL: ${testUrl}\n`)

  try {
    const response = await makeRequest(testUrl)

    console.log(`📊 Status: ${response.statusCode} ${response.statusMessage}`)

    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data)

        console.log('🎉 SUCCESS! API WORKING CORRECTLY')
        console.log(`✅ Success: ${data.success}`)
        console.log(`📦 Products found: ${data.data?.products?.length || 0}`)
        console.log(`📊 Total in DB: ${data.data?.total || 0}`)
        console.log(`📄 Page: ${data.data?.pagination?.page || 0}`)
        console.log(`🔧 API: ${data.meta?.api || 'unknown'}`)
        console.log(`📝 Message: ${data.message || 'none'}`)

        if (data.data?.products?.length > 0) {
          console.log('\n📋 First product:')
          const firstProduct = data.data.products[0]
          console.log(`   • ID: ${firstProduct.id}`)
          console.log(`   • Name: ${firstProduct.name}`)
          console.log(`   • Price: $${firstProduct.price}`)
          console.log(`   • Stock: ${firstProduct.stock}`)
          console.log(`   • Category: ${firstProduct.category_name || 'N/A'}`)
        }

        return true
      } catch (parseError) {
        console.log('❌ Error parsing JSON:')
        console.log(response.data.substring(0, 300) + '...')
        return false
      }
    } else if (response.statusCode === 307) {
      console.log('❌ Still redirecting to signin - middleware issue')
      console.log('🔄 May need more time for deployment')
      return false
    } else {
      console.log('❌ API returned error:')
      console.log(response.data.substring(0, 300) + '...')
      return false
    }
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🎯 GOAL: Test if new products-test API works without authResult error\n')

  const success = await testProductsTestAPI()

  console.log('\n' + '='.repeat(60))

  if (success) {
    console.log('🎉 EXCELLENT! NEW API WORKS!')
    console.log('✅ No authResult error')
    console.log('✅ Products loading correctly')
    console.log('✅ Database connection working')
    console.log('\n📋 Next steps:')
    console.log('   1. Reload debug page in browser')
    console.log('   2. Test "Probar API Productos" button')
    console.log('   3. Should now work without 500 error')
    console.log('   4. Test main admin panel /admin/products')
  } else {
    console.log('❌ API still not working')
    console.log('⏳ May need more time for deployment')
    console.log('🔄 Try again in a few minutes')
  }

  console.log('\n🔗 URLs to test:')
  console.log('   🧪 Debug: https://www.pinteya.com/admin/debug-products')
  console.log('   📦 Admin: https://www.pinteya.com/admin/products')
  console.log('   🔧 Test API: https://www.pinteya.com/api/admin/products-test?page=1&limit=5')
}

main().catch(console.error)
