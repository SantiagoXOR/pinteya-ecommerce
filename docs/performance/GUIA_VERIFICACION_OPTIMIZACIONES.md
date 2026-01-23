# 🔍 Guía de Verificación de Optimizaciones Post-Deploy

**Fecha:** 23 de Enero, 2026  
**Objetivo:** Verificar que todas las optimizaciones estén activas y funcionando correctamente

---

## ✅ Checklist de Verificación

### 1. Sistema de Batching de Analytics

#### Verificación en Network Tab

1. **Abrir DevTools** (F12) → Pestaña **Network**
2. **Recargar la página** (Ctrl+R / Cmd+R)
3. **Filtrar por "analytics" o "events"**

**Resultados Esperados:**
- ✅ Debe haber **1-2 requests** a `/api/analytics/events/optimized`
- ❌ NO debe haber 50+ requests a `/api/track/events`
- ✅ Los requests deben tener status **202 (Accepted)**

#### Verificar Payload

1. **Click en el request** a `/api/analytics/events/optimized`
2. **Ir a la pestaña "Payload" o "Request"**
3. **Verificar estructura JSON:**

```json
{
  "events": [...],  // Array de eventos
  "tenantId": "...", // Debe estar presente
  "timestamp": 1234567890
}
```

**Resultados Esperados:**
- ✅ `tenantId` presente en el payload
- ✅ `events` es un array con múltiples eventos (batching)
- ✅ Cada evento tiene `tenantId` incluido

#### Verificar en Código

**Abrir consola del navegador y ejecutar:**

```javascript
// Verificar que OptimizedAnalyticsManager esté activo
if (window.__TENANT_CONFIG__) {
  console.log('✅ Tenant config disponible:', window.__TENANT_CONFIG__);
} else {
  console.warn('⚠️ Tenant config no disponible');
}

// Verificar que el sistema optimizado esté cargado
fetch('/api/analytics/events/optimized', { method: 'OPTIONS' })
  .then(() => console.log('✅ Endpoint optimizado disponible'))
  .catch(() => console.warn('⚠️ Endpoint optimizado no disponible'));
```

---

### 2. Preload de Imágenes Hero

#### Verificar en HTML

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña "Elements"**
3. **Buscar en `<head>`** los tags de preload

**Resultados Esperados:**

```html
<link rel="preload" as="image" href="/tenants/pinteya/hero/hero1.webp" fetchPriority="high" type="image/webp" />
<link rel="preload" as="image" href="/tenants/pinteya/hero/hero2.webp" fetchPriority="low" type="image/webp" />
```

**Verificar:**
- ✅ Tags `<link rel="preload">` presentes
- ✅ `fetchPriority="high"` en primera imagen
- ✅ Rutas correctas según tenant

#### Verificar en Network Tab

1. **Filtrar por "hero" o "webp"**
2. **Buscar la primera imagen hero**

**Resultados Esperados:**
- ✅ Primera imagen hero tiene `Priority: High`
- ✅ Imágenes cargan temprano (antes del LCP)
- ✅ Tamaño de imágenes <150KB (verificar en "Size" column)

---

### 3. Lazy Loading de Componentes

#### Verificar Chunks de JavaScript

1. **Network Tab** → Filtrar por "js"
2. **Buscar chunks específicos:**

**Resultados Esperados:**
- ✅ `tenant-config-*.js` se carga bajo demanda (no en carga inicial)
- ✅ `HeroCarousel` se carga después del LCP
- ✅ Chunks se cargan cuando son necesarios

#### Verificar en Performance Tab

1. **Abrir Performance tab** en DevTools
2. **Grabar carga de página** (Ctrl+E / Cmd+E)
3. **Recargar página**
4. **Detener grabación**

**Resultados Esperados:**
- ✅ JavaScript crítico carga primero
- ✅ Componentes pesados (Swiper, carousels) cargan después
- ✅ No hay bloqueo del main thread por componentes no críticos

---

### 4. Critical CSS Inline

#### Verificar en HTML

1. **Elements tab** → Buscar `<style>` en `<head>`

**Resultados Esperados:**
- ✅ Hay un tag `<style>` con CSS crítico inline
- ✅ CSS crítico incluye variables del tenant (`--tenant-primary`, etc.)
- ✅ CSS no crítico se carga diferido

#### Verificar en Network Tab

1. **Filtrar por "css"**
2. **Verificar timing de carga**

**Resultados Esperados:**
- ✅ CSS crítico está inline (no aparece como request separado)
- ✅ CSS no crítico se carga después del FCP
- ✅ Menos requests de CSS bloqueantes

---

### 5. Code Splitting Optimizado

#### Verificar en Network Tab

1. **Filtrar por "chunk" o "js"**
2. **Verificar nombres de chunks**

**Resultados Esperados:**
- ✅ Chunks con nombres como `tenant-config-*.js`
- ✅ Chunks de vendor separados
- ✅ Tamaño de chunks principales <100KB

#### Verificar en Build Output

```bash
npm run build
```

**Verificar en `.next/static/chunks/`:**
- ✅ Chunks de tenant separados
- ✅ Chunks optimizados por tamaño

---

## 🔧 Scripts de Verificación Automática

### Script 1: Verificar Endpoints

```javascript
// Ejecutar en consola del navegador
(async () => {
  const response = await fetch('/api/analytics/events/optimized', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: [], tenantId: 'test' })
  });
  
  if (response.status === 202) {
    console.log('✅ Endpoint optimizado funcionando');
  } else {
    console.warn('⚠️ Endpoint optimizado no responde correctamente');
  }
})();
```

### Script 2: Verificar Tenant ID

```javascript
// Ejecutar en consola del navegador
const tenantId = document.querySelector('meta[name="tenant-id"]')?.content;
if (tenantId) {
  console.log('✅ Tenant ID disponible:', tenantId);
} else {
  console.warn('⚠️ Tenant ID no encontrado en meta tag');
}
```

### Script 3: Verificar Preloads

```javascript
// Ejecutar en consola del navegador
const preloads = Array.from(document.querySelectorAll('link[rel="preload"]'));
const heroPreloads = preloads.filter(link => 
  link.href.includes('hero') && link.getAttribute('as') === 'image'
);

if (heroPreloads.length > 0) {
  console.log('✅ Preloads de hero encontrados:', heroPreloads.length);
  heroPreloads.forEach(link => {
    console.log('  -', link.href, 'Priority:', link.getAttribute('fetchPriority'));
  });
} else {
  console.warn('⚠️ No se encontraron preloads de hero');
}
```

---

## 📊 Métricas a Monitorear

### En Network Tab

| Métrica | Valor Esperado | Cómo Verificar |
|---------|----------------|----------------|
| Requests a `/api/analytics/events/optimized` | 1-2 | Filtrar por "optimized" |
| Requests a `/api/track/events` | 0-1 (fallback) | Filtrar por "track/events" |
| Tamaño total de JS | <500KB inicial | Sumar todos los .js |
| Tamaño de imágenes hero | <150KB cada una | Verificar en "Size" column |
| CSS bloqueante | Mínimo | Verificar "Render Blocking" |

### En Performance Tab

| Métrica | Valor Esperado | Cómo Verificar |
|---------|----------------|----------------|
| LCP | <2.5s | Ver en "Metrics" |
| FCP | <1.8s | Ver en "Metrics" |
| TBT | <200ms | Ver en "Metrics" |
| Total Blocking Time | <200ms | Ver en "Main" thread |

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: Siguen apareciendo 50+ requests a `/api/track/events`

**Causa:** El sistema legacy todavía está activo

**Solución:**
1. Verificar que `UnifiedAnalyticsProvider` esté usando `optimizedAnalytics`
2. Verificar que no haya código legacy llamando directamente a `/api/track/events`
3. Limpiar cache del navegador
4. Verificar que el deploy se completó correctamente

### Problema 2: No aparecen preloads de hero images

**Causa:** El código de preload no está activo o las imágenes no existen

**Solución:**
1. Verificar que `layout.tsx` tenga el código de preload
2. Verificar que las imágenes hero existan en `public/tenants/{tenant}/hero/`
3. Verificar que el tenant config esté correcto
4. Verificar que el deploy incluyó los cambios

### Problema 3: Chunks no se cargan bajo demanda

**Causa:** Code splitting no está funcionando o lazy loading no está implementado

**Solución:**
1. Verificar `next.config.js` tiene la configuración de code splitting
2. Verificar que los componentes usen `dynamic()` o `React.lazy()`
3. Verificar que el build generó los chunks correctamente
4. Limpiar cache y rebuild

---

## ✅ Checklist Final

- [ ] Endpoint optimizado funcionando (202 Accepted)
- [ ] Batching activo (1-2 requests en lugar de 50+)
- [ ] Tenant ID presente en eventos
- [ ] Preloads de hero images presentes
- [ ] Lazy loading funcionando
- [ ] Critical CSS inline
- [ ] Code splitting activo
- [ ] Métricas mejoradas (verificar con Lighthouse)

---

**Última actualización:** 23 de Enero, 2026
