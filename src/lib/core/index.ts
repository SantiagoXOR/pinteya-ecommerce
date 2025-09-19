/**
 * Core Module Index - Pinteya E-commerce
 * Punto de entrada centralizado para funcionalidades core del sistema
 * Configuración, validación, utilidades básicas
 */

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================
export * from '../config';
export * from '../constants';
export * from '../env-config';

// =====================================================
// VALIDACIÓN Y UTILIDADES BÁSICAS
// =====================================================
export * from '../validation';
export * from '../json-utils';
export * from '../utils/consolidated-utils';

// =====================================================
// MÓDULOS ESPECIALIZADOS
// =====================================================
// Para funcionalidades específicas, usar los módulos especializados:
// - Authentication: import from '@/lib/auth'
// - Integrations: import from '@/lib/integrations'
// - Enterprise: import from '@/lib/enterprise'
// - Business Logic: import from '@/lib/business'

// =====================================================
// RE-EXPORTS DE MÓDULOS PRINCIPALES
// =====================================================
export * from '../auth';
export * from '../integrations';
export * from '../enterprise';
export * from '../business';









