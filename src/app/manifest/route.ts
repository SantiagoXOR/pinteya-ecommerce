// =====================================================
// MANIFEST.JSON DINÁMICO POR TENANT
// =====================================================
// Descripción: Genera manifest.json dinámico basado en el tenant actual
//              Permite instalar múltiples PWAs (una por tenant)
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getTenantPublicConfig } from '@/lib/tenant/tenant-service'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Obtener configuración del tenant actual
    const tenant = await getTenantPublicConfig()
    
    // Construir URLs de iconos usando getTenantAssetPath - TODOS los iconos deben ser del tenant
    const faviconSvg = getTenantAssetPath(tenant, 'favicon.svg', '/favicon.svg')
    const faviconPng = getTenantAssetPath(tenant, 'favicon.png', '/favicon.png')
    
    // Iconos específicos del tenant desde Supabase Storage
    // Si no existen, usar el favicon.svg como fallback (los navegadores lo escalarán)
    const icon192 = getTenantAssetPath(tenant, 'favicon-192x192.png', faviconSvg)
    const icon512 = getTenantAssetPath(tenant, 'favicon-512x512.png', faviconSvg)
    const appleIcon = getTenantAssetPath(tenant, 'apple-touch-icon.png', '/apple-touch-icon.png')
    
    // Manifest dinámico basado en el tenant
    const manifest = {
      name: `${tenant.name} E-commerce`,
      short_name: tenant.name,
      description: tenant.siteDescription || `Sistema completo especializado en productos de pinturería, ferretería y corralón - ${tenant.name}`,
      start_url: '/',
      display: 'standalone',
      background_color: tenant.primaryColor || '#ea5a17',
      theme_color: tenant.primaryColor || '#ea5a17',
      orientation: 'portrait-primary',
      // ⚡ MULTITENANT: ID único por tenant para permitir múltiples instalaciones
      id: `/${tenant.slug}/`,
      scope: '/',
      lang: tenant.locale || 'es-AR',
      dir: 'ltr',
      categories: ['shopping', 'business'],
      prefer_related_applications: false,
      icons: [
        // Favicon SVG (principal) - PRIORIZAR SVG para mejor calidad vectorial
        {
          src: faviconSvg,
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable any'
        },
        // Icono 192x192 - usar SVG si está disponible, sino PNG
        {
          src: icon192,
          sizes: '192x192',
          type: icon192.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'maskable any'
        },
        // Icono 512x512 - usar SVG si está disponible, sino PNG
        {
          src: icon512,
          sizes: '512x512',
          type: icon512.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'maskable any'
        },
        // Favicon PNG solo si existe y es diferente al SVG (fallback)
        ...(faviconPng && faviconPng !== faviconSvg ? [{
          src: faviconPng,
          sizes: 'any',
          type: 'image/png',
          purpose: 'maskable any'
        }] : []),
        // Apple touch icon del tenant
        {
          src: appleIcon,
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    }

    // Retornar como JSON con headers apropiados
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[Manifest] Error generando manifest:', error)
    
    // Fallback a manifest por defecto si hay error
    const fallbackManifest = {
      name: 'E-commerce',
      short_name: 'E-commerce',
      description: 'Sistema completo especializado en productos de pinturería, ferretería y corralón',
      start_url: '/',
      display: 'standalone',
      background_color: '#ea5a17',
      theme_color: '#ea5a17',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable any'
        }
      ]
    }
    
    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache',
      },
      status: 500,
    })
  }
}
