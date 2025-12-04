# 🔒 Security Logging Implementation - Pinteya E-commerce

## 📋 Resumen

Sistema de logging estructurado de seguridad implementado para monitorear, auditar y detectar actividades sospechosas en el proyecto Pinteya E-commerce.

## 🏗️ Arquitectura

### Componentes Principales

1. **Security Logger Core** (`src/lib/logging/security-logger.ts`)
   - Logger estructurado con contexto enriquecido
   - Múltiples niveles de severidad
   - Formato JSON consistente

2. **Tipos de Eventos de Seguridad**
   - `auth_attempt` / `auth_success` / `auth_failure`
   - `rate_limit_exceeded`
   - `permission_denied`
   - `suspicious_activity`
   - `data_access`
   - `admin_action`
   - `api_error`
   - `validation_error`
   - `security_scan`
   - `unauthorized_access`

3. **Niveles de Severidad**
   - `low`: Eventos informativos
   - `medium`: Eventos que requieren atención
   - `high`: Eventos críticos de seguridad
   - `critical`: Eventos que requieren acción inmediata

## 🔧 Configuración

### Variables de Entorno

```bash
# Nivel mínimo de logging (low, medium, high, critical)
SECURITY_LOG_LEVEL=medium

# Modo de desarrollo (afecta formato de salida)
NODE_ENV=development
```

### Configuración de Niveles

```typescript
const levels = {
  low: 1, // Eventos informativos
  medium: 2, // Eventos de atención
  high: 3, // Eventos críticos
  critical: 4, // Eventos de emergencia
}
```

## 🚀 Uso

### Implementación Básica

```typescript
import { createSecurityLogger } from '@/lib/logging/security-logger'

export async function GET(request: NextRequest) {
  // Crear logger con contexto de request
  const securityLogger = createSecurityLogger(request)

  try {
    // Log de acceso a datos
    securityLogger.log({
      type: 'data_access',
      severity: 'low',
      message: 'Products API accessed',
      context: securityLogger.context,
      metadata: {
        filters: queryParams,
        hasSearch: !!searchTerm,
      },
    })

    // Tu lógica de API aquí
    const result = await processRequest()

    return NextResponse.json(result)
  } catch (error) {
    // Log de error con contexto
    securityLogger.logApiError(securityLogger.context, error, { operation: 'products_get' })

    throw error
  }
}
```

### Métodos Especializados

```typescript
// Intentos de autenticación
securityLogger.logAuthAttempt(context, success, { provider: 'google' })

// Rate limiting excedido
securityLogger.logRateLimitExceeded(context, { limit: 100, window: '5m' })

// Permisos denegados
securityLogger.logPermissionDenied(context, 'products', 'create')

// Actividad sospechosa
securityLogger.logSuspiciousActivity(context, 'Multiple failed attempts', {
  attempts: 5,
  timeframe: '1m',
})

// Acciones administrativas
securityLogger.logAdminAction(context, 'delete_user', { targetUserId: 'user-123' })

// Errores de API
securityLogger.logApiError(context, error, { database: 'postgres' })
```

## 📊 Formato de Logs

### Estructura JSON

```json
{
  "timestamp": "2025-01-11T10:30:00.000Z",
  "level": "warn",
  "type": "SECURITY",
  "event_type": "auth_failure",
  "severity": "medium",
  "message": "Authentication failed for user-123",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "endpoint": "/api/auth/login",
    "method": "POST",
    "timestamp": "2025-01-11T10:30:00.000Z",
    "requestId": "req_1641897000_abc123"
  },
  "metadata": {
    "provider": "credentials",
    "reason": "invalid_password"
  },
  "error": {
    "name": "AuthenticationError",
    "message": "Invalid credentials",
    "stack": "Error: Invalid credentials\n    at..."
  }
}
```

### Contexto de Seguridad

```typescript
interface SecurityLogContext {
  userId?: string // ID del usuario autenticado
  sessionId?: string // ID de sesión
  ip?: string // IP del cliente
  userAgent?: string // User agent del navegador
  endpoint: string // Endpoint de la API
  method: string // Método HTTP
  timestamp: string // Timestamp ISO
  requestId?: string // ID único de request
}
```

## 🔍 Extracción de Contexto

### Información de Request

```typescript
export function extractSecurityContext(
  request: NextRequest,
  additionalContext: Partial<SecurityLogContext> = {}
): SecurityLogContext {
  const url = new URL(request.url)

  // Extraer IP con fallbacks
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown'

  // Generar request ID único
  const requestId =
    request.headers.get('x-request-id') ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: url.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    requestId,
    ...additionalContext,
  }
}
```

### Headers de Seguridad

1. **x-forwarded-for**: IP del cliente (primera en la lista)
2. **x-real-ip**: IP real del cliente (fallback)
3. **user-agent**: Información del navegador
4. **x-request-id**: ID único de request (generado si no existe)

## 🎨 Formato de Salida

### Desarrollo (Coloreado)

```bash
[SECURITY:AUTH_FAILURE] {
  "timestamp": "2025-01-11T10:30:00.000Z",
  "level": "warn",
  "message": "Authentication failed",
  ...
}
```

### Producción (JSON Plano)

```json
{"timestamp":"2025-01-11T10:30:00.000Z","level":"warn","type":"SECURITY",...}
```

## 🧪 Testing

### Tests Unitarios

```bash
npm test -- __tests__/lib/security-logger.test.ts
```

### Ejemplo de Test

```typescript
describe('Security Logger', () => {
  it('should log authentication attempts', () => {
    const logger = createSecurityLogger(mockRequest)

    logger.logAuthAttempt(logger.context, false, { reason: 'invalid_password' })

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY:AUTH_FAILURE]'),
      expect.stringContaining('Authentication failed')
    )
  })
})
```

## 📈 Monitoreo y Alertas

### Métricas Clave

1. **Eventos por severidad** (últimas 24h)
2. **Intentos de autenticación fallidos** por IP
3. **Accesos denegados** por recurso
4. **Errores de API** por endpoint
5. **Actividad administrativa** por usuario

### Alertas Recomendadas

```typescript
// Múltiples fallos de autenticación
if (authFailures > 5 && timeframe < '5m') {
  sendAlert('Multiple auth failures', {
    ip: context.ip,
    attempts: authFailures,
    timeframe: '5m',
  })
}

// Acceso administrativo fuera de horario
if (isAdminAction && isOutsideBusinessHours()) {
  sendAlert('Admin action outside business hours', {
    userId: context.userId,
    action: metadata.action,
    timestamp: context.timestamp,
  })
}
```

## 🔧 Integración con Servicios Externos

### DataDog

```typescript
// TODO: Implementar integración con DataDog
async function sendToDataDog(logEntry: string) {
  await fetch('https://http-intake.logs.datadoghq.com/v1/input/API_KEY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: logEntry,
  })
}
```

### Sentry

```typescript
// TODO: Implementar integración con Sentry
import * as Sentry from '@sentry/nextjs'

function sendToSentry(event: SecurityEvent) {
  if (event.severity === 'high' || event.severity === 'critical') {
    Sentry.captureException(event.error || new Error(event.message), {
      tags: {
        security_event: event.type,
        severity: event.severity,
      },
      extra: {
        context: event.context,
        metadata: event.metadata,
      },
    })
  }
}
```

## 🚨 Casos de Uso Críticos

### Detección de Ataques

```typescript
// Múltiples IPs desde la misma sesión
if (uniqueIPs.length > 3 && sessionId === context.sessionId) {
  securityLogger.logSuspiciousActivity(context, 'Session hijacking attempt', {
    sessionId: context.sessionId,
    ips: uniqueIPs,
    timeframe: '10m',
  })
}

// Acceso a recursos sensibles
if (endpoint.includes('/admin/') && !isAuthorized) {
  securityLogger.logPermissionDenied(context, 'admin_panel', 'access')
}
```

### Auditoría de Compliance

```typescript
// Log de acceso a datos personales (GDPR)
securityLogger.log({
  type: 'data_access',
  severity: 'low',
  message: 'Personal data accessed',
  context,
  metadata: {
    dataType: 'personal_information',
    userId: targetUserId,
    purpose: 'customer_support',
    legalBasis: 'legitimate_interest',
  },
})
```

## 🔄 Helpers Rápidos

### securityLog Helper

```typescript
import { securityLog } from '@/lib/logging/security-logger'

// Logging rápido sin contexto de request
securityLog.info('System startup completed')
securityLog.warn('High memory usage detected')
securityLog.error('Database connection failed', error)
```

## 📚 Referencias

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [GDPR Logging Requirements](https://gdpr.eu/article-30-records-processing-activities/)
- [Rate Limiting Implementation](./RATE_LIMITING_IMPLEMENTATION.md)

---

**Última actualización**: 2025-01-11  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo Pinteya
