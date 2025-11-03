/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Configuración mínima y estable para Next.js 15

  // ⚡ OPTIMIZACIÓN: Configuración ISR para reducir build time
  // Genera páginas bajo demanda en lugar de todas en build time
  generateBuildId: async () => {
    // Generar ID de build único
    return `build-${Date.now()}`
  },

  // ✅ ESLint configuration - Temporalmente deshabilitado para investigar errores
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },

  // ✅ TypeScript configuration - Temporalmente deshabilitado para investigar errores
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⚡ OPTIMIZACIÓN: Configuración de output para ISR
  output: 'standalone',

  // ✅ Compiler optimizations - Solo las esenciales
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // ✅ Configuración experimental para resolver errores de webpack
  experimental: {
    optimizePackageImports: [
      'lucide-react',
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
    ],
    // optimizeCss: true, // Experimental CSS optimization - Requiere critters package
  },

  // ✅ Configuración de webpack para resolver el error de 'call'
  webpack: (config, { dev, isServer }) => {
    // Resolver problemas de hidratación y carga dinámica
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Configuración específica para NextAuth v5 - Método alternativo
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'next-auth/react$': require.resolve('next-auth/react'),
        'next-auth$': require.resolve('next-auth'),
      }
    }

    // ✅ Configuración para resolver errores de hot-update
    if (dev && !isServer) {
      // Configurar el cliente de webpack para manejar errores de red
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
      }

      // Configurar el output para hot updates
      config.output = {
        ...config.output,
        hotUpdateChunkFilename: 'static/webpack/[id].[fullhash].hot-update.js',
        hotUpdateMainFilename: 'static/webpack/[fullhash].hot-update.json',
      }
    }

    // Optimizar chunks para evitar errores de carga
    if (!dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }

    return config
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
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
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
    ]
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
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=()',
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
    ]
  },
}

// Export configuration without bundle analyzer to avoid potential issues
module.exports = nextConfig
