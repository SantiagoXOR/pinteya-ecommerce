# Sistema de Manejo de Errores de Red - Pinteya E-commerce

## 📋 Resumen

Este documento describe el sistema completo de manejo de errores de red implementado para resolver los errores `ERR_ABORTED` y otros errores de conectividad que aparecían en la consola del navegador.

## 🎯 Objetivos

1. **Suprimir errores no críticos** como `ERR_ABORTED` que no afectan la funcionalidad
2. **Mejorar la experiencia del usuario** eliminando ruido en la consola
3. **Mantener logging útil** para debugging en desarrollo
4. **Implementar retry automático** para errores de red recuperables
5. **Proporcionar feedback visual** del estado de la conexión

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. **Query Client Optimizado** (`src/lib/query-client.ts`)
- Configuración inteligente de retry para diferentes tipos de errores
- Backoff exponencial para errores de red
- Detección automática de errores recuperables

#### 2. **Network Error Handler Hook** (`src/hooks/useNetworkErrorHandler.ts`)
- Hook personalizado para manejo de errores de red
- Clasificación automática de tipos de error
- Interceptación global de errores de fetch

#### 3. **Network Error Provider** (`src/components/providers/NetworkErrorProvider.tsx`)
- Context provider para estado global de errores de red
- Monitoreo de conectividad online/offline
- Componente de error boundary para errores de red

#### 4. **Client Error Suppression** (`src/components/ErrorSuppression/ClientErrorSuppression.tsx`)
- Supresión de errores en el lado del cliente
- Interceptación de console.error y console.warn
- Manejo de unhandled promise rejections

#### 5. **Middleware de Supresión** (`src/lib/middleware/error-suppression.ts`)
- Middleware para el lado del servidor
- Headers optimizados para conexiones estables
- Wrapper para APIs con manejo robusto de errores

#### 6. **Diagnóstico de Red** (`src/components/Debug/NetworkErrorDiagnostic.tsx`)
- Panel de diagnóstico para desarrollo
- Monitoreo en tiempo real de errores suprimidos
- Herramientas de testing y debugging

## 🔧 Configuración

### Instalación Automática

El sistema se configura automáticamente al iniciar la aplicación:

```typescript
// En src/app/layout.tsx
<ClientErrorSuppression />
<NetworkErrorProvider>
  <QueryClientProvider>
    {/* Tu aplicación */}
  </QueryClientProvider>
</NetworkErrorProvider>
```

### Configuración Manual

Para usar componentes específicos:

```typescript
// Hook básico de manejo de errores
import { useNetworkErrorHandler } from '@/hooks/useNetworkErrorHandler';

const { handleNetworkError, createFetchWrapper } = useNetworkErrorHandler({
  enableLogging: true,
  enableRetry: true,
  maxRetries: 3
});

// Wrapper de fetch con manejo de errores
const safeFetch = createFetchWrapper('/api');
const response = await safeFetch('/products');
```

## 🎛️ Tipos de Errores Manejados

### Errores Suprimidos
- `ERR_ABORTED` - Requests cancelados por el usuario
- `AbortError` - Errores de abort de fetch API
- `NetworkError` - Errores de conectividad
- `TimeoutError` - Timeouts de requests

### Errores con Retry
- Errores HTTP 5xx (servidor)
- Errores de timeout (408)
- Errores de red temporales
- Pérdida de conectividad

### Errores No Manejados
- Errores HTTP 4xx (cliente) - excepto 408
- Errores de validación
- Errores de autenticación

## 📊 Configuración de Retry

### Query Client
```typescript
retry: (failureCount: number, error: any) => {
  // No retry para errores 4xx (cliente) excepto 408
  if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
    return false;
  }
  
  // Retry para errores de red
  if (shouldRetryError(error)) {
    return failureCount < 3;
  }
  
  return failureCount < 2;
}
```

### Delay de Retry
```typescript
retryDelay: (attemptIndex: number, error: any) => {
  // Delay más corto para errores de red
  if (shouldRetryError(error)) {
    return Math.min(500 * 2 ** attemptIndex, 5000);
  }
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}
```

## 🔍 Debugging y Monitoreo

### Panel de Diagnóstico (Solo Desarrollo)

En modo desarrollo, aparece un botón flotante 🌐 en la esquina inferior izquierda que abre un panel con:

- **Estado de conexión** (Online/Offline)
- **Contador de errores suprimidos**
- **Log en tiempo real** de errores
- **Botón de test** para generar errores de prueba
- **Estadísticas** de red

### Logging en Desarrollo

```typescript
// Los errores suprimidos aparecen como debug
console.debug('🔇 [Suppressed Error]:', error);

// Errores importantes siguen apareciendo normalmente
console.error('❌ Critical Error:', error);
```

## 🧪 Testing

### Script de Prueba

```bash
# Ejecutar tests del sistema de errores
node scripts/test-error-suppression.js
```

### Tests Incluidos
- ✅ Requests válidos a APIs públicas
- ✅ Requests a APIs protegidas (deben fallar)
- ✅ Requests con abort inmediato
- ✅ Verificación de supresión de errores

## 📈 Métricas y Performance

### Impacto en Performance
- **Overhead mínimo** - Solo intercepta errores específicos
- **Retry inteligente** - Evita requests innecesarios
- **Cache optimizado** - Reduce requests duplicados

### Métricas Monitoreadas
- Número de errores suprimidos
- Tiempo de respuesta de APIs
- Tasa de éxito de retry
- Estado de conectividad

## 🚀 Beneficios

### Para Desarrolladores
- ✅ Consola limpia sin errores irrelevantes
- ✅ Debugging más eficiente
- ✅ Logs estructurados y útiles
- ✅ Herramientas de diagnóstico integradas

### Para Usuarios
- ✅ Experiencia más estable
- ✅ Retry automático en errores temporales
- ✅ Feedback visual del estado de conexión
- ✅ Mejor performance general

## 🔧 Mantenimiento

### Agregar Nuevos Patrones de Error

```typescript
// En error-suppression.ts
const suppressedErrorPatterns = [
  'ERR_ABORTED',
  'AbortError',
  // Agregar nuevos patrones aquí
  'NEW_ERROR_PATTERN'
];
```

### Configurar Retry para Nuevas APIs

```typescript
// En query-client.ts
const shouldRetryError = (error: any): boolean => {
  // Agregar lógica específica para nuevos tipos de error
  return networkErrors.includes(error.code);
};
```

## 📝 Notas Importantes

1. **Solo en Desarrollo**: El panel de diagnóstico solo aparece en modo desarrollo
2. **Errores Críticos**: Los errores importantes siguen siendo visibles
3. **Performance**: El sistema tiene overhead mínimo en producción
4. **Compatibilidad**: Funciona con todas las versiones modernas de navegadores

## 🔗 Archivos Relacionados

- `src/lib/query-client.ts` - Configuración de TanStack Query
- `src/hooks/useNetworkErrorHandler.ts` - Hook principal de manejo
- `src/components/providers/NetworkErrorProvider.tsx` - Provider de contexto
- `src/components/ErrorSuppression/ClientErrorSuppression.tsx` - Supresión cliente
- `src/lib/middleware/error-suppression.ts` - Middleware servidor
- `src/components/Debug/NetworkErrorDiagnostic.tsx` - Panel de diagnóstico
- `scripts/test-error-suppression.js` - Script de testing

---

**Fecha de Implementación**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Activo y Funcional
