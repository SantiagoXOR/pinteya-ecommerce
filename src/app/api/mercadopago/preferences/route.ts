// ===================================
// PINTEYA E-COMMERCE - ALIAS MERCADOPAGO PREFERENCES
// ===================================
// Alias para mantener compatibilidad con frontend
// Redirige a la implementación real en /api/payments/preferences

// Re-exportar solo las funciones disponibles de la implementación real
export {
  GET
} from '../../payments/preferences/route';

// Nota: Este archivo es un alias para mantener compatibilidad
// La implementación real está en src/app/api/payments/preferences/route.ts
// Solo GET está disponible en la implementación actual
