# 🚀 Plan de Acción - Optimizaciones de Performance

**Fecha**: 23 de Enero 2026  
**Basado en**: PageSpeed Insights + Análisis de Bundle  
**Performance Actual**: 43/100 (Mobile)  
**Objetivo**: >85/100

---

## 📊 Resumen Ejecutivo

### Problemas Identificados

1. **Chunk crítico**: 670 KB bloqueando ejecución 🔴
2. **Imágenes no optimizadas**: 418 KiB de ahorro potencial 🔴
3. **JavaScript no utilizado**: 192 KiB en chunks grandes 🔴
4. **Caché no optimizado**: 265 KiB de ahorro potencial 🔴
5. **Tiempo de ejecución JS**: 3.2s (target: <2s) 🔴
6. **Trabajo del hilo principal**: 7.0s (target: <5s) 🔴

### Impacto Esperado Total

- **Ahorro de tamaño**: ~952 KiB
- **Mejora en Performance**: 43 → 85+ puntos
- **Mejora en LCP**: 11.3s → <2.5s
- **Mejora en TBT**: 770ms → <300ms

---

## 🎯 Fases de Optimización

### FASE 1: Optimización Crítica de Bundle (Prioridad Máxima) 🔴

**Objetivo**: Reducir chunk de 670 KB y optimizar chunks grandes  
**Impacto esperado**: Mejora significativa en TBT y tiempo de ejecución  
**Duración estimada**: 2-3 horas

#### 1.1 Análisis del Chunk de 670 KB

**Acciones**:
- [ ] Ejecutar bundle analyzer visual: `ANALYZE=true npm run build`
- [ ] Abrir reporte en navegador y analizar contenido
- [ ] Identificar librerías en el chunk
- [ ] Identificar componentes en el chunk
- [ ] Documentar hallazgos

**Herramientas**:
```bash
# Bundle analyzer visual
ANALYZE=true npm run build

# Análisis de chunks
npm run analyze:chunks

# Verificación de optimización
npm run bundle-optimization:check
```

**Entregables**:
- Lista de librerías en chunk de 670 KB
- Lista de componentes en chunk de 670 KB
- Oportunidades de optimización identificadas

#### 1.2 Dividir Chunk de 670 KB

**Estrategias**:

1. **Separar vendor bundle**
   - Crear chunks separados por librería
   - Lazy load de librerías no críticas
   - Optimizar imports modulares

2. **Lazy load de componentes pesados**
   - Identificar componentes grandes
   - Convertir a dynamic imports
   - Implementar lazy loading

3. **Optimizar code splitting**
   - Ajustar `maxSize` en `next.config.js`
   - Reducir límites para forzar más chunks pequeños
   - Optimizar `cacheGroups`

**Cambios en `next.config.js`**:
```javascript
// Reducir maxSize para vendor
vendor: {
  maxSize: 50000, // Reducido de 100KB a 50KB
  // ...
}

// Reducir maxSize para pages
pages: {
  maxSize: 80000, // Reducido de 150KB a 80KB
  // ...
}
```

**Criterios de éxito**:
- Chunk de 670 KB dividido en chunks <200 KB
- Reducción de 200-400 KB en chunk más grande
- Mejora en tiempo de ejecución: 3.2s → <2s

#### 1.3 Optimizar Chunk de 208 KB

**Acciones**:
- [ ] Identificar contenido del chunk
- [ ] Implementar lazy loading si es posible
- [ ] Optimizar imports
- [ ] Dividir si contiene múltiples librerías

**Criterios de éxito**:
- Reducción de 50-100 KB
- Chunk dividido en chunks más pequeños

#### 1.4 Revisar Chunks Grandes (100-200KB)

**Acciones**:
- [ ] Identificar contenido de cada chunk
- [ ] Implementar lazy loading donde sea apropiado
- [ ] Optimizar imports de librerías
- [ ] Verificar si pueden ser más pequeños

**Criterios de éxito**:
- Reducción total de 200-300 KB
- Chunks optimizados a <100 KB cuando sea posible

---

### ⚠️ Hero banner – EXCLUIDO de optimizaciones

**No modificar**: `HeroSection.tsx`, `SimpleHeroCarousel.tsx` (contenedor estático, `fetchPriority`).  
Ver **`HERO_BANNER_NO_MODIFICAR.md`** y **`FIX_HERO_BANNER.md`**.  
Cambios en posicionamiento o `fetchPriority` ya rompieron la carga del hero.

---

### FASE 2: Optimización de Imágenes (Prioridad Alta) 🔴

**Objetivo**: Reducir 418 KiB en entrega de imágenes  
**Impacto esperado**: Mejora significativa en LCP y FCP  
**Duración estimada**: 1-2 horas  

**Excluir**: Hero (ver `HERO_BANNER_NO_MODIFICAR.md`).

#### 2.1 Auditoría de Imágenes

**Acciones**:
- [ ] Buscar todas las imágenes sin `width`/`height`
- [ ] Verificar lazy loading en imágenes offscreen
- [ ] Revisar `sizes` attribute
- [ ] Verificar formatos WebP/AVIF

**Comandos**:
```bash
# Buscar imágenes sin width/height
grep -r "Image.*fill" src/components

# Verificar lazy loading
grep -r "loading=" src/components
```

**Archivos a revisar** (excluir HeroSection y SimpleHeroCarousel):
- `src/components/Home/Hero/HeroSlide.tsx`
- `src/components/Home/HeroCarousel/index.tsx`
- `src/components/Home/PromoBanners/index.tsx`
- `src/components/ui/product-card-commercial/components/ProductCardImage.tsx`

#### 2.2 Optimizar Imágenes Hero – ⚠️ NO TOCAR

**Estado**: Hero funcionando. Ver **`HERO_BANNER_NO_MODIFICAR.md`**.  
- [x] ✅ Fix aplicado (sin style conflictivo, `fetchPriority` auto)
- [ ] No modificar contenedor ni `fetchPriority` en hero/carousel

#### 2.3 Optimizar Lazy Loading

**Acciones**:
- [ ] Verificar todas las imágenes offscreen tienen `loading="lazy"`
- [ ] Agregar `fetchPriority="low"` a imágenes below-fold
- [ ] Optimizar `sizes` attribute según breakpoints reales

#### 2.4 Verificar Formatos y Calidad

**Acciones**:
- [ ] Verificar WebP/AVIF están habilitados (✅ en `next.config.js`)
- [ ] Ajustar calidad: thumbnails 65, hero 80, galería 85
- [ ] Verificar que imágenes remotas están optimizadas

**Criterios de éxito**:
- Todas las imágenes tienen width/height explícitos
- Lazy loading en todas las imágenes offscreen
- `sizes` optimizado según uso real
- Ahorro de 200-300 KiB en imágenes

---

### FASE 3: Optimización de Caché (Prioridad Alta) 🔴

**Objetivo**: Optimizar caché para 265 KiB de ahorro  
**Impacto esperado**: Mejora en visitas repetidas  
**Duración estimada**: 30 minutos

#### 3.1 Verificar Headers en Producción

**Acciones**:
- [ ] Verificar headers de caché en Vercel
- [ ] Verificar CDN cache funcionando
- [ ] Revisar que headers se aplican correctamente

**Herramientas**:
```bash
# Verificar headers en producción
curl -I https://www.pinteya.com/images/hero/hero1.webp

# Verificar caché de CDN
curl -I https://www.pinteya.com/_next/static/chunks/main.js
```

**Headers esperados**:
- Imágenes: `Cache-Control: public, max-age=2592000, s-maxage=31536000, immutable`
- Fonts: `Cache-Control: public, max-age=31536000, immutable`
- Chunks: `Cache-Control: public, max-age=31536000, immutable`

#### 3.2 Optimizar Caché de Recursos Dinámicos

**Acciones**:
- [ ] Revisar caché de recursos dinámicos
- [ ] Optimizar Cache-Control si es necesario
- [ ] Verificar Service Worker si existe

**Criterios de éxito**:
- Headers de caché funcionando correctamente
- CDN cache optimizado
- Ahorro de 200-265 KiB en visitas repetidas

---

### FASE 4: Optimización de Ejecución JS (Prioridad Media) 🟡

**Objetivo**: Reducir tiempo de ejecución de 3.2s a <2s  
**Impacto esperado**: Mejora en TBT y TTI  
**Duración estimada**: 1-2 horas

#### 4.1 Code Splitting Más Agresivo

**Acciones**:
- [ ] Lazy load de más componentes pesados
- [ ] Defer de scripts no críticos
- [ ] Separar código crítico de no crítico

**Componentes candidatos**:
- Componentes de Analytics (ya parcialmente optimizados ✅)
- Componentes de Admin no críticos
- Modales y popups
- Componentes de checkout no críticos

#### 4.2 Optimizar Carga de Librerías

**Acciones**:
- [x] ✅ Framer Motion ya lazy
- [x] ✅ Swiper ya lazy
- [x] ✅ Recharts ya lazy
- [ ] Verificar otras librerías pesadas necesitan lazy load
- [ ] Optimizar imports modulares adicionales

#### 4.3 Defer de Scripts No Críticos

**Acciones**:
- [ ] Identificar scripts no críticos
- [ ] Agregar `defer` o `async` donde sea apropiado
- [ ] Optimizar carga de analytics (ya optimizado ✅)

**Criterios de éxito**:
- Tiempo de ejecución: 3.2s → <2s
- TBT: 770ms → <500ms
- Mejora en interactividad

---

### FASE 5: Optimización del Hilo Principal (Prioridad Media) 🟡

**Objetivo**: Reducir trabajo del hilo principal de 7.0s a <5s  
**Impacto esperado**: Mejora en interactividad  
**Duración estimada**: 1-2 horas

#### 5.1 Reducir Parsing de JavaScript

**Acciones**:
- [ ] Reducir tamaño de bundle inicial (Fase 1)
- [ ] Code splitting más agresivo (Fase 4)
- [ ] Defer de JavaScript no crítico (Fase 4)

#### 5.2 Optimizar Renderizado

**Acciones**:
- [ ] Usar React.memo para componentes pesados
- [ ] Optimizar re-renders innecesarios
- [ ] Lazy load de componentes below-fold

**Criterios de éxito**:
- Trabajo del hilo principal: 7.0s → <5s
- Mejora en interactividad
- Reducción de bloqueos

---

### FASE 6: Optimizaciones Menores (Prioridad Baja) 🟢

**Objetivo**: Optimizaciones finales  
**Impacto esperado**: Mejoras menores pero importantes  
**Duración estimada**: 1 hora

#### 6.1 JavaScript Heredado (49 KiB)

**Acciones**:
- [ ] Verificar `.browserslistrc` está correcto (✅)
- [ ] Eliminar polyfills innecesarios
- [ ] Optimizar configuración de SWC

#### 6.2 CSS No Utilizado (28 KiB)

**Acciones**:
- [ ] Verificar Tailwind purge
- [ ] Eliminar CSS no utilizado
- [ ] Optimizar imports de CSS

**Criterios de éxito**:
- Reducción de 49 KiB en JavaScript heredado
- Reducción de 28 KiB en CSS no utilizado

---

## 📅 Cronograma de Implementación

### Semana 1: Fases Críticas

**Día 1-2: Fase 1 (Bundle)**
- Análisis del chunk de 670 KB
- División y optimización
- Verificación de mejoras

**Día 3: Fase 2 (Imágenes)**
- Auditoría de imágenes
- Optimización de lazy loading
- Verificación de formatos

**Día 4: Fase 3 (Caché)**
- Verificación de headers
- Optimización de caché
- Verificación en producción

### Semana 2: Optimizaciones Adicionales

**Día 5-6: Fase 4 (Ejecución JS)**
- Code splitting más agresivo
- Optimización de carga de librerías
- Defer de scripts

**Día 7: Fase 5 (Hilo Principal)**
- Reducir parsing
- Optimizar renderizado

**Día 8: Fase 6 (Menores)**
- JavaScript heredado
- CSS no utilizado

---

## 📊 Métricas de Éxito

### Métricas de Bundle

| Métrica | Actual | Objetivo | Estado |
|---------|--------|----------|--------|
| **Chunk más grande** | 670 KB | <200 KB | 🔴 |
| **Chunks >200KB** | 2 | 0 | 🔴 |
| **Chunks >100KB** | 9 | <5 | 🟡 |
| **First Load JS** | 88 KB | <128 KB | ✅ |

### Métricas de PageSpeed

| Métrica | Actual | Objetivo Inicial | Objetivo Final | Estado |
|---------|--------|------------------|---------------|--------|
| **Performance** | 43/100 | 55-60 | >85 | 🔴 |
| **LCP** | 11.3s | <8s | <2.5s | 🔴 |
| **FCP** | 3.0s | <2.5s | <1.8s | 🔴 |
| **TBT** | 770ms | <500ms | <300ms | 🔴 |
| **SI** | 8.8s | <6s | <3.4s | 🔴 |
| **CLS** | 0 | <0.1 | <0.1 | ✅ |

---

## ✅ Checklist de Implementación

### Fase 1: Bundle
- [ ] Ejecutar bundle analyzer visual
- [ ] Identificar contenido de chunk de 670 KB
- [ ] Dividir chunk de 670 KB
- [ ] Optimizar chunk de 208 KB
- [ ] Revisar chunks grandes (100-200KB)
- [ ] Verificar mejoras

### Fase 2: Imágenes
- [ ] Auditoría de imágenes
- [ ] Agregar width/height explícitos
- [ ] Optimizar lazy loading
- [ ] Verificar formatos WebP/AVIF
- [ ] Optimizar `sizes` attribute

### Fase 3: Caché
- [ ] Verificar headers en producción
- [ ] Verificar CDN cache
- [ ] Optimizar caché de recursos dinámicos

### Fase 4: Ejecución JS
- [ ] Code splitting más agresivo
- [ ] Lazy load de más componentes
- [ ] Defer de scripts no críticos

### Fase 5: Hilo Principal
- [ ] Reducir parsing de JavaScript
- [ ] Optimizar renderizado
- [ ] Lazy load de componentes below-fold

### Fase 6: Menores
- [ ] JavaScript heredado
- [ ] CSS no utilizado

---

## 🔧 Herramientas y Comandos

### Análisis

```bash
# Bundle analyzer visual
ANALYZE=true npm run build

# Análisis de chunks
npm run analyze:chunks

# Verificación de optimización
npm run bundle-optimization:check

# Análisis detallado
npm run bundle-optimization:analyze
```

### Verificación

```bash
# Lighthouse audit
npm run lighthouse

# PageSpeed Insights (manual)
# https://pagespeed.web.dev/

# Verificar headers
curl -I https://www.pinteya.com/images/hero/hero1.webp
```

### Build y Deploy

```bash
# Build de producción
npm run build

# Verificar build
npm run start

# Deploy (Vercel)
git push origin main
```

---

## 📝 Documentación de Referencia

1. **Análisis PageSpeed**: `ANALISIS_PAGESPEED_20260123.md`
2. **Análisis Bundle**: `ANALISIS_BUNDLE_RESULTADOS.md`
3. **Análisis Chunks**: `ANALISIS_CHUNKS_DETALLADO.md`
4. **Recomendaciones**: `RECOMENDACIONES_OPTIMIZACION_BUNDLE.md`
5. **Plan de Optimización**: `PLAN_OPTIMIZACION_PAGESPEED.md`

---

## 🚀 Próximos Pasos Inmediatos

1. **Ejecutar bundle analyzer visual** (Fase 1.1)
   ```bash
   ANALYZE=true npm run build
   ```

2. **Analizar contenido del chunk de 670 KB** (Fase 1.1)

3. **Dividir y optimizar chunk grande** (Fase 1.2)

4. **Verificar mejoras** después de cada fase

---

**Estado**: 📋 Plan creado - Listo para implementación
