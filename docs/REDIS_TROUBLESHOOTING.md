# 🔍 Diagnóstico de Problemas con Redis en Producción

## ❌ Problema: Redis no se conecta en Producción

Si después de configurar Redis en Vercel y redesplegar, los números en el dashboard de Upstash no cambian, sigue estos pasos:

## 📋 Pasos de Diagnóstico

### 1. Verificar Variables de Entorno en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto → **Settings** → **Environment Variables**
3. Verifica que estas variables estén configuradas correctamente:

```env
REDIS_HOST=knowing-ewe-31162.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu-token-aqui
REDIS_DB=0
DISABLE_REDIS=false  ← ⚠️ IMPORTANTE: Debe ser "false" (no "true")
```

**Puntos críticos a verificar**:
- ✅ `DISABLE_REDIS` debe ser exactamente `false` (no `"false"` con comillas)
- ✅ `REDIS_PASSWORD` debe estar completo (sin espacios al inicio/final)
- ✅ Todas las variables deben estar marcadas para **Production** environment

### 2. Usar el Endpoint de Diagnóstico

Después de redesplegar, accede a:

```
https://tu-dominio.com/api/debug/redis
```

Este endpoint te mostrará:
- Estado de las variables de entorno
- Si Redis está conectado
- Si está usando MockRedis
- Resultados de tests de conexión
- Errores específicos

**Ejemplo de respuesta exitosa**:
```json
{
  "success": true,
  "status": "healthy",
  "message": "Redis está conectado y funcionando correctamente",
  "diagnostics": {
    "environment": {
      "REDIS_HOST": "knowing-ewe-31162.upstash.io",
      "DISABLE_REDIS": "false"
    },
    "connection": {
      "available": true,
      "isMock": false
    },
    "tests": {
      "ping": { "success": true },
      "write": { "success": true },
      "read": { "success": true },
      "increment": { "success": true }
    }
  }
}
```

**Ejemplo de respuesta con problemas**:
```json
{
  "success": false,
  "status": "mock",
  "message": "Redis está deshabilitado o usando mock",
  "diagnostics": {
    "environment": {
      "DISABLE_REDIS": "true"  ← ⚠️ Problema aquí
    },
    "connection": {
      "available": false,
      "isMock": true
    }
  }
}
```

### 3. Revisar Logs de Vercel

1. Ve a: **Vercel Dashboard** → Tu proyecto → **Deployments**
2. Click en el último deployment
3. Ve a la pestaña **"Functions"** o **"Runtime Logs"**
4. Busca mensajes de Redis:

**Logs exitosos**:
```
[REDIS] ✅ Connected successfully
[REDIS] ✅ Lazy connection successful
```

**Logs de error**:
```
[REDIS] ❌ Connection error: ...
[REDIS] ⚠️ Cambiando a modo mock debido a error de conexión
[REDIS] Redis deshabilitado por configuración, usando mock
```

### 4. Problemas Comunes y Soluciones

#### Problema: `DISABLE_REDIS=true` en producción

**Síntoma**: El endpoint muestra `"isMock": true` y `"DISABLE_REDIS": "true"`

**Solución**:
1. Ve a Vercel → Environment Variables
2. Busca `DISABLE_REDIS`
3. Cambia el valor de `true` a `false`
4. Verifica que esté marcado para **Production**
5. **Redesplega** la aplicación

#### Problema: Password incorrecto o incompleto

**Síntoma**: `"connection.error"` con mensaje sobre autenticación

**Solución**:
1. Ve a Upstash Dashboard → Tu base de datos → **Details**
2. Haz click en **"TOKEN"** para ver el password completo
3. Copia el token **completo** (sin espacios)
4. Actualiza `REDIS_PASSWORD` en Vercel
5. **Redesplega**

#### Problema: Host o Puerto incorrecto

**Síntoma**: Error de conexión con `ECONNREFUSED` o `timeout`

**Solución**:
1. Verifica en Upstash Dashboard:
   - **Endpoint**: `knowing-ewe-31162.upstash.io`
   - **Port**: `6379`
2. Actualiza `REDIS_HOST` y `REDIS_PORT` en Vercel
3. **Redesplega**

#### Problema: Variables no se cargan correctamente

**Síntoma**: Variables muestran `"no configurado"` en el diagnóstico

**Solución**:
1. Verifica que las variables estén en el environment correcto (Production)
2. **IMPORTANTE**: Después de agregar/modificar variables, **SIEMPRE** redesplega
3. Vercel no carga nuevas variables sin redeploy

#### Problema: Redis no se conecta (lazy connection)

**Síntoma**: Redis solo se conecta cuando se usa, pero nunca se usa

**Solución**: 
- El código ahora fuerza una conexión automática
- Si aún no funciona, verifica que las funciones que usan Redis se estén ejecutando
- Puedes forzar uso llamando al endpoint `/api/debug/redis` que crea una conexión

### 5. Verificar que Redis se Esté Usando

Una vez que Redis esté conectado, puedes verificar su uso:

1. **Upstash Dashboard**: 
   - Ve a tu base de datos
   - Pestaña **"Usage"**
   - Deberías ver comandos incrementando

2. **Endpoint de diagnóstico**:
   - `/api/debug/redis` muestra estadísticas de rate limiting

3. **Logs de Vercel**:
   - Busca mensajes de rate limiting con `"source": "redis"`

### 6. Forzar Conexión de Redis

Si Redis no se conecta automáticamente, puedes forzar su uso haciendo una request a:

```bash
# Esto forzará que Redis se conecte
curl https://tu-dominio.com/api/debug/redis
```

O usa las funcionalidades que requieren Redis:
- Rate limiting (haz muchas requests)
- Cache SEO (navega a páginas diferentes)
- Cache de productos (visita páginas de productos)

### 7. Checklist Final

Antes de reportar un problema, verifica:

- [ ] `DISABLE_REDIS=false` (no `true`, no `"false"`)
- [ ] `REDIS_HOST` correcto (copiado de Upstash)
- [ ] `REDIS_PORT=6379`
- [ ] `REDIS_PASSWORD` completo (click en TOKEN en Upstash)
- [ ] Todas las variables marcadas para **Production**
- [ ] **Redesplegado** después de cambiar variables
- [ ] Endpoint `/api/debug/redis` muestra `"status": "healthy"`
- [ ] Logs de Vercel muestran `[REDIS] ✅ Connected successfully`

## 🆘 Si Nada Funciona

1. **Captura el resultado** de `/api/debug/redis`
2. **Revisa los logs** de Vercel y copia los mensajes de Redis
3. **Verifica en Upstash** que la base de datos esté activa
4. **Prueba localmente** con las mismas credenciales para aislar el problema

---

**Última actualización**: Enero 2026
