import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API de diagnóstico para el panel administrativo
 * Esta API NO requiere autenticación para poder diagnosticar problemas
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Debug: Starting diagnostic...');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      },
      supabase: {
        connection: 'unknown',
        productsTable: 'unknown',
        categoriesTable: 'unknown',
        error: null
      },
      apis: {
        productsDirectExists: true,
        productsSimpleExists: false,
        error: null
      }
    };

    // Test Supabase connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        diagnostics.supabase.connection = 'missing_credentials';
        diagnostics.supabase.error = 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY';
      } else {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Test products table
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .limit(1);

        if (productsError) {
          diagnostics.supabase.productsTable = 'error';
          diagnostics.supabase.error = productsError.message;
        } else {
          diagnostics.supabase.productsTable = 'ok';
          diagnostics.supabase.connection = 'ok';
        }

        // Test categories table
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id')
          .limit(1);

        if (categoriesError) {
          diagnostics.supabase.categoriesTable = 'error';
        } else {
          diagnostics.supabase.categoriesTable = 'ok';
        }
      }
    } catch (error) {
      diagnostics.supabase.connection = 'error';
      diagnostics.supabase.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test API endpoints existence
    try {
      // Check if products-simple API exists
      const fs = require('fs');
      const path = require('path');
      const productsSimplePath = path.join(process.cwd(), 'src/app/api/admin/products-simple/route.ts');
      diagnostics.apis.productsSimpleExists = fs.existsSync(productsSimplePath);
    } catch (error) {
      diagnostics.apis.error = error instanceof Error ? error.message : 'Unknown error';
    }

    console.log('✅ Admin Debug: Diagnostic completed', diagnostics);

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado',
      data: diagnostics,
      recommendations: generateRecommendations(diagnostics)
    });

  } catch (error) {
    console.error('❌ Error in admin debug:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error en diagnóstico',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = [];

  if (!diagnostics.environment.hasSupabaseUrl) {
    recommendations.push('❌ Falta variable NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!diagnostics.environment.hasSupabaseServiceKey) {
    recommendations.push('❌ Falta variable SUPABASE_SERVICE_ROLE_KEY');
  }

  if (diagnostics.supabase.connection === 'error') {
    recommendations.push('❌ Error de conexión con Supabase - Verificar credenciales');
  }

  if (diagnostics.supabase.productsTable === 'error') {
    recommendations.push('❌ Error accediendo tabla products - Verificar RLS policies');
  }

  if (!diagnostics.apis.productsSimpleExists) {
    recommendations.push('⚠️ API products-simple no existe - Crear o usar products-direct');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Configuración parece correcta - Verificar autenticación');
  }

  return recommendations;
}
