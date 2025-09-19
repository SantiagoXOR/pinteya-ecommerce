# ⏱️ API Timeouts Configuration - Pinteya E-commerce

## 📋 Resumen

Sistema de configuración centralizada de timeouts para todas las operaciones de API del proyecto Pinteya E-commerce, proporcionando control granular sobre tiempos de espera y mejorando la experiencia del usuario.

## 🏗️ Arquitectura

### Componentes Principales

1. **Timeout Configuration Core** (`src/lib/config/api-timeouts.ts`)
   - Configuración centralizada con variables de entorno
   - Valores por defecto optimizados
   - Helpers para diferentes tipos de operaciones

2. **Tipos de Timeouts**
   - `default`: Operaciones generales (30s)
   - `database`: Consultas a base de datos (15s)
   - `external`: APIs externas (45s)
   - `upload`: Subida de archivos (2min)
   - `payment`: Operaciones de pago (1min)
   - `auth`: Autenticación (20s)
   - `admin`: Operaciones administrativas (45s)
   - `webhook`: Webhooks (10s)
   - `email`: Envío de emails (30s)
   - `image`: Procesamiento de imágenes (1.5min)

3. **Configuración por Endpoint**
   - Timeouts específicos por ruta de API
   - Configuración granular (connection, request, response, total)
   - Fallbacks automáticos

## 🔧 Configuración

### Variables de Entorno

```bash
# Timeouts en milisegundos
API_TIMEOUT_DEFAULT=30000      # 30 segundos
API_TIMEOUT_DATABASE=15000     # 15 segundos
API_TIMEOUT_EXTERNAL=45000     # 45 segundos
API_TIMEOUT_UPLOAD=120000      # 2 minutos
API_TIMEOUT_PAYMENT=60000      # 1 minuto
API_TIMEOUT_AUTH=20000         # 20 segundos
API_TIMEOUT_ADMIN=45000        # 45 segundos
API_TIMEOUT_WEBHOOK=10000      # 10 segundos
API_TIMEOUT_EMAIL=30000        # 30 segundos
API_TIMEOUT_IMAGE=90000        # 1.5 minutos
```

### Configuración por Defecto

```typescript
const DEFAULT_TIMEOUTS = {
  default: 30000,        // 30 segundos
  database: 15000,       // 15 segundos
  external: 45000,       // 45 segundos
  upload: 120000,        // 2 minutos
  payment: 60000,        // 1 minuto
  auth: 20000,           // 20 segundos
  admin: 45000,          // 45 segundos
  webhook: 10000,        // 10 segundos
  email: 30000,          // 30 segundos
  image: 90000,          // 1.5 minutos
} as const;
```

## 🚀 Uso

### Configuración Básica

```typescript
import { API_TIMEOUTS, getTimeout } from '@/lib/config/api-timeouts';

// Usar timeout específico
const dbTimeout = getTimeout('database');
const paymentTimeout = getTimeout('payment');

// Usar configuración directa
const uploadTimeout = API_TIMEOUTS.upload;
```

### Operaciones de Base de Datos

```typescript
import { withDatabaseTimeout } from '@/lib/config/api-timeouts';

export async function GET(request: NextRequest) {
  try {
    const result = await withDatabaseTimeout(async (signal) => {
      return await supabase
        .from('products')
        .select('*')
        .abortSignal(signal); // Pasar signal para cancelación
    }, API_TIMEOUTS.database);

    return NextResponse.json(result);
  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Database operation timed out' },
        { status: 408 }
      );
    }
    throw error;
  }
}
```

### Operaciones Externas

```typescript
import { withExternalTimeout, fetchWithTimeout } from '@/lib/config/api-timeouts';

// Con wrapper de fetch
const response = await fetchWithTimeout('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  body: JSON.stringify(paymentData),
  timeout: API_TIMEOUTS.payment
});

// Con wrapper genérico
const result = await withExternalTimeout(async (signal) => {
  return await mercadoPagoClient.createPayment(paymentData, { signal });
}, API_TIMEOUTS.payment);
```

### Configuración por Endpoint

```typescript
import { getEndpointTimeouts } from '@/lib/config/api-timeouts';

export async function POST(request: NextRequest) {
  const timeouts = getEndpointTimeouts('/api/products');
  
  // timeouts.connection: 5000ms
  // timeouts.request: 15000ms (database timeout)
  // timeouts.response: 10000ms
  // timeouts.total: 30000ms (default timeout)
  
  // Usar timeouts específicos según la fase
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeouts.total);
  
  try {
    const result = await processRequest(controller.signal);
    clearTimeout(timeoutId);
    return NextResponse.json(result);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

## 📊 Configuración por Endpoint

### Endpoints Predefinidos

```typescript
export const ENDPOINT_TIMEOUTS: Record<string, EndpointTimeouts> = {
  '/api/products': {
    connection: 5000,      // Tiempo para establecer conexión
    request: 15000,        // Tiempo para procesar request (DB)
    response: 10000,       // Tiempo para enviar respuesta
    total: 30000,          // Tiempo total máximo
  },
  '/api/orders': {
    connection: 5000,
    request: 15000,        // Operaciones de DB
    response: 15000,       // Respuestas más complejas
    total: 30000,
  },
  '/api/payments': {
    connection: 10000,     // Conexiones externas más lentas
    request: 60000,        // Operaciones de pago
    response: 20000,       // Respuestas de pago
    total: 45000,          // Timeout externo
  },
  '/api/webhooks': {
    connection: 2000,      // Conexiones rápidas
    request: 10000,        // Procesamiento rápido
    response: 3000,        // Respuestas inmediatas
    total: 10000,          // Timeout de webhook
  }
};
```

### Matching de Rutas

```typescript
// Coincidencia exacta
getEndpointTimeouts('/api/products') // → configuración de products

// Coincidencia por prefijo
getEndpointTimeouts('/api/products/123') // → configuración de products

// Fallback a configuración por defecto
getEndpointTimeouts('/api/unknown') // → configuración por defecto
```

## 🛠️ Helpers y Utilidades

### createTimeoutController

```typescript
import { createTimeoutController } from '@/lib/config/api-timeouts';

const { controller, timeoutId } = createTimeoutController(5000);

try {
  const result = await someAsyncOperation(controller.signal);
  clearTimeout(timeoutId);
  return result;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new Error('Operation timed out');
  }
  throw error;
}
```

### Timeout Personalizado

```typescript
function withCustomTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeout: number,
  errorMessage?: string
): Promise<T> {
  const { controller, timeoutId } = createTimeoutController(timeout);
  
  return operation(controller.signal)
    .catch(error => {
      if (error.name === 'AbortError') {
        throw new Error(errorMessage || `Operation timed out after ${timeout}ms`);
      }
      throw error;
    })
    .finally(() => clearTimeout(timeoutId));
}
```

## 🧪 Testing

### Tests Unitarios

```bash
npm test -- __tests__/lib/api-timeouts.test.ts
```

### Ejemplo de Test

```typescript
describe('API Timeouts', () => {
  it('should timeout slow operations', async () => {
    const slowOperation = (signal: AbortSignal) => 
      new Promise(resolve => setTimeout(resolve, 1000));
    
    await expect(
      withDatabaseTimeout(slowOperation, 100)
    ).rejects.toThrow('timeout');
  });
  
  it('should use environment variables', () => {
    process.env.API_TIMEOUT_DATABASE = '25000';
    
    // Re-import para obtener nuevos valores
    jest.resetModules();
    const { API_TIMEOUTS } = require('@/lib/config/api-timeouts');
    
    expect(API_TIMEOUTS.database).toBe(25000);
  });
});
```

## 📈 Monitoreo y Métricas

### Métricas Recomendadas

1. **Timeout Rate** por endpoint
2. **Tiempo promedio de respuesta** por tipo de operación
3. **Distribución de timeouts** por severidad
4. **Operaciones canceladas** por timeout

### Alertas Sugeridas

```typescript
// Alerta cuando > 5% de operaciones hacen timeout
if (timeoutRate > 0.05) {
  sendAlert('High timeout rate', {
    endpoint,
    rate: timeoutRate,
    timeframe: '5m'
  });
}

// Alerta cuando operaciones críticas hacen timeout
if (endpoint.includes('/api/payments/') && isTimeout) {
  sendAlert('Payment operation timeout', {
    endpoint,
    timeout: timeoutValue,
    severity: 'critical'
  });
}
```

## 🔧 Configuración Avanzada

### Timeouts Dinámicos

```typescript
function getDynamicTimeout(operation: string, complexity: number): number {
  const baseTimeout = API_TIMEOUTS[operation as keyof typeof API_TIMEOUTS];
  const complexityMultiplier = Math.min(complexity / 10, 3); // Max 3x
  
  return Math.floor(baseTimeout * (1 + complexityMultiplier));
}

// Uso
const timeout = getDynamicTimeout('database', queryComplexity);
const result = await withDatabaseTimeout(operation, timeout);
```

### Retry con Backoff

```typescript
async function withRetryAndTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  maxRetries: number = 3,
  baseTimeout: number = API_TIMEOUTS.default
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeout = baseTimeout * Math.pow(2, attempt - 1); // Exponential backoff
      return await withCustomTimeout(operation, timeout);
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * attempt)
      );
    }
  }
  
  throw lastError!;
}
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Timeouts muy cortos**
   ```bash
   # Aumentar timeout específico
   API_TIMEOUT_DATABASE=25000
   ```

2. **Operaciones lentas**
   ```typescript
   // Usar timeout específico para operaciones complejas
   const complexTimeout = API_TIMEOUTS.upload; // 2 minutos
   await withDatabaseTimeout(complexQuery, complexTimeout);
   ```

3. **Timeouts en cascada**
   ```typescript
   // Configurar timeouts jerárquicos
   const totalTimeout = API_TIMEOUTS.external;
   const operationTimeout = totalTimeout * 0.8; // 80% del total
   ```

### Debugging

```typescript
// Habilitar logs de timeout
const DEBUG_TIMEOUTS = process.env.DEBUG_TIMEOUTS === 'true';

if (DEBUG_TIMEOUTS) {
  console.log(`Operation timeout: ${timeout}ms`);
  console.time('operation');
}

try {
  const result = await operation();
  if (DEBUG_TIMEOUTS) console.timeEnd('operation');
  return result;
} catch (error) {
  if (DEBUG_TIMEOUTS) {
    console.timeEnd('operation');
    console.log('Operation failed:', error.message);
  }
  throw error;
}
```

## 📚 Referencias

- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Fetch API Timeout](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)
- [Node.js Timeout Best Practices](https://nodejs.org/api/timers.html)
- [Rate Limiting Implementation](./RATE_LIMITING_IMPLEMENTATION.md)
- [Security Logging Implementation](./SECURITY_LOGGING_IMPLEMENTATION.md)

---

**Última actualización**: 2025-01-11  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo Pinteya



