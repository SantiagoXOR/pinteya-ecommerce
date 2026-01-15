# 🚀 Guía de Configuración de Redis - Pinteya E-commerce

## 📋 Resumen Ejecutivo

Redis está implementado en el proyecto pero actualmente **deshabilitado** mediante la variable `DISABLE_REDIS=true`. Esta guía te ayudará a configurarlo correctamente para producción.

## 🔍 Métodos y Funcionalidades que Utilizan Redis

### 1. **Rate Limiting Enterprise** ⚡
**Archivo**: `src/lib/rate-limiting/enterprise-rate-limiter.ts`

Redis se utiliza para implementar rate limiting distribuido con ventanas deslizantes:

- **Función**: `rateLimitWithRedis()`
- **Uso**: Control de límites de peticiones por IP/usuario
- **Ventajas con Redis**:
  - Rate limiting distribuido entre múltiples instancias
  - Persistencia de contadores entre reinicios
  - Operaciones atómicas para precisión

**Ejemplo de uso**:
```typescript
// Sin Redis: usa memoria local (no distribuido)
// Con Redis: rate limiting compartido entre servidores
```

### 2. **Cache de SEO Dinámico** 🔍
**Archivo**: `src/lib/seo/dynamic-seo-manager.ts`

Redis cachea metadatos SEO para mejorar rendimiento:

- **Métodos**: `getCachedMetadata()`, `setCachedMetadata()`
- **Uso**: Cache de metadatos SEO por ruta/idioma
- **TTL**: Configurable (default: 3600 segundos)

**Ejemplo**:
```typescript
// Cachea: seo:{"path":"/productos","language":"es"}
// Evita regenerar metadatos en cada request
```

### 3. **Sistema de Cache Multi-Capa** 💾
**Archivo**: `src/lib/cache/multi-layer-cache-manager.ts`

Redis actúa como capa de cache distribuida:

- **Estrategia**: L1 (memoria) → L2 (Redis) → L3 (fuente de datos)
- **Uso**: Cache de productos, categorías, búsquedas
- **Ventajas**: Cache compartido entre instancias de servidor

### 4. **Métricas y Monitoreo** 📊
**Archivos**: 
- `src/lib/enterprise/metrics/index.ts`
- `src/lib/monitoring/enterprise-metrics.ts`

Redis almacena métricas temporales y contadores:

- **Uso**: Agregación de métricas en tiempo real
- **Operaciones**: Listas, contadores, sets

## 🛠️ Configuración Paso a Paso

### Paso 1: Elegir Proveedor de Redis

Tienes 3 opciones principales:

#### Opción A: Redis Cloud (Recomendado para Producción) ☁️
- **URL**: https://redis.com/try-free/
- **Ventajas**: 
  - Gestión automática
  - Alta disponibilidad
  - Escalado automático
  - SSL/TLS incluido

#### Opción B: Upstash Redis (Serverless) ⚡
- **URL**: https://upstash.com/
- **Ventajas**:
  - Serverless (pago por uso)
  - Integración fácil con Vercel
  - Free tier generoso

#### Opción C: Redis Local (Solo Desarrollo) 💻
- **Instalación**: Docker o instalación local
- **Uso**: Solo para desarrollo/testing

### Paso 2: Configurar Variables de Entorno

#### Para Desarrollo Local

Crea o edita `.env.local`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# IMPORTANTE: Cambiar a false para habilitar Redis
DISABLE_REDIS=false
```

#### Para Producción (Vercel)

En el dashboard de Vercel, agrega estas variables:

```env
# Redis Cloud / Upstash
REDIS_HOST=tu-redis-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=tu-password-seguro
REDIS_DB=0

# Habilitar Redis
DISABLE_REDIS=false
```

**Nota**: Si usas Redis Cloud o Upstash, obtendrás una URL completa. Puedes extraer los valores así:
- `redis://default:password@host:port` → 
  - `REDIS_HOST=host`
  - `REDIS_PORT=port`
  - `REDIS_PASSWORD=password`

### Paso 3: Configurar Redis Cloud (Ejemplo)

1. **Crear cuenta en Redis Cloud**:
   ```
   https://redis.com/try-free/
   ```

2. **Crear base de datos**:
   - Elige el plan (Free tier disponible)
   - Selecciona región cercana a tu servidor
   - Configura nombre y password

3. **Obtener credenciales**:
   ```
   Endpoint: redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
   Port: 12345
   Password: tu-password-generado
   ```

4. **Configurar en Vercel**:
   ```
   REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=tu-password-generado
   REDIS_DB=0
   DISABLE_REDIS=false
   ```

### Paso 4: Configurar Upstash Redis (Alternativa)

1. **Crear cuenta en Upstash**:
   ```
   https://console.upstash.com/
   ```

2. **Crear base de datos**:
   - Click "Create Database"
   - Elige región
   - Copia las credenciales

3. **Configurar en Vercel**:
   ```
   REDIS_HOST=tu-db.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=tu-token
   REDIS_DB=0
   DISABLE_REDIS=false
   ```

### Paso 5: Verificar Configuración

Crea un script de verificación:

**`scripts/test-redis-connection.js`**:
```javascript
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  });

  try {
    await redis.ping();
    console.log('✅ Redis conectado correctamente');
    
    // Test de escritura
    await redis.set('test:connection', 'ok', 'EX', 10);
    const value = await redis.get('test:connection');
    console.log('✅ Test de escritura/lectura:', value);
    
    await redis.quit();
    console.log('✅ Conexión cerrada correctamente');
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    process.exit(1);
  }
}

testRedis();
```

Ejecutar:
```bash
node scripts/test-redis-connection.js
```

## 🔧 Configuración Avanzada

### Configuración de Timeouts

El código ya incluye timeouts optimizados:

```typescript
// En src/lib/integrations/redis/index.ts
const REDIS_CONFIG = {
  connectTimeout: 10000,    // 10 segundos para conectar
  commandTimeout: 5000,     // 5 segundos por comando
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  keepAlive: 30000,         // Mantener conexión viva
}
```

### Configuración de SSL/TLS

Si tu proveedor requiere SSL (como Redis Cloud), agrega:

```typescript
// Modificar src/lib/integrations/redis/index.ts
const REDIS_CONFIG = {
  // ... configuración existente
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
}
```

Y en `.env.local`:
```env
REDIS_TLS=true
```

## 📊 Monitoreo y Debugging

### Verificar Estado de Redis

El código ya incluye logging automático:

```typescript
// Eventos registrados automáticamente:
- 'connect' → Redis conectado
- 'error' → Error de conexión (fallback a mock)
- 'close' → Conexión cerrada
- 'reconnecting' → Reintentando conexión
```

### Verificar si Redis está Activo

```typescript
import { isRedisAvailable } from '@/lib/integrations/redis'

const available = await isRedisAvailable()
console.log('Redis disponible:', available)
```

### Ver Estadísticas de Rate Limiting

```typescript
import { getRateLimitStats } from '@/lib/integrations/redis'

const stats = await getRateLimitStats('rate_limit:*')
console.log('Rate limit stats:', stats)
```

## 🚨 Troubleshooting

### Problema: Redis no se conecta

**Síntomas**:
- Logs muestran "Redis deshabilitado por configuración, usando mock"
- Rate limiting funciona pero no es distribuido

**Soluciones**:
1. Verificar `DISABLE_REDIS=false` (no `true`)
2. Verificar credenciales (host, port, password)
3. Verificar firewall/red (puerto abierto)
4. Verificar que Redis esté corriendo

### Problema: Timeouts frecuentes

**Síntomas**:
- Errores de timeout en logs
- Fallback a memoria frecuente

**Soluciones**:
1. Aumentar `connectTimeout` y `commandTimeout`
2. Verificar latencia de red
3. Considerar Redis en región más cercana
4. Verificar carga del servidor Redis

### Problema: Rate limiting no funciona entre servidores

**Síntomas**:
- Rate limits diferentes en diferentes instancias
- No se comparten límites

**Solución**:
- Verificar que Redis esté habilitado (`DISABLE_REDIS=false`)
- Verificar que todas las instancias usen el mismo Redis
- Verificar conectividad de red

## 📝 Checklist de Configuración

### Pre-Producción

- [ ] Redis Cloud/Upstash configurado
- [ ] Variables de entorno configuradas en Vercel
- [ ] `DISABLE_REDIS=false` en producción
- [ ] Test de conexión exitoso
- [ ] Verificar rate limiting funciona
- [ ] Verificar cache SEO funciona
- [ ] Monitorear logs por 24h

### Post-Configuración

- [ ] Verificar métricas de Redis en dashboard
- [ ] Configurar alertas de uso
- [ ] Documentar credenciales (en gestor seguro)
- [ ] Configurar backups (si aplica)

## 🔐 Seguridad

### Mejores Prácticas

1. **Password fuerte**: Usa passwords generados aleatoriamente
2. **SSL/TLS**: Habilita en producción
3. **Firewall**: Restringe acceso por IP si es posible
4. **Rotación**: Rota passwords periódicamente
5. **Variables de entorno**: Nunca hardcodees credenciales

### Variables Sensibles

```env
# ✅ CORRECTO: En variables de entorno
REDIS_PASSWORD=tu-password-seguro

# ❌ INCORRECTO: En código
const password = "mi-password"
```

## 📚 Referencias

- **Documentación ioredis**: https://github.com/redis/ioredis
- **Redis Cloud**: https://redis.com/cloud/
- **Upstash**: https://upstash.com/docs
- **Código Redis en proyecto**: `src/lib/integrations/redis/index.ts`

## 🎯 Próximos Pasos

1. ✅ Configurar Redis Cloud/Upstash
2. ✅ Actualizar variables en Vercel
3. ✅ Cambiar `DISABLE_REDIS=false`
4. ✅ Redesplegar aplicación
5. ✅ Verificar logs y métricas
6. ✅ Monitorear por 24-48h

---

**¿Necesitas ayuda?** Revisa los logs de la aplicación o contacta al equipo de desarrollo.
