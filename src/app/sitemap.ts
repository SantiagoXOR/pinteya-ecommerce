import { MetadataRoute } from 'next'

/**
 * Genera el sitemap dinámico de la aplicación
 * Se ejecuta durante build time
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinteya.com.ar'
  
  try {
    // URLs estáticas principales
    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/productos`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/cart`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/checkout`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ]

    // URLs dinámicas de productos (solo si no estamos en build time)
    let productRoutes: MetadataRoute.Sitemap = []
    
    // Durante build, solo generamos URLs estáticas para evitar sobrecarga
    // Las páginas de productos se generarán bajo demanda con ISR
    if (process.env.NODE_ENV !== 'production' || process.env.GENERATE_SITEMAP_PRODUCTS === 'true') {
      try {
        // TODO: Si quieres incluir productos específicos en el sitemap,
        // descomentar y adaptar esta sección con tu API
        /*
        const response = await fetch(`${baseUrl}/api/products?limit=100`)
        const { data: products } = await response.json()
        
        productRoutes = products.map((product: any) => ({
          url: `${baseUrl}/productos/${product.id}`,
          lastModified: new Date(product.updated_at || product.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
        */
      } catch (error) {
        console.warn('[Sitemap] No se pudieron cargar productos dinámicos:', error)
      }
    }

    return [...staticRoutes, ...productRoutes]
    
  } catch (error) {
    console.error('[Sitemap] Error generando sitemap:', error)
    
    // Retornar sitemap mínimo en caso de error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}

