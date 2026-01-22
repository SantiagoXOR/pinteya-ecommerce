/**
 * Integrations Module Index - Pinteya E-commerce
 * Punto de entrada centralizado para integraciones de servicios externos
 * MercadoPago, Analytics, Supabase, Redis
 */

// =====================================================
// MERCADOPAGO INTEGRATION
// =====================================================
export * from '../mercadopago'
export * from '../mercadopago-mock'

// =====================================================
// ANALYTICS INTEGRATION
// =====================================================
export * from '../analytics'
export * from '../analytics-optimized'
export * from '../google-analytics'

// =====================================================
// EXTERNAL ANALYTICS APIs
// =====================================================
// Google Analytics 4 Data API
export * from './google-analytics-api'
// Meta Marketing API
export * from './meta-marketing-api'
// Meta Pixel Analytics (legacy - local data)
export * from './meta-pixel-analytics'

// =====================================================
// DATABASE INTEGRATION
// =====================================================
export * from '../supabase'
export * from '../integrations/redis'

// =====================================================
// PERFORMANCE & MONITORING
// =====================================================
export * from '../metrics'
export * from '../performance'
export * from '../monitoring'
