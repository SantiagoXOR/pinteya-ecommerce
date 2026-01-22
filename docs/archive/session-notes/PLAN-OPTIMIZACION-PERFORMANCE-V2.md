# Plan de Optimización Performance V2 - Post Deploy

## Análisis de Resultados Actuales

Después del último deploy, los resultados muestran mejoras pero aún hay problemas críticos:

| Métrica | Antes | Actual | Objetivo | Gap |
|---------|-------|--------|----------|-----|
| **Performance Score** | 70 | 72 | 90+ | +18 puntos |
| **LCP** | 7.1s | 6.3s | < 2.5s | -3.8s |
| **CLS** | 0.42 | 0.31 | < 0.1 | -0.21 |
| **FCP** | 4.1s | 1.9s | < 1.8s | -0.1s |
| **TBT** | 90ms | 90ms | < 200ms | ✅ OK |
| **Render-blocking** | 450ms | 300ms | 0ms | -300ms |

### Problemas Críticos Identificados

1. **Render-blocking CSS**: 300ms de ahorro estimado
2. **LCP alto (6.3s)**: Retraso en descubrimiento/carga de imagen hero
3. **CLS alto (0.31)**: Layout shifts en componentes dinámicos

---

## Implementación

### Fase 1: Eliminar Render-Blocking CSS Final (300ms)

#### 1.1 Optimizar CSS Imports en layout.tsx
**Archivo**: `src/app/layout.tsx`

**Problema**: Hay 4 imports CSS directos que pueden estar bloqueando:
- `./css/style.css`
- `./css/euclid-fonts-turbopack.css`
- `@/styles/mobile-performance.css`
- `@/styles/disable-all-effects.css`

**Solución**:
- Mover CSS no crítico a carga diferida
- Verificar que el script inline de non-blocking CSS funcione correctamente
- Considerar mover algunos CSS a componentes específicos

#### 1.2 Optimizar CSS en page.tsx
**Archivo**: `src/app/page.tsx`

**Problema**: `@/styles/home-v3-glassmorphism.css` se importa directamente

**Solución**:
- Mover a carga diferida con `DeferredCSS` o cargar solo en desktop
- Ya hay lógica para cargar solo en desktop, verificar que funcione

**Impacto esperado**: -300ms en render-blocking

---

### Fase 2: Reducir LCP de 6.3s a < 2.5s (-3.8s)

#### 2.1 Optimizar Descubrimiento de Imagen Hero
**Archivo**: `src/components/Home-v3/HeroOptimized.tsx`

**Problema actual**:
- Componente es `'use client'`, la imagen no está en HTML inicial
- El navegador espera JavaScript para descubrir la imagen
- Aunque hay preload, puede no ser suficiente

**Solución**:
- Convertir la primera imagen a Server Component o renderizar `<img>` estático en HTML
- Asegurar que la imagen hero esté en el HTML inicial del servidor
- Verificar que el preload funcione correctamente

**Código propuesto**:
```tsx
// En page.tsx o un Server Component
<div className="hero-lcp-container">
  <img
    src="/images/hero/hero2/hero1.webp"
    alt="Pintá rápido, fácil y cotiza al instante - Pinteya"
    width={1200}
    height={433}
    fetchPriority="high"
    loading="eager"
    style={{ width: '100%', height: 'auto', aspectRatio: '1200/433' }}
  />
</div>
```

#### 2.2 Verificar Tamaño de Imagen Hero
**Archivo**: `public/images/hero/hero2/hero1.webp`

**Acción**:
- Verificar tamaño físico del archivo
- Si es > 200KB, comprimir más agresivamente
- Considerar generar versión AVIF para mejor compresión

#### 2.3 Optimizar Preload de Imagen Hero
**Archivo**: `src/app/layout.tsx`

**Verificar**:
- El preload está correctamente posicionado
- El header Link tiene sintaxis correcta (ya corregido)
- Considerar agregar preload también para AVIF si existe

**Impacto esperado**: -3.8s en LCP (de 6.3s a < 2.5s)

---

### Fase 3: Reducir CLS de 0.31 a < 0.1 (-0.21)

#### 3.1 Optimizar HeroOptimized para Evitar Layout Shift
**Archivo**: `src/components/Home-v3/HeroOptimized.tsx`

**Problema**:
- La transición de opacity entre imagen estática y carousel puede causar shift
- El contenedor puede cambiar de tamaño cuando el carousel carga

**Solución**:
- Asegurar que el contenedor tenga dimensiones fijas desde el inicio
- Usar `height` fijo en lugar de solo `aspectRatio`
- Evitar transiciones que puedan causar layout shift

#### 3.2 Verificar Componentes con Layout Shift
**Archivos a revisar**:
- `src/components/Home-v3/index.tsx` - Secciones dinámicas
- Componentes de productos que se cargan dinámicamente
- Banners y promociones

**Solución**:
- Agregar `minHeight` fijo a todos los contenedores dinámicos
- Usar skeletons con dimensiones exactas
- Asegurar que placeholders tengan el mismo tamaño que el contenido final

#### 3.3 Optimizar Product Cards
**Archivo**: `src/components/ui/product-card-commercial/components/ProductCardImage.tsx`

**Verificar**:
- Las dimensiones width/height explícitas están funcionando
- No hay cambios de tamaño durante la carga
- El aspect-ratio está correctamente aplicado

**Impacto esperado**: -0.21 en CLS (de 0.31 a < 0.1)

---

### Fase 4: Optimizaciones Adicionales

#### 4.1 Mejorar FCP de 1.9s a < 1.8s (-0.1s)
- Verificar que CSS crítico esté completamente inline
- Reducir tamaño de HTML inicial
- Optimizar fuentes (ya optimizado, verificar)

#### 4.2 Verificar Tamaño de Bundle
- Ejecutar bundle analyzer
- Verificar que code splitting esté funcionando
- Eliminar código sin usar adicional

---

## Orden de Implementación

1. **Fase 1** (Render-blocking CSS) - Impacto inmediato en FCP
2. **Fase 2** (LCP) - Mejora métrica Core Web Vital crítica
3. **Fase 3** (CLS) - Mejora métrica Core Web Vital crítica
4. **Fase 4** (Optimizaciones adicionales) - Mejoras menores

---

## Métricas Objetivo

| Métrica | Actual | Objetivo | Mejora Requerida |
|---------|--------|----------|------------------|
| **Performance Score** | 72 | 90+ | +18 puntos |
| **LCP** | 6.3s | < 2.5s | -3.8s |
| **CLS** | 0.31 | < 0.1 | -0.21 |
| **FCP** | 1.9s | < 1.8s | -0.1s |
| **Render-blocking** | 300ms | 0ms | -300ms |

---

## Verificación Post-Implementación

1. Ejecutar Lighthouse en modo incógnito
2. Verificar métricas Core Web Vitals
3. Comparar con resultados anteriores
4. Verificar que no haya regresiones visuales
5. Probar en dispositivos móviles reales



