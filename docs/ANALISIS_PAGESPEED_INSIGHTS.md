# Análisis Completo de Problemas de Rendimiento - PageSpeed Insights

## Fecha de Análisis
4 de Diciembre 2025

## Resumen Ejecutivo

Este documento identifica todos los problemas comunes que PageSpeed Insights reporta en el diagnóstico de rendimiento y proporciona soluciones específicas para cada uno.

---

## Problemas Identificados y Soluciones

### 1. CSS Bloqueante (Render-Blocking Resources)

**Problema:**
PageSpeed Insights reporta CSS que bloquea el renderizado inicial. Actualmente hay varios archivos CSS importados síncronamente en `layout.tsx`:

```typescript
// src/app/layout.tsx
import './css/style.css'                    // Bloqueante
import './css/euclid-circular-a-font.css'  // Bloqueante
import '../styles/checkout-mobile.css'     // Bloqueante
import '../styles/z-index-hierarchy.css'  // Bloqueante
```

**Impacto:**
- Retrasa el First Contentful Paint (FCP)
- Bloquea el renderizado hasta que todo el CSS carga
- Afecta negativamente el Core Web Vitals

**Solución Implementada:**
- ✅ CSS crítico ya está inline en el `<head>` (líneas 34-69 de layout.tsx)
- ⚠️ CSS no crítico sigue siendo bloqueante

**Recomendación:**
Convertir CSS no crítico a carga asíncrona usando `next/dynamic` o cargar después del FCP:

```typescript
// Opción 1: Usar useEffect para cargar CSS después del FCP
useEffect(() => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/styles/checkout-mobile.css'
  link.media = 'print'
  link.onload = () => { link.media = 'all' }
  document.head.appendChild(link)
}, [])

// Opción 2: Usar next/dynamic para componentes que usan CSS específico
```

**Prioridad:** Media-Alta
**Impacto Esperado:** Mejora FCP en 0.2-0.5s

---

### 2. Scripts de Terceros (Third-Party Scripts)

**Problema:**
Scripts de terceros pueden bloquear el renderizado o consumir recursos del main thread.

**Estado Actual:**
- ✅ Google Analytics: Usa `strategy='lazyOnload'` (correcto)
- ✅ Meta Pixel: Usa `strategy='lazyOnload'` (correcto)
- ✅ Google Ads: No carga scripts adicionales (usa gtag de GA)

**Mejoras Recomendadas:**

#### A. Agregar `fetchpriority="low"` a scripts no críticos
```typescript
<Script
  strategy='lazyOnload'"
  fetchPriority="low"
  src="..."
/>
```

#### B. Usar `afterInteractive` en lugar de `lazyOnload` para scripts críticos
```typescript
// Para scripts que necesitan ejecutarse temprano pero no bloquean
<Script strategy="afterInteractive" />
```

**Prioridad:** Baja
**Impacto Esperado:** Mejora menor en TTI

---

### 3. Optimización de Imágenes

**Estado Actual:**
- ✅ Next.js Image component configurado con WebP/AVIF
- ✅ `deviceSizes` y `imageSizes` optimizados
- ✅ `quality: 85` configurado
- ✅ Lazy loading implementado

**Verificaciones Necesarias:**

#### A. Asegurar que todas las imágenes usen `next/image`
```bash
# Buscar imágenes que no usen next/image
grep -r "<img" src/ --exclude-dir=node_modules
```

#### B. Verificar imágenes hero tienen `priority={true}`
Las imágenes above-the-fold deben tener:
```typescript
<Image
  src="/hero-image.jpg"
  priority={true}  // ✅ Crítico para LCP
  quality={85}
/>
```

#### C. Verificar dimensiones explícitas
Todas las imágenes deben tener `width` y `height` para prevenir CLS:
```typescript
<Image
  width={1200}
  height={600}
  src="..."
/>
```

**Prioridad:** Alta
**Impacto Esperado:** Mejora LCP en 0.5-1.5s

---

### 4. JavaScript Sin Minificar o Sin Comprimir

**Estado Actual:**
- ✅ Next.js minifica automáticamente en producción
- ✅ Webpack optimizations configuradas (`minimize: true`)
- ✅ Tree-shaking habilitado (`usedExports: true`)

**Verificaciones:**

#### A. Verificar compresión Gzip/Brotli en servidor
El servidor debe comprimir respuestas JavaScript:
- Gzip: ~70% reducción
- Brotli: ~75% reducción

#### B. Verificar que no hay código muerto
```bash
# Ejecutar bundle analyzer
ANALYZE=true npm run build
```

**Prioridad:** Baja (ya optimizado)
**Impacto Esperado:** Ya implementado

---

### 5. Eliminar Recursos No Utilizados

**Problema:**
PageSpeed Insights reporta recursos JavaScript/CSS que se descargan pero no se usan.

**Solución:**

#### A. Usar Coverage Tool de Chrome DevTools
1. Abrir Chrome DevTools → Coverage tab
2. Recargar página
3. Identificar código no utilizado
4. Remover o hacer lazy load

#### B. Verificar imports no utilizados
```bash
# Usar ESLint para encontrar imports no usados
npm run lint
```

#### C. Lazy load de librerías pesadas
Ya implementado para:
- ✅ Recharts (solo admin)
- ✅ Framer Motion (separado en chunk)
- ✅ Radix UI (separado en chunk)

**Prioridad:** Media
**Impacto Esperado:** Reducción de bundle size en 10-20%

---

### 6. Reducir Tiempo de Ejecución de JavaScript

**Problema:**
JavaScript pesado puede bloquear el main thread y retrasar el TTI (Time to Interactive).

**Soluciones Implementadas:**
- ✅ Code splitting agresivo
- ✅ Lazy loading de componentes pesados
- ✅ Chunks separados por librería

**Mejoras Adicionales:**

#### A. Usar Web Workers para cálculos pesados
```typescript
// Para operaciones que no necesitan DOM
const worker = new Worker('/workers/heavy-calculation.js')
worker.postMessage(data)
```

#### B. Defer cálculos no críticos
```typescript
// Usar requestIdleCallback para tareas de baja prioridad
requestIdleCallback(() => {
  // Cálculos no críticos
})
```

**Prioridad:** Baja
**Impacto Esperado:** Mejora TTI en 0.2-0.5s

---

### 7. Preload de Recursos Críticos

**Estado Actual:**
- ✅ Fuentes críticas preloadadas (Regular y Bold)
- ✅ Preconnect a dominios externos
- ⚠️ Falta preload de imágenes hero críticas

**Mejora Recomendada:**

Agregar preload de imagen hero (LCP candidate):
```typescript
<link
  rel="preload"
  as="image"
  href="/images/hero/hero1.webp"
  fetchPriority="high"
/>
```

**Prioridad:** Alta
**Impacto Esperado:** Mejora LCP en 0.3-0.8s

---

### 8. Evitar Cambios de Diseño (CLS)

**Problema:**
Cumulative Layout Shift (CLS) puede ocurrir por:
- Imágenes sin dimensiones
- Fuentes sin reserva de espacio
- Contenido dinámico que se carga después

**Soluciones Implementadas:**
- ✅ `font-display: swap` en fuentes
- ✅ Aspect ratios en CSS para imágenes
- ✅ Dimensiones explícitas en componentes Image

**Verificaciones:**

#### A. Usar aspect-ratio CSS
```css
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
}
```

#### B. Reservar espacio para contenido dinámico
```typescript
// Usar skeleton loaders con dimensiones exactas
<div style={{ height: '400px' }}>
  {loading ? <Skeleton /> : <Content />}
</div>
```

**Prioridad:** Alta
**Impacto Esperado:** CLS < 0.1

---

### 9. Optimizar Tiempo de Respuesta del Servidor (TTFB)

**Problema:**
Time to First Byte (TTFB) alto puede indicar:
- Servidor lento
- Falta de caché
- Consultas de base de datos lentas

**Soluciones:**

#### A. Headers de caché optimizados
Ya implementado:
- ✅ Assets estáticos: `max-age=31536000, immutable`
- ✅ Páginas: `max-age=3600, must-revalidate`

#### B. Usar ISR (Incremental Static Regeneration)
```typescript
// En páginas que pueden usar ISR
export const revalidate = 3600 // 1 hora
```

#### C. Optimizar consultas de base de datos
- Usar índices apropiados
- Limitar datos devueltos
- Usar caché de Redis cuando sea posible

**Prioridad:** Media
**Impacto Esperado:** Mejora TTFB en 0.2-0.5s

---

### 10. Reducir Tamaño de Payload

**Estado Actual:**
- Bundle total: ~3.2 MB
- First Load JS: 499 KB
- Vendor chunk: 466 KB

**Mejoras Recomendadas:**

#### A. Code splitting más agresivo
Ya implementado con chunks separados por librería.

#### B. Usar dynamic imports para rutas
```typescript
// En lugar de import estático
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

#### C. Remover dependencias no utilizadas
```bash
# Verificar dependencias
npm run analyze
```

**Prioridad:** Media
**Impacto Esperado:** Reducción de 10-15% en bundle size

---

## Checklist de Implementación

### Prioridad Alta
- [ ] Preload de imagen hero crítica
- [ ] Verificar todas las imágenes usan `next/image` con dimensiones
- [ ] Asegurar imágenes hero tienen `priority={true}`
- [ ] Verificar CLS < 0.1 con aspect-ratios

### Prioridad Media
- [ ] Convertir CSS no crítico a carga asíncrona
- [ ] Verificar y remover código no utilizado
- [ ] Optimizar consultas de base de datos
- [ ] Implementar ISR donde sea posible

### Prioridad Baja
- [ ] Agregar `fetchpriority` a scripts
- [ ] Usar Web Workers para cálculos pesados
- [ ] Defer cálculos no críticos

---

## Métricas Objetivo

| Métrica | Actual | Objetivo | Estado |
|---------|--------|----------|--------|
| **FCP** | ~3.5s | < 1.8s | 🔴 Necesita mejora |
| **LCP** | ~3.5s | < 2.5s | 🔴 Necesita mejora |
| **CLS** | ~0.28 | < 0.1 | 🔴 Necesita mejora |
| **TTFB** | ? | < 600ms | ⚠️ Verificar |
| **TTI** | ? | < 3.8s | ⚠️ Verificar |
| **FID/INP** | ? | < 100ms | ⚠️ Verificar |

---

## Próximos Pasos

1. **Ejecutar nuevo análisis** en PageSpeed Insights después de desplegar optimizaciones
2. **Monitorear Core Web Vitals** en producción usando PerformanceTracker
3. **Iterar** basándose en métricas reales de usuarios
4. **Optimizar** problemas específicos reportados por PageSpeed Insights

---

## Referencias

- [PageSpeed Insights Documentation](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Optimizing CSS Delivery](https://web.dev/defer-non-critical-css/)

