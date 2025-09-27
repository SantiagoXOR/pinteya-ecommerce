// ===================================
// WEBPACK OPTIMIZATION CONFIGURATION
// ===================================
// Configuración avanzada de webpack para optimización de bundles

import type { Configuration } from 'webpack'

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface WebpackOptimizationOptions {
  enableAdvancedSplitting: boolean
  enableTreeShaking: boolean
  enableCompression: boolean
  enableCaching: boolean
  enablePreloading: boolean
  performanceMode: 'development' | 'production' | 'analysis'
  customChunks?: CustomChunkConfig[]
}

export interface CustomChunkConfig {
  name: string
  test: RegExp
  priority: number
  minSize?: number
  maxSize?: number
  enforce?: boolean
}

// ===================================
// CONFIGURACIÓN DE CHUNKS AVANZADA
// ===================================

export function getAdvancedSplitChunksConfig(options: WebpackOptimizationOptions) {
  const baseConfig = {
    chunks: 'all' as const,
    minSize: 20000,
    maxSize: 250000,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    cacheGroups: {},
  }

  // ===================================
  // CACHE GROUPS OPTIMIZADOS
  // ===================================

  const cacheGroups: Record<string, any> = {
    // Framework core (React, Next.js)
    framework: {
      name: 'framework',
      test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
      priority: 40,
      chunks: 'all',
      enforce: true,
      reuseExistingChunk: true,
    },

    // Vendor libraries críticas
    vendor: {
      name: 'vendor',
      test: /[\\/]node_modules[\\/](?!(react|react-dom|next)[\\/])/,
      priority: 20,
      chunks: 'all',
      minSize: 30000,
      maxSize: 200000,
      reuseExistingChunk: true,
    },

    // UI Components (Radix UI, Lucide)
    uiComponents: {
      name: 'ui-components',
      test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|@headlessui)[\\/]/,
      priority: 35,
      chunks: 'all',
      enforce: true,
      reuseExistingChunk: true,
    },

    // Charts y visualización
    charts: {
      name: 'charts',
      test: /[\\/]node_modules[\\/](recharts|d3|chart\.js|victory)[\\/]/,
      priority: 30,
      chunks: 'all',
      minSize: 50000,
      reuseExistingChunk: true,
    },

    // Mapas y geolocalización
    maps: {
      name: 'maps',
      test: /[\\/]node_modules[\\/](maplibre-gl|mapbox-gl|leaflet)[\\/]/,
      priority: 30,
      chunks: 'all',
      minSize: 100000,
      reuseExistingChunk: true,
    },

    // Utilidades y helpers
    utils: {
      name: 'utils',
      test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority|tailwind-merge)[\\/]/,
      priority: 25,
      chunks: 'all',
      minSize: 20000,
      maxSize: 100000,
      reuseExistingChunk: true,
    },

    // Animaciones
    animations: {
      name: 'animations',
      test: /[\\/]node_modules[\\/](framer-motion|lottie-react|react-spring)[\\/]/,
      priority: 25,
      chunks: 'all',
      minSize: 50000,
      reuseExistingChunk: true,
    },

    // Forms y validación
    forms: {
      name: 'forms',
      test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod|yup)[\\/]/,
      priority: 25,
      chunks: 'all',
      minSize: 30000,
      reuseExistingChunk: true,
    },

    // Auth y seguridad
    auth: {
      name: 'auth',
      test: /[\\/]node_modules[\\/](@auth|next-auth|supabase)[\\/]/,
      priority: 30,
      chunks: 'all',
      minSize: 40000,
      reuseExistingChunk: true,
    },

    // Componentes de aplicación específicos
    appComponents: {
      name: 'app-components',
      test: /[\\/]src[\\/]components[\\/](?!ui[\\/])/,
      priority: 15,
      chunks: 'all',
      minSize: 30000,
      maxSize: 150000,
      reuseExistingChunk: true,
    },

    // Sistema de diseño (UI components)
    designSystem: {
      name: 'design-system',
      test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
      priority: 20,
      chunks: 'all',
      minSize: 20000,
      maxSize: 100000,
      reuseExistingChunk: true,
    },

    // Hooks y utilidades de aplicación
    appUtils: {
      name: 'app-utils',
      test: /[\\/]src[\\/](hooks|lib|utils)[\\/]/,
      priority: 15,
      chunks: 'all',
      minSize: 20000,
      maxSize: 80000,
      reuseExistingChunk: true,
    },

    // Admin panel específico
    admin: {
      name: 'admin',
      test: /[\\/]src[\\/](app[\\/]admin|components[\\/]admin)[\\/]/,
      priority: 25,
      chunks: 'async',
      minSize: 40000,
      maxSize: 200000,
      reuseExistingChunk: true,
    },

    // E-commerce específico
    ecommerce: {
      name: 'ecommerce',
      test: /[\\/]src[\\/](app[\\/](shop|cart|checkout)|components[\\/](shop|cart|checkout))[\\/]/,
      priority: 20,
      chunks: 'all',
      minSize: 30000,
      maxSize: 150000,
      reuseExistingChunk: true,
    },

    // Páginas comunes
    common: {
      name: 'common',
      test: /[\\/]src[\\/]/,
      priority: 5,
      chunks: 'all',
      minSize: 30000,
      maxSize: 100000,
      minChunks: 2,
      reuseExistingChunk: true,
    },
  }

  // Agregar chunks personalizados si se proporcionan
  if (options.customChunks) {
    options.customChunks.forEach(chunk => {
      cacheGroups[chunk.name] = {
        name: chunk.name,
        test: chunk.test,
        priority: chunk.priority,
        chunks: 'all',
        minSize: chunk.minSize || 20000,
        maxSize: chunk.maxSize || 250000,
        enforce: chunk.enforce || false,
        reuseExistingChunk: true,
      }
    })
  }

  return {
    ...baseConfig,
    cacheGroups,
  }
}

// ===================================
// CONFIGURACIÓN DE OPTIMIZACIÓN
// ===================================

export function getOptimizationConfig(
  options: WebpackOptimizationOptions
): Configuration['optimization'] {
  const isProduction = options.performanceMode === 'production'
  const isAnalysis = options.performanceMode === 'analysis'

  return {
    // Split chunks avanzado
    splitChunks: options.enableAdvancedSplitting
      ? getAdvancedSplitChunksConfig(options)
      : undefined,

    // Runtime chunk
    runtimeChunk: isProduction ? 'single' : false,

    // Minimización
    minimize: isProduction,
    minimizer: isProduction ? [] : undefined, // Next.js maneja esto automáticamente

    // Module concatenation (scope hoisting)
    concatenateModules: isProduction,

    // Tree shaking
    usedExports: options.enableTreeShaking,
    sideEffects: false,

    // Chunk IDs
    chunkIds: isProduction ? 'deterministic' : 'named',
    moduleIds: isProduction ? 'deterministic' : 'named',

    // Optimización de módulos
    providedExports: true,
    innerGraph: true,

    // Mangling
    mangleExports: isProduction ? 'deterministic' : false,

    // Eliminación de código muerto
    removeAvailableModules: isProduction,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,

    // Análisis de dependencias
    flagIncludedChunks: isProduction,

    // Configuración específica para análisis
    ...(isAnalysis && {
      splitChunks: {
        ...getAdvancedSplitChunksConfig(options),
        maxSize: 1000000, // Chunks más grandes para análisis
        hidePathInfo: false,
      },
    }),
  }
}

// ===================================
// CONFIGURACIÓN DE PERFORMANCE
// ===================================

export function getPerformanceConfig(
  options: WebpackOptimizationOptions
): Configuration['performance'] {
  if (options.performanceMode === 'development') {
    return false
  }

  return {
    hints: options.performanceMode === 'analysis' ? 'warning' : 'error',
    maxEntrypointSize: 250000, // 250KB
    maxAssetSize: 250000, // 250KB
    assetFilter: (assetFilename: string) => {
      // Solo analizar archivos JS y CSS
      return /\.(js|css)$/.test(assetFilename)
    },
  }
}

// ===================================
// CONFIGURACIÓN DE RESOLVE
// ===================================

export function getResolveConfig(options: WebpackOptimizationOptions): Configuration['resolve'] {
  return {
    // Extensiones optimizadas
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

    // Alias para optimización
    alias: {
      // Optimizaciones específicas para librerías pesadas
      ...(options.enableTreeShaking && {
        lodash: 'lodash-es',
        'date-fns': 'date-fns/esm',
      }),
    },

    // Módulos principales
    mainFields: ['browser', 'module', 'main'],

    // Optimización de resolución
    symlinks: false,
    cacheWithContext: false,

    // Fallbacks para Node.js modules en browser
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
    },
  }
}

// ===================================
// CONFIGURACIÓN DE MODULE RULES
// ===================================

export function getModuleRulesOptimization(options: WebpackOptimizationOptions) {
  const rules = []

  // Tree shaking para módulos específicos
  if (options.enableTreeShaking) {
    rules.push({
      test: /\.js$/,
      include: [/node_modules\/lodash-es/, /node_modules\/date-fns/, /src\/lib/, /src\/utils/],
      sideEffects: false,
    })
  }

  // Optimización de imports
  rules.push({
    test: /\.(ts|tsx|js|jsx)$/,
    include: /src/,
    use: {
      loader: 'babel-loader',
      options: {
        plugins: [
          // Plugin para optimizar imports de librerías
          [
            'import',
            {
              libraryName: 'lodash',
              libraryDirectory: '',
              camel2DashComponentName: false,
            },
            'lodash',
          ],
          [
            'import',
            {
              libraryName: 'date-fns',
              libraryDirectory: '',
              camel2DashComponentName: false,
            },
            'date-fns',
          ],
        ],
      },
    },
  })

  return rules
}

// ===================================
// CONFIGURACIÓN COMPLETA
// ===================================

export function createOptimizedWebpackConfig(
  baseConfig: Configuration,
  options: WebpackOptimizationOptions
): Configuration {
  return {
    ...baseConfig,
    optimization: {
      ...baseConfig.optimization,
      ...getOptimizationConfig(options),
    },
    performance: getPerformanceConfig(options),
    resolve: {
      ...baseConfig.resolve,
      ...getResolveConfig(options),
    },
    module: {
      ...baseConfig.module,
      rules: [...(baseConfig.module?.rules || []), ...getModuleRulesOptimization(options)],
    },
  }
}

// ===================================
// CONFIGURACIONES PREDEFINIDAS
// ===================================

export const OPTIMIZATION_PRESETS = {
  development: {
    enableAdvancedSplitting: false,
    enableTreeShaking: false,
    enableCompression: false,
    enableCaching: true,
    enablePreloading: false,
    performanceMode: 'development' as const,
  },

  production: {
    enableAdvancedSplitting: true,
    enableTreeShaking: true,
    enableCompression: true,
    enableCaching: true,
    enablePreloading: true,
    performanceMode: 'production' as const,
  },

  analysis: {
    enableAdvancedSplitting: true,
    enableTreeShaking: true,
    enableCompression: false,
    enableCaching: false,
    enablePreloading: false,
    performanceMode: 'analysis' as const,
  },
} as const
