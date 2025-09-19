// ===================================
// PINTEYA E-COMMERCE - ASSET OPTIMIZER TESTS
// ===================================

import { AssetOptimizer, assetOptimizer, ASSET_CONFIGS, AssetUtils } from '@/lib/asset-optimizer';

// Mock logger
jest.mock('@/lib/enterprise/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
  },
}));

// Mock DOM para tests de browser
const mockDocument = {
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn(),
  },
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
};

const mockWindow = {
  IntersectionObserver: jest.fn(),
  document: mockDocument,
};

// Solo mockear si no existe
if (typeof global.document === 'undefined') {
  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
  });
}

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
}

describe('AssetOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AssetOptimizer.getInstance();
      const instance2 = AssetOptimizer.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(assetOptimizer);
    });
  });

  describe('optimizeImageUrl', () => {
    it('should optimize Supabase image URLs', () => {
      const originalUrl = 'https://abc.supabase.co/storage/v1/object/public/images/test.jpg';
      const config = ASSET_CONFIGS.PRODUCT_IMAGES;
      
      const optimized = assetOptimizer.optimizeImageUrl(originalUrl, config);
      
      expect(optimized).toContain('width=800');
      expect(optimized).toContain('height=600');
      expect(optimized).toContain('quality=85');
      expect(optimized).toContain('format=webp');
    });

    it('should leave local URLs unchanged', () => {
      const localUrl = '/images/product.jpg';
      
      const optimized = assetOptimizer.optimizeImageUrl(localUrl, ASSET_CONFIGS.PRODUCT_IMAGES);
      
      expect(optimized).toBe(localUrl);
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = 'not-a-url';

      const optimized = assetOptimizer.optimizeImageUrl(invalidUrl, ASSET_CONFIGS.PRODUCT_IMAGES);

      expect(optimized).toBe(invalidUrl);
    });
  });

  describe('generateSrcSet', () => {
    it('should generate responsive srcSet', () => {
      const baseUrl = 'https://example.supabase.co/image.jpg';
      
      const srcSet = assetOptimizer.generateSrcSet(baseUrl, ASSET_CONFIGS.PRODUCT_IMAGES);
      
      expect(srcSet).toContain('320w');
      expect(srcSet).toContain('640w');
      expect(srcSet).toContain('width=320');
      expect(srcSet).toContain('width=640');
    });

    it('should respect maxWidth limits', () => {
      const baseUrl = 'https://example.supabase.co/image.jpg';
      const config = { ...ASSET_CONFIGS.PRODUCT_IMAGES, maxWidth: 640 };
      
      const srcSet = assetOptimizer.generateSrcSet(baseUrl, config);
      
      expect(srcSet).toContain('320w');
      expect(srcSet).toContain('640w');
      expect(srcSet).not.toContain('1024w');
    });

    it('should handle errors gracefully', () => {
      const invalidUrl = null as any;

      // No debería lanzar error
      expect(() => assetOptimizer.generateSrcSet(invalidUrl, ASSET_CONFIGS.PRODUCT_IMAGES)).not.toThrow();
    });
  });

  describe('generateSizes', () => {
    it('should generate sizes attribute', () => {
      const breakpoints = [
        { condition: '(max-width: 640px)', size: '100vw' },
        { condition: '(max-width: 1024px)', size: '50vw' },
        { condition: '', size: '33vw' },
      ];
      
      const sizes = assetOptimizer.generateSizes(breakpoints);
      
      expect(sizes).toBe('(max-width: 640px) 100vw, (max-width: 1024px) 50vw,  33vw');
    });
  });

  describe('preloadCriticalAssets', () => {
    it('should not throw errors when preloading assets', () => {
      const assets = [
        { url: '/image.jpg', type: 'image' as const },
        { url: '/font.woff2', type: 'font' as const },
        { url: '/style.css', type: 'style' as const },
      ];

      // No debería lanzar error
      expect(() => assetOptimizer.preloadCriticalAssets(assets)).not.toThrow();
    });
  });

  describe('optimizeJsonResponse', () => {
    it('should remove null values and compress JSON', () => {
      const data = {
        id: 1,
        name: 'Test',
        description: null,
        tags: ['tag1', null, 'tag2'],
        metadata: {
          created: '2023-01-01',
          updated: null,
        },
      };

      const optimized = assetOptimizer.optimizeJsonResponse(data);
      const parsed = JSON.parse(optimized);

      expect(parsed.description).toBeUndefined();
      expect(parsed.tags).toEqual(['tag1', 'tag2']);
      expect(parsed.metadata.updated).toBeUndefined();
      expect(parsed.metadata.created).toBe('2023-01-01');
    });

    it('should handle arrays correctly', () => {
      const data = [
        { id: 1, name: 'Item 1', deleted: null },
        null,
        { id: 2, name: 'Item 2', deleted: false },
      ];

      const optimized = assetOptimizer.optimizeJsonResponse(data);
      const parsed = JSON.parse(optimized);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].deleted).toBeUndefined();
      expect(parsed[1].deleted).toBe(false);
    });

    it('should handle primitive values', () => {
      const data = 'simple string';

      const optimized = assetOptimizer.optimizeJsonResponse(data);

      expect(optimized).toBe('"simple string"');
    });

    it('should handle errors gracefully', () => {
      // Crear objeto circular
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // No debería lanzar error, debería retornar algo
      expect(() => assetOptimizer.optimizeJsonResponse(circularObj)).not.toThrow();
    });
  });

  describe('Asset Configurations', () => {
    it('should have product images config', () => {
      const config = ASSET_CONFIGS.PRODUCT_IMAGES;
      
      expect(config.compress).toBe(true);
      expect(config.quality).toBe(85);
      expect(config.format).toBe('webp');
      expect(config.maxWidth).toBe(800);
      expect(config.maxHeight).toBe(600);
      expect(config.lazy).toBe(true);
    });

    it('should have payment icons config', () => {
      const config = ASSET_CONFIGS.PAYMENT_ICONS;
      
      expect(config.compress).toBe(true);
      expect(config.quality).toBe(90);
      expect(config.format).toBe('webp');
      expect(config.maxWidth).toBe(64);
      expect(config.maxHeight).toBe(64);
      expect(config.lazy).toBe(false);
    });

    it('should have hero images config', () => {
      const config = ASSET_CONFIGS.HERO_IMAGES;
      
      expect(config.compress).toBe(true);
      expect(config.quality).toBe(80);
      expect(config.format).toBe('webp');
      expect(config.maxWidth).toBe(1920);
      expect(config.maxHeight).toBe(1080);
      expect(config.lazy).toBe(true);
    });
  });
});

describe('AssetUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('optimizeProductImage', () => {
    it('should optimize product image with correct config', () => {
      const url = 'https://example.supabase.co/product.jpg';
      
      const optimized = AssetUtils.optimizeProductImage(url);
      
      expect(optimized).toContain('width=800');
      expect(optimized).toContain('quality=85');
    });
  });

  describe('optimizePaymentIcon', () => {
    it('should optimize payment icon with correct config', () => {
      const url = 'https://example.supabase.co/visa.svg';
      
      const optimized = AssetUtils.optimizePaymentIcon(url);
      
      expect(optimized).toContain('width=64');
      expect(optimized).toContain('quality=90');
    });
  });

  describe('generateProductImageProps', () => {
    it('should generate complete image props', () => {
      const url = 'https://example.supabase.co/product.jpg';
      
      const props = AssetUtils.generateProductImageProps(url);
      
      expect(props.src).toContain('width=800');
      expect(props.srcSet).toContain('320w');
      expect(props.sizes).toContain('100vw');
      expect(props.loading).toBe('lazy');
      expect(props.decoding).toBe('async');
    });
  });

  describe('preloadPaymentAssets', () => {
    it('should not throw errors when preloading payment assets', () => {
      // No debería lanzar error
      expect(() => AssetUtils.preloadPaymentAssets()).not.toThrow();
    });
  });

  describe('initializeClientOptimizations', () => {
    it('should not throw errors during initialization', () => {
      // No debería lanzar error
      expect(() => AssetUtils.initializeClientOptimizations()).not.toThrow();
    });

    it('should handle server-side rendering', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      // No debería lanzar error
      expect(() => AssetUtils.initializeClientOptimizations()).not.toThrow();

      global.window = originalWindow;
    });
  });
});









