// =====================================================
// CONFIGURACIÓN: NEXT.JS LOGISTICS OPTIMIZATION
// Descripción: Configuración optimizada para el módulo de logística
// Basado en: Bundle Splitting + Code Splitting + Performance
// =====================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // =====================================================
  // OPTIMIZACIONES EXPERIMENTALES
  // =====================================================
  experimental: {
    // Optimizar imports de librerías grandes
    optimizePackageImports: [
      'maplibre-gl',
      'recharts',
      'lodash-es',
      '@tanstack/react-query'
    ],
    
    // Lazy compilation para desarrollo más rápido
    webpackBuildWorker: true,
    
    // Optimizar CSS
    optimizeCss: true,
    
    // Turbo mode para builds más rápidos
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },

  // =====================================================
  // CONFIGURACIÓN DE WEBPACK
  // =====================================================
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // =====================================================
    // BUNDLE SPLITTING OPTIMIZADO
    // =====================================================
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunks separados
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all'
          },
          
          // Chunk específico para MapLibre GL JS
          maplibre: {
            test: /[\\/]node_modules[\\/]maplibre-gl[\\/]/,
            name: 'maplibre',
            priority: 20,
            chunks: 'all'
          },
          
          // Chunk para librerías de charts
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 20,
            chunks: 'all'
          },
          
          // Chunk para utilidades
          utils: {
            test: /[\\/]node_modules[\\/](lodash|date-fns|clsx)[\\/]/,
            name: 'utils',
            priority: 15,
            chunks: 'all'
          },
          
          // Chunk específico para logística
          logistics: {
            test: /[\\/]src[\\/](components|hooks|lib)[\\/].*logistics[\\/]/,
            name: 'logistics',
            priority: 30,
            chunks: 'all',
            minSize: 20000
          },
          
          // Chunk para componentes pesados (ShopDetails, ShopWithSidebar)
          shopComponents: {
            test: /[\\/]src[\\/]components[\\/](ShopDetails|ShopWithSidebar)[\\/]/,
            name: 'shop-components',
            priority: 35,
            chunks: 'all',
            minSize: 30000
          },
          
          // Chunk para checkout y componentes de pago
          checkout: {
            test: /[\\/]src[\\/]components[\\/]Checkout[\\/]/,
            name: 'checkout',
            priority: 35,
            chunks: 'all',
            minSize: 25000
          },
          
          // Chunk para componentes UI comunes
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 25,
            chunks: 'all'
          },
          
          // Chunk por defecto
          default: {
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true
          }
        }
      };
    }

    // =====================================================
    // OPTIMIZACIONES DE MÓDULOS
    // =====================================================
    
    // Alias para imports más eficientes
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components/logistics': path.resolve(__dirname, 'src/components/admin/logistics'),
      '@/hooks/logistics': path.resolve(__dirname, 'src/hooks/admin'),
      '@/lib/logistics': path.resolve(__dirname, 'src/lib/logistics')
    };

    // Optimizar imports de lodash
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^lodash$/,
        'lodash-es'
      )
    );

    // =====================================================
    // OPTIMIZACIONES DE MAPLIBRE GL JS
    // =====================================================
    
    // MapLibre GL JS requiere configuración especial
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/maplibre-gl/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime']
        }
      }
    });

    // Configurar workers para MapLibre
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/'
        }
      }
    });

    // =====================================================
    // OPTIMIZACIONES DE ASSETS
    // =====================================================
    
    // Optimizar SVGs
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    });

    // Optimizar imágenes
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp)$/,
      use: {
        loader: 'next-optimized-images',
        options: {
          optimizeImages: true,
          optimizeImagesInDev: false,
          mozjpeg: {
            quality: 80
          },
          optipng: {
            optimizationLevel: 3
          },
          webp: {
            quality: 80
          }
        }
      }
    });

    // =====================================================
    // TREE SHAKING OPTIMIZADO
    // =====================================================
    
    // Marcar side effects para tree shaking
    config.module.rules.push({
      test: /\.js$/,
      sideEffects: false,
      include: [
        /src\/lib\/logistics/,
        /src\/hooks\/admin/,
        /src\/components\/admin\/logistics/
      ]
    });

    // =====================================================
    // ANÁLISIS DE BUNDLE
    // =====================================================
    
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html'
        })
      );
    }

    return config;
  },

  // =====================================================
  // CONFIGURACIÓN DE IMÁGENES
  // =====================================================
  images: {
    domains: [
      'api.maptiler.com',
      'tiles.stadiamaps.com',
      'cdn.jsdelivr.net'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // =====================================================
  // HEADERS DE PERFORMANCE
  // =====================================================
  async headers() {
    return [
      {
        source: '/admin/logistics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/api/admin/logistics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://pinteya.com' 
              : 'http://localhost:3000'
          }
        ]
      }
    ];
  },

  // =====================================================
  // CONFIGURACIÓN DE COMPRESIÓN
  // =====================================================
  compress: true,
  
  // =====================================================
  // CONFIGURACIÓN DE DESARROLLO
  // =====================================================
  ...(process.env.NODE_ENV === 'development' && {
    // Optimizaciones para desarrollo
    webpack: (config, options) => {
      // Fast refresh optimizado
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      };

      // Source maps optimizados
      config.devtool = 'eval-cheap-module-source-map';

      return config;
    }
  }),

  // =====================================================
  // CONFIGURACIÓN DE PRODUCCIÓN
  // =====================================================
  ...(process.env.NODE_ENV === 'production' && {
    // Optimizaciones para producción
    swcMinify: true,
    
    // Configuración de output
    output: 'standalone',
    
    // Configuración de compresión
    compress: true,
    
    // Configuración de assets
    assetPrefix: process.env.CDN_URL || '',
    
    // Configuración de PWA
    pwa: {
      dest: 'public',
      register: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.maptiler\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'maptiler-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
            }
          }
        }
      ]
    }
  })
};

// =====================================================
// PLUGINS ADICIONALES
// =====================================================

const withPlugins = require('next-compose-plugins');

const plugins = [
  // Plugin para análisis de bundle
  process.env.ANALYZE === 'true' && [
    require('@next/bundle-analyzer')({
      enabled: true
    })
  ],
  
  // Plugin para PWA
  process.env.NODE_ENV === 'production' && [
    require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true
    })
  ],
  
  // Plugin para optimización de imágenes
  [
    require('next-optimized-images'),
    {
      optimizeImages: process.env.NODE_ENV === 'production',
      optimizeImagesInDev: false
    }
  ]
].filter(Boolean);

module.exports = withPlugins(plugins, nextConfig);
