// ===================================
// PINTEYA E-COMMERCE - DYNAMIC SITEMAP.XML ROUTE
// Ruta para servir sitemap.xml dinámico que reemplaza el estático
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { enhancedDynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator'
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger'
import { getSupabaseClient } from '@/lib/integrations/supabase'

// ===================================
// GET /sitemap.xml - Servir sitemap dinámico
// ===================================

// ⚡ FIX VERCEL: Marcar como dinámico para permitir acceso a headers en runtime
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ⚡ FIX VERCEL: Solo acceder a headers si están disponibles (no durante build)
    // Esto evita el error "Dynamic server usage: Route /sitemap.xml couldn't be rendered statically"
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined

    // Solo loguear si estamos en runtime (no durante build)
    if (userAgent || referer) {
      logger.info(
        LogLevel.INFO,
        'Dynamic sitemap.xml requested',
        {
          userAgent,
          referer,
        },
        LogCategory.SEO
      )
    }

    // Generar sitemap XML completo
    const xmlContent = await generateCompleteSitemapXML()

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache por 1 hora
        'X-Sitemap-Type': 'dynamic',
        'X-Generated-At': new Date().toISOString(),
        'X-Robots-Tag': 'noindex', // Los sitemaps no deben indexarse
      },
    })
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Dynamic sitemap.xml generation error',
      error as Error,
      LogCategory.SEO
    )

    // Fallback a sitemap básico en caso de error
    const fallbackXML = generateFallbackSitemap()

    return new NextResponse(fallbackXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache más corto para fallback
        'X-Sitemap-Type': 'fallback',
        'X-Error': 'true',
      },
    })
  }
}

// ===================================
// GENERACIÓN DE SITEMAP COMPLETO
// ===================================

async function generateCompleteSitemapXML(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinteya-ecommerce.vercel.app'
  const now = new Date().toISOString().split('T')[0]

  // Obtener datos dinámicos
  const [products, categories] = await Promise.all([
    getProductsForSitemap(),
    getCategoriesForSitemap(),
  ])

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
  const urlsetOpen =
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

  let urls = ''

  // Páginas estáticas principales
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/shop', priority: '0.9', changefreq: 'daily' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/help', priority: '0.6', changefreq: 'monthly' },
    { url: '/search', priority: '0.5', changefreq: 'weekly' },
  ]

  staticPages.forEach(page => {
    urls += `  <url>\n`
    urls += `    <loc>${baseUrl}${page.url}</loc>\n`
    urls += `    <lastmod>${now}</lastmod>\n`
    urls += `    <changefreq>${page.changefreq}</changefreq>\n`
    urls += `    <priority>${page.priority}</priority>\n`
    urls += `  </url>\n`
  })

  // Páginas de categorías
  categories.forEach(category => {
    urls += `  <url>\n`
    urls += `    <loc>${baseUrl}/shop?category=${category.slug}</loc>\n`
    urls += `    <lastmod>${category.updated_at || now}</lastmod>\n`
    urls += `    <changefreq>weekly</changefreq>\n`
    urls += `    <priority>0.8</priority>\n`

    // Agregar imagen de categoría si existe
    if (category.image) {
      urls += `    <image:image>\n`
      urls += `      <image:loc>${baseUrl}${category.image}</image:loc>\n`
      urls += `      <image:caption>${escapeXml(category.name)}</image:caption>\n`
      urls += `      <image:title>${escapeXml(category.name)}</image:title>\n`
      urls += `    </image:image>\n`
    }

    urls += `  </url>\n`
  })

  // Páginas de productos (limitamos a los más recientes para evitar sitemaps muy grandes)
  products.slice(0, 1000).forEach(product => {
    urls += `  <url>\n`
    urls += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`
    urls += `    <lastmod>${product.updated_at || now}</lastmod>\n`
    urls += `    <changefreq>weekly</changefreq>\n`
    urls += `    <priority>0.7</priority>\n`

    // Agregar imágenes del producto (máximo 3)
    if (product.images && Array.isArray(product.images)) {
      product.images.slice(0, 3).forEach((image: string) => {
        if (image) {
          urls += `    <image:image>\n`
          urls += `      <image:loc>${baseUrl}${image}</image:loc>\n`
          urls += `      <image:caption>${escapeXml(product.name)}</image:caption>\n`
          urls += `      <image:title>${escapeXml(product.name)}</image:title>\n`
          urls += `    </image:image>\n`
        }
      })
    }

    urls += `  </url>\n`
  })

  const urlsetClose = '</urlset>'

  const finalXML = xmlHeader + urlsetOpen + urls + urlsetClose

  // Log estadísticas
  logger.info(
    LogLevel.INFO,
    'Dynamic sitemap.xml generated',
    {
      totalUrls: staticPages.length + categories.length + Math.min(products.length, 1000),
      staticPages: staticPages.length,
      categories: categories.length,
      products: Math.min(products.length, 1000),
      sizeKB: Math.round(Buffer.byteLength(finalXML, 'utf8') / 1024),
    },
    LogCategory.SEO
  )

  return finalXML
}

// ===================================
// OBTENER DATOS DE LA BASE DE DATOS
// ===================================

async function getProductsForSitemap() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return []
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('slug, name, updated_at, images')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1000) // Limitar para performance

    if (error) {
      logger.warn(LogLevel.WARN, 'Error fetching products for sitemap', {}, LogCategory.SEO)
      return []
    }

    return products || []
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error in getProductsForSitemap', error as Error, LogCategory.SEO)
    return []
  }
}

async function getCategoriesForSitemap() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return []
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('slug, name, updated_at, image')
      .order('name')

    if (error) {
      logger.warn(LogLevel.WARN, 'Error fetching categories for sitemap', {}, LogCategory.SEO)
      return []
    }

    return categories || []
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Error in getCategoriesForSitemap',
      error as Error,
      LogCategory.SEO
    )
    return []
  }
}

// ===================================
// UTILIDADES
// ===================================

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateFallbackSitemap(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinteya-ecommerce.vercel.app'
  const now = new Date().toISOString().split('T')[0]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
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
</urlset>`
}
