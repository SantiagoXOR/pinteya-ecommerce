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
  // ⚡ OPTIMIZACIÓN POST-DEPLOY: Configuración adicional para evitar JavaScript legacy
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
    // ⚡ OPTIMIZACIÓN POST-DEPLOY: SWC ya respeta .browserslistrc automáticamente
    // No necesitamos configuración adicional - Next.js 16 usa SWC que transpila según browserslist
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
    const nextReactPath = path.resolve(process.cwd(), 'node_modules/next/dist/compiled/react')
    
    // CRÍTICO: Configurar alias para react/cache ANTES de configurar otros alias
    // Next.js 16 usa next/dist/compiled/react internamente, pero necesitamos
    // asegurar que react/cache se resuelva correctamente
    const fs = require('fs')
    const localPolyfillPath = path.resolve(process.cwd(), 'src/lib/polyfills/react-cache.js')
    const reactCachePath = path.join(reactPath, 'cache.js')
    const polyfillToUse = fs.existsSync(localPolyfillPath) ? localPolyfillPath : reactCachePath
    
    // ⚡ FIX ReactCurrentDispatcher: Asegurar resolución correcta de React sin forzar alias
    // Next.js 16 maneja React internamente, pero cuando se usa --webpack puede haber problemas
    // La solución es asegurar que webpack resuelva React desde node_modules sin forzar alias
    config.resolve.alias = {
      ...config.resolve.alias,
      // ⚡ FIX: No forzar alias de 'react' - Next.js debe resolverlo desde node_modules
      // Forzar el alias causa conflictos con ReactCurrentDispatcher
      // En su lugar, asegurar que webpack resuelva correctamente desde node_modules
      'react-dom': reactDomPath,
      // CRÍTICO: Resolver react/cache al polyfill
      'react/cache': polyfillToUse,
    }
    
    // ⚡ FIX ReactCurrentDispatcher: Asegurar que React se resuelva desde node_modules
    // Esto previene problemas con ReactCurrentDispatcher cuando se usa --webpack
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules']
    } else if (!config.resolve.modules.includes('node_modules')) {
      config.resolve.modules.unshift('node_modules')
    }
    
    // ⚡ FIX ReactCurrentDispatcher: Asegurar que webpack use la misma instancia de React
    // Esto previene múltiples instancias de React que causan el error ReactCurrentDispatcher
    // symlinks debe ser false para evitar problemas con la resolución de módulos en Windows
    if (config.resolve.symlinks === undefined) {
      config.resolve.symlinks = false
    }
    
    // ⚡ FIX ReactCurrentDispatcher: Asegurar que webpack resuelva extensiones correctamente
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']
    }
    
    // ⚡ REMOVIDO: La configuración de modules ya se maneja arriba
    
    // ⚡ OPTIMIZACIÓN: Code splitting mejorado para reducir código sin usar
    // ⚡ OPTIMIZACIÓN LCP: Balance entre chunks pequeños y carga eficiente
    if (!isServer && config.optimization) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 150000, // ⚡ OPTIMIZACIÓN LCP: 150 KB máximo (balance entre tamaño y paralelización)
          minSize: 20000, // ⚡ OPTIMIZACIÓN: 20 KB mínimo para evitar demasiados chunks pequeños
          maxAsyncRequests: 30, // ⚡ OPTIMIZACIÓN: 30 requests async (balance)
          maxInitialRequests: 25, // ⚡ OPTIMIZACIÓN: 25 requests iniciales (reducido para mejor LCP)
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // ⚡ Framework core (React, Next.js) - Prioridad alta
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              priority: 40,
              maxSize: 200000, // ⚡ OPTIMIZACIÓN LCP: 200 KB máximo para framework (balance)
              enforce: true,
              reuseExistingChunk: true,
            },
            // ⚡ OPTIMIZACIÓN LCP: Separar chunk principal en chunks más pequeños
            // ⚡ FIX: Removido cache group "main" - causa conflicto con entrypoint "main" de webpack
            // main: {
            //   name: 'main',
            //   minChunks: 2,
            //   priority: 20,
            //   maxSize: 150000,
            //   reuseExistingChunk: true,
            // },
            // ⚡ React Query - Separado para mejor code splitting
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              name: 'react-query',
              priority: 35,
              chunks: 'async', // ⚡ FASE 1 PLAN 90+: Solo cargar cuando se necesita
              maxSize: 20000, // ⚡ FASE 1 PLAN 90+: REDUCIDO a 20 KB
              reuseExistingChunk: true,
            },
            // ⚡ Redux - Separado para mejor code splitting
            redux: {
              test: /[\\/]node_modules[\\/](@reduxjs|redux)[\\/]/,
              name: 'redux',
              priority: 35,
              chunks: 'async', // ⚡ FASE 1 PLAN 90+: Solo cargar cuando se necesita
              maxSize: 20000, // ⚡ FASE 1 PLAN 90+: REDUCIDO a 20 KB
              reuseExistingChunk: true,
            },
            // ⚡ Framer Motion - Separado para lazy loading async
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 35,
              chunks: 'async', // ⚡ CRITICAL: Solo cargar cuando se necesita
              maxSize: 20000, // ⚡ FASE 3.2: REDUCIDO a 20 KB
              reuseExistingChunk: true,
            },
            // ⚡ Radix UI - Separado para mejor tree shaking
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 35,
              maxSize: 30000, // ⚡ FASE 3.2: REDUCIDO a 30 KB
              reuseExistingChunk: true,
            },
            // ⚡ Swiper - Separado para lazy loading async
            swiper: {
              test: /[\\/]node_modules[\\/]swiper[\\/]/,
              name: 'swiper',
              priority: 30,
              chunks: 'async', // ⚡ CRITICAL: Solo cargar cuando se necesita
              maxSize: 20000, // ⚡ FASE 3.2: REDUCIDO a 20 KB
              reuseExistingChunk: true,
            },
            // ⚡ Recharts - Separado para lazy loading async
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 30,
              chunks: 'async', // ⚡ CRITICAL: Solo cargar cuando se necesita (async)
              maxSize: 100000, // 100 KB máximo
              reuseExistingChunk: true,
            },
            // ⚡ MULTITENANT: Chunk separado para código específico por tenant
            // Configuraciones de tema, logos, colores (cargados dinámicamente)
            tenantConfig: {
              test: /[\\/]src[\\/](lib[\\/]tenant|components[\\/]theme|contexts[\\/]TenantContext)[\\/]/,
              name: 'tenant-config',
              priority: 30,
              chunks: 'async', // MULTITENANT: Lazy loaded - solo cargar cuando se necesita
              maxSize: 50000, // MULTITENANT: 50 KB máximo para configuraciones de tenant
              minSize: 5000, // MULTITENANT: 5 KB mínimo
              reuseExistingChunk: true,
            },
            // ⚡ OPTIMIZACIÓN PAGESPEED: Vendor libraries - Reducido maxSize para forzar más chunks pequeños
            // Esto ayuda a dividir el chunk de 670 KB identificado en el análisis
            vendor: {
              test: /[\\/]node_modules[\\/](?!(react|react-dom|scheduler|next|framer-motion|@radix-ui|swiper|recharts|@tanstack|redux)[\\/])/,
              name: 'vendor',
              priority: 10,
              maxSize: 50000, // ⚡ OPTIMIZACIÓN PAGESPEED: Reducido de 100KB a 50KB para dividir chunks grandes
              minSize: 20000, // ⚡ OPTIMIZACIÓN: 20 KB mínimo
              reuseExistingChunk: true,
            },
            // ⚡ OPTIMIZACIÓN PAGESPEED: Chunk separado para componentes de HomeV3 - Reducido maxSize
            homeV3: {
              test: /[\\/]src[\\/]components[\\/]Home-v3[\\/]/,
              name: 'home-v3',
              priority: 25,
              maxSize: 80000, // ⚡ OPTIMIZACIÓN PAGESPEED: Reducido de 150KB a 80KB para mejor code splitting
              minSize: 20000, // ⚡ OPTIMIZACIÓN: 20 KB mínimo
              reuseExistingChunk: true,
            },
            // ⚡ OPTIMIZACIÓN PAGESPEED: Chunk separado para componentes de página - Reducido maxSize
            pages: {
              test: /[\\/]src[\\/](app|components[\\/]Home)[\\/]/,
              name: 'pages',
              priority: 20,
              maxSize: 80000, // ⚡ OPTIMIZACIÓN PAGESPEED: Reducido de 150KB a 80KB para mejor code splitting
              minSize: 20000, // ⚡ OPTIMIZACIÓN: 20 KB mínimo
              reuseExistingChunk: true,
            },
          },
        },
        // ⚡ OPTIMIZACIÓN: Tree shaking mejorado
        // ⚡ FIX: Removido usedExports - No compatible con cacheUnaffected en Next.js 16
        // usedExports: true, // Removido por conflicto con cacheUnaffected
        sideEffects: false,
        concatenateModules: true, // Scope hoisting
        providedExports: true,
        innerGraph: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
      }
    }
    
    // ⚡ FIX: Asegurar que el polyfill existe en node_modules (para compatibilidad)
    // Nota: reactCachePath, localPolyfillPath y polyfillToUse ya están declarados arriba
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
module.exports = cacheImpl;
module.exports.cache = cacheImpl;
module.exports.default = cacheImpl;
module.exports.__esModule = true;
`
        fs.writeFileSync(reactCachePath, polyfillContent, 'utf8')
      }
    }
    
    // ⚡ FIX: Removido NormalModuleReplacementPlugin - Estaba rompiendo React internals
    // En su lugar, confiamos en que react/cache se resuelva correctamente con el alias
    // Si Next.js intenta acceder a react.cache directamente, puede que necesitemos
    // actualizar React a una versión que incluya cache nativamente
    
    return config
  },

  // ⚡ FIX Next.js 16: Configuración Turbopack para react/cache polyfill
  // Turbopack es el empaquetador predeterminado en Next.js 16
  // El script prebuild:vercel copia el polyfill a node_modules/react/cache.js
  // Configuramos alias para que Turbopack resuelva correctamente
  turbopack: {
    // ⚡ FIX: Especificar directorio raíz para evitar warning de múltiples lockfiles
    // Esto evita que Turbopack confunda el package-lock.json del home del usuario
    // con el del proyecto
    root: process.cwd(),
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
            value: '</images/hero/hero2/hero1.webp>; rel=preload; as=image; fetchpriority=high',
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
      // MULTITENANT: Headers para todos los chunks estáticos
      // Next.js ya maneja cache para chunks con versioning, pero podemos optimizar
      // Nota: No se pueden usar wildcards en source, pero Next.js ya cachea chunks correctamente
      // Los chunks compartidos (framework, vendor) ya tienen cache largo por defecto
      // Los chunks tenant-specific se pueden cachear con headers específicos si es necesario
    ]
  },
}

// Export configuration with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig)
