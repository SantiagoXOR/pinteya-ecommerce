// ===================================
// PINTEYA E-COMMERCE - PLAYWRIGHT GLOBAL TEARDOWN
// ===================================

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...')

  try {
    // Clean up test data
    console.log('📝 Cleaning up test data...')

    // You can add cleanup logic here
    // For example, removing test users, orders, etc.

    // Note: Be careful not to delete production data
    // Only clean up data that was specifically created for testing

    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test run
  }
}

export default globalTeardown
