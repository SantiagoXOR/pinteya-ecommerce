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
    
    // Construir URLs de iconos usando getTenantAssetPath
    const faviconSvg = getTenantAssetPath(tenant, 'favicon.svg', '/favicon.svg')
    const faviconPng = getTenantAssetPath(tenant, 'favicon.png', '/favicon.png')
    
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
        {
          src: faviconSvg,
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable any'
        },
        {
          src: faviconPng || faviconSvg,
          sizes: 'any',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/apple-touch-icon.png',
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
