// ===================================
// PINTEYA E-COMMERCE - ALIAS MERCADOPAGO WEBHOOK
// ===================================
// Alias para mantener compatibilidad con frontend
// Redirige a la implementación real en /api/payments/webhook

// Re-exportar las funciones GET y POST de la implementación real
export {
  GET,
  POST
} from '../../payments/webhook/route';

// Nota: Este archivo es un alias para mantener compatibilidad
// La implementación real está en src/app/api/payments/webhook/route.ts
