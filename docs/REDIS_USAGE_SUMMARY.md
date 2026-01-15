# 📊 Resumen de Uso de Redis en el Proyecto

## 🔍 Métodos y Archivos que Utilizan Redis

### 1. Rate Limiting Enterprise ⚡

**Archivo**: `src/lib/rate-limiting/enterprise-rate-limiter.ts`

#### Funciones que usan Redis:
- `rateLimitWithRedis()` - Rate limiting distribuido
- `enterpriseRateLimit()` - Función principal de rate limiting
- `slidingWindowRateLimit()` - Ventana deslizante precisa

#### Uso:
```typescript
// Controla límites de peticiones por IP/usuario
// Claves Redis: rate_limit:{key}:{window}
// Operaciones: INCR, EXPIRE, GET, TTL
```

#### Impacto sin Redis:
- ❌ Rate limiting solo en memoria (no distribuido)
- ❌ Límites se pierden al reiniciar servidor
- ❌ Diferentes límites en cada instancia de servidor

#### Impacto con Redis:
- ✅ Rate limiting distribuido entre servidores
- ✅ Límites persistentes
- ✅ Consistencia entre instancias

---

### 2. Cache de SEO Dinámico 🔍

**Archivo**: `src/lib/seo/dynamic-seo-manager.ts`

#### Métodos que usan Redis:
- `getCachedMetadata()` - Obtiene metadatos SEO cacheados
- `setCachedMetadata()` - Guarda metadatos SEO en cache
- `initializeRedis()` - Inicializa conexión Redis

#### Uso:
```typescript
// Cachea metadatos SEO por ruta/idioma
// Claves Redis: seo:{"path":"/productos","language":"es"}
// TTL: 3600 segundos (configurable)
// Operaciones: GET, SETEX
```

#### Impacto sin Redis:
- ⚠️ Cache solo en memoria del servidor
- ⚠️ Cache se pierde al reiniciar
- ⚠️ Cada servidor tiene su propio cache

#### Impacto con Redis:
- ✅ Cache compartido entre servidores
- ✅ Cache persistente
- ✅ Mejor rendimiento en regeneración de SEO

---

### 3. Sistema de Cache Multi-Capa 💾

**Archivo**: `src/lib/cache/multi-layer-cache-manager.ts`

#### Funcionalidad:
- L1: Cache en memoria (rápido)
- L2: Redis (distribuido)
- L3: Fuente de datos (DB/API)

#### Uso:
```typescript
// Cache de productos, categorías, búsquedas
// Estrategia: L1 → L2 → L3
// Operaciones: GET, SET, DEL, EXPIRE
```

#### Impacto sin Redis:
- ⚠️ Solo cache L1 (memoria)
- ⚠️ No hay cache compartido
- ⚠️ Cache se pierde al reiniciar

#### Impacto con Redis:
- ✅ Cache distribuido (L2)
- ✅ Cache persistente
- ✅ Mejor hit rate

---

### 4. Métricas y Monitoreo 📊

**Archivos**:
- `src/lib/enterprise/metrics/index.ts`
- `src/lib/monitoring/enterprise-metrics.ts`

#### Funcionalidad:
- Agregación de métricas en tiempo real
- Contadores de eventos
- Listas de métricas temporales

#### Uso:
```typescript
// Almacena métricas temporales
// Operaciones: LPUSH, LTRIM, LRANGE, INCR
// Claves: metrics:{type}:{timestamp}
```

---

### 5. Funciones de Utilidad Redis 🔧

**Archivo**: `src/lib/integrations/redis/index.ts`

#### Funciones disponibles:

##### Rate Limiting:
- `getRateLimitInfo(key)` - Obtiene info de rate limit
- `incrementRateLimit(key, windowSeconds)` - Incrementa contador
- `enterpriseRateLimit(key, windowMs, maxRequests)` - Rate limit enterprise
- `slidingWindowRateLimit(key, windowMs, maxRequests)` - Ventana deslizante
- `getRateLimitStats(pattern)` - Estadísticas de rate limits
- `cleanupRateLimitKeys(pattern)` - Limpia claves expiradas

##### Cache:
- `RedisCache` - Clase para operaciones de cache
  - `get(key)` - Obtener valor
  - `set(key, value, ttlSeconds?)` - Guardar valor
  - `del(key)` - Eliminar clave
  - `incr(key)` - Incrementar contador
  - `expire(key, ttlSeconds)` - Establecer TTL
  - `ttl(key)` - Obtener TTL restante

##### Utilidades:
- `getRedisClient()` - Obtiene cliente Redis (singleton)
- `isRedisAvailable()` - Verifica si Redis está disponible
- `closeRedisConnection()` - Cierra conexión gracefully

---

## 📈 Impacto en Rendimiento

### Sin Redis (Estado Actual):
- ⚠️ Rate limiting no distribuido
- ⚠️ Cache solo en memoria
- ⚠️ Pérdida de datos al reiniciar
- ⚠️ Inconsistencias entre servidores

### Con Redis:
- ✅ Rate limiting distribuido y preciso
- ✅ Cache compartido y persistente
- ✅ Mejor rendimiento en alta carga
- ✅ Consistencia entre instancias
- ✅ Escalabilidad horizontal

---

## 🔑 Claves Redis Utilizadas

### Rate Limiting:
```
rate_limit:{identifier}:{window}
rate_limit:{ip}:{window}
rate_limit:{user_id}:{window}
```

### SEO Cache:
```
seo:{"path":"/ruta","language":"es"}
seo:{"path":"/productos","language":"en"}
```

### Cache General:
```
cache:product:{id}
cache:category:{id}
cache:search:{query}
```

### Métricas:
```
metrics:{type}:{timestamp}
metrics:events:{date}
```

---

## 🎯 Prioridad de Implementación

### 🔥 Alta Prioridad:
1. **Rate Limiting** - Crítico para seguridad y estabilidad
2. **Cache SEO** - Mejora significativa de rendimiento

### 🟡 Media Prioridad:
3. **Cache Multi-Capa** - Optimización de rendimiento
4. **Métricas** - Mejora monitoreo

---

## 📝 Notas Importantes

1. **Fallback Automático**: Si Redis no está disponible, el sistema usa memoria local (MockRedis)
2. **Sin Breaking Changes**: Habilitar Redis no rompe funcionalidad existente
3. **Configuración Gradual**: Puedes habilitar Redis sin afectar producción
4. **Monitoreo**: El código incluye logging automático de estado Redis

---

**Última actualización**: Enero 2026
