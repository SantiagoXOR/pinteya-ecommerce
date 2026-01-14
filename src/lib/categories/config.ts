/**
 * Unified Category Configuration
 * Pinteya E-commerce - Centralized category configuration
 * 
 * This module unifies configuration from constants/categories.ts and config/categories.ts
 */

import type { CategoryConfig, CategoryComponentConfig } from './types'

// ===================================
// UI CONFIGURATION (from constants/categories.ts)
// ===================================

/**
 * Category UI configuration for dynamic product carousel
 */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  // Default - Envío Gratis (sin categoría seleccionada)
  default: {
    title: 'Envío Gratis',
    subtitle: 'Llega hoy en Córdoba Capital',
    iconUrl: '/images/icons/icon-envio.svg',
    color: 'green',
    bgGradient: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-green-500',
    textColor: 'text-green-700',
    slug: null,
  },
  
  // Categoría: Paredes
  paredes: {
    title: 'Pinturas para Paredes',
    subtitle: 'Látex, sintéticos y revestimientos',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/interiores.webp',
    color: 'blue',
    bgGradient: 'from-blue-50 to-cyan-50',
    badgeColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    slug: 'paredes',
  },
  
  // Categoría: Metales y Maderas
  'metales-y-maderas': {
    title: 'Metales y Maderas',
    subtitle: 'Esmaltes, barnices y protectores',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/maderas.webp',
    color: 'orange',
    bgGradient: 'from-orange-50 to-amber-50',
    badgeColor: 'bg-orange-500',
    textColor: 'text-orange-700',
    slug: 'metales-y-maderas',
  },
  
  // Categoría: Techos
  techos: {
    title: 'Impermeabilizantes',
    subtitle: 'Membranas líquidas y selladores',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/techos.webp',
    color: 'red',
    bgGradient: 'from-red-50 to-rose-50',
    badgeColor: 'bg-red-500',
    textColor: 'text-red-700',
    slug: 'techos',
  },
  
  // Categoría: Complementos
  complementos: {
    title: 'Herramientas y Accesorios',
    subtitle: 'Pinceles, rodillos y más',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/profesionales.webp',
    color: 'purple',
    bgGradient: 'from-purple-50 to-violet-50',
    badgeColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    slug: 'complementos',
  },
  
  // Categoría: Antihumedad
  antihumedad: {
    title: 'Antihumedad',
    subtitle: 'Soluciones contra la humedad',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/humedades.webp',
    color: 'teal',
    bgGradient: 'from-teal-50 to-cyan-50',
    badgeColor: 'bg-teal-500',
    textColor: 'text-teal-700',
    slug: 'antihumedad',
  },
  
  // Categoría: Piscinas
  Piscinas: {
    title: 'Piscinas',
    subtitle: 'Pinturas especiales para piscinas',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/category-images/categories/piscinas.webp',
    color: 'sky',
    bgGradient: 'from-sky-50 to-blue-50',
    badgeColor: 'bg-sky-500',
    textColor: 'text-sky-700',
    slug: 'Piscinas',
  },
  
  // Categoría: Reparaciones
  reparaciones: {
    title: 'Reparaciones',
    subtitle: 'Productos para reparar y restaurar',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/reparaciones.webp',
    color: 'indigo',
    bgGradient: 'from-indigo-50 to-blue-50',
    badgeColor: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    slug: 'reparaciones',
  },
  
  // Categoría: Pisos
  pisos: {
    title: 'Pisos',
    subtitle: 'Barnices y acabados para pisos',
    iconUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/category-images/categories/interiores.webp',
    color: 'amber',
    bgGradient: 'from-amber-50 to-yellow-50',
    badgeColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    slug: 'pisos',
  },
}

/**
 * Get category configuration by slug
 */
export function getCategoryConfig(slug: string | null): CategoryConfig {
  if (!slug) return CATEGORY_CONFIGS.default
  return CATEGORY_CONFIGS[slug] || CATEGORY_CONFIGS.default
}

/**
 * List of available category slugs
 */
export const CATEGORY_SLUGS = Object.keys(CATEGORY_CONFIGS).filter(key => key !== 'default')

// ===================================
// COMPONENT CONFIGURATION (from config/categories.ts)
// ===================================

/**
 * Environment-based configuration
 */
interface EnvironmentConfig {
  apiEndpoints: {
    categories: string
    categoryCount: string
    categorySearch: string
  }
  features: {
    enableAnalytics: boolean
    enableBackgroundRefresh: boolean
    enableCaching: boolean
    enableKeyboardNavigation: boolean
    enableErrorReporting: boolean
  }
  performance: {
    cacheDuration: number
    refreshInterval: number
    maxCategories: number
    debounceDelay: number
  }
  ui: {
    defaultVariant: 'default' | 'compact' | 'minimal'
    defaultSize: 'sm' | 'md' | 'lg'
    showCounts: boolean
    enableAnimations: boolean
  }
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
}

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
    showCounts: false,
    enableAnimations: true,
  },
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV

  switch (env) {
    case 'development':
      return developmentConfig
    case 'production':
      return productionConfig
    default:
      return developmentConfig
  }
}

/**
 * Get component configuration from environment
 */
export function getComponentConfig(): CategoryComponentConfig {
  const envConfig = getEnvironmentConfig()

  return {
    defaultVariant: envConfig.ui.defaultVariant,
    defaultSize: envConfig.ui.defaultSize,
    maxCategories: envConfig.performance.maxCategories,
    enableAnalytics: envConfig.features.enableAnalytics,
    enableKeyboardNavigation: envConfig.features.enableKeyboardNavigation,
    animationDuration: 200,
    urlUpdateDelay: envConfig.performance.debounceDelay,
    showCounts: envConfig.ui.showCounts,
  }
}

/**
 * Default component configuration
 */
export const DEFAULT_COMPONENT_CONFIG: CategoryComponentConfig = {
  defaultVariant: 'default',
  defaultSize: 'md',
  maxCategories: 20,
  enableAnalytics: true,
  enableKeyboardNavigation: true,
  animationDuration: 200,
  urlUpdateDelay: 300,
  showCounts: true,
}
