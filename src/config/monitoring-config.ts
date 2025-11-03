// ===================================
// MONITORING CONFIGURATION
// Configuración centralizada para el sistema de monitoring
// ===================================

export interface MonitoringConfig {
  // Configuración general
  enabled: boolean
  environment: 'development' | 'production' | 'staging'
  version: string

  // Configuración de métricas
  metrics: {
    collectInterval: number // ms
    retentionPeriod: number // ms
    batchSize: number
    enableWebVitals: boolean
    enableApiMetrics: boolean
    enableErrorTracking: boolean
  }

  // Configuración de alertas
  alerts: {
    enabled: boolean
    thresholds: {
      responseTime: number // ms
      errorRate: number // percentage (0-1)
      memoryUsage: number // MB
      cpuUsage: number // percentage (0-1)
    }
    channels: {
      console: boolean
      webhook?: string
      email?: string[]
    }
  }

  // Configuración de health checks
  healthCheck: {
    enabled: boolean
    interval: number // ms
    timeout: number // ms
    endpoints: {
      api: boolean
      database: boolean
      memory: boolean
      performance: boolean
    }
  }

  // Configuración de storage
  storage: {
    type: 'memory' | 'redis' | 'database'
    maxEntries: number
    compression: boolean
  }

  // Configuración de reporting
  reporting: {
    enabled: boolean
    interval: number // ms
    includeDetails: boolean
    exportFormats: ('json' | 'csv' | 'pdf')[]
  }
}

// Configuración por defecto
const defaultConfig: MonitoringConfig = {
  enabled: true,
  environment: (process.env.NODE_ENV as any) || 'development',
  version: process.env.npm_package_version || '1.0.0',

  metrics: {
    collectInterval: 5000, // 5 segundos
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 horas
    batchSize: 100,
    enableWebVitals: true,
    enableApiMetrics: true,
    enableErrorTracking: true,
  },

  alerts: {
    enabled: process.env.NODE_ENV === 'production',
    thresholds: {
      responseTime: 2000, // 2 segundos
      errorRate: 0.05, // 5%
      memoryUsage: 512, // 512 MB
      cpuUsage: 0.8, // 80%
    },
    channels: {
      console: true,
      webhook: process.env.MONITORING_WEBHOOK_URL,
      email: process.env.MONITORING_EMAIL_ALERTS?.split(','),
    },
  },

  healthCheck: {
    enabled: true,
    interval: 30000, // 30 segundos
    timeout: 5000, // 5 segundos
    endpoints: {
      api: true,
      database: true,
      memory: true,
      performance: true,
    },
  },

  storage: {
    type: (process.env.MONITORING_STORAGE_TYPE as any) || 'memory',
    maxEntries: 10000,
    compression: process.env.NODE_ENV === 'production',
  },

  reporting: {
    enabled: true,
    interval: 60000, // 1 minuto
    includeDetails: process.env.NODE_ENV !== 'production',
    exportFormats: ['json'],
  },
}

// Configuraciones específicas por entorno
const environmentConfigs: Record<string, Partial<MonitoringConfig>> = {
  development: {
    metrics: {
      collectInterval: 10000, // Menos frecuente en desarrollo
      retentionPeriod: 60 * 60 * 1000, // 1 hora
    },
    alerts: {
      enabled: false, // Sin alertas en desarrollo
    },
    storage: {
      maxEntries: 1000, // Menos entradas en desarrollo
    },
  },

  staging: {
    metrics: {
      collectInterval: 5000,
      retentionPeriod: 12 * 60 * 60 * 1000, // 12 horas
    },
    alerts: {
      enabled: true,
      channels: {
        console: true,
        webhook: undefined, // Sin webhook en staging
      },
    },
    storage: {
      maxEntries: 5000,
    },
  },

  production: {
    metrics: {
      collectInterval: 3000, // Más frecuente en producción
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 días
    },
    alerts: {
      enabled: true,
      thresholds: {
        responseTime: 1500, // Más estricto en producción
        errorRate: 0.02, // 2%
        memoryUsage: 1024, // 1 GB
        cpuUsage: 0.7, // 70%
      },
    },
    storage: {
      type: 'redis', // Redis en producción
      maxEntries: 50000,
      compression: true,
    },
    reporting: {
      interval: 30000, // Más frecuente en producción
      includeDetails: false, // Sin detalles en producción por performance
      exportFormats: ['json', 'csv'],
    },
  },
}

// Función para obtener la configuración final
export function getMonitoringConfig(): MonitoringConfig {
  const environment = process.env.NODE_ENV || 'development'
  
  // 🔧 DESACTIVAR MONITORING DURANTE BUILD
  // Evita errores de persistencia de alertas y reduce consumo de memoria
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.VERCEL_ENV === 'production' && !process.env.RUNTIME
  
  const envConfig = environmentConfigs[environment] || {}

  // Merge deep de configuraciones
  const config = {
    ...defaultConfig,
    ...envConfig,
    // 🔧 DESACTIVAR MONITORING DURANTE BUILD TIME
    enabled: isBuildTime ? false : (envConfig.enabled ?? defaultConfig.enabled),
    metrics: {
      ...defaultConfig.metrics,
      ...envConfig.metrics,
      enableWebVitals: isBuildTime ? false : (envConfig.metrics?.enableWebVitals ?? defaultConfig.metrics.enableWebVitals),
      enableApiMetrics: isBuildTime ? false : (envConfig.metrics?.enableApiMetrics ?? defaultConfig.metrics.enableApiMetrics),
      enableErrorTracking: isBuildTime ? false : (envConfig.metrics?.enableErrorTracking ?? defaultConfig.metrics.enableErrorTracking),
    },
    alerts: {
      ...defaultConfig.alerts,
      ...envConfig.alerts,
      // ⚡ DESACTIVAR ALERTAS DURANTE BUILD
      enabled: isBuildTime ? false : (envConfig.alerts?.enabled ?? defaultConfig.alerts.enabled),
      thresholds: {
        ...defaultConfig.alerts.thresholds,
        ...envConfig.alerts?.thresholds,
      },
      channels: {
        ...defaultConfig.alerts.channels,
        ...envConfig.alerts?.channels,
      },
    },
    healthCheck: {
      ...defaultConfig.healthCheck,
      ...envConfig.healthCheck,
      // ⚡ DESACTIVAR HEALTH CHECKS DURANTE BUILD
      enabled: isBuildTime ? false : (envConfig.healthCheck?.enabled ?? defaultConfig.healthCheck.enabled),
      endpoints: {
        ...defaultConfig.healthCheck.endpoints,
        ...envConfig.healthCheck?.endpoints,
      },
    },
    storage: {
      ...defaultConfig.storage,
      ...envConfig.storage,
    },
    reporting: {
      ...defaultConfig.reporting,
      ...envConfig.reporting,
      // ⚡ DESACTIVAR REPORTING DURANTE BUILD
      enabled: isBuildTime ? false : (envConfig.reporting?.enabled ?? defaultConfig.reporting.enabled),
    },
  }

  return config
}

// Configuración singleton
let configInstance: MonitoringConfig | null = null

export function getConfig(): MonitoringConfig {
  if (!configInstance) {
    configInstance = getMonitoringConfig()
  }
  return configInstance
}

// Función para validar la configuración
export function validateConfig(config: MonitoringConfig): string[] {
  const errors: string[] = []

  if (config.metrics.collectInterval < 1000) {
    errors.push('metrics.collectInterval debe ser al menos 1000ms')
  }

  if (config.metrics.retentionPeriod < 60000) {
    errors.push('metrics.retentionPeriod debe ser al menos 60000ms (1 minuto)')
  }

  if (config.alerts.thresholds.responseTime < 100) {
    errors.push('alerts.thresholds.responseTime debe ser al menos 100ms')
  }

  if (config.alerts.thresholds.errorRate < 0 || config.alerts.thresholds.errorRate > 1) {
    errors.push('alerts.thresholds.errorRate debe estar entre 0 y 1')
  }

  if (config.storage.maxEntries < 100) {
    errors.push('storage.maxEntries debe ser al menos 100')
  }

  return errors
}

// Función para logging de configuración
export function logConfig(): void {
  const config = getConfig()
  const errors = validateConfig(config)

  console.log('🔧 Monitoring Configuration:', {
    environment: config.environment,
    version: config.version,
    enabled: config.enabled,
    metricsInterval: config.metrics.collectInterval,
    alertsEnabled: config.alerts.enabled,
    storageType: config.storage.type,
  })

  if (errors.length > 0) {
    console.warn('⚠️ Configuration warnings:', errors)
  } else {
    console.log('✅ Configuration is valid')
  }
}

// Exportar configuración por defecto
export default getConfig
