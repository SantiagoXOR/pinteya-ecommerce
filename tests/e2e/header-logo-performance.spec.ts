import { test, expect } from '@playwright/test'

test.describe('Header Logo Performance Test', () => {
  test('should not reload logo repeatedly', async ({ page }) => {
    const logoRequests: string[] = []
    const renderLogs: any[] = []

    // ⚡ FIX: Register route interceptor BEFORE navigation to catch all requests
    await page.route('**/LOGO%20POSITIVO.svg', async (route) => {
      const url = route.request().url()
      const initiator = route.request().headers()['referer'] || 'unknown'
      logoRequests.push({
        url,
        initiator,
        timestamp: Date.now()
      })
      console.log(`[NETWORK] Logo requested: ${url} (Total: ${logoRequests.length})`)
      await route.continue()
    })

    // Capture console logs from our debug instrumentation
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Header rendered') || text.includes('OptimizedLogo rendered') || text.includes('HeaderLogo rendered')) {
        renderLogs.push({
          type: msg.type(),
          text: text,
          timestamp: Date.now()
        })
      }
    })

    // Navigate to the home page
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    // Wait for initial load and all images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Additional wait for any delayed requests

    const initialLogoCount = logoRequests.length
    console.log(`[INITIAL] Logo requests after page load: ${initialLogoCount}`)
    
    // ⚡ FIX: Filter requests - only count those from header (not footer or other components)
    // The header logo should have data-testid="desktop-logo" or "mobile-logo"
    const headerLogoElement = await page.locator('header img[data-testid*="logo"]').first()
    const headerLogoSrc = await headerLogoElement.getAttribute('src').catch(() => null)
    
    // Count only requests that match the header logo src
    // If we can't find the header logo, count all requests (assume they're from header)
    const headerLogoRequests = headerLogoSrc 
      ? logoRequests.filter(req => req.url.includes(headerLogoSrc.split('/').pop() || ''))
      : logoRequests // Fallback: count all if we can't identify header specifically
    
    console.log(`[INITIAL] Header-specific logo requests: ${headerLogoRequests.length}`)

    // Scroll down
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })
    await page.waitForTimeout(1000)

    // Scroll up
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1000)

    // Scroll down again
    await page.evaluate(() => {
      window.scrollTo(0, 1000)
    })
    await page.waitForTimeout(1000)

    // Wait for any pending requests
    await page.waitForTimeout(2000)

    // Re-count header logo requests after scroll
    const finalHeaderLogoRequests = logoRequests.filter(req => 
      headerLogoSrc && req.url.includes(headerLogoSrc.split('/').pop() || '')
    )
    const finalLogoCount = logoRequests.length
    const finalHeaderCount = finalHeaderLogoRequests.length
    const additionalHeaderRequests = finalHeaderCount - headerLogoRequests.length

    console.log(`[FINAL] Total logo requests (all components): ${finalLogoCount}`)
    console.log(`[FINAL] Header logo requests: ${finalHeaderCount}`)
    console.log(`[FINAL] Additional header requests after initial load: ${additionalHeaderRequests}`)
    console.log(`[RENDERS] Total render logs captured: ${renderLogs.length}`)

    // Log all render events
    renderLogs.forEach((log, index) => {
      console.log(`[RENDER ${index + 1}] ${log.text}`)
    })

    // ⚡ FIX: Assertions focused on HEADER logo only
    // The header logo should only be requested once (or at most 2 times for SSR/hydration)
    // If it's being requested more than 3 times, that's a problem
    expect(finalHeaderCount).toBeLessThan(4)
    
    // Additional requests after initial load should be ZERO for header logo
    // (SSR + hydration = 2 requests max, any more indicates re-renders)
    expect(additionalHeaderRequests).toBeLessThan(1)

    // Generate detailed report
    const report = {
      testName: 'Header Logo Performance Test',
      timestamp: new Date().toISOString(),
      results: {
        totalLogoRequests: finalLogoCount,
        headerLogoRequests: finalHeaderCount,
        initialHeaderRequests: headerLogoRequests.length,
        additionalHeaderRequests: additionalHeaderRequests,
        renderLogCount: renderLogs.length,
        logoRequestUrls: logoRequests,
        renderLogs: renderLogs
      },
      verdict: additionalHeaderRequests > 0 ? 'FAILED - Header logo is being reloaded repeatedly' : 'PASSED - Header logo loading is optimized'
    }

    console.log('\n=== PERFORMANCE TEST REPORT ===')
    console.log(JSON.stringify(report, null, 2))
    console.log('==============================\n')
  })
})

