/**
 * Script para analizar el problema del LCP en detalle
 */

const report = require('../../lighthouse-report.json')

console.log('\n🔍 ANÁLISIS DETALLADO DEL PROBLEMA DE LCP\n')
console.log('============================================================\n')

// 1. LCP Details
const lcp = report.audits['largest-contentful-paint']
console.log('📊 LCP METRICS:')
console.log(`   Score: ${lcp?.score || 'N/A'}`)
console.log(`   Numeric Value: ${lcp?.numericValue ? Math.round(lcp.numericValue) + 'ms' : 'N/A'}`)
console.log(`   Display Value: ${lcp?.displayValue || 'N/A'}\n`)

// 2. LCP Element
const lcpElement = report.audits['largest-contentful-paint-element']
console.log('🖼️  LCP ELEMENT:')
if (lcpElement?.details?.items && lcpElement.details.items.length > 0) {
  const item = lcpElement.details.items[0]
  console.log(`   Node: ${item.node?.snippet || 'N/A'}`)
  console.log(`   URL: ${item.node?.nodeLabel || 'N/A'}`)
  console.log(`   Type: ${item.node?.type || 'N/A'}`)
} else {
  console.log('   ❌ NO ELEMENT DETECTED - This is the problem!\n')
}

// 3. Network Requests for Hero Image
const networkRequests = report.audits['network-requests']
console.log('\n🌐 NETWORK REQUESTS (Hero Image):')
if (networkRequests?.details?.items) {
  const heroRequests = networkRequests.details.items.filter(item => 
    item.url && (item.url.includes('hero1.webp') || item.url.includes('hero'))
  )
  if (heroRequests.length > 0) {
    heroRequests.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.url.substring(0, 80)}`)
      console.log(`      Status: ${item.statusCode || 'N/A'}`)
      console.log(`      Size: ${Math.round(item.transferSize / 1024)}KB`)
      console.log(`      Duration: ${Math.round(item.duration)}ms`)
      console.log(`      Start Time: ${Math.round(item.startTime)}ms`)
    })
  } else {
    console.log('   ❌ NO HERO IMAGE REQUESTS FOUND - Image not loading!')
  }
} else {
  console.log('   ⚠️  Network requests data not available')
}

// 4. Render Blocking Resources
const renderBlocking = report.audits['render-blocking-resources']
console.log('\n🚫 RENDER BLOCKING RESOURCES:')
if (renderBlocking?.details?.items && renderBlocking.details.items.length > 0) {
  renderBlocking.details.items.forEach((item, i) => {
    const url = item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url
    console.log(`   ${i + 1}. ${url}`)
    console.log(`      Wasted: ${Math.round(item.wastedMs)}ms`)
  })
} else {
  console.log('   ✅ No render blocking resources')
}

// 5. Preload LCP Image
const preloadLCP = report.audits['preload-lcp-image']
console.log('\n⚡ PRELOAD LCP IMAGE:')
if (preloadLCP) {
  console.log(`   Score: ${preloadLCP.score || 'N/A'}`)
  console.log(`   Display Value: ${preloadLCP.displayValue || 'N/A'}`)
  if (preloadLCP.details?.items && preloadLCP.details.items.length > 0) {
    preloadLCP.details.items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.url || 'N/A'}`)
    })
  }
} else {
  console.log('   ⚠️  Preload LCP image audit not available')
}

// 6. LCP Breakdown
const lcpBreakdown = report.audits['lcp-lazy-loaded']
console.log('\n📉 LCP LAZY LOADED:')
if (lcpBreakdown) {
  console.log(`   Score: ${lcpBreakdown.score || 'N/A'}`)
  console.log(`   Display Value: ${lcpBreakdown.displayValue || 'N/A'}`)
}

// 7. Image Elements
const imageElements = report.audits['image-elements']
console.log('\n🖼️  IMAGE ELEMENTS (First 5):')
if (imageElements?.details?.items) {
  imageElements.details.items.slice(0, 5).forEach((item, i) => {
    const url = item.url ? (item.url.length > 60 ? item.url.substring(0, 60) + '...' : item.url) : 'N/A'
    console.log(`   ${i + 1}. ${url}`)
    console.log(`      Size: ${Math.round(item.totalBytes / 1024)}KB`)
    console.log(`      Wasted: ${Math.round(item.wastedBytes / 1024)}KB`)
  })
}

console.log('\n============================================================\n')
console.log('💡 DIAGNÓSTICO:')
if (!lcpElement?.details?.items || lcpElement.details.items.length === 0) {
  console.log('   ❌ LCP element no detectado - posible causa:')
  console.log('      1. La imagen hero no se está cargando correctamente')
  console.log('      2. La imagen se está ocultando antes de que Lighthouse la detecte')
  console.log('      3. Hay recursos bloqueando la carga de la imagen')
  console.log('      4. El delay de 8s está causando que Lighthouse no detecte el LCP')
} else {
  console.log('   ✅ LCP element detectado')
}

console.log('\n')

