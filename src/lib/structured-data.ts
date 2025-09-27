// Structured Data (JSON-LD) para SEO de Pinteya E-commerce

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pinteya E-commerce',
  alternateName: 'Pinteya',
  description: 'Pinturería online especializada en productos de pintura, ferretería y corralón',
  url: 'https://pinteya-ecommerce.vercel.app',
  logo: 'https://pinteya-ecommerce.vercel.app/images/logo/LOGO POSITIVO.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
  sameAs: ['https://pinteya-ecommerce.vercel.app'],
}

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Pinteya E-commerce',
  alternateName: 'Pinteya - Tu Pinturería Online',
  url: 'https://pinteya-ecommerce.vercel.app',
  description:
    'Pinturería online especializada en productos de pintura, ferretería y corralón. Marcas reconocidas y envío gratis.',
  publisher: {
    '@type': 'Organization',
    name: 'Pinteya E-commerce',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://pinteya-ecommerce.vercel.app/shop?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export const storeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Pinteya E-commerce',
  description: 'Pinturería online especializada en productos de pintura, ferretería y corralón',
  url: 'https://pinteya-ecommerce.vercel.app',
  logo: 'https://pinteya-ecommerce.vercel.app/images/logo/LOGO POSITIVO.svg',
  image: 'https://pinteya-ecommerce.vercel.app/images/hero/hero-bg.jpg',
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

export const breadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://pinteya-ecommerce.vercel.app${item.url}`,
  })),
})

export const productStructuredData = (product: {
  name: string
  description: string
  image: string
  price: number
  currency: string
  brand: string
  category: string
  availability: string
  condition: string
}) => ({
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
      name: 'Pinteya E-commerce',
    },
  },
})
