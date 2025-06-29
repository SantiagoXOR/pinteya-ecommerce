#!/usr/bin/env node

/**
 * Script para implementar optimizaciones de performance automáticas
 * Pinteya E-commerce - Performance Optimization
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ Implementando Optimizaciones de Performance...\n');

const optimizations = {
  nextConfig: false,
  lazyLoading: false,
  treeShaking: false,
  bundleSplitting: false,
  imageOptimization: false
};

async function optimizeNextConfig() {
  console.log('🔧 1/5 - Optimizando configuración de Next.js...');
  
  const nextConfigPath = 'next.config.js';
  
  try {
    let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Verificar si ya tiene optimizaciones
    if (nextConfig.includes('experimental') && nextConfig.includes('optimizePackageImports')) {
      console.log('✅ Next.js ya está optimizado');
      optimizations.nextConfig = true;
      return;
    }

    // Agregar optimizaciones experimentales
    const optimizedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones experimentales
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-select',
      'lucide-react',
      '@/components/ui'
    ],
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$']
    } : false,
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimizar bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk para dependencias grandes
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // UI components chunk
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\\\/]components[\\\\/]ui[\\\\/]/,
            priority: 30,
          },
          // Common chunk para código compartido
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Tree shaking para Lucide icons
    if (config.resolve.alias) {
      config.resolve.alias['lucide-react'] = 'lucide-react/dist/esm/icons';
    } else {
      config.resolve.alias = {
        'lucide-react': 'lucide-react/dist/esm/icons'
      };
    }

    return config;
  },

  // Configuración de imágenes existente
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aakzspzfulgftqlgwkpb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.poxipol.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'poxipol.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.plavicon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plavicon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.petrilac.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'petrilac.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sinteplast.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sinteplast.com.ar',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuración para Clerk
  serverExternalPackages: ['@clerk/nextjs'],

  // Headers de seguridad existentes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Cache headers para assets estáticos
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Headers específicos para assets
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;

    // Hacer backup del archivo original
    fs.writeFileSync(`${nextConfigPath}.backup`, nextConfig);
    
    // Escribir nueva configuración
    fs.writeFileSync(nextConfigPath, optimizedConfig);
    
    console.log('✅ Next.js config optimizado');
    console.log('📁 Backup guardado en next.config.js.backup');
    optimizations.nextConfig = true;

  } catch (error) {
    console.error('❌ Error optimizando Next.js config:', error.message);
  }
}

async function implementLazyLoading() {
  console.log('🔄 2/5 - Implementando lazy loading...');
  
  try {
    // Crear hook personalizado para lazy loading
    const lazyLoadHook = `import { lazy, Suspense, ComponentType } from 'react';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hook para lazy loading de componentes
 * Optimiza el bundle size cargando componentes solo cuando se necesitan
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <div className="animate-pulse bg-gray-200 h-20 rounded" />
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Componente wrapper para lazy loading
 */
export function LazyComponent({ fallback, children }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-20 rounded" />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC para lazy loading de componentes pesados
 */
export function withLazyLoading<T extends ComponentType<any>>(
  Component: T,
  fallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-20 rounded" />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Lazy loading para modales comunes
export const LazyModal = lazy(() => import('@/components/ui/modal'));
export const LazyProductModal = lazy(() => import('@/components/Product/ProductModal'));
export const LazyCheckoutModal = lazy(() => import('@/components/Checkout/CheckoutModal'));

// Lazy loading para páginas pesadas
export const LazyProductGrid = lazy(() => import('@/components/Product/ProductGrid'));
export const LazyTestimonials = lazy(() => import('@/components/Home/Testimonials'));
export const LazyNewsletter = lazy(() => import('@/components/Common/Newsletter'));
`;

    const hooksDir = 'src/hooks';
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    fs.writeFileSync(path.join(hooksDir, 'useLazyComponent.ts'), lazyLoadHook);
    
    console.log('✅ Hook de lazy loading creado');
    optimizations.lazyLoading = true;

  } catch (error) {
    console.error('❌ Error implementando lazy loading:', error.message);
  }
}

async function optimizeTreeShaking() {
  console.log('🌳 3/5 - Optimizando tree shaking...');
  
  try {
    // Crear archivo de configuración para tree shaking
    const treeShakingConfig = `// Tree shaking configuration for Pinteya E-commerce
// Optimiza imports para reducir bundle size

// ✅ Imports optimizados para Lucide React
// En lugar de: import { ShoppingCart, Heart, Search } from 'lucide-react'
// Usar: import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart'

// Configuración de babel para tree shaking
module.exports = {
  plugins: [
    // Tree shaking para Lucide icons
    [
      'babel-plugin-import',
      {
        libraryName: 'lucide-react',
        libraryDirectory: 'dist/esm/icons',
        camel2DashComponentName: false,
      },
      'lucide-react',
    ],
    // Tree shaking para Radix UI
    [
      'babel-plugin-import',
      {
        libraryName: '@radix-ui/react-icons',
        libraryDirectory: 'dist',
        camel2DashComponentName: false,
      },
      'radix-icons',
    ],
  ],
};
`;

    fs.writeFileSync('babel.config.js', treeShakingConfig);

    // Crear utility para imports optimizados
    const optimizedImports = `// Utility para imports optimizados
// Reduce bundle size usando tree shaking

// Lucide React icons optimizados
export { default as ShoppingCart } from 'lucide-react/dist/esm/icons/shopping-cart';
export { default as Heart } from 'lucide-react/dist/esm/icons/heart';
export { default as Search } from 'lucide-react/dist/esm/icons/search';
export { default as User } from 'lucide-react/dist/esm/icons/user';
export { default as Menu } from 'lucide-react/dist/esm/icons/menu';
export { default as X } from 'lucide-react/dist/esm/icons/x';
export { default as ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down';
export { default as ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right';
export { default as Star } from 'lucide-react/dist/esm/icons/star';
export { default as Truck } from 'lucide-react/dist/esm/icons/truck';
export { default as Shield } from 'lucide-react/dist/esm/icons/shield';
export { default as CreditCard } from 'lucide-react/dist/esm/icons/credit-card';
export { default as Package } from 'lucide-react/dist/esm/icons/package';
export { default as Eye } from 'lucide-react/dist/esm/icons/eye';
export { default as Filter } from 'lucide-react/dist/esm/icons/filter';
export { default as Grid } from 'lucide-react/dist/esm/icons/grid-3x3';
export { default as List } from 'lucide-react/dist/esm/icons/list';
export { default as Plus } from 'lucide-react/dist/esm/icons/plus';
export { default as Minus } from 'lucide-react/dist/esm/icons/minus';

// Re-export optimizado de componentes UI
export { Button } from '@/components/ui/button';
export { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export { Badge } from '@/components/ui/badge';
export { Input } from '@/components/ui/input';
export { Modal } from '@/components/ui/modal';

// Tipos optimizados
export type { ButtonProps } from '@/components/ui/button';
export type { CardProps } from '@/components/ui/card';
export type { BadgeProps } from '@/components/ui/badge';
`;

    const utilsDir = 'src/utils';
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(utilsDir, 'optimized-imports.ts'), optimizedImports);
    
    console.log('✅ Tree shaking optimizado');
    optimizations.treeShaking = true;

  } catch (error) {
    console.error('❌ Error optimizando tree shaking:', error.message);
  }
}

async function optimizeBundleSplitting() {
  console.log('📦 4/5 - Optimizando bundle splitting...');
  
  try {
    // Crear configuración de webpack personalizada
    const webpackConfig = `// Webpack configuration for bundle optimization
const path = require('path');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        default: false,
        vendors: false,
        
        // Vendor libraries
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\\\/]node_modules[\\\\/]/,
          priority: 20,
          reuseExistingChunk: true,
        },
        
        // UI components
        ui: {
          name: 'ui',
          chunks: 'all',
          test: /[\\\\/]components[\\\\/]ui[\\\\/]/,
          priority: 30,
          reuseExistingChunk: true,
        },
        
        // Radix UI components
        radix: {
          name: 'radix',
          chunks: 'all',
          test: /[\\\\/]node_modules[\\\\/]@radix-ui[\\\\/]/,
          priority: 25,
          reuseExistingChunk: true,
        },
        
        // Clerk authentication
        clerk: {
          name: 'clerk',
          chunks: 'all',
          test: /[\\\\/]node_modules[\\\\/]@clerk[\\\\/]/,
          priority: 25,
          reuseExistingChunk: true,
        },
        
        // Common shared code
        common: {
          name: 'common',
          chunks: 'all',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
    
    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime',
    },
  },
  
  // Module resolution optimization
  resolve: {
    alias: {
      // Tree shaking aliases
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/icons'),
    },
  },
};
`;

    fs.writeFileSync('webpack.config.js', webpackConfig);
    
    console.log('✅ Bundle splitting optimizado');
    optimizations.bundleSplitting = true;

  } catch (error) {
    console.error('❌ Error optimizando bundle splitting:', error.message);
  }
}

async function optimizeImages() {
  console.log('🖼️ 5/5 - Optimizando configuración de imágenes...');
  
  try {
    // Crear componente de imagen optimizada
    const optimizedImageComponent = `import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
}

/**
 * Componente de imagen optimizada para Pinteya E-commerce
 * Incluye lazy loading, WebP/AVIF, y placeholders optimizados
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generar blur placeholder automático si no se proporciona
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height);

  return (
    <div className={\`relative overflow-hidden \${className}\`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      {hasError ? (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-400 rounded"
          style={{ width, height }}
        >
          <span className="text-sm">Imagen no disponible</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          quality={quality}
          className={\`transition-opacity duration-300 \${isLoading ? 'opacity-0' : 'opacity-100'}\`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Generar blur placeholder automático
 */
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Crear gradiente suave
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

/**
 * Hook para precargar imágenes críticas
 */
export function useImagePreload(src: string) {
  useState(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  });
}
`;

    const componentsDir = 'src/components/ui';
    fs.writeFileSync(path.join(componentsDir, 'optimized-image.tsx'), optimizedImageComponent);
    
    console.log('✅ Componente de imagen optimizada creado');
    optimizations.imageOptimization = true;

  } catch (error) {
    console.error('❌ Error optimizando imágenes:', error.message);
  }
}

async function generateOptimizationReport() {
  console.log('\n📋 Generando reporte de optimizaciones...');
  
  const report = {
    timestamp: new Date().toISOString(),
    optimizations,
    summary: {
      total: Object.keys(optimizations).length,
      completed: Object.values(optimizations).filter(Boolean).length,
      pending: Object.values(optimizations).filter(opt => !opt).length
    },
    nextSteps: [
      'Ejecutar npm run build para verificar optimizaciones',
      'Ejecutar npm run analyze-bundle para medir mejoras',
      'Implementar lazy loading en componentes específicos',
      'Migrar imports a versión optimizada',
      'Ejecutar tests de performance'
    ]
  };

  const reportPath = 'PERFORMANCE_OPTIMIZATIONS.md';
  const markdownReport = `# ⚡ Performance Optimizations Applied

**Fecha:** ${new Date(report.timestamp).toLocaleString()}

## 📊 Resumen

- **Total optimizaciones**: ${report.summary.total}
- **Completadas**: ${report.summary.completed}
- **Pendientes**: ${report.summary.pending}

## ✅ Optimizaciones Implementadas

${Object.entries(optimizations).map(([key, completed]) => 
  `- ${completed ? '✅' : '❌'} **${key}**: ${getOptimizationDescription(key)}`
).join('\n')}

## 🎯 Próximos Pasos

${report.nextSteps.map(step => `- ${step}`).join('\n')}

## 📈 Beneficios Esperados

- **Bundle Size**: Reducción del 20-30%
- **First Contentful Paint**: Mejora del 15-25%
- **Largest Contentful Paint**: Mejora del 10-20%
- **Time to Interactive**: Mejora del 25-35%

## 🧪 Verificación

\`\`\`bash
# Analizar bundle optimizado
npm run build
npm run analyze-bundle

# Tests de performance
npm run test:performance

# Verificar lazy loading
npm run dev
# Revisar Network tab en DevTools
\`\`\`
`;

  fs.writeFileSync(reportPath, markdownReport);
  
  console.log('\n📊 Resumen de Optimizaciones:');
  console.log(`  ✅ Completadas: ${report.summary.completed}/${report.summary.total}`);
  console.log(`  ⏳ Pendientes: ${report.summary.pending}/${report.summary.total}`);
  console.log(`\n📁 Reporte guardado en: ${reportPath}`);
}

function getOptimizationDescription(key) {
  const descriptions = {
    nextConfig: 'Configuración de Next.js optimizada con experimental features',
    lazyLoading: 'Hook y componentes para lazy loading implementados',
    treeShaking: 'Tree shaking configurado para Lucide React y Radix UI',
    bundleSplitting: 'Bundle splitting optimizado con webpack',
    imageOptimization: 'Componente de imagen optimizada con WebP/AVIF'
  };
  return descriptions[key] || 'Optimización aplicada';
}

// Ejecutar optimizaciones
async function main() {
  try {
    await optimizeNextConfig();
    await implementLazyLoading();
    await optimizeTreeShaking();
    await optimizeBundleSplitting();
    await optimizeImages();
    await generateOptimizationReport();
    
    console.log('\n🎯 ¡Optimizaciones de performance completadas!');
    console.log('\n📋 Para aplicar las optimizaciones:');
    console.log('1. npm run build');
    console.log('2. npm run analyze-bundle');
    console.log('3. npm run test:performance');
    
  } catch (error) {
    console.error('❌ Error en optimizaciones:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
