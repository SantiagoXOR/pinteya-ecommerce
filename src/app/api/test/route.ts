// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE TESTING
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ===================================
// GET /api/test - Ejecutar tests de conexión
// ===================================
export async function GET(request: NextRequest) {
  try {

    // Test básico de conexión a Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test de conexión básica
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const results = {
      connection: !productsError,
      adminConnection: !categoriesError,
      crud: !productsError && !categoriesError,
      tables: {
        products: !productsError,
        categories: !categoriesError,
      }
    };

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










