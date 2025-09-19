// =====================================================
// SCRIPT DE VALIDACIÓN MANUAL - PANEL DE LOGÍSTICA
// Descripción: Validación exhaustiva de datos y funcionalidades
// Ejecutar en consola del navegador en /admin/logistics
// =====================================================

console.log('🚀 Iniciando validación exhaustiva del Panel de Logística...');

// =====================================================
// 1. VALIDACIÓN DE APIS Y DATOS REALES
// =====================================================

async function validateAPIs() {
  console.log('\n📡 1. VALIDANDO APIS Y DATOS REALES...');
  
  try {
    // Llamar a la API principal de logística
    const response = await fetch('/api/admin/logistics');
    const data = await response.json();
    
    console.log('✅ API /api/admin/logistics responde correctamente');
    console.log('📊 Datos recibidos:', {
      totalShipments: data.stats?.total_shipments,
      activeShipments: data.stats?.active_shipments,
      deliveredShipments: data.stats?.delivered_shipments,
      recentShipmentsCount: data.recent_shipments?.length,
      performanceMetricsCount: data.performance_metrics?.length
    });
    
    // Verificar que no hay datos hardcodeados
    const hasRealData = data.stats?.total_shipments > 0 && data.recent_shipments?.length > 0;
    console.log(hasRealData ? '✅ Datos reales detectados' : '❌ Posibles datos hardcodeados');
    
    return data;
  } catch (error) {
    console.error('❌ Error al validar APIs:', error);
    return null;
  }
}

// =====================================================
// 2. VALIDACIÓN DE ELEMENTOS UI
// =====================================================

function validateUIElements() {
  console.log('\n🎨 2. VALIDANDO ELEMENTOS DE UI...');
  
  const checks = [
    { name: 'Título principal', selector: 'h1', expectedText: 'Logística' },
    { name: 'Badge de estado del sistema', selector: '[class*="badge"]', expectedText: 'Sistema' },
    { name: 'Botón Actualizar', selector: 'button:has-text("Actualizar")', expectedText: 'Actualizar' },
    { name: 'Botón Crear Envío', selector: 'button:has-text("Crear Envío")', expectedText: 'Crear Envío' },
    { name: 'Pestaña Resumen', selector: '[data-value="overview"]', expectedText: 'Resumen' },
    { name: 'Pestaña Envíos', selector: '[data-value="shipments"]', expectedText: 'Envíos' },
    { name: 'Pestaña Performance', selector: '[data-value="performance"]', expectedText: 'Performance' },
    { name: 'Pestaña Couriers', selector: '[data-value="carriers"]', expectedText: 'Couriers' }
  ];
  
  const results = checks.map(check => {
    const element = document.querySelector(check.selector);
    const exists = !!element;
    const hasCorrectText = exists && element.textContent.includes(check.expectedText);
    
    console.log(`${exists && hasCorrectText ? '✅' : '❌'} ${check.name}: ${exists ? 'Encontrado' : 'No encontrado'}`);
    
    return { ...check, exists, hasCorrectText };
  });
  
  return results;
}

// =====================================================
// 3. VALIDACIÓN DE MÉTRICAS Y NÚMEROS
// =====================================================

function validateMetrics() {
  console.log('\n📊 3. VALIDANDO MÉTRICAS Y NÚMEROS...');
  
  const metrics = [];
  
  // Buscar todas las métricas numéricas
  const metricElements = document.querySelectorAll('[class*="text-2xl"], [class*="text-3xl"]');
  
  metricElements.forEach((element, index) => {
    const text = element.textContent.trim();
    const isNumeric = /\d/.test(text);
    const parentText = element.parentElement?.textContent || '';
    
    if (isNumeric) {
      metrics.push({
        index,
        value: text,
        context: parentText.substring(0, 50) + '...',
        isValidNumber: !isNaN(parseFloat(text.replace(/[^\d.,]/g, '')))
      });
      
      console.log(`📈 Métrica ${index + 1}: ${text} (${parentText.split(' ')[0]})`);
    }
  });
  
  console.log(`✅ Total de métricas encontradas: ${metrics.length}`);
  return metrics;
}

// =====================================================
// 4. VALIDACIÓN DE FORMATOS
// =====================================================

function validateFormats() {
  console.log('\n🔍 4. VALIDANDO FORMATOS DE DATOS...');
  
  const results = {
    dates: [],
    currencies: [],
    states: []
  };
  
  // Validar fechas (buscar en tabla de envíos)
  const dateElements = document.querySelectorAll('tbody td:last-child');
  dateElements.forEach((element, index) => {
    const text = element.textContent.trim();
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const isValidDate = dateRegex.test(text);
    
    results.dates.push({ index, text, isValid: isValidDate });
    
    if (index < 3) { // Solo mostrar primeros 3
      console.log(`📅 Fecha ${index + 1}: ${text} ${isValidDate ? '✅' : '❌'}`);
    }
  });
  
  // Validar monedas
  const currencyElements = document.querySelectorAll('tbody td:nth-child(6)');
  currencyElements.forEach((element, index) => {
    const text = element.textContent.trim();
    const currencyRegex = /^\$\s*[\d.,]+$/;
    const isValidCurrency = currencyRegex.test(text);
    
    results.currencies.push({ index, text, isValid: isValidCurrency });
    
    if (index < 3) { // Solo mostrar primeros 3
      console.log(`💰 Moneda ${index + 1}: ${text} ${isValidCurrency ? '✅' : '❌'}`);
    }
  });
  
  // Validar estados
  const stateElements = document.querySelectorAll('tbody td:nth-child(3)');
  const validStates = ['Pendiente', 'Confirmado', 'En Tránsito', 'Entregado', 'Cancelado'];
  
  stateElements.forEach((element, index) => {
    const text = element.textContent.trim();
    const isValidState = validStates.some(state => text.includes(state));
    
    results.states.push({ index, text, isValid: isValidState });
    
    if (index < 3) { // Solo mostrar primeros 3
      console.log(`🏷️ Estado ${index + 1}: ${text} ${isValidState ? '✅' : '❌'}`);
    }
  });
  
  return results;
}

// =====================================================
// 5. VALIDACIÓN DE CONSISTENCIA ENTRE PESTAÑAS
// =====================================================

async function validateTabConsistency() {
  console.log('\n🔄 5. VALIDANDO CONSISTENCIA ENTRE PESTAÑAS...');
  
  const results = {};
  
  // Obtener datos de pestaña Resumen
  const overviewTab = document.querySelector('[data-value="overview"]');
  if (overviewTab) {
    overviewTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const totalShipmentsElement = document.querySelector('text=Total Envíos')?.parentElement?.querySelector('[class*="text-2xl"]');
    const totalFromOverview = totalShipmentsElement ? parseInt(totalShipmentsElement.textContent.replace(/[^\d]/g, '')) : 0;
    
    results.overviewTotal = totalFromOverview;
    console.log(`📊 Total envíos (Resumen): ${totalFromOverview}`);
  }
  
  // Obtener datos de pestaña Envíos
  const shipmentsTab = document.querySelector('[data-value="shipments"]');
  if (shipmentsTab) {
    shipmentsTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shipmentRows = document.querySelectorAll('tbody tr');
    const shipmentsCount = shipmentRows.length;
    
    results.shipmentsTableCount = shipmentsCount;
    console.log(`📋 Envíos en tabla: ${shipmentsCount}`);
    
    // Verificar consistencia
    const isConsistent = shipmentsCount <= results.overviewTotal;
    console.log(`${isConsistent ? '✅' : '❌'} Consistencia: ${isConsistent ? 'OK' : 'FALLO'}`);
  }
  
  return results;
}

// =====================================================
// 6. TESTING DE BOTONES Y FUNCIONALIDADES
// =====================================================

async function testInteractions() {
  console.log('\n🖱️ 6. TESTING DE INTERACCIONES...');
  
  const results = [];
  
  // Test botón Actualizar
  const refreshButton = document.querySelector('button:has-text("Actualizar")');
  if (refreshButton) {
    console.log('🔄 Testing botón Actualizar...');
    
    // Interceptar llamadas de red
    let apiCalled = false;
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (args[0].includes('/api/admin/logistics')) {
        apiCalled = true;
        console.log('📡 API llamada detectada:', args[0]);
      }
      return originalFetch.apply(this, args);
    };
    
    refreshButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    window.fetch = originalFetch; // Restaurar fetch original
    
    results.push({
      name: 'Botón Actualizar',
      success: apiCalled,
      message: apiCalled ? 'API llamada correctamente' : 'No se detectó llamada a API'
    });
    
    console.log(`${apiCalled ? '✅' : '❌'} Botón Actualizar: ${apiCalled ? 'Funciona' : 'No funciona'}`);
  }
  
  // Test filtros y búsqueda
  const searchInput = document.querySelector('input[placeholder*="Buscar"]');
  if (searchInput) {
    console.log('🔍 Testing búsqueda...');
    
    const initialRows = document.querySelectorAll('tbody tr').length;
    searchInput.value = 'TRK';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filteredRows = document.querySelectorAll('tbody tr').length;
    const searchWorks = filteredRows !== initialRows;
    
    results.push({
      name: 'Funcionalidad de búsqueda',
      success: searchWorks,
      message: `${initialRows} → ${filteredRows} filas`
    });
    
    console.log(`${searchWorks ? '✅' : '❌'} Búsqueda: ${searchWorks ? 'Funciona' : 'No funciona'}`);
    
    // Limpiar búsqueda
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  return results;
}

// =====================================================
// 7. FUNCIÓN PRINCIPAL DE VALIDACIÓN
// =====================================================

async function runCompleteValidation() {
  console.log('🎯 INICIANDO VALIDACIÓN COMPLETA DEL PANEL DE LOGÍSTICA');
  console.log('=' .repeat(60));
  
  const report = {
    timestamp: new Date().toISOString(),
    results: {}
  };
  
  try {
    // 1. Validar APIs
    report.results.apiData = await validateAPIs();
    
    // 2. Validar elementos UI
    report.results.uiElements = validateUIElements();
    
    // 3. Validar métricas
    report.results.metrics = validateMetrics();
    
    // 4. Validar formatos
    report.results.formats = validateFormats();
    
    // 5. Validar consistencia
    report.results.consistency = await validateTabConsistency();
    
    // 6. Test interacciones
    report.results.interactions = await testInteractions();
    
    // Generar resumen
    console.log('\n📋 RESUMEN DE VALIDACIÓN:');
    console.log('=' .repeat(40));
    
    const apiValid = !!report.results.apiData;
    const uiValid = report.results.uiElements.every(el => el.exists && el.hasCorrectText);
    const metricsValid = report.results.metrics.length > 0;
    const formatsValid = report.results.formats.dates.every(d => d.isValid) && 
                        report.results.formats.currencies.every(c => c.isValid);
    const interactionsValid = report.results.interactions.every(i => i.success);
    
    console.log(`📡 APIs: ${apiValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎨 UI Elements: ${uiValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Métricas: ${metricsValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔍 Formatos: ${formatsValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🖱️ Interacciones: ${interactionsValid ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallScore = [apiValid, uiValid, metricsValid, formatsValid, interactionsValid]
      .filter(Boolean).length;
    
    console.log(`\n🎯 SCORE GENERAL: ${overallScore}/5 (${(overallScore/5*100).toFixed(0)}%)`);
    
    if (overallScore === 5) {
      console.log('🎉 ¡PANEL DE LOGÍSTICA COMPLETAMENTE FUNCIONAL!');
    } else {
      console.log('⚠️ Panel tiene algunos problemas que requieren atención');
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Error durante la validación:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

// =====================================================
// EJECUTAR VALIDACIÓN
// =====================================================

// Ejecutar automáticamente
runCompleteValidation().then(report => {
  console.log('\n💾 Reporte completo guardado en variable global: window.logisticsValidationReport');
  window.logisticsValidationReport = report;
});

// También exportar funciones individuales para testing manual
window.logisticsValidation = {
  validateAPIs,
  validateUIElements,
  validateMetrics,
  validateFormats,
  validateTabConsistency,
  testInteractions,
  runCompleteValidation
};

console.log('\n🔧 Funciones disponibles en window.logisticsValidation para testing manual');
