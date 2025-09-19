// ===================================
// PINTEYA E-COMMERCE - DYNAMIC SITEMAP API
// API para generar y servir sitemaps dinámicos
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedDynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET /api/sitemap - Generar y servir sitemap
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xml';
    const index = searchParams.get('index');

    logger.info(LogLevel.INFO, 'Sitemap API request', {
      format,
      index,
      userAgent: request.headers.get('user-agent')
    }, LogCategory.SEO);

    // Generar sitemap
    const sitemapUrls = await enhancedDynamicSitemapGenerator.generateSitemap();

    if (format === 'json') {
      // Retornar información del sitemap en JSON
      const stats = enhancedDynamicSitemapGenerator.getStats();
      return NextResponse.json({
        success: true,
        data: {
          sitemapUrls,
          stats,
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Retornar XML por defecto
    // En un entorno real, esto serviría el archivo XML generado
    const xmlContent = await generateSampleSitemapXML();

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'X-Sitemap-Generated': new Date().toISOString(),
        'X-Total-URLs': enhancedDynamicSitemapGenerator.getStats().totalUrls.toString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Sitemap API error', error as Error, LogCategory.SEO);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate sitemap',
      message: (error as Error).message
    }, { status: 500 });
  }
}

// ===================================
// POST /api/sitemap - Regenerar sitemap manualmente
// ===================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clearCache = false, config = {} } = body;

    logger.info(LogLevel.INFO, 'Manual sitemap regeneration requested', {
      clearCache,
      hasConfig: Object.keys(config).length > 0
    }, LogCategory.SEO);

    // Limpiar cache si se solicita
    if (clearCache) {
      await enhancedDynamicSitemapGenerator.clearCache();
    }

    // Aplicar configuración temporal si se proporciona
    if (Object.keys(config).length > 0) {
      enhancedDynamicSitemapGenerator.configure(config);
    }

    // Regenerar sitemap
    const sitemapUrls = await enhancedDynamicSitemapGenerator.generateSitemap();
    const stats = enhancedDynamicSitemapGenerator.getStats();
    const report = enhancedDynamicSitemapGenerator.generateReport();

    return NextResponse.json({
      success: true,
      data: {
        sitemapUrls,
        stats,
        report,
        regeneratedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Manual sitemap regeneration error', error as Error, LogCategory.SEO);

    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate sitemap',
      message: (error as Error).message
    }, { status: 500 });
  }
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Generar XML de ejemplo para demostración
 */
async function generateSampleSitemapXML(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinteya-ecommerce.vercel.app';
  const now = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/help</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <!-- Páginas dinámicas se generarían aquí -->
</urlset>`;
}









