// ===================================
// PINTEYA E-COMMERCE - API DE TESTING
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { runAllTests } from '@/lib/test-connection';

// ===================================
// GET /api/test - Ejecutar tests de conexión
// ===================================
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando tests desde API...');
    
    const results = await runAllTests();
    
    const allPassed = results.connection && 
                     results.adminConnection && 
                     results.crud && 
                     Object.values(results.tables).every(Boolean);

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? 'Todos los tests pasaron exitosamente' : 'Algunos tests fallaron',
      results,
      timestamp: new Date().toISOString(),
    }, { 
      status: allPassed ? 200 : 500 
    });

  } catch (error: any) {
    console.error('❌ Error ejecutando tests:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error ejecutando tests',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { 
      status: 500 
    });
  }
}
