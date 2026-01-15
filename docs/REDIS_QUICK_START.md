# ⚡ Redis - Inicio Rápido

## 🎯 Resumen

Redis está implementado en el proyecto pero **deshabilitado** (`DISABLE_REDIS=true`). Esta guía te ayuda a habilitarlo rápidamente.

## 📚 Documentación Completa

- **Guía Completa**: `docs/REDIS_CONFIGURATION_GUIDE.md`
- **Resumen de Uso**: `docs/REDIS_USAGE_SUMMARY.md`
- **Variables de Entorno**: `ENV_VARIABLES_REQUIRED.md`

## 🚀 Pasos Rápidos (5 minutos)

### 1. Elegir Proveedor

**Opción A: Redis Cloud** (Recomendado)
- URL: https://redis.com/try-free/
- Plan gratuito disponible
- Alta disponibilidad

**Opción B: Upstash** (Serverless)
- URL: https://upstash.com/
- Pago por uso
- Integración fácil con Vercel

### 2. Obtener Credenciales

Después de crear tu base de datos, obtendrás:
```
Host: redis-xxxxx.redis.cloud
Port: 12345
Password: tu-password-generado
```

### 3. Configurar Variables en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto → Settings → Environment Variables
3. Agrega estas variables:

```env
REDIS_HOST=tu-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=tu-password
REDIS_DB=0
DISABLE_REDIS=false
```

### 4. Probar Conexión (Local)

```bash
# Configurar en .env.local primero
node scripts/test-redis-connection.js
```

### 5. Redesplegar

En Vercel Dashboard:
- Deployments → ... → Redeploy

## ✅ Verificación

Después de redesplegar, verifica en los logs:

```
✅ Redis connected successfully
```

Si ves:
```
⚠️ Redis deshabilitado por configuración, usando mock
```

Verifica que `DISABLE_REDIS=false` esté configurado.

## 🔍 ¿Qué Funcionalidades Usan Redis?

1. **Rate Limiting** ⚡
   - Control de límites de peticiones distribuido
   - Sin Redis: solo en memoria (no distribuido)

2. **Cache SEO** 🔍
   - Cache de metadatos SEO compartido
   - Sin Redis: cache solo en memoria

3. **Cache Multi-Capa** 💾
   - Cache distribuido de productos/categorías
   - Sin Redis: solo cache local

## 🆘 Problemas Comunes

### Redis no se conecta

**Solución**:
1. Verifica `DISABLE_REDIS=false` (no `true`)
2. Verifica credenciales (host, port, password)
3. Ejecuta: `node scripts/test-redis-connection.js`

### Rate limiting no funciona entre servidores

**Solución**:
- Verifica que Redis esté habilitado
- Verifica que todas las instancias usen el mismo Redis

## 📞 Ayuda

- **Guía Completa**: `docs/REDIS_CONFIGURATION_GUIDE.md`
- **Script de Test**: `scripts/test-redis-connection.js`
- **Código Redis**: `src/lib/integrations/redis/index.ts`

---

**Tiempo estimado**: 5-10 minutos
**Dificultad**: Fácil
**Impacto**: Alto (mejora rate limiting y cache)
