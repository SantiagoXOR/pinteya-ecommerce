// ===================================
// PINTEYA E-COMMERCE - ADVANCED SCHEMA MARKUP - ENHANCED
// Sistema avanzado de structured data para SEO con soporte completo
// Incluye BreadcrumbList, FAQ, Review, LocalBusiness, Organization y más
// ===================================

import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';
import { getRedisClient } from '@/lib/integrations/redis';

import type { ProductSEOData, CategorySEOData } from './dynamic-seo-manager';

// ===================================
// INTERFACES Y TIPOS AVANZADOS
// ===================================

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface FAQItem {
  question: string;
  answer: string;
  acceptedAnswer?: {
    text: string;
    author?: string;
    dateCreated?: string;
  };
}

export interface ReviewData {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
  worstRating?: number;
  bestRating?: number;
  ratingValue?: number;
  reviewAspect?: string;
  pros?: string[];
  cons?: string[];
}

export interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface LocalBusinessData {
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone: string;
  email: string;
  openingHours: string[];
  priceRange: string;
  paymentAccepted: string[];
  geo?: {
    latitude: number;
    longitude: number;
  };
  url?: string;
  logo?: string;
  image?: string[];
  sameAs?: string[];
}

export interface ArticleData {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image: string;
  publisher: string;
  wordCount: number;
  articleSection?: string;
  keywords?: string[];
  mainEntityOfPage?: string;
}

export interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint: {
    telephone: string;
    contactType: string;
    email?: string;
    availableLanguage?: string[];
  };
  address?: LocalBusinessData['address'];
  sameAs?: string[];
  foundingDate?: string;
  numberOfEmployees?: string;
}

export interface WebSiteData {
  name: string;
  url: string;
  description: string;
  publisher: OrganizationData;
  potentialAction?: {
    target: string;
    queryInput: string;
  };
  sameAs?: string[];
}

export interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: LocalBusinessData['address'];
  };
  organizer: OrganizationData;
  offers?: {
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  image?: string;
  performer?: string;
}

export interface VideoData {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl: string;
  embedUrl?: string;
  publisher: OrganizationData;
  interactionStatistic?: {
    interactionType: string;
    userInteractionCount: number;
  }[];
}

export interface JobPostingData {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType: string;
  hiringOrganization: OrganizationData;
  jobLocation: {
    address: LocalBusinessData['address'];
  };
  baseSalary?: {
    currency: string;
    value: {
      minValue: number;
      maxValue: number;
      unitText: string;
    };
  };
  qualifications?: string[];
  responsibilities?: string[];
  skills?: string[];
}

export interface CourseData {
  name: string;
  description: string;
  provider: OrganizationData;
  courseCode?: string;
  hasCourseInstance?: {
    courseMode: string;
    startDate: string;
    endDate?: string;
    instructor: string;
  }[];
  offers?: {
    price: number;
    priceCurrency: string;
    category: string;
  };
  aggregateRating?: AggregateRating;
}

export interface RecipeData {
  name: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  recipeYield: string;
  recipeCategory: string;
  recipeCuisine: string;
  recipeIngredient: string[];
  recipeInstructions: Array<{
    text: string;
    name?: string;
    url?: string;
    image?: string;
  }>;
  nutrition?: {
    calories: string;
    fatContent?: string;
    carbohydrateContent?: string;
    proteinContent?: string;
  };
  aggregateRating?: AggregateRating;
}

export interface SoftwareApplicationData {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    price: number;
    priceCurrency: string;
  };
  aggregateRating?: AggregateRating;
  screenshot?: string[];
  softwareVersion?: string;
  fileSize?: string;
  downloadUrl?: string;
  installUrl?: string;
  permissions?: string[];
}

// Configuración del schema markup
export interface SchemaConfig {
  baseUrl: string;
  siteName: string;
  organization: OrganizationData;
  defaultImage: string;
  enableCache: boolean;
  cacheTTL: number;
  enableValidation: boolean;
  enableAnalytics: boolean;
}

// ===================================
// CONFIGURACIÓN POR DEFECTO
// ===================================

const DEFAULT_SCHEMA_CONFIG: SchemaConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya-ecommerce.vercel.app',
  siteName: 'Pinteya E-commerce',
  organization: {
    name: 'Pinteya E-commerce',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya-ecommerce.vercel.app',
    logo: '/images/logo/LOGO POSITIVO.svg',
    description: 'Tu pinturería online especializada en productos de pintura, ferretería y corralón',
    contactPoint: {
      telephone: '+54-11-1234-5678',
      contactType: 'customer service',
      email: 'contacto@pinteya.com',
      availableLanguage: ['Spanish', 'English']
    },
    address: {
      streetAddress: 'Av. Corrientes 1234',
      addressLocality: 'Buenos Aires',
      addressRegion: 'CABA',
      postalCode: '1043',
      addressCountry: 'AR'
    },
    sameAs: [
      'https://www.facebook.com/pinteya',
      'https://www.instagram.com/pinteya',
      'https://twitter.com/pinteya'
    ],
    foundingDate: '2020-01-01',
    numberOfEmployees: '10-50'
  },
  defaultImage: '/images/hero/hero-bg.jpg',
  enableCache: true,
  cacheTTL: 3600,
  enableValidation: true,
  enableAnalytics: true
};

// ===================================
// ENHANCED ADVANCED SCHEMA MARKUP CLASS
// ===================================

export class EnhancedAdvancedSchemaMarkup {
  private static instance: EnhancedAdvancedSchemaMarkup;
  private config: SchemaConfig;
  private cache: Map<string, { schema: any; timestamp: number }>;
  private redis: any;

  private constructor(config?: Partial<SchemaConfig>) {
    this.config = { ...DEFAULT_SCHEMA_CONFIG, ...config };
    this.cache = new Map();
    this.initializeRedis();

    logger.info(LogLevel.INFO, 'Enhanced Advanced Schema Markup initialized', {
      baseUrl: this.config.baseUrl,
      cacheEnabled: this.config.enableCache
    }, LogCategory.SEO);
  }

  public static getInstance(config?: Partial<SchemaConfig>): EnhancedAdvancedSchemaMarkup {
    if (!EnhancedAdvancedSchemaMarkup.instance) {
      EnhancedAdvancedSchemaMarkup.instance = new EnhancedAdvancedSchemaMarkup(config);
    }
    return EnhancedAdvancedSchemaMarkup.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisClient();
      logger.info(LogLevel.INFO, 'Redis initialized for schema caching', {}, LogCategory.SEO);
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Redis not available for schema caching', {}, LogCategory.SEO);
    }
  }

  // ===================================
  // SCHEMAS BÁSICOS MEJORADOS
  // ===================================

  public async generateBreadcrumbSchema(items: BreadcrumbItem[]): Promise<any> {
    const cacheKey = `breadcrumb:${JSON.stringify(items)}`;

    if (this.config.enableCache) {
      const cached = await this.getCachedSchema(cacheKey);
      if (cached) {return cached;}
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": {
          "@type": "WebPage",
          "@id": `${this.config.baseUrl}${item.url}`,
          "name": item.name,
          "url": `${this.config.baseUrl}${item.url}`
        }
      }))
    };

    if (this.config.enableCache) {
      await this.setCachedSchema(cacheKey, schema);
    }

    logger.info(LogLevel.INFO, 'Breadcrumb schema generated', {
      itemsCount: items.length,
      cacheKey
    }, LogCategory.SEO);

    return schema;
  }

  public async generateFAQSchema(faqs: FAQItem[]): Promise<any> {
    const cacheKey = `faq:${JSON.stringify(faqs)}`;

    if (this.config.enableCache) {
      const cached = await this.getCachedSchema(cacheKey);
      if (cached) {return cached;}
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.acceptedAnswer?.text || faq.answer,
          ...(faq.acceptedAnswer?.author && {
            "author": {
              "@type": "Person",
              "name": faq.acceptedAnswer.author
            }
          }),
          ...(faq.acceptedAnswer?.dateCreated && {
            "dateCreated": faq.acceptedAnswer.dateCreated
          })
        }
      }))
    };

    if (this.config.enableCache) {
      await this.setCachedSchema(cacheKey, schema);
    }

    logger.info(LogLevel.INFO, 'FAQ schema generated', {
      faqsCount: faqs.length,
      cacheKey
    }, LogCategory.SEO);

    return schema;
  }

  // ===================================
  // SCHEMAS DE PRODUCTOS Y CATEGORÍAS
  // ===================================

  public async generateProductSchema(
    product: ProductSEOData,
    reviews?: ReviewData[],
    aggregateRating?: AggregateRating
  ): Promise<any> {
    const cacheKey = `product:${product.id}:${reviews?.length || 0}`;

    if (this.config.enableCache) {
      const cached = await this.getCachedSchema(cacheKey);
      if (cached) {return cached;}
    }

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.images.map(img => `${this.config.baseUrl}${img}`),
      "brand": {
        "@type": "Brand",
        "name": product.brand
      },
      "category": product.category,
      "sku": product.sku,
      "gtin": product.gtin,
      "mpn": product.mpn,
      "url": `${this.config.baseUrl}/products/${product.slug}`,
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": product.currency,
        "availability": `https://schema.org/${product.availability}`,
        "itemCondition": `https://schema.org/${product.condition}`,
        "url": `${this.config.baseUrl}/products/${product.slug}`,
        "seller": {
          "@type": "Organization",
          "name": this.config.organization.name,
          "url": this.config.baseUrl
        },
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": product.currency
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 2,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 3,
              "maxValue": 7,
              "unitCode": "DAY"
            }
          }
        }
      },
      "manufacturer": {
        "@type": "Organization",
        "name": product.brand
      }
    };

    // Agregar subcategoría si existe
    if (product.subcategory) {
      schema.additionalProperty = {
        "@type": "PropertyValue",
        "name": "Subcategoría",
        "value": product.subcategory
      };
    }

    // Agregar aggregate rating si está disponible
    if (aggregateRating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": aggregateRating.ratingValue,
        "reviewCount": aggregateRating.reviewCount,
        "bestRating": aggregateRating.bestRating || 5,
        "worstRating": aggregateRating.worstRating || 1
      };
    }

    // Agregar reviews individuales si están disponibles
    if (reviews && reviews.length > 0) {
      // Si no hay aggregate rating, calcularlo
      if (!aggregateRating) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        schema.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": Number(averageRating.toFixed(1)),
          "reviewCount": reviews.length,
          "bestRating": 5,
          "worstRating": 1
        };
      }

      schema.review = reviews.map(review => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": review.author
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": review.bestRating || 5,
          "worstRating": review.worstRating || 1
        },
        "reviewBody": review.reviewBody,
        "datePublished": review.datePublished,
        ...(review.reviewAspect && { "reviewAspect": review.reviewAspect }),
        ...(review.pros && review.pros.length > 0 && {
          "positiveNotes": review.pros.join(", ")
        }),
        ...(review.cons && review.cons.length > 0 && {
          "negativeNotes": review.cons.join(", ")
        })
      }));
    }

    if (this.config.enableCache) {
      await this.setCachedSchema(cacheKey, schema);
    }

    logger.info(LogLevel.INFO, 'Product schema generated', {
      productId: product.id,
      reviewsCount: reviews?.length || 0,
      hasAggregateRating: !!aggregateRating,
      cacheKey
    }, LogCategory.SEO);

    return schema;
  }

  // Schema para Category/CollectionPage
  generateCategorySchema(category: CategorySEOData, products?: ProductSEOData[]) {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category.name,
      "description": category.description,
      "url": `${this.baseUrl}/categories/${category.slug}`,
      "mainEntity": {
        "@type": "ItemList",
        "name": category.name,
        "description": category.description,
        "numberOfItems": category.productCount
      }
    };

    // Agregar productos si están disponibles
    if (products && products.length > 0) {
      schema.mainEntity.itemListElement = products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "url": `${this.baseUrl}/products/${product.slug}`,
          "image": product.images[0] ? `${this.baseUrl}${product.images[0]}` : undefined,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": product.currency,
            "availability": `https://schema.org/${product.availability}`
          }
        }
      }));
    }

    return schema;
  }

  // Schema para FAQ
  generateFAQSchema(faqs: FAQItem[]) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  // Schema para LocalBusiness
  generateLocalBusinessSchema(business: LocalBusinessData) {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": business.address.streetAddress,
        "addressLocality": business.address.addressLocality,
        "addressRegion": business.address.addressRegion,
        "postalCode": business.address.postalCode,
        "addressCountry": business.address.addressCountry
      },
      "telephone": business.telephone,
      "email": business.email,
      "url": this.baseUrl,
      "openingHours": business.openingHours,
      "priceRange": business.priceRange,
      "paymentAccepted": business.paymentAccepted,
      "currenciesAccepted": "ARS"
    };
  }

  // Schema para Article/BlogPost
  generateArticleSchema(article: ArticleData) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.headline,
      "description": article.description,
      "image": `${this.baseUrl}${article.image}`,
      "author": {
        "@type": "Person",
        "name": article.author
      },
      "publisher": {
        "@type": "Organization",
        "name": article.publisher,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.baseUrl}/images/logo/LOGO POSITIVO.svg`
        }
      },
      "datePublished": article.datePublished,
      "dateModified": article.dateModified,
      "wordCount": article.wordCount,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": this.baseUrl
      }
    };
  }

  // Schema para SearchAction
  generateSearchActionSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": this.baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.baseUrl}/shop?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  // Schema para Organization con información completa
  generateOrganizationSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Pinteya E-commerce",
      "alternateName": "Pinteya",
      "description": "Tu pinturería online especializada en productos de pintura, ferretería y corralón",
      "url": this.baseUrl,
      "logo": `${this.baseUrl}/images/logo/LOGO POSITIVO.svg`,
      "image": `${this.baseUrl}/images/hero/hero-bg.jpg`,
      "foundingDate": "2024",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Spanish",
          "areaServed": "AR"
        }
      ],
      "sameAs": [
        this.baseUrl
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Productos de Pinturería",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Pinturas",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Pinturas de Interior y Exterior"
                }
              }
            ]
          },
          {
            "@type": "OfferCatalog",
            "name": "Herramientas",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Herramientas de Pintura y Construcción"
                }
              }
            ]
          }
        ]
      }
    };
  }

  // Schema para WebPage genérico
  generateWebPageSchema(title: string, description: string, url: string) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": `${this.baseUrl}${url}`,
      "isPartOf": {
        "@type": "WebSite",
        "name": "Pinteya E-commerce",
        "url": this.baseUrl
      },
      "inLanguage": "es-AR",
      "potentialAction": {
        "@type": "ReadAction",
        "target": `${this.baseUrl}${url}`
      }
    };
  }

  // Combinar múltiples schemas
  combineSchemas(...schemas: object[]): object[] {
    return schemas.filter(schema => schema !== null && schema !== undefined);
  }

  // Validar schema JSON-LD
  validateSchema(schema: object): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Verificar estructura básica
      if (!schema || typeof schema !== 'object') {
        errors.push('Schema debe ser un objeto válido');
        return { isValid: false, errors };
      }

      const schemaObj = schema as any;

      // Verificar @context
      if (!schemaObj['@context']) {
        errors.push('Schema debe incluir @context');
      } else if (schemaObj['@context'] !== 'https://schema.org') {
        errors.push('@context debe ser "https://schema.org"');
      }

      // Verificar @type
      if (!schemaObj['@type']) {
        errors.push('Schema debe incluir @type');
      }

      // Verificar que se pueda serializar a JSON
      JSON.stringify(schema);

    } catch (error) {
      errors.push(`Error de serialización JSON: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Exportar instancia singleton
export const advancedSchemaMarkup = AdvancedSchemaMarkup.getInstance();

// Exportar clase y tipos
export { AdvancedSchemaMarkup };









