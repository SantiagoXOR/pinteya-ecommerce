# 🔐 MercadoPago Enterprise Patterns - Pinteya E-commerce

> Patrones de seguridad y mejores prácticas enterprise para MercadoPago basados en documentación oficial

[![MercadoPago](https://img.shields.io/badge/MercadoPago-Enterprise-blue)](https://mercadopago.com/)
[![Security](https://img.shields.io/badge/Security-HMAC%20Verified-success)](../security/README.md)
[![Context7](https://img.shields.io/badge/Context7-Optimized-blue)](https://context7.ai/)

---

## 📋 Índice

- [🛡️ Security Patterns](#️-security-patterns)
- [🔄 Webhook Handling](#-webhook-handling)
- [⚡ Error Handling](#-error-handling)
- [📊 Monitoring & Compliance](#-monitoring--compliance)
- [🚀 Production Deployment](#-production-deployment)
- [🧪 Testing Strategies](#-testing-strategies)

---

## 🛡️ Security Patterns

### **1. HMAC Signature Verification**
```typescript
// lib/mercadopago/security.ts - Verificación HMAC enterprise
import crypto from 'crypto'

export interface HMACVerificationResult {
  isValid: boolean
  error?: string
  metadata?: {
    timestamp: string
    requestId: string
    dataId: string
  }
}

export function verifyHMACSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secretKey: string
): HMACVerificationResult {
  try {
    // Separar x-signature en componentes
    const parts = xSignature.split(',')
    let ts: string = ''
    let hash: string = ''

    // Extraer timestamp y hash
    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key?.trim() === 'ts') {
        ts = value?.trim() || ''
      } else if (key?.trim() === 'v1') {
        hash = value?.trim() || ''
      }
    }

    if (!ts || !hash) {
      return { isValid: false, error: 'Invalid signature format' }
    }

    // Generar manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // Crear HMAC signature
    const hmac = crypto.createHmac('sha256', secretKey)
    hmac.update(manifest)
    const calculatedHash = hmac.digest('hex')

    // Verificar hash
    const isValid = calculatedHash === hash

    return {
      isValid,
      metadata: {
        timestamp: ts,
        requestId: xRequestId,
        dataId
      }
    }
  } catch (error) {
    return { 
      isValid: false, 
      error: `HMAC verification failed: ${error}` 
    }
  }
}
```

### **2. Secure Webhook Endpoint**
```typescript
// app/api/webhooks/mercadopago/route.ts - Webhook enterprise
import { NextRequest, NextResponse } from 'next/server'
import { verifyHMACSignature } from '@/lib/mercadopago/security'
import { processWebhookNotification } from '@/lib/mercadopago/webhook-processor'
import { logWebhookEvent } from '@/lib/monitoring/webhook-logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Extraer headers de seguridad
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    
    if (!xSignature || !xRequestId) {
      await logWebhookEvent({
        status: 'rejected',
        reason: 'Missing security headers',
        duration: Date.now() - startTime
      })
      
      return NextResponse.json(
        { error: 'Missing required headers' }, 
        { status: 400 }
      )
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const dataId = searchParams.get('data.id')
    const type = searchParams.get('type')

    if (!dataId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      )
    }

    // Verificar HMAC
    const secretKey = process.env.MERCADOPAGO_WEBHOOK_SECRET!
    const verification = verifyHMACSignature(
      xSignature, 
      xRequestId, 
      dataId, 
      secretKey
    )

    if (!verification.isValid) {
      await logWebhookEvent({
        status: 'security_violation',
        reason: verification.error,
        dataId,
        requestId: xRequestId,
        duration: Date.now() - startTime
      })
      
      return NextResponse.json(
        { error: 'Invalid signature' }, 
        { status: 401 }
      )
    }

    // Procesar notificación
    const result = await processWebhookNotification({
      type,
      dataId,
      requestId: xRequestId,
      metadata: verification.metadata
    })

    await logWebhookEvent({
      status: 'processed',
      type,
      dataId,
      requestId: xRequestId,
      duration: Date.now() - startTime,
      result
    })

    // Responder con HTTP 200 dentro de 22 segundos
    return NextResponse.json({ status: 'ok' }, { status: 200 })

  } catch (error) {
    await logWebhookEvent({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

---

## 🔄 Webhook Handling

### **1. Notification Processor**
```typescript
// lib/mercadopago/webhook-processor.ts
import { Payment, Subscription, Invoice } from '@/types/mercadopago'

export interface WebhookNotification {
  type: string
  dataId: string
  requestId: string
  metadata?: any
}

export async function processWebhookNotification(
  notification: WebhookNotification
) {
  const { type, dataId } = notification

  try {
    switch (type) {
      case 'payment':
        return await handlePaymentNotification(dataId)
      
      case 'subscription':
        return await handleSubscriptionNotification(dataId)
      
      case 'invoice':
        return await handleInvoiceNotification(dataId)
      
      case 'point_integration_wh':
        return await handlePointIntegrationNotification(notification)
      
      default:
        throw new Error(`Unknown notification type: ${type}`)
    }
  } catch (error) {
    throw new Error(`Failed to process ${type} notification: ${error}`)
  }
}

async function handlePaymentNotification(paymentId: string) {
  // Obtener payment desde MercadoPago API
  const payment = await fetchPaymentFromAPI(paymentId)
  
  // Actualizar estado en base de datos
  await updatePaymentStatus(payment)
  
  // Enviar notificaciones al usuario
  if (payment.status === 'approved') {
    await sendPaymentConfirmationEmail(payment)
  }
  
  return { action: 'payment_processed', paymentId, status: payment.status }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  const subscription = await fetchSubscriptionFromAPI(subscriptionId)
  await updateSubscriptionStatus(subscription)
  
  return { action: 'subscription_processed', subscriptionId }
}
```

### **2. Retry Logic con Backoff Exponencial**
```typescript
// lib/mercadopago/retry-logic.ts
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitterMax: number
}

export const RETRY_CONFIGS = {
  critical: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitterMax: 1000
  },
  standard: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    jitterMax: 500
  }
} as const

export async function retryMercadoPagoOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = RETRY_CONFIGS.standard
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // No reintentar errores no recuperables
      if (isNonRetryableError(error)) {
        throw error
      }
      
      if (attempt === config.maxAttempts) {
        break
      }
      
      // Calcular delay con backoff exponencial y jitter
      const exponentialDelay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )
      
      const jitter = Math.random() * config.jitterMax
      const totalDelay = exponentialDelay + jitter
      
      console.log(`Retry attempt ${attempt}/${config.maxAttempts} after ${totalDelay}ms`)
      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }
  
  throw lastError
}

function isNonRetryableError(error: any): boolean {
  // Errores 4xx (excepto 429) no son recuperables
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return true
  }
  
  // Errores de validación
  if (error.message?.includes('invalid_parameter')) {
    return true
  }
  
  return false
}
```

---

## ⚡ Error Handling

### **1. Error Classification**
```typescript
// lib/mercadopago/error-handler.ts
export enum MercadoPagoErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface MercadoPagoError {
  type: MercadoPagoErrorType
  message: string
  code?: string
  details?: any
  retryable: boolean
}

export function classifyMercadoPagoError(error: any): MercadoPagoError {
  // Error de red
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      type: MercadoPagoErrorType.NETWORK_ERROR,
      message: 'Network connection failed',
      retryable: true
    }
  }
  
  // Error de autenticación
  if (error.status === 401) {
    return {
      type: MercadoPagoErrorType.AUTHENTICATION_ERROR,
      message: 'Invalid credentials',
      retryable: false
    }
  }
  
  // Error de rate limiting
  if (error.status === 429) {
    return {
      type: MercadoPagoErrorType.RATE_LIMIT_ERROR,
      message: 'Rate limit exceeded',
      retryable: true
    }
  }
  
  // Error de validación
  if (error.status >= 400 && error.status < 500) {
    return {
      type: MercadoPagoErrorType.VALIDATION_ERROR,
      message: error.message || 'Validation failed',
      code: error.code,
      details: error.details,
      retryable: false
    }
  }
  
  // Error del servidor
  if (error.status >= 500) {
    return {
      type: MercadoPagoErrorType.SERVER_ERROR,
      message: 'Server error',
      retryable: true
    }
  }
  
  return {
    type: MercadoPagoErrorType.UNKNOWN_ERROR,
    message: error.message || 'Unknown error',
    retryable: false
  }
}
```

### **2. Circuit Breaker Pattern**
```typescript
// lib/mercadopago/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitoringWindow: number = 120000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }
}
```

---

## 📊 Monitoring & Compliance

### **1. Compliance Standards**
```typescript
// lib/mercadopago/compliance.ts
/**
 * Implementación de estándares de seguridad según:
 * - ISO/IEC 27552:2019 (Privacy Management)
 * - ISO/IEC 27001:2013 (Information Security Management)
 */

export interface ComplianceAuditLog {
  timestamp: string
  userId?: string
  action: string
  resource: string
  result: 'success' | 'failure'
  ipAddress: string
  userAgent: string
  metadata?: any
}

export async function logComplianceEvent(event: ComplianceAuditLog) {
  // Almacenar en sistema de auditoría seguro
  await storeAuditLog({
    ...event,
    timestamp: new Date().toISOString(),
    hash: generateEventHash(event)
  })
  
  // Alertar si es evento crítico
  if (event.result === 'failure' && isCriticalAction(event.action)) {
    await sendSecurityAlert(event)
  }
}

function generateEventHash(event: ComplianceAuditLog): string {
  const data = JSON.stringify(event)
  return crypto.createHash('sha256').update(data).digest('hex')
}
```

### **2. Real-time Monitoring**
```typescript
// lib/mercadopago/monitoring.ts
export interface MercadoPagoMetrics {
  timestamp: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  errorRate: number
  throughput: number
}

export class MercadoPagoMonitor {
  private metrics: MercadoPagoMetrics[] = []
  
  async recordMetric(metric: MercadoPagoMetrics) {
    this.metrics.push(metric)
    
    // Enviar a sistema de monitoreo
    await this.sendToMonitoringSystem(metric)
    
    // Verificar alertas
    await this.checkAlerts(metric)
  }
  
  private async checkAlerts(metric: MercadoPagoMetrics) {
    // Alert si response time > 5 segundos
    if (metric.responseTime > 5000) {
      await this.sendAlert({
        type: 'high_response_time',
        metric,
        threshold: 5000
      })
    }
    
    // Alert si error rate > 5%
    if (metric.errorRate > 0.05) {
      await this.sendAlert({
        type: 'high_error_rate',
        metric,
        threshold: 0.05
      })
    }
  }
}
```

---

## 🚀 Production Deployment

### **1. Environment Configuration**
```typescript
// lib/mercadopago/config.ts
export interface MercadoPagoConfig {
  publicKey: string
  accessToken: string
  webhookSecret: string
  environment: 'sandbox' | 'production'
  rateLimits: {
    createPreference: number
    webhook: number
    query: number
  }
}

export function getMercadoPagoConfig(): MercadoPagoConfig {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  
  return {
    publicKey: environment === 'production' 
      ? process.env.MERCADOPAGO_PUBLIC_KEY_PROD!
      : process.env.MERCADOPAGO_PUBLIC_KEY_TEST!,
    accessToken: environment === 'production'
      ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD!
      : process.env.MERCADOPAGO_ACCESS_TOKEN_TEST!,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
    environment,
    rateLimits: {
      createPreference: environment === 'production' ? 100 : 50,
      webhook: environment === 'production' ? 1000 : 100,
      query: environment === 'production' ? 200 : 100
    }
  }
}
```

### **2. Health Checks**
```typescript
// app/api/health/mercadopago/route.ts
export async function GET() {
  try {
    const config = getMercadoPagoConfig()
    
    // Verificar conectividad con MercadoPago
    const healthCheck = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`
      }
    })
    
    if (!healthCheck.ok) {
      throw new Error(`MercadoPago API unhealthy: ${healthCheck.status}`)
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.environment
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
```

---

**Documentado por**: Augment Agent  
**Fecha**: Enero 2025  
**Versión**: Enterprise v3.0  
**Basado en**: MercadoPago Official Documentation + Context7



