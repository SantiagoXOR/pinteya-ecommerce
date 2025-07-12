/**
 * Script de prueba para verificar que la API de búsqueda funciona correctamente
 */

import { searchProducts } from '@/lib/api/products';

export async function testSearchAPI() {
  console.log('🧪 Iniciando pruebas de la API de búsqueda...');
  
  const testCases = [
    { query: 'pintura', expectedResults: true },
    { query: 'lija', expectedResults: true },
    { query: 'bandeja', expectedResults: true },
    { query: 'xyz123nonexistent', expectedResults: false },
    { query: '', expectedResults: false },
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Probando búsqueda: "${testCase.query}"`);
    
    try {
      const startTime = Date.now();
      const result = await searchProducts(testCase.query, 5);
      const endTime = Date.now();
      
      console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
      console.log(`📊 Resultado:`, {
        success: result.success,
        dataLength: result.data?.length || 0,
        total: result.pagination?.total || 0,
      });
      
      if (testCase.expectedResults && (!result.data || result.data.length === 0)) {
        console.warn(`⚠️ Se esperaban resultados para "${testCase.query}" pero no se encontraron`);
      } else if (!testCase.expectedResults && result.data && result.data.length > 0) {
        console.warn(`⚠️ No se esperaban resultados para "${testCase.query}" pero se encontraron ${result.data.length}`);
      } else {
        console.log(`✅ Prueba exitosa para "${testCase.query}"`);
      }
      
      // Mostrar algunos productos de ejemplo
      if (result.data && result.data.length > 0) {
        console.log(`📦 Productos encontrados:`);
        result.data.slice(0, 2).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} - ${product.category?.name || 'Sin categoría'}`);
        });
      }
      
    } catch (error) {
      console.error(`❌ Error en búsqueda "${testCase.query}":`, error);
    }
  }
  
  console.log('\n🏁 Pruebas completadas');
}

// Función para probar desde la consola del navegador
export function runBrowserTest() {
  if (typeof window !== 'undefined') {
    console.log('🌐 Ejecutando prueba desde el navegador...');
    testSearchAPI();
  } else {
    console.log('❌ Esta función solo puede ejecutarse en el navegador');
  }
}

// Hacer disponible globalmente para pruebas
if (typeof window !== 'undefined') {
  (window as any).testSearchAPI = testSearchAPI;
  (window as any).runBrowserTest = runBrowserTest;
}
