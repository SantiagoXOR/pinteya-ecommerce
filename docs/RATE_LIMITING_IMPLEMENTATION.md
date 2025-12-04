# 🛡️ Rate Limiting Implementation - Pinteya E-commerce

## 📋 Resumen

Sistema de rate limiting implementado para proteger las APIs críticas del proyecto Pinteya E-commerce contra abuso y ataques de denegación de servicio (DoS).

## 🏗️ Arquitectura

### Componentes Principales

1. **Rate Limiter Core** (`src/lib/rate-limiting/rate-limiter.ts`)
   - Middleware de rate limiting configurable
   - Store en memoria para desarrollo
   - Configuraciones predefinidas por tipo de endpoint

2. **Configuraciones Predefinidas**
   - Products API: 200 requests/5min
   - Auth API: 10 requests/15min
   - Admin API: 50 requests/10min
   - Creation API: 20 requests/10min
   - Payment API: 30 requests/15min
   - Webhook API: 100 requests/1min

3. **Integración con APIs**
   - Implementado en `/api/products/route.ts`
   - Logging de seguridad integrado
   - Headers informativos de rate limiting

## 🔧 Configuración

### Variables de Entorno

```bash
# Configuración personalizada de rate limiting (opcional)
RATE_LIMIT_PRODUCTS_WINDOW=300000  # 5 minutos
RATE_LIMIT_PRODUCTS_MAX=200        # 200 requests
RATE_LIMIT_AUTH_WINDOW=900000      # 15 minutos
RATE_LIMIT_AUTH_MAX=10             # 10 intentos
```

### Configuraciones por Defecto

```typescript
export const RATE_LIMIT_CONFIGS = {
  products: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 200, // 200 requests por ventana
    message: 'Límite de consultas de productos excedido. Intente en 5 minutos.',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10, // 10 intentos por ventana
    message: 'Demasiados intentos de autenticación. Intente en 15 minutos.',
  },
  // ... más configuraciones
}
```

## 🚀 Uso

### Implementación Básica

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'

export async function GET(request: NextRequest) {
  const securityLogger = createSecurityLogger(request)

  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.products, async () => {
    // Tu lógica de API aquí
    return await handleRequest()
  })

  // Manejar rate limit excedido
  if (rateLimitResult instanceof NextResponse) {
    securityLogger.logRateLimitExceeded(securityLogger.context, {
      endpoint: '/api/products',
      method: 'GET',
    })
    return rateLimitResult
  }

  return rateLimitResult
}
```

### Configuración Personalizada

```typescript
const customConfig: RateLimitConfig = {
  windowMs: 10 * 60 * 1000, // 10 minutos
  maxRequests: 50, // 50 requests
  message: 'Límite personalizado excedido',
  keyGenerator: request => {
    // Lógica personalizada para generar clave
    return `custom:${getClientIP(request)}`
  },
}

const result = await withRateLimit(request, customConfig, handler)
```

## 📊 Monitoreo y Logging

### Headers de Respuesta

Cuando se aplica rate limiting, se incluyen headers informativos:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150
X-RateLimit-Reset: 1640995200
Retry-After: 300
```

### Logging de Seguridad

```typescript
// Automático cuando se excede el límite
securityLogger.logRateLimitExceeded(context, {
  endpoint: '/api/products',
  method: 'GET',
  limit: 200,
  window: '5m',
  clientIP: '192.168.1.1',
})
```

## 🔍 Identificación de Clientes

### Extracción de IP

1. **x-forwarded-for** (primera IP de la lista)
2. **x-real-ip** (fallback)
3. **'unknown'** (último fallback)

```typescript
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') || 'unknown'
}
```

### Generación de Claves

```typescript
function generateKey(request: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(request)
  }

  const ip = getClientIP(request)
  const endpoint = new URL(request.url).pathname
  return `${ip}:${endpoint}`
}
```

## 🧪 Testing

### Tests Unitarios

```bash
npm test -- __tests__/lib/rate-limiting.test.ts
```

### Tests de Integración

```typescript
describe('Rate Limiting Integration', () => {
  it('should block requests after limit', async () => {
    const requests = Array(6)
      .fill(null)
      .map(() => fetch('/api/products', { headers: { 'x-forwarded-for': '192.168.1.1' } }))

    const responses = await Promise.all(requests)
    const lastResponse = responses[responses.length - 1]

    expect(lastResponse.status).toBe(429)
  })
})
```

## 🔧 Configuración Avanzada

### Store Personalizado

```typescript
interface RateLimitStore {
  get(key: string): Promise<number | null>
  set(key: string, value: number, ttl: number): Promise<void>
  increment(key: string, ttl: number): Promise<number>
}

// Implementación con Redis
class RedisRateLimitStore implements RateLimitStore {
  // ... implementación
}
```

### Middleware Personalizado

```typescript
export function createCustomRateLimiter(config: RateLimitConfig, store?: RateLimitStore) {
  return async (request: NextRequest) => {
    // Lógica personalizada de rate limiting
  }
}
```

## 📈 Métricas y Alertas

### Métricas Recomendadas

1. **Requests por minuto** por endpoint
2. **Rate limit hits** por IP/endpoint
3. **Distribución de IPs** bloqueadas
4. **Patrones de tráfico** sospechosos

### Alertas Sugeridas

```typescript
// Alerta cuando > 50% de requests son bloqueadas
if (blockedRequests / totalRequests > 0.5) {
  sendAlert('High rate limit hit ratio', {
    endpoint,
    ratio: blockedRequests / totalRequests,
    timeframe: '5m',
  })
}
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Rate limit muy estricto**

   ```bash
   # Ajustar en variables de entorno
   RATE_LIMIT_PRODUCTS_MAX=500
   ```

2. **IPs legítimas bloqueadas**

   ```typescript
   // Implementar whitelist
   const whitelist = ['192.168.1.100', '10.0.0.1']
   if (whitelist.includes(clientIP)) {
     return handler()
   }
   ```

3. **Store de memoria lleno**
   ```typescript
   // Implementar limpieza automática
   setInterval(() => {
     cleanupExpiredEntries()
   }, 60000)
   ```

### Logs de Debug

```bash
# Habilitar logs detallados
DEBUG=rate-limiting npm run dev
```

## 🔄 Migración y Rollback

### Plan de Migración

1. **Fase 1**: Implementar en modo observación
2. **Fase 2**: Activar con límites altos
3. **Fase 3**: Ajustar límites según métricas
4. **Fase 4**: Implementar en todas las APIs

### Plan de Rollback

```typescript
// Feature flag para deshabilitar rate limiting
if (process.env.DISABLE_RATE_LIMITING === 'true') {
  return handler()
}
```

## 📚 Referencias

- [OWASP Rate Limiting Guide](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [RFC 6585 - HTTP Status Code 429](https://tools.ietf.org/html/rfc6585)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Security Logging Implementation](./SECURITY_LOGGING_IMPLEMENTATION.md)
- [API Timeouts Configuration](./API_TIMEOUTS_CONFIGURATION.md)

## 🤝 Contribución

Para contribuir al sistema de rate limiting:

1. Revisar configuraciones existentes
2. Agregar tests para nuevas funcionalidades
3. Documentar cambios en este archivo
4. Validar con el equipo de seguridad

---

**Última actualización**: 2025-01-11
**Versión**: 1.0.0
**Mantenedor**: Equipo de Desarrollo Pinteya
