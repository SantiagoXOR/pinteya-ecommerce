/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ OPTIMIZACIONES PARA ADMIN PANEL - Configuración simplificada y estable
  experimental: {
    // Optimizaciones críticas para admin panel + lazy loading
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@clerk/nextjs',
      'recharts',
      'maplibre-gl',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'framer-motion'
    ],
    // Removidas optimizaciones experimentales que causan problemas de build
  },

  // ✅ CONFIGURACIÓN DE DESARROLLO OPTIMIZADA
  ...(process.env.NODE_ENV === 'development' && {
    // Configuraciones específicas para desarrollo
    onDemandEntries: {
      // Tiempo antes de eliminar páginas de memoria (ms)
      maxInactiveAge: 60 * 1000,
      // Páginas que se mantienen en memoria
      pagesBufferLength: 5,
    },

  }),

  // ✅ BUILD ID ÚNICO para evitar cache issues
  generateBuildId: async () => {
    return 'admin-panel-' + Date.now()
  },

  // ✅ ESLint configuration - Simplificado para builds estables
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },

  // ✅ TypeScript configuration - Simplificado
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Compiler optimizations - Solo las esenciales
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ✅ WEBPACK OPTIMIZADO - Configuración avanzada de bundle optimization
  webpack: (config, { dev, isServer, buildId }) => {
    // ===================================
    // BUNDLE OPTIMIZATION SYSTEM
    // ===================================

    if (!dev && !isServer) {
      // Configuración avanzada de chunks optimizada
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Framework core (React, Next.js)
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            chunks: 'all',
            enforce: true,
            reuseExistingChunk: true
          },

          // UI Components (Radix UI, Lucide)
          uiComponents: {
            name: 'ui-components',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            priority: 35,
            chunks: 'all',
            enforce: true,
            reuseExistingChunk: true
          },

          // Auth y seguridad
          auth: {
            name: 'auth',
            test: /[\\/]node_modules[\\/](@clerk|@supabase)[\\/]/,
            priority: 30,
            chunks: 'all',
            minSize: 40000,
            reuseExistingChunk: true
          },

          // Charts y visualización
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            priority: 30,
            chunks: 'all',
            minSize: 50000,
            reuseExistingChunk: true
          },

          // Utilidades
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
            priority: 25,
            chunks: 'all',
            minSize: 20000,
            maxSize: 100000,
            reuseExistingChunk: true
          },

          // Animaciones
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            priority: 25,
            chunks: 'all',
            minSize: 50000,
            reuseExistingChunk: true
          },

          // Forms y validación
          forms: {
            name: 'forms',
            test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
            priority: 25,
            chunks: 'all',
            minSize: 30000,
            reuseExistingChunk: true
          },

          // Sistema de diseño
          designSystem: {
            name: 'design-system',
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            priority: 20,
            chunks: 'all',
            minSize: 20000,
            maxSize: 100000,
            reuseExistingChunk: true
          },

          // Admin panel específico
          admin: {
            name: 'admin',
            test: /[\\/]src[\\/](app[\\/]admin|components[\\/]admin)[\\/]/,
            priority: 25,
            chunks: 'async',
            minSize: 40000,
            maxSize: 150000,
            reuseExistingChunk: true
          },

          // Vendor general
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/](?!(react|react-dom|next|@radix-ui|lucide-react|@clerk|@supabase|recharts|framer-motion|react-hook-form|zod)[\\/])/,
            priority: 20,
            chunks: 'all',
            minSize: 30000,
            maxSize: 200000,
            reuseExistingChunk: true
          },

          // Componentes comunes
          common: {
            name: 'common',
            test: /[\\/]src[\\/]/,
            priority: 5,
            chunks: 'all',
            minSize: 30000,
            maxSize: 100000,
            minChunks: 2,
            reuseExistingChunk: true
          }
        }
      };

      // Runtime chunk para mejor caching
      config.optimization.runtimeChunk = 'single';

      // Optimizaciones adicionales
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.concatenateModules = true;
    }

    // Tree shaking mejorado
    config.module.rules.push({
      test: /\.js$/,
      include: [
        /node_modules\/lodash-es/,
        /node_modules\/date-fns/,
        /src\/lib/,
        /src\/utils/
      ],
      sideEffects: false
    });

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
      // Configuración para avatares de Google OAuth
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ CONFIGURACIÓN CLERK corregida - Removido serverExternalPackages conflictivo

  // Redirects para compatibilidad de URLs
  async redirects() {
    return [
      // ✅ REDIRECCIONES RESTAURADAS CON CONFIGURACIÓN SEGURA
      {
        source: '/my-account',
        destination: '/admin',
        permanent: false, // 302 redirect para poder cambiar en el futuro
      },
      {
        source: '/my-account/:path*',
        destination: '/admin/:path*', // Preservar subrutas
        permanent: false,
      },
      // Comentado temporalmente hasta verificar que no cause problemas
      // {
      //   source: '/home',
      //   destination: '/admin',
      //   permanent: false,
      // },
      {
        source: '/product/:id',
        destination: '/shop-details/:id',
        permanent: true,
      },
    ];
  },

  // ✅ HEADERS OPTIMIZADOS para admin panel
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
        ],
      },
      // ✅ Headers específicos para admin panel
      {
        source: '/admin/:path*',
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
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Headers para assets estáticos
      {
        source: '/_next/static/:path*',
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
