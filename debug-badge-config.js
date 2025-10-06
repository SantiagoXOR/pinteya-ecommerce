// ============================================================================
// DEBUG SCRIPT: CONFIGURACIÓN DE BADGES
// ============================================================================
// Este script debuggea específicamente la configuración de badges
// para identificar dónde se pierde showColor: true

console.log('🔍 INICIANDO DEBUG DE CONFIGURACIÓN DE BADGES');
console.log('='.repeat(60));

// Función para interceptar y debuggear la configuración de badges
function debugBadgeConfig() {
  // Buscar todos los elementos de producto en la página
  const productElements = document.querySelectorAll('[data-testid*="product"], .product-card, [class*="product"]');
  
  console.log(`📦 Productos encontrados en la página: ${productElements.length}`);
  
  if (productElements.length === 0) {
    console.warn('❌ No se encontraron productos en la página');
    console.log('💡 Asegúrate de que la página tenga productos cargados');
    return;
  }
  
  // Interceptar console.log para capturar los logs de debug de badges
  const originalLog = console.log;
  const badgeDebugLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Capturar logs específicos de badges
    if (message.includes('[ProductCardCommercial] Debug badges') || 
        message.includes('badgeConfig:') ||
        message.includes('showColor:') ||
        message.includes('extractedInfo:')) {
      badgeDebugLogs.push(message);
    }
    
    originalLog.apply(console, args);
  };
  
  // Simular un re-render forzando un cambio en el DOM
  console.log('🔄 Forzando re-render para capturar logs...');
  
  // Trigger re-render scrolling
  window.scrollBy(0, 1);
  window.scrollBy(0, -1);
  
  // Esperar un momento para que se ejecuten los logs
  setTimeout(() => {
    console.log = originalLog; // Restaurar console.log original
    
    console.log('📋 LOGS DE DEBUG CAPTURADOS:');
    console.log('-'.repeat(40));
    
    if (badgeDebugLogs.length === 0) {
      console.warn('❌ No se capturaron logs de debug de badges');
      console.log('💡 Los productos podrían no estar renderizándose correctamente');
    } else {
      badgeDebugLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    // Análisis específico de la configuración
    console.log('\n🔍 ANÁLISIS DE CONFIGURACIÓN:');
    console.log('-'.repeat(40));
    
    // Buscar en el código fuente si hay alguna sobrescritura
    const scripts = document.querySelectorAll('script');
    let foundBadgeConfig = false;
    
    scripts.forEach(script => {
      if (script.textContent && script.textContent.includes('badgeConfig')) {
        console.log('📜 Encontrado badgeConfig en script:', script.src || 'inline');
        foundBadgeConfig = true;
      }
    });
    
    if (!foundBadgeConfig) {
      console.log('❌ No se encontró badgeConfig en scripts del DOM');
    }
    
    console.log('\n✅ DEBUG COMPLETADO');
    console.log('💡 Revisa los logs anteriores para identificar dónde showColor cambia a false');
    
  }, 2000);
}

// Función para verificar la configuración actual en ProductItem
function checkProductItemConfig() {
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN EN PRODUCTITEM:');
  console.log('-'.repeat(50));
  
  // Simular la configuración que debería tener ProductItem
  const expectedConfig = {
    showCapacity: true,
    showColor: true, // ← Este debería ser true
    showFinish: false,
    showMaterial: true,
    showGrit: true,
    showDimensions: true,
    showWeight: false,
    showBrand: false,
    maxBadges: 3
  };
  
  console.log('📋 Configuración esperada en ProductItem:', expectedConfig);
  
  // Verificar si hay alguna sobrescritura global
  if (window.badgeConfig) {
    console.log('🌐 Configuración global encontrada:', window.badgeConfig);
  } else {
    console.log('✅ No hay configuración global de badges');
  }
}

// Función principal
function runBadgeConfigDebug() {
  console.log('🚀 Ejecutando debug completo de configuración de badges...\n');
  
  checkProductItemConfig();
  debugBadgeConfig();
}

// Ejecutar el debug
runBadgeConfigDebug();

// Mensaje final
console.log('\n📝 INSTRUCCIONES:');
console.log('1. Revisa los logs anteriores');
console.log('2. Busca dónde showColor cambia de true a false');
console.log('3. Si no ves productos, recarga la página y ejecuta el script nuevamente');
console.log('4. Comparte los resultados para continuar con el fix');