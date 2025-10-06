// ===================================
// PINTEYA E-COMMERCE - PLAYWRIGHT GLOBAL SETUP
// ===================================

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...')

    let retries = 0
    const maxRetries = 30

    while (retries < maxRetries) {
      try {
        const response = await page.goto('http://localhost:3000/api/test')
        if (response?.ok()) {
          console.log('✅ Development server is ready')
          break
        }
      } catch (error) {
        retries++
        if (retries === maxRetries) {
          throw new Error('Development server failed to start within timeout')
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Verify essential APIs are working
    console.log('🔍 Verifying APIs...')

    const apiChecks = [
      { endpoint: '/api/products', name: 'Products API' },
      { endpoint: '/api/categories', name: 'Categories API' },
    ]

    for (const check of apiChecks) {
      try {
        const response = await page.goto(`http://localhost:3000${check.endpoint}`)
        if (response?.ok()) {
          const data = await response.json()
          if (data.success) {
            console.log(`✅ ${check.name} is working`)
          } else {
            console.warn(`⚠️ ${check.name} returned success: false`)
          }
        } else {
          console.warn(`⚠️ ${check.name} returned status: ${response?.status()}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${check.name} check failed:`, error)
      }
    }

    // Setup test data if needed
    console.log('📝 Setting up test data...')

    // You can add test data setup here if needed
    // For example, creating test users, products, etc.

    // Verify database connection
    try {
      const dbResponse = await page.goto('http://localhost:3000/api/test')
      if (dbResponse?.ok()) {
        const dbData = await dbResponse.json()
        if (dbData.success) {
          console.log('✅ Database connection verified')
        } else {
          console.warn('⚠️ Database connection issues detected')
        }
      }
    } catch (error) {
      console.warn('⚠️ Database verification failed:', error)
    }

    // Clear any existing test data
    console.log('🧹 Cleaning up previous test data...')

    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
