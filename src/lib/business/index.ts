/**
 * Business Module Index - Pinteya E-commerce
 * Punto de entrada centralizado para lógica de negocio y dominio
 * Orders, Products, Logistics, Analytics
 */

// =====================================================
// ORDERS & COMMERCE
// =====================================================
export * from '../order-state-machine'
export * from '../order-status-manager'
export * from '../order-analytics'
export * from '../order-validation'

// =====================================================
// PRODUCTS & INVENTORY
// =====================================================
export * from '../product-manager'
export * from '../inventory-manager'
export * from '../category-manager'
export * from '../price-calculator'

// =====================================================
// LOGISTICS & SHIPPING
// =====================================================
export * from '../logistics'
export * from '../shipping-calculator'
export * from '../courier-manager'
export * from '../tracking-manager'

// =====================================================
// ANALYTICS & REPORTING
// =====================================================
export * from '../analytics'
export * from '../conversion-tracking'
export * from '../performance-analytics'
export * from '../business-metrics'

// =====================================================
// PAYMENT & FINANCIAL
// =====================================================
export * from '../payment-processor'
export * from '../financial-calculator'
export * from '../tax-calculator'
export * from '../discount-manager'
