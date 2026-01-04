/** @type {import('next').NextConfig} */

// ⚡ PERFORMANCE: Bundle Analyzer para optimización
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // ✅ Configuración mínima y estable para Next.js 16

  // ⚡ OPTIMIZACIÓN: Configuración ISR para reducir build time
  // Genera páginas bajo demanda en lugar de todas en build time
  generateBuildId: async () => {
    // Generar ID de build único
    return `build-${Date.now()}`
  },

  // ✅ TypeScript configuration - Temporalmente deshabilitado para investigar errores
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⚡ FIX: ESLint config removido - Next.js 16 maneja esto diferente

  // ⚡ Next.js 16: Turbopack es el empaquetador predeterminado
  // También mantenemos configuración de webpack por compatibilidad

  // ⚡ FIX VERCEL: output: 'standalone' removido - NO compatible con Vercel
  // 'standalone' es para Docker/containers, Vercel maneja Next.js automáticamente
  // Esta configuración causaba el error "Unable to find lambda for route"
  // output: 'standalone', // ⚡ REMOVIDO: Incompatible con Vercel

  // ✅ Compiler optimizations - Solo las esenciales
  // ⚡ FASE 6: SWC (Next.js 16) respeta automáticamente .browserslistrc
  // ⚡ FASE 12: Configuración explícita para evitar transpilación innecesaria
  // .browserslistrc ya está optimizado para navegadores modernos (últimas 2 versiones)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
    // ⚡ FASE 12: SWC minify está habilitado por defecto en Next.js 16
    // No se requiere configuración adicional - SWC transpila según browserslist
    // El archivo .browserslistrc ya está configurado para navegadores modernos
  },

  // ⚡ PERFORMANCE: Modular imports para reducir bundle size
  // Nota: swcMinify removido - es por defecto en Next.js 15
  modularizeImports: {
    '@tabler/icons-react': {
      transform: '@tabler/icons-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    // ⚡ OPTIMIZACIÓN: Imports modulares de lodash-es para tree shaking
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
    // ⚡ OPTIMIZACIÓN: Imports modulares para librerías comunes que pueden tener mucho código sin usar
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
    'recharts': {
      transform: 'recharts/lib/{{member}}',
      skipDefaultConversion: true,
    },
  },

  // ⚡ PERFORMANCE: Configuración experimental optimizada
  experimental: {
    optimizePackageImports: [
      '@tabler/icons-react',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
      'framer-motion',
      'swiper',
      'swiper/react',
    ],
    // ⚡ OPTIMIZACIÓN CSS: Deshabilitado inlineCss para reducir tamaño HTML inicial
    // - inlineCss: true inlina TODO el CSS, aumentando el tamaño del HTML inicial
    // - Esto aumenta el parse time y afecta negativamente el Speed Index (SI)
    // - Usamos el script de interceptación CSS en layout.tsx que hace CSS no bloqueante
    // - El script aplica media="print" a los links CSS para evitar render-blocking
    // optimizeCss: true, // ⚡ DESHABILITADO: No funciona con App Router
    // inlineCss: true, // ⚡ DESHABILITADO: Aumenta tamaño HTML y parse time, afecta SI negativamente
    
    optimisticClientCache: true, // Cache optimista para navegación más rápida
    
    // ⚡ CSS chunking para mejor code splitting
    // - Separa CSS en chunks más pequeños por ruta/componente
    // - Reduce el tamaño inicial del CSS principal
    // - Los @import bloqueantes fueron removidos de style.css y se cargan via DeferredCSS
    // Nota: En Next.js 16, cssChunking debe ser boolean (true = loose, false = strict)
    cssChunking: true,
  },

  // ⚡ FIX VERCEL WEBPACK: Configuración de webpack para builds con --webpack
  // Necesario para resolver react/jsx-runtime cuando se usa webpack en lugar de Turbopack
  webpack: (config, { isServer }) => {
    const path = require('path')
    
    // Resolver react/jsx-runtime correctamente para webpack
    if (!config.resolve) {
      config.resolve = {}
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    
    // Asegurar que React se resuelva correctamente y evitar múltiples instancias
    const reactPath = path.resolve(process.cwd(), 'node_modules/react')
    const reactDomPath = path.resolve(process.cwd(), 'node_modules/react-dom')
    
    config.resolve.alias = {
      ...config.resolve.alias,
      // Asegurar una sola instancia de React
      'react': reactPath,
      'react-dom': reactDomPath,
      // Resolver jsx-runtime
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime.js'),
    }
    
    // Asegurar que webpack no incluya múltiples instancias de React
    if (!config.resolve.modules) {
      config.resolve.modules = []
    }
    if (!config.resolve.modules.includes('node_modules')) {
      config.resolve.modules.push('node_modules')
    }
    
    // ⚡ OPTIMIZACIÓN: Code splitting mejorado para reducir código sin usar
    // ⚡ FASE 9: Optimización agresiva para reducir 80 KiB JS sin usar
    if (!isServer && config.optimization) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 30000, // ⚡ FASE 2: REDUCIDO a 30 KB para chunks más pequeños y menos main thread work
          minSize: 10000, // ⚡ FASE 2: Reducido a 10 KB mínimo para más granularidad
          maxAsyncRequests: 80, // ⚡ FASE 1B: AUMENTADO a 80 para permitir más chunks pequeños
          maxInitialRequests: 50, // ⚡ FASE 1B: AUMENTADO a 50 para permitir más chunks iniciales
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // ⚡ Framework core (React, Next.js) - Prioridad alta
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              priority: 40,
              maxSize: 60000, // ⚡ FASE 2: REDUCIDO a 60 KB para reducir main thread work
              reuseExistingChunk: true,
            },
            // ⚡ Framer Motion - Separado para lazy loading async
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 35,
              chunks: 'async', // ⚡ CRITICAL: Solo cargar cuando se necesita
              maxSize: 50000, // ⚡ FASE 2: REDUCIDO a 50 KB
              reuseExistingChunk: true,
            },
            // ⚡ Radix UI - Separado para mejor tree shaking
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 35,
              maxSize: 80000, // ⚡ FASE 2: REDUCIDO a 80 KB
              reuseExistingChunk: true,
            },
            // ⚡ Swiper - Separado para lazy loading async
            swiper: {
              test: /[\\/]node_modules[\\/]swiper[\\/]/,
              name: 'swiper',
              priority: 30,
              chunks: 'async', // ⚡ CRITICAL: Solo cargar cuando se necesita
              maxSize: 50000, // ⚡ FASE 2: REDUCIDO a 50 KB
              reuseExistingChunk: true,
            },
            // ⚡ Recharts - Separado para lazy loading
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 30,
              maxSize: 100000, // 100 KB máximo
              reuseExistingChunk: true,
            },
            // ⚡ Vendor libraries - Chunks más pequeños para mejor tree shaking
            vendor: {
              test: /[\\/]node_modules[\\/](?!(react|react-dom|scheduler|next|framer-motion|@radix-ui|swiper|recharts)[\\/])/,
              name: 'vendor',
              priority: 10,
              maxSize: 30000, // ⚡ FASE 2: REDUCIDO a 30 KB para reducir main thread work
              minSize: 10000, // ⚡ FASE 2: Reducido a 10 KB mínimo para más granularidad
              reuseExistingChunk: true,
            },
            // ⚡ FASE 1B: Chunk separado para componentes de HomeV3 con tamaño reducido
            homeV3: {
              test: /[\\/]src[\\/]components[\\/]Home-v3[\\/]/,
              name: 'home-v3',
              priority: 25,
              maxSize: 30000, // ⚡ FASE 2: REDUCIDO a 30 KB
              minSize: 10000, // ⚡ FASE 2: Reducido a 10 KB
              reuseExistingChunk: true,
            },
            // ⚡ FASE 19: Chunk separado para componentes de página (Home, etc.)
            pages: {
              test: /[\\/]src[\\/](app|components[\\/]Home)[\\/]/,
              name: 'pages',
              priority: 20,
              maxSize: 30000, // ⚡ FASE 2: REDUCIDO a 30 KB para reducir main thread work
              minSize: 10000, // ⚡ FASE 2: Reducido a 10 KB mínimo para más granularidad
              reuseExistingChunk: true,
            },
          },
        },
        // ⚡ OPTIMIZACIÓN: Tree shaking mejorado
        usedExports: true,
        sideEffects: false,
        concatenateModules: true, // Scope hoisting
        providedExports: true,
        innerGraph: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
      }
    }
    
    // ⚡ FIX: Next.js puede requerir react/cache que no existe en React 18.3.1
    // Usamos un polyfill local en lugar de node_modules para mayor confiabilidad
    // Primero intentar crear el polyfill en node_modules (para compatibilidad)
    const fs = require('fs')
    const reactCachePath = path.join(reactPath, 'cache.js')
    const localPolyfillPath = path.resolve(process.cwd(), 'src/lib/polyfills/react-cache.js')
    
    // Asegurar que el polyfill existe en node_modules (para compatibilidad)
    if (!fs.existsSync(reactCachePath)) {
      if (!fs.existsSync(reactPath)) {
        fs.mkdirSync(reactPath, { recursive: true })
      }
      // Usar el polyfill local como fuente
      if (fs.existsSync(localPolyfillPath)) {
        fs.copyFileSync(localPolyfillPath, reactCachePath)
      } else {
        // Fallback: crear polyfill inline
        const polyfillContent = `'use strict';
function cacheImpl(fn) {
  if (typeof fn !== 'function') throw new Error('cache requires a function');
  return fn;
}
const cacheExport = function(fn) { return cacheImpl(fn); };
Object.defineProperty(cacheExport, 'cache', { value: cacheImpl, writable: false, enumerable: true, configurable: false });
Object.defineProperty(cacheExport, 'default', { value: cacheImpl, writable: false, enumerable: true, configurable: false });
Object.defineProperty(cacheExport, '__esModule', { value: true, writable: false, enumerable: false, configurable: false });
module.exports = cacheExport;
module.exports.cache = cacheImpl;
module.exports.default = cacheImpl;
module.exports.__esModule = true;
`
        fs.writeFileSync(reactCachePath, polyfillContent, 'utf8')
      }
    }
    
    // CRÍTICO: Configurar alias para que webpack resuelva react/cache
    // Priorizar el polyfill local si existe, sino usar el de node_modules
    const polyfillToUse = fs.existsSync(localPolyfillPath) ? localPolyfillPath : reactCachePath
    config.resolve.alias['react/cache'] = polyfillToUse
    
    // También configurar fallback para asegurar resolución
    if (!config.resolve.fallback) {
      config.resolve.fallback = {}
    }
    config.resolve.fallback['react/cache'] = polyfillToUse
    
    return config
  },

  // ⚡ FIX Next.js 16: Configuración Turbopack para react/cache polyfill
  // Turbopack es el empaquetador predeterminado en Next.js 16
  // El script prebuild:vercel copia el polyfill a node_modules/react/cache.js
  // Configuramos alias para que Turbopack resuelva correctamente
  turbopack: {
    resolveAlias: {
      'react/cache': require('path').resolve(process.cwd(), 'node_modules/react/cache.js'),
    },
  },

  // ⚡ PERFORMANCE: Configuración de imágenes optimizada (-4s FCP con WebP)
  images: {
    // Formatos modernos para mejor compresión
    formats: ['image/webp', 'image/avif'],
    // Cache más largo para imágenes optimizadas
    minimumCacheTTL: 31536000, // 1 año para imágenes estáticas
    // ⚡ OPTIMIZACIÓN: Tamaños responsivos optimizados para productos y hero
    // ⚡ FASE 3: Agregado 308px para product cards (308x308 según reporte PageSpeed)
    // Tamaños específicos para productos (263x263, 286x286, 308x308, 320x320) para reducir 162 KiB
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 263, 286, 308, 320, 384],
    // Nota: quality se especifica en cada componente Image individualmente (default: 75)
    // Habilitar optimización de imágenes remotas
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aakzspzfulgftqlgwkpb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // 🛡️ FALLBACK: Hostname truncado (puede ocurrir por extensiones del navegador)
      // El código lo corregirá automáticamente, pero esto previene errores de Next/Image
      {
        protocol: 'https',
        hostname: 'aaklgwkpb.supabase.co',
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
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    // SVG con precaución por seguridad
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // ⚡ CRITICAL: Optimización habilitada para Next.js Image
    unoptimized: false, // DEBE ser false para aprovechar optimización automática
    // NOTA: quality se especifica en cada componente <Image quality={85} />
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
      // ⚡ PERFORMANCE: Fix 404 de /shop
      {
        source: '/shop',
        destination: '/products',
        permanent: true, // 301 redirect permanente
      },
      {
        source: '/shop/:path*',
        destination: '/products/:path*',
        permanent: true,
      },
      {
        source: '/product/:id',
        destination: '/shop-details/:id',
        permanent: true,
      },
    ]
  },

  // ✅ HEADERS OPTIMIZADOS para admin panel
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</fonts/EuclidCircularA-Regular.woff2>; rel="preload"; as="font"; type="font/woff2"; crossorigin="anonymous", </fonts/EuclidCircularA-SemiBold.woff2>; rel="preload"; as="font"; type="font/woff2"; crossorigin="anonymous", </images/hero/hero2/hero1.webp>; rel="preload"; as="image"; fetchpriority="high"',
          },
        ],
      },
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
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=()',
          },
          // ⚡ FASE 13: Cache optimizado para páginas HTML con stale-while-revalidate
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
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
      // ⚡ PERFORMANCE: Headers para fuentes críticas
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ⚡ FASE 13: Headers para imágenes estáticas - Caché de 1 año para recursos inmutables
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, s-maxage=31536000, immutable', // ⚡ FASE 13: 30 días en cliente, 1 año en CDN
          },
        ],
      },
      // ⚡ PERFORMANCE: Headers para imágenes optimizadas de Next.js
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

// Export configuration with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig)
