/**
 * MERCADOPAGO MOCK PARA DESARROLLO
 * Simula el comportamiento de MercadoPago para testing local
 */

import { v4 as uuidv4 } from 'uuid'

// Tipos para el mock
export interface MockPaymentResult {
  success: boolean
  payment_id: string
  status: 'approved' | 'rejected' | 'pending'
  status_detail: string
  external_reference: string
  redirect_url: string
}

export interface MockPreferenceResult {
  id: string
  init_point: string
  sandbox_init_point: string
  collector_id: number
  client_id: string
  marketplace: string
  operation_type: string
  additional_info: string
  auto_return: string
  back_urls: {
    success: string
    failure: string
    pending: string
  }
}

// Configuración del mock
const MOCK_CONFIG = {
  // Simular delay de red
  networkDelay: 1000,

  // Probabilidades de resultado (para testing)
  successRate: 0.8, // 80% de pagos exitosos
  pendingRate: 0.1, // 10% de pagos pendientes
  rejectionRate: 0.1, // 10% de pagos rechazados

  // URLs base para mock
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock de creación de preferencia
 */
export async function createMockPreference(data: any): Promise<MockPreferenceResult> {
  console.log('🧪 MOCK: Creando preferencia de prueba...')

  await delay(MOCK_CONFIG.networkDelay)

  const preferenceId = `mock-${uuidv4()}`
  const mockResult: MockPreferenceResult = {
    id: preferenceId,
    init_point: `${MOCK_CONFIG.baseUrl}/mock/mercadopago/checkout?preference_id=${preferenceId}`,
    sandbox_init_point: `${MOCK_CONFIG.baseUrl}/mock/mercadopago/checkout?preference_id=${preferenceId}&sandbox=true`,
    collector_id: 123456789,
    client_id: 'mock_client_id',
    marketplace: 'NONE',
    operation_type: 'regular_payment',
    additional_info: 'Mock payment for testing',
    auto_return: data.auto_return || 'approved',
    back_urls: {
      success: data.back_urls?.success || `${MOCK_CONFIG.baseUrl}/checkout/success`,
      failure: data.back_urls?.failure || `${MOCK_CONFIG.baseUrl}/checkout/failure`,
      pending: data.back_urls?.pending || `${MOCK_CONFIG.baseUrl}/checkout/pending`,
    },
  }

  console.log('✅ MOCK: Preferencia creada:', preferenceId)
  return mockResult
}

// Interfaz para datos de tarjeta
interface CardData {
  cardNumber?: string
  securityCode?: string
  expirationMonth?: string
  expirationYear?: string
  cardholderName?: string
  identificationType?: string
  identificationNumber?: string
}

/**
 * Mock de procesamiento de pago
 */
export async function processMockPayment(
  preferenceId: string,
  cardData: CardData
): Promise<MockPaymentResult> {
  console.log('🧪 MOCK: Procesando pago de prueba...')

  await delay(MOCK_CONFIG.networkDelay * 2) // Simular procesamiento más lento

  // Determinar resultado basado en datos de la tarjeta
  let status: 'approved' | 'rejected' | 'pending' = 'approved'
  let status_detail = 'accredited'

  // Simular diferentes resultados basados en el número de tarjeta
  if (cardData.cardNumber) {
    const lastDigits = cardData.cardNumber.slice(-4)

    // Tarjetas específicas para testing
    switch (lastDigits) {
      case '3704': // Visa aprobada
        status = 'approved'
        status_detail = 'accredited'
        break
      case '6260': // Visa rechazada
        status = 'rejected'
        status_detail = 'cc_rejected_insufficient_amount'
        break
      case '0001': // Pendiente
        status = 'pending'
        status_detail = 'pending_contingency'
        break
      default:
        // Resultado aleatorio basado en configuración
        const random = Math.random()
        if (random < MOCK_CONFIG.successRate) {
          status = 'approved'
          status_detail = 'accredited'
        } else if (random < MOCK_CONFIG.successRate + MOCK_CONFIG.pendingRate) {
          status = 'pending'
          status_detail = 'pending_contingency'
        } else {
          status = 'rejected'
          status_detail = 'cc_rejected_other_reason'
        }
    }
  }

  const paymentId = `mock-payment-${uuidv4()}`
  const externalReference = preferenceId.replace('mock-', 'order-')

  // Determinar URL de redirección
  let redirectUrl = `${MOCK_CONFIG.baseUrl}/checkout/success`
  if (status === 'rejected') {
    redirectUrl = `${MOCK_CONFIG.baseUrl}/checkout/failure`
  } else if (status === 'pending') {
    redirectUrl = `${MOCK_CONFIG.baseUrl}/checkout/pending`
  }

  // Agregar parámetros de query
  const params = new URLSearchParams({
    payment_id: paymentId,
    status,
    status_detail,
    external_reference: externalReference,
    merchant_order_id: `mock-order-${Date.now()}`,
  })

  redirectUrl += `?${params.toString()}`

  const result: MockPaymentResult = {
    success: status === 'approved',
    payment_id: paymentId,
    status,
    status_detail,
    external_reference: externalReference,
    redirect_url: redirectUrl,
  }

  console.log(
    `${status === 'approved' ? '✅' : status === 'pending' ? '⏳' : '❌'} MOCK: Pago ${status}:`,
    paymentId
  )

  return result
}

/**
 * Verificar si el modo mock está habilitado
 */
export function isMockEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'
}

/**
 * Simular webhook de MercadoPago
 */
export async function simulateWebhook(paymentData: MockPaymentResult) {
  console.log('🧪 MOCK: Simulando webhook...')

  const webhookData = {
    action: 'payment.created',
    api_version: 'v1',
    data: {
      id: paymentData.payment_id,
    },
    date_created: new Date().toISOString(),
    id: parseInt(paymentData.payment_id.replace('mock-payment-', '')),
    live_mode: false,
    type: 'payment',
    user_id: 123456789,
  }

  try {
    const response = await fetch(`${MOCK_CONFIG.baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': 'mock-signature',
      },
      body: JSON.stringify(webhookData),
    })

    if (response.ok) {
      console.log('✅ MOCK: Webhook simulado exitosamente')
    } else {
      console.log('❌ MOCK: Error en webhook simulado')
    }
  } catch (error) {
    console.log('❌ MOCK: Error al simular webhook:', error)
  }
}

/**
 * Generar datos de tarjeta de prueba
 */
export function generateTestCardData() {
  const testCards = [
    {
      number: '4509953566233704',
      name: 'APRO APRO',
      expiry: '11/25',
      cvv: '123',
      document: '12345678',
      result: 'approved',
    },
    {
      number: '4013540682746260',
      name: 'OTHE OTHE',
      expiry: '11/25',
      cvv: '123',
      document: '12345678',
      result: 'rejected',
    },
    {
      number: '5031755734530604',
      name: 'APRO APRO',
      expiry: '11/25',
      cvv: '123',
      document: '12345678',
      result: 'approved',
    },
  ]

  return testCards[Math.floor(Math.random() * testCards.length)]
}

/**
 * Crear página de checkout mock
 */
export function createMockCheckoutUrl(preferenceId: string): string {
  return `${MOCK_CONFIG.baseUrl}/mock/mercadopago/checkout?preference_id=${preferenceId}`
}

export default {
  createMockPreference,
  processMockPayment,
  isMockEnabled,
  simulateWebhook,
  generateTestCardData,
  createMockCheckoutUrl,
}
