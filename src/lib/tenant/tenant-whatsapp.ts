// =====================================================
// TENANT WHATSAPP HELPER
// Descripción: Helper para obtener número de WhatsApp según el tenant
// =====================================================

import { TenantPublicConfig } from './types'

/**
 * Números de WhatsApp por tenant slug (fallback si no está en BD)
 */
const WHATSAPP_NUMBERS: Record<string, string> = {
  pinteya: '5493513411796',
  pintemas: '5493547637630',
}

/**
 * Número por defecto (Pinteya)
 */
const DEFAULT_WHATSAPP_NUMBER = '5493513411796'

/**
 * Obtiene el número de WhatsApp para un tenant
 * Prioridad:
 * 1. Número del tenant desde BD (tenant.whatsappNumber)
 * 2. Número por slug del tenant
 * 3. Número por defecto
 */
export function getTenantWhatsAppNumber(tenant: TenantPublicConfig | null): string {
  if (!tenant) {
    return DEFAULT_WHATSAPP_NUMBER
  }

  // Prioridad 1: Número del tenant desde BD
  if (tenant.whatsappNumber) {
    return tenant.whatsappNumber
  }

  // Prioridad 2: Número por slug
  if (tenant.slug && WHATSAPP_NUMBERS[tenant.slug]) {
    return WHATSAPP_NUMBERS[tenant.slug]
  }

  // Prioridad 3: Número por defecto
  return DEFAULT_WHATSAPP_NUMBER
}
