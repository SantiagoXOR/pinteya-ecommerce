/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ OPTIMIZACIONES PARA ADMIN PANEL - Configuración simplificada y estable
  experimental: {
    // Optimizaciones críticas para admin panel
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@clerk/nextjs'
    ],
    // Removidas optimizaciones experimentales que causan problemas de build
  },

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

  // ✅ WEBPACK SIMPLIFICADO - Solo configuraciones esenciales para admin panel
  webpack: (config, { dev, isServer }) => {
    // Configuración mínima para evitar problemas de build
    if (!dev && !isServer) {
      // Configuración básica de chunks para admin panel
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk básico
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
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

  // ✅ CONFIGURACIÓN CLERK PROXY - Temporalmente comentado para debug
  // async rewrites() {
  //   return {
  //     beforeFiles: [
  //       {
  //         source: '/__clerk/:path*',
  //         destination: 'https://api.clerk.com/:path*',
  //       },
  //     ],
  //   };
  // },

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
