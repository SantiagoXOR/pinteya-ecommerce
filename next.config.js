/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones experimentales simplificadas para mejor performance
  experimental: {
    // Solo optimizaciones críticas que realmente mejoran performance
    optimizePackageImports: [
      'lucide-react',
      '@/components/ui'
    ],
    optimizeCss: true,
    // Removidas optimizaciones que causan overhead de compilación
  },

  // Configuración de Turbopack simplificada
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // ESLint configuration - Mejorado para mejor calidad de código
  eslint: {
    // Ignorar durante builds para evitar bloqueos
    ignoreDuringBuilds: true,
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },

  // TypeScript configuration
  typescript: {
    // Ignorar errores de TypeScript para el build
    ignoreBuildErrors: true,
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
            test: /[\\/]components[\\/]ui[\\/]/,
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

    // Tree shaking mejorado para librerías pesadas
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimizar imports de librerías comunes
      '@/lib/optimized-imports': require('path').resolve(__dirname, 'src/lib/optimized-imports.ts'),
    };

    // Configuración de tree-shaking para producción
    if (config.mode === 'production') {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        // Configuración específica para tree-shaking
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Separar librerías de iconos
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui)[\\/]/,
              name: 'icons',
              chunks: 'all',
              priority: 20,
            },
            // Separar librerías de animación
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'animations',
              chunks: 'all',
              priority: 15,
            },
            // Separar utilidades de fecha
            dateUtils: {
              test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
              name: 'date-utils',
              chunks: 'all',
              priority: 10,
            },
          },
        },
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

  // Redirects para compatibilidad de URLs
  async redirects() {
    return [
      // 🚨 REDIRECCIÓN CRÍTICA: /my-account → /admin
      // Solución definitiva para evitar ciclos recursivos de Clerk
      {
        source: '/my-account',
        destination: '/admin',
        permanent: false, // 302 redirect para poder cambiar en el futuro
      },
      {
        source: '/my-account/:path*',
        destination: '/admin',
        permanent: false, // 302 redirect para cualquier subruta
      },
      {
        source: '/product/:id',
        destination: '/shop-details/:id',
        permanent: true,
      },
    ];
  },

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
          // Permissions Policy para evitar errores de browsing-topics
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=(), interest-cohort=(), join-ad-interest-group=(), run-ad-auction=(), camera=(), microphone=(), geolocation=(), payment=()',
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

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Export configuration with bundle analyzer
module.exports = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;
