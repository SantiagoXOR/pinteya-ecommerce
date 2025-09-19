// ===================================
// PERFORMANCE BUDGETS CONFIGURATION
// ===================================
// Configuración centralizada de presupuestos de performance para CI/CD

module.exports = {
  // ===================================
  // CONFIGURACIÓN GENERAL
  // ===================================
  general: {
    // Entornos donde aplicar presupuestos
    environments: ['production', 'staging', 'ci'],
    
    // Configuración de reportes
    reporting: {
      enabled: true,
      formats: ['json', 'markdown', 'csv'],
      outputDir: 'performance-reports',
      retentionDays: 30
    },
    
    // Configuración de notificaciones
    notifications: {
      slack: {
        enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channels: {
          critical: '#alerts-critical',
          warnings: '#performance-warnings',
          reports: '#performance-reports'
        }
      },
      email: {
        enabled: false,
        recipients: ['dev-team@pinteya.com'],
        dailyReports: true
      }
    }
  },

  // ===================================
  // PRESUPUESTOS DE PERFORMANCE
  // ===================================
  budgets: {
    // Presupuestos críticos - fallan el build
    critical: {
      // Bundle JavaScript total
      totalBundleSize: {
        threshold: 500 * 1024, // 500KB
        warning: 400 * 1024,   // 400KB
        unit: 'bytes',
        description: 'Tamaño total del bundle JavaScript',
        category: 'critical',
        failBuild: true
      },

      // First Load JS - crítico para performance inicial
      firstLoadJS: {
        threshold: 128 * 1024, // 128KB (recomendación Next.js)
        warning: 100 * 1024,   // 100KB
        unit: 'bytes',
        description: 'JavaScript cargado en la primera carga',
        category: 'critical',
        failBuild: true
      },

      // Score de performance general
      performanceScore: {
        threshold: 85,          // Mínimo 85/100
        warning: 90,            // Warning si < 90
        unit: 'score',
        description: 'Score general de performance (0-100)',
        category: 'critical',
        failBuild: true
      },

      // Número máximo de chunks
      chunkCount: {
        threshold: 25,          // Máximo 25 chunks
        warning: 20,            // Warning si > 20
        unit: 'count',
        description: 'Número total de chunks generados',
        category: 'critical',
        failBuild: true
      }
    },

    // Presupuestos importantes - generan warnings
    important: {
      // CSS Bundle Size
      cssBundleSize: {
        threshold: 50 * 1024,  // 50KB
        warning: 40 * 1024,    // 40KB
        unit: 'bytes',
        description: 'Tamaño total del CSS',
        category: 'important',
        failBuild: false
      },

      // Largest Chunk Size
      largestChunkSize: {
        threshold: 150 * 1024, // 150KB
        warning: 120 * 1024,   // 120KB
        unit: 'bytes',
        description: 'Tamaño del chunk más grande',
        category: 'important',
        failBuild: false
      },

      // Duplicate Modules
      duplicateModules: {
        threshold: 5,           // Máximo 5 módulos duplicados
        warning: 3,             // Warning si > 3
        unit: 'count',
        description: 'Número de módulos duplicados',
        category: 'important',
        failBuild: false
      },

      // Unused Dependencies
      unusedDependencies: {
        threshold: 10,          // Máximo 10 dependencias no usadas
        warning: 5,             // Warning si > 5
        unit: 'count',
        description: 'Dependencias instaladas pero no utilizadas',
        category: 'important',
        failBuild: false
      }
    },

    // Presupuestos opcionales - solo para monitoreo
    optional: {
      // Image Assets
      imageAssets: {
        threshold: 200 * 1024, // 200KB
        warning: 150 * 1024,   // 150KB
        unit: 'bytes',
        description: 'Tamaño total de assets de imágenes',
        category: 'optional',
        failBuild: false
      },

      // Font Assets
      fontAssets: {
        threshold: 100 * 1024, // 100KB
        warning: 80 * 1024,    // 80KB
        unit: 'bytes',
        description: 'Tamaño total de fuentes',
        category: 'optional',
        failBuild: false
      },

      // Build Time
      buildTime: {
        threshold: 300,         // 5 minutos
        warning: 180,           // 3 minutos
        unit: 'seconds',
        description: 'Tiempo total de build',
        category: 'optional',
        failBuild: false
      }
    }
  },

  // ===================================
  // CONFIGURACIÓN POR ENTORNO
  // ===================================
  environments: {
    production: {
      // En producción, todos los presupuestos son más estrictos
      multipliers: {
        critical: 1.0,    // Sin relajación
        important: 1.0,
        optional: 1.0
      },
      failOnWarnings: false,
      enableDetailedReports: true
    },

    staging: {
      // En staging, permitir un poco más de flexibilidad
      multipliers: {
        critical: 1.1,    // 10% más permisivo
        important: 1.2,   // 20% más permisivo
        optional: 1.5     // 50% más permisivo
      },
      failOnWarnings: false,
      enableDetailedReports: true
    },

    development: {
      // En desarrollo, solo monitorear tendencias
      multipliers: {
        critical: 2.0,    // 100% más permisivo
        important: 2.0,
        optional: 3.0     // 200% más permisivo
      },
      failOnWarnings: false,
      enableDetailedReports: false
    },

    ci: {
      // En CI, usar configuración de producción pero con reportes detallados
      multipliers: {
        critical: 1.0,
        important: 1.1,   // Ligeramente más permisivo
        optional: 1.2
      },
      failOnWarnings: false,
      enableDetailedReports: true,
      enableComparisons: true  // Comparar con baseline
    }
  },

  // ===================================
  // CONFIGURACIÓN DE ANÁLISIS
  // ===================================
  analysis: {
    // Configuración de webpack-bundle-analyzer
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: false,
      analyzerMode: 'json',
      reportFilename: 'bundle-analysis.json'
    },

    // Configuración de análisis de dependencias
    dependencies: {
      checkUnused: true,
      checkDuplicates: true,
      checkOutdated: false,
      excludePatterns: [
        '@types/*',
        'eslint*',
        'prettier*',
        'jest*'
      ]
    },

    // Configuración de métricas de performance
    performance: {
      enableCoreWebVitals: true,
      enableLighthouse: false, // Requiere configuración adicional
      enableCustomMetrics: true
    }
  },

  // ===================================
  // CONFIGURACIÓN DE COMPARACIONES
  // ===================================
  comparisons: {
    // Configuración para comparar con baseline
    baseline: {
      enabled: true,
      branch: 'main',
      maxAge: 7, // días
      thresholds: {
        // Cambios que requieren atención
        significantIncrease: 0.05,  // 5% de aumento
        criticalIncrease: 0.10,     // 10% de aumento
        significantDecrease: -0.05  // 5% de mejora
      }
    },

    // Configuración para tracking histórico
    historical: {
      enabled: true,
      retentionDays: 90,
      trendAnalysis: true,
      alertOnRegression: true
    }
  },

  // ===================================
  // FUNCIONES HELPER
  // ===================================
  helpers: {
    // Obtener presupuesto ajustado por entorno
    getBudgetForEnvironment(budgetName, category, environment = 'production') {
      const config = module.exports;
      const budget = config.budgets[category]?.[budgetName];
      if (!budget) return null;

      const envConfig = config.environments[environment];
      const multiplier = envConfig?.multipliers?.[category] || 1.0;

      return {
        ...budget,
        threshold: Math.round(budget.threshold * multiplier),
        warning: Math.round(budget.warning * multiplier)
      };
    },

    // Verificar si un valor viola el presupuesto
    checkBudgetViolation(value, budget, environment = 'production') {
      const config = module.exports;
      const adjustedBudget = config.helpers.getBudgetForEnvironment(budget.name, budget.category, environment);
      if (!adjustedBudget) return { violation: false };

      const isError = value > adjustedBudget.threshold;
      const isWarning = value > adjustedBudget.warning && !isError;

      return {
        violation: isError || isWarning,
        severity: isError ? 'error' : (isWarning ? 'warning' : 'ok'),
        value,
        threshold: adjustedBudget.threshold,
        warning: adjustedBudget.warning,
        difference: value - adjustedBudget.threshold,
        percentageOver: ((value - adjustedBudget.threshold) / adjustedBudget.threshold) * 100
      };
    },

    // Formatear bytes para display
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    // Formatear tiempo para display
    formatTime(seconds) {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  }
};
