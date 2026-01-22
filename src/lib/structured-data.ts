// Structured Data (JSON-LD) para SEO - Soporte Multitenant

import type { TenantPublicConfig } from '@/lib/tenant/types'

// ===================================
// TIPOS
// ===================================

interface TenantStructuredDataConfig {
  name: string
  slug: string
  description: string
  baseUrl: string
  logoUrl: string
  contactCity?: string
  contactProvince?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

// ===================================
// FUNCIONES DINÁMICAS PARA TENANT
// ===================================

/**
 * Genera los datos estructurados de organización para un tenant
 */
export const getTenantOrganizationData = (tenant: TenantStructuredDataConfig) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: tenant.name,
  alternateName: tenant.name,
  description: tenant.description,
  url: tenant.baseUrl,
  logo: `${tenant.baseUrl}${tenant.logoUrl}`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
  sameAs: [
    tenant.baseUrl,
    ...(tenant.socialLinks?.facebook ? [tenant.socialLinks.facebook] : []),
    ...(tenant.socialLinks?.instagram ? [tenant.socialLinks.instagram] : []),
    ...(tenant.socialLinks?.twitter ? [tenant.socialLinks.twitter] : []),
  ].filter(Boolean),
})

/**
 * Genera los datos estructurados del sitio web para un tenant
 */
export const getTenantWebsiteData = (tenant: TenantStructuredDataConfig) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: tenant.name,
  alternateName: `${tenant.name} - E-commerce`,
  url: tenant.baseUrl,
  description: tenant.description,
  publisher: {
    '@type': 'Organization',
    name: tenant.name,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${tenant.baseUrl}/shop?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

/**
 * Genera los datos estructurados de tienda para un tenant
 */
export const getTenantStoreData = (tenant: TenantStructuredDataConfig) => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: tenant.name,
  description: tenant.description,
  url: tenant.baseUrl,
  logo: `${tenant.baseUrl}${tenant.logoUrl}`,
  image: `${tenant.baseUrl}/tenants/${tenant.slug}/hero/hero1.webp`,
  priceRange: '$$$',
  paymentAccepted: ['Credit Card', 'Debit Card', 'MercadoPago'],
  currenciesAccepted: 'ARS',
  openingHours: 'Mo-Su 00:00-23:59',
  ...(tenant.contactCity && tenant.contactProvince && {
    address: {
      '@type': 'PostalAddress',
      addressLocality: tenant.contactCity,
      addressRegion: tenant.contactProvince,
      addressCountry: 'AR',
    },
  }),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Productos de Pinturería',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Pinturas',
          category: 'Pinturas y Recubrimientos',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Herramientas',
          category: 'Herramientas de Pintura',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Accesorios',
          category: 'Accesorios de Pintura',
        },
      },
    ],
  },
})

/**
 * Genera todos los datos estructurados para un tenant
 * @param tenant - Configuración del tenant o TenantPublicConfig
 * @returns Objeto con organization, website y store structured data
 */
export const getTenantStructuredData = (
  tenant: TenantPublicConfig | TenantStructuredDataConfig
) => {
  // Normalizar la configuración del tenant
  const config: TenantStructuredDataConfig = 'siteDescription' in tenant 
    ? {
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.siteDescription || `${tenant.name} - E-commerce`,
        baseUrl: tenant.customDomain 
          ? `https://${tenant.customDomain}` 
          : `https://${tenant.subdomain}.pinteya.com`,
        logoUrl: tenant.logoUrl || `/tenants/${tenant.slug}/logo.svg`,
        contactCity: tenant.contactCity,
        contactProvince: tenant.contactProvince,
        socialLinks: tenant.socialLinks,
      }
    : tenant

  return {
    organization: getTenantOrganizationData(config),
    website: getTenantWebsiteData(config),
    store: getTenantStoreData(config),
  }
}

// ===================================
// DATOS ESTÁTICOS (FALLBACK/LEGACY)
// ===================================

// Fallback URL base para cuando no hay tenant
// Prioridad: SITE_URL env > APP_URL env > dominio por defecto
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya.com'

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pinteya E-commerce',
  alternateName: 'Pinteya',
  description: 'Pinturería online especializada en productos de pintura, ferretería y corralón',
  url: DEFAULT_BASE_URL,
  logo: `${DEFAULT_BASE_URL}/tenants/pinteya/logo.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
  sameAs: [DEFAULT_BASE_URL],
}

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Pinteya E-commerce',
  alternateName: 'Pinteya - Tu Pinturería Online',
  url: DEFAULT_BASE_URL,
  description:
    'Pinturería online especializada en productos de pintura, ferretería y corralón. Marcas reconocidas y envío gratis.',
  publisher: {
    '@type': 'Organization',
    name: 'Pinteya E-commerce',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${DEFAULT_BASE_URL}/shop?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const storeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Pinteya E-commerce',
  description: 'Pinturería online especializada en productos de pintura, ferretería y corralón',
  url: DEFAULT_BASE_URL,
  logo: `${DEFAULT_BASE_URL}/tenants/pinteya/logo.svg`,
  image: `${DEFAULT_BASE_URL}/tenants/pinteya/hero/hero1.webp`,
  priceRange: '$$$',
  paymentAccepted: ['Credit Card', 'Debit Card', 'MercadoPago'],
  currenciesAccepted: 'ARS',
  openingHours: 'Mo-Su 00:00-23:59',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Productos de Pinturería',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Pinturas',
          category: 'Pinturas y Recubrimientos',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Herramientas',
          category: 'Herramientas de Pintura',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Accesorios',
          category: 'Accesorios de Pintura',
        },
      },
    ],
  },
}

export const breadcrumbStructuredData = (
  items: Array<{ name: string; url: string }>,
  baseUrl: string = DEFAULT_BASE_URL
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseUrl}${item.url}`,
  })),
})

export const productStructuredData = (
  product: {
    name: string
    description: string
    image: string
    price: number
    currency: string
    brand: string
    category: string
    availability: string
    condition: string
  },
  sellerName: string = 'Pinteya E-commerce'
) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image,
  brand: {
    '@type': 'Brand',
    name: product.brand,
  },
  category: product.category,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency,
    availability: `https://schema.org/${product.availability}`,
    itemCondition: `https://schema.org/${product.condition}`,
    seller: {
      '@type': 'Organization',
      name: sellerName,
    },
  },
})
