// ===================================
// TESTS - DYNAMIC SEO MANAGER
// Tests para el sistema de gestión dinámica de SEO
// ===================================

import { dynamicSEOManager, DynamicSEOManager, SITE_CONFIG } from '@/lib/seo/dynamic-seo-manager';
import type { ProductSEOData, CategorySEOData, PageSEOData } from '@/lib/seo/dynamic-seo-manager';

describe('DynamicSEOManager', () => {
  
  describe('Singleton Pattern', () => {
    test('mantiene una sola instancia', () => {
      const instance1 = DynamicSEOManager.getInstance();
      const instance2 = DynamicSEOManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(dynamicSEOManager);
    });
  });

  describe('Product Metadata Generation', () => {
    const mockProduct: ProductSEOData = {
      id: 'prod-1',
      name: 'Pintura Sherwin Williams Interior',
      description: 'Pintura de alta calidad para interiores con excelente cobertura y durabilidad.',
      price: 15000,
      currency: 'ARS',
      brand: 'Sherwin Williams',
      category: 'Pinturas',
      subcategory: 'Interior',
      images: ['/images/products/pintura1.jpg', '/images/products/pintura1-2.jpg'],
      availability: 'InStock',
      condition: 'NewCondition',
      sku: 'SW-INT-001',
      gtin: '1234567890123',
      mpn: 'SW-INT-001',
      slug: 'pintura-sherwin-williams-interior'
    };

    test('genera metadata completa para productos', async () => {
      const metadata = await dynamicSEOManager.generateProductMetadata(mockProduct);

      expect(metadata.title).toBe('Pintura Sherwin Williams Interior - Sherwin Williams | Pinteya E-commerce');
      expect(metadata.description).toContain('Compra Pintura Sherwin Williams Interior de Sherwin Williams en Pinteya');
      expect(metadata.keywords).toContain('pintura sherwin williams interior');
      expect(metadata.keywords).toContain('sherwin williams');
      expect(metadata.keywords).toContain('pinturas');
    });

    test('incluye Open Graph tags para productos', async () => {
      const metadata = await dynamicSEOManager.generateProductMetadata(mockProduct);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('Pintura Sherwin Williams Interior - Sherwin Williams | Pinteya E-commerce');
      expect(metadata.openGraph?.images).toHaveLength(1);
      expect(metadata.openGraph?.images?.[0].url).toBe('/images/products/pintura1.jpg');
      expect(metadata.openGraph?.images?.[0].alt).toBe('Pintura Sherwin Williams Interior');
    });

    test('incluye Twitter Cards para productos', async () => {
      const metadata = await dynamicSEOManager.generateProductMetadata(mockProduct);

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.images).toContain('/images/products/pintura1.jpg');
    });

    test('incluye canonical URL para productos', async () => {
      const metadata = await dynamicSEOManager.generateProductMetadata(mockProduct);

      expect(metadata.alternates?.canonical).toBe(`${SITE_CONFIG.url}/products/${mockProduct.slug}`);
    });

    test('incluye metadata específica de producto', async () => {
      const metadata = await dynamicSEOManager.generateProductMetadata(mockProduct);

      expect(metadata.other).toBeDefined();
      expect(metadata.other?.['product:price:amount']).toBe('15000');
      expect(metadata.other?.['product:price:currency']).toBe('ARS');
      expect(metadata.other?.['product:availability']).toBe('InStock');
      expect(metadata.other?.['product:condition']).toBe('NewCondition');
      expect(metadata.other?.['product:brand']).toBe('Sherwin Williams');
      expect(metadata.other?.['product:category']).toBe('Pinturas');
    });
  });

  describe('Category Metadata Generation', () => {
    const mockCategory: CategorySEOData = {
      id: 'cat-1',
      name: 'Pinturas',
      description: 'Amplia selección de pinturas para interior y exterior de las mejores marcas.',
      slug: 'pinturas',
      productCount: 150,
      image: '/images/categories/pinturas.jpg',
      subcategories: ['Interior', 'Exterior', 'Esmaltes']
    };

    test('genera metadata completa para categorías', () => {
      const metadata = dynamicSEOManager.generateCategoryMetadata(mockCategory);

      expect(metadata.title).toBe('Pinturas | Pinteya E-commerce - Tu Pinturería Online');
      expect(metadata.description).toContain('Descubre nuestra selección de pinturas en Pinteya');
      expect(metadata.description).toContain('150 productos disponibles');
      expect(metadata.keywords).toContain('pinturas');
      expect(metadata.keywords).toContain('pinturería online');
    });

    test('incluye canonical URL para categorías', () => {
      const metadata = dynamicSEOManager.generateCategoryMetadata(mockCategory);

      expect(metadata.alternates?.canonical).toBe(`${SITE_CONFIG.url}/categories/${mockCategory.slug}`);
    });

    test('incluye metadata específica de categoría', () => {
      const metadata = dynamicSEOManager.generateCategoryMetadata(mockCategory);

      expect(metadata.other).toBeDefined();
      expect(metadata.other?.['category:name']).toBe('Pinturas');
      expect(metadata.other?.['category:product_count']).toBe('150');
    });
  });

  describe('Page Metadata Generation', () => {
    const mockPage: PageSEOData = {
      path: '/checkout',
      title: 'Finalizar Compra',
      description: 'Completa tu compra de forma segura y rápida en Pinteya E-commerce.',
      type: 'checkout'
    };

    test('genera metadata para páginas generales', () => {
      const metadata = dynamicSEOManager.generatePageMetadata(mockPage);

      expect(metadata.title).toBe('Finalizar Compra | Pinteya E-commerce');
      expect(metadata.description).toBe('Completa tu compra de forma segura y rápida en Pinteya E-commerce.');
      expect(metadata.keywords).toContain('pinturería online');
    });

    test('configura robots correctamente para páginas privadas', () => {
      const metadata = dynamicSEOManager.generatePageMetadata(mockPage);

      expect(metadata.robots?.index).toBe(false); // checkout no debe indexarse
      expect(metadata.robots?.googleBot?.index).toBe(false);
    });

    test('configura robots correctamente para páginas públicas', () => {
      const publicPage: PageSEOData = {
        path: '/about',
        title: 'Acerca de Nosotros',
        description: 'Conoce más sobre Pinteya E-commerce.',
        type: 'page'
      };

      const metadata = dynamicSEOManager.generatePageMetadata(publicPage);

      expect(metadata.robots?.index).toBe(true);
      expect(metadata.robots?.googleBot?.index).toBe(true);
    });
  });

  describe('SEO Utilities', () => {
    test('optimiza títulos correctamente', () => {
      const longTitle = 'Este es un título muy largo que excede los 60 caracteres recomendados para SEO';
      const optimized = dynamicSEOManager.optimizeTitle(longTitle, 60);

      expect(optimized.length).toBeLessThanOrEqual(60);
      expect(optimized).toContain('...');
    });

    test('mantiene títulos cortos sin cambios', () => {
      const shortTitle = 'Título Corto';
      const optimized = dynamicSEOManager.optimizeTitle(shortTitle, 60);

      expect(optimized).toBe(shortTitle);
    });

    test('optimiza descripciones correctamente', () => {
      const longDescription = 'Esta es una descripción extremadamente larga que definitivamente excede los 160 caracteres recomendados para meta descriptions en SEO y necesita ser truncada apropiadamente para cumplir con las mejores prácticas de optimización.';
      const optimized = dynamicSEOManager.optimizeDescription(longDescription, 160);

      expect(optimized.length).toBeLessThanOrEqual(160);
      expect(optimized).toContain('...');
    });

    test('genera slugs SEO-friendly', () => {
      const text = 'Pintura Sherwin Williams - Interior & Exterior (Premium)';
      const slug = dynamicSEOManager.generateSlug(text);

      expect(slug).toBe('pintura-sherwin-williams-interior-exterior-premium');
      expect(slug).not.toContain(' ');
      expect(slug).not.toContain('&');
      expect(slug).not.toContain('(');
      expect(slug).not.toContain(')');
    });

    test('maneja acentos en slugs', () => {
      const text = 'Categoría de Pinturas Acrílicas';
      const slug = dynamicSEOManager.generateSlug(text);

      expect(slug).toBe('categoria-de-pinturas-acrilicas');
      expect(slug).not.toContain('í');
      expect(slug).not.toContain('á');
    });

    test('extrae keywords relevantes del texto', () => {
      const text = 'Pintura de alta calidad para interiores y exteriores. Excelente cobertura y durabilidad. Ideal para proyectos profesionales.';
      const keywords = dynamicSEOManager.extractKeywords(text, 5);

      expect(keywords).toHaveLength(5);
      expect(keywords).toContain('pintura');
      expect(keywords).toContain('calidad');
      expect(keywords).not.toContain('para'); // stop word
      expect(keywords).not.toContain('de'); // stop word
    });
  });

  describe('SEO Validation', () => {
    test('valida configuración SEO correcta', () => {
      const validConfig = {
        title: 'Título válido',
        description: 'Descripción válida para SEO',
        keywords: ['keyword1', 'keyword2', 'keyword3']
      };

      const validation = dynamicSEOManager.validateSEOConfig(validConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('detecta título faltante', () => {
      const invalidConfig = {
        title: '',
        description: 'Descripción válida',
        keywords: ['keyword1']
      };

      const validation = dynamicSEOManager.validateSEOConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El título es requerido');
    });

    test('detecta título muy largo', () => {
      const invalidConfig = {
        title: 'Este es un título extremadamente largo que excede los 60 caracteres recomendados',
        description: 'Descripción válida',
        keywords: ['keyword1']
      };

      const validation = dynamicSEOManager.validateSEOConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El título no debe exceder 60 caracteres');
    });

    test('detecta descripción muy larga', () => {
      const invalidConfig = {
        title: 'Título válido',
        description: 'Esta es una descripción extremadamente larga que excede los 160 caracteres recomendados para meta descriptions y debería ser detectada como inválida por el validador',
        keywords: ['keyword1']
      };

      const validation = dynamicSEOManager.validateSEOConfig(invalidConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('La descripción no debe exceder 160 caracteres');
    });
  });
});
