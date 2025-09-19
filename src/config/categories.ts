/**
 * Categories Configuration System
 * Dynamic configuration for Categories component
 * Pinteya E-commerce - Enterprise Configuration
 */

import React from 'react';
import type { Category, CategoriesConfig } from '@/types/categories';

/**
 * Environment-based configuration
 */
interface EnvironmentConfig {
  /** API endpoints */
  apiEndpoints: {
    categories: string;
    categoryCount: string;
    categorySearch: string;
  };
  /** Feature flags */
  features: {
    enableAnalytics: boolean;
    enableBackgroundRefresh: boolean;
    enableCaching: boolean;
    enableKeyboardNavigation: boolean;
    enableErrorReporting: boolean;
  };
  /** Performance settings */
  performance: {
    cacheDuration: number;
    refreshInterval: number;
    maxCategories: number;
    debounceDelay: number;
  };
  /** UI settings */
  ui: {
    defaultVariant: 'default' | 'compact' | 'minimal';
    defaultSize: 'sm' | 'md' | 'lg';
    showCounts: boolean;
    enableAnimations: boolean;
  };
}

/**
 * Development configuration
 */
const developmentConfig: EnvironmentConfig = {
  apiEndpoints: {
    categories: '/api/categories',
    categoryCount: '/api/categories/count',
    categorySearch: '/api/categories/search',
  },
  features: {
    enableAnalytics: true,
    enableBackgroundRefresh: true,
    enableCaching: true,
    enableKeyboardNavigation: true,
    enableErrorReporting: true,
  },
  performance: {
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    maxCategories: 20,
    debounceDelay: 300,
  },
  ui: {
    defaultVariant: 'default',
    defaultSize: 'md',
    showCounts: true,
    enableAnimations: true,
  },
};

/**
 * Production configuration
 */
const productionConfig: EnvironmentConfig = {
  apiEndpoints: {
    categories: '/api/categories',
    categoryCount: '/api/categories/count',
    categorySearch: '/api/categories/search',
  },
  features: {
    enableAnalytics: true,
    enableBackgroundRefresh: true,
    enableCaching: true,
    enableKeyboardNavigation: true,
    enableErrorReporting: true,
  },
  performance: {
    cacheDuration: 15 * 60 * 1000, // 15 minutes
    refreshInterval: 60 * 60 * 1000, // 1 hour
    maxCategories: 15,
    debounceDelay: 500,
  },
  ui: {
    defaultVariant: 'default',
    defaultSize: 'md',
    showCounts: false, // Hide counts in production for cleaner UI
    enableAnimations: true,
  },
};

/**
 * Test configuration
 */
const testConfig: EnvironmentConfig = {
  apiEndpoints: {
    categories: '/api/test/categories',
    categoryCount: '/api/test/categories/count',
    categorySearch: '/api/test/categories/search',
  },
  features: {
    enableAnalytics: false,
    enableBackgroundRefresh: false,
    enableCaching: false,
    enableKeyboardNavigation: true,
    enableErrorReporting: false,
  },
  performance: {
    cacheDuration: 1000, // 1 second for testing
    refreshInterval: 5000, // 5 seconds for testing
    maxCategories: 5,
    debounceDelay: 100,
  },
  ui: {
    defaultVariant: 'default',
    defaultSize: 'md',
    showCounts: true,
    enableAnimations: false, // Disable animations in tests
  },
};

/**
 * Get configuration based on environment
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return developmentConfig;
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
};

/**
 * Remote configuration interface
 */
interface RemoteConfig {
  /** Configuration version */
  version: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Categories configuration */
  categories: {
    enabled: boolean;
    maxVisible: number;
    layout: 'grid' | 'list' | 'carousel';
    variants: string[];
  };
  /** Feature toggles */
  features: Record<string, boolean>;
  /** A/B testing configurations */
  experiments: Record<string, {
    enabled: boolean;
    variant: string;
    percentage: number;
  }>;
}

/**
 * Fetch remote configuration
 */
export const fetchRemoteConfig = async (): Promise<RemoteConfig | null> => {
  try {
    const response = await fetch('/api/config/categories');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    
    // Validate configuration structure
    if (!config.version || !config.categories) {
      throw new Error('Invalid configuration format');
    }

    return config;
  } catch (error) {
    console.warn('Failed to fetch remote configuration:', error);
    return null;
  }
};

/**
 * Merge configurations with priority: remote > environment > default
 */
export const getMergedConfig = async (): Promise<CategoriesConfig> => {
  const envConfig = getEnvironmentConfig();
  const remoteConfig = await fetchRemoteConfig();

  // Base configuration from environment
  const baseConfig: CategoriesConfig = {
    defaultVariant: envConfig.ui.defaultVariant,
    defaultSize: envConfig.ui.defaultSize,
    maxCategories: envConfig.performance.maxCategories,
    enableAnalytics: envConfig.features.enableAnalytics,
    enableKeyboardNavigation: envConfig.features.enableKeyboardNavigation,
    animationDuration: 200,
    urlUpdateDelay: envConfig.performance.debounceDelay,
  };

  // Apply remote configuration overrides if available
  if (remoteConfig) {
    return {
      ...baseConfig,
      maxCategories: remoteConfig.categories.maxVisible || baseConfig.maxCategories,
      enableAnalytics: remoteConfig.features.analytics ?? baseConfig.enableAnalytics,
      enableKeyboardNavigation: remoteConfig.features.keyboardNavigation ?? baseConfig.enableKeyboardNavigation,
    };
  }

  return baseConfig;
};

/**
 * Configuration cache
 */
let configCache: {
  config: CategoriesConfig;
  timestamp: number;
  ttl: number;
} | null = null;

/**
 * Get cached configuration or fetch new one
 */
export const getCachedConfig = async (ttl = 5 * 60 * 1000): Promise<CategoriesConfig> => {
  const now = Date.now();

  // Return cached config if valid
  if (configCache && (now - configCache.timestamp) < configCache.ttl) {
    return configCache.config;
  }

  // Fetch new configuration
  const config = await getMergedConfig();

  // Update cache
  configCache = {
    config,
    timestamp: now,
    ttl,
  };

  return config;
};

/**
 * Clear configuration cache
 */
export const clearConfigCache = (): void => {
  configCache = null;
};

/**
 * Configuration provider hook
 */
export const useCategoryConfig = () => {
  const [config, setConfig] = React.useState<CategoriesConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const newConfig = await getCachedConfig();
        setConfig(newConfig);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
        setError(errorMessage);
        
        // Fallback to environment config
        const envConfig = getEnvironmentConfig();
        setConfig({
          defaultVariant: envConfig.ui.defaultVariant,
          defaultSize: envConfig.ui.defaultSize,
          maxCategories: envConfig.performance.maxCategories,
          enableAnalytics: envConfig.features.enableAnalytics,
          enableKeyboardNavigation: envConfig.features.enableKeyboardNavigation,
          animationDuration: 200,
          urlUpdateDelay: envConfig.performance.debounceDelay,
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const refreshConfig = React.useCallback(async () => {
    clearConfigCache();
    await loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refreshConfig,
  };
};

/**
 * Export current environment configuration
 */
export const currentConfig = getEnvironmentConfig();

/**
 * Export configuration utilities
 */
export const configUtils = {
  getEnvironmentConfig,
  fetchRemoteConfig,
  getMergedConfig,
  getCachedConfig,
  clearConfigCache,
};









