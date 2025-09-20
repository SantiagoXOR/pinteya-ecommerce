// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - SITEMAP API
// API para generar y servir sitemap dinámico
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedDynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator';

// GET - Generar y servir sitemap
export async function GET(request: NextRequest) {
  try {
    console.log('🗺️ Generando sitemap dinámico...');
    
    const startTime = Date.now();
    
    // Generar sitemap
    const sitemap = await enhancedDynamicSitemapGenerator.generateSitemap();

    const endTime = Date.now();
    console.log(`✅ Sitemap generado en ${endTime - startTime}ms`);

    // Validar sitemap
    const validation = enhancedDynamicSitemapGenerator.validateSitemap(sitemap);
    if (!validation.isValid) {
      console.error('❌ Sitemap inválido:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Sitemap generado es inválido',
        details: validation.errors
      }, { status: 500 });
    }
    
    // Obtener estadísticas
    const stats = await enhancedDynamicSitemapGenerator.getSitemapStats();
    
    // Configurar headers para XML
    const headers = new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      'X-Sitemap-URLs': stats.totalUrls.toString(),
      'X-Sitemap-Size': stats.fileSize.toString(),
      'X-Generated-At': new Date().toISOString()
    });
    
    return new NextResponse(sitemap, { headers });
    
  } catch (error) {
    console.error('❌ Error generando sitemap:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Regenerar sitemap y limpiar cache
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Regenerando sitemap...');
    
    // Limpiar cache
    enhancedDynamicSitemapGenerator.clearCache();

    // Generar nuevo sitemap
    const sitemap = await enhancedDynamicSitemapGenerator.generateSitemap();
    const stats = await enhancedDynamicSitemapGenerator.getSitemapStats();
    
    console.log('✅ Sitemap regenerado exitosamente');
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap regenerado exitosamente',
      stats: {
        totalUrls: stats.totalUrls,
        staticPages: stats.staticPages,
        productPages: stats.productPages,
        categoryPages: stats.categoryPages,
        fileSize: stats.fileSize,
        lastGenerated: stats.lastGenerated
      }
    });
    
  } catch (error) {
    console.error('❌ Error regenerando sitemap:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error regenerando sitemap',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}










