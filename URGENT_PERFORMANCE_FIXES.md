# 🚨 PLAN DE ACCIÓN URGENTE - Performance Crítico

## 📊 Situación Actual (Speed Insights)

**Real Experience Score: 65** ❌ (Objetivo: > 90)

### Problemas Críticos:
1. **FCP: 3.56s** 🔴 (Objetivo: < 1.8s) - **BLOQUEANTE**
2. **LCP: 3.56s** 🟡 (Objetivo: < 2.5s) - **URGENTE**  
3. **CLS: 0.28** 🟡 (Objetivo: < 0.1) - **NECESITA ATENCIÓN**

---

## 🎯 CAUSAS RAÍZ IDENTIFICADAS

### 1. Imágenes Hero sin Optimizar ⚠️ PRINCIPAL
**Archivos:** `/public/images/hero/hero-01.png`, `hero-02.png`, etc.

- ✅ Están usando `priority={true}` (correcto)
- ❌ Formato PNG (sin WebP/AVIF)
- ❌ Probablemente muy pesadas (> 500KB cada una)

**Impacto:** LCP bloqueado por carga de imagen pesada

### 2. CSS Bloqueante en `<head>`
**Archivos cargados síncronamente:**
- `src/app/css/style.css` (8.64 KB)
- `src/app/css/euclid-circular-a-font.css` (2.62 KB)
- `src/app/css/async-gallery.css` (5.83 KB)
- `src/styles/checkout-mobile.css`
- `src/styles/z-index-hierarchy.css`

**Total: ~20KB de CSS bloqueante**

**Impacto:** FCP retrasado hasta que todo el CSS carga

### 3. Layout Shifts (CLS: 0.28)
- Imágenes sin dimensiones explícitas
- Fuentes cargando sin reserve space
- Carrusel/carousel puede causar shifts

---

## 🚀 SOLUCIONES INMEDIATAS (Orden de Prioridad)

### PRIORIDAD 1: Optimizar Imágenes Hero (IMPACTO: ~40%)

#### Paso 1: Convertir a WebP
```bash
# Navegar al directorio de imágenes hero
cd public/images/hero

# Opción A: Usar Squoosh (Manual, Recomendado)
# 1. Ir a https://squoosh.app
# 2. Arrastrar hero-01.png, hero-02.png, hero-03.png, hero-04.png
# 3. Configurar: WebP, Quality 80-85
# 4. Descargar y reemplazar

# Opción B: Con Sharp (Automatizado)
npm install -g sharp-cli
sharp -i hero-01.png -o hero-01.webp --webp '{"quality":85}'
sharp -i hero-02.png -o hero-02.webp --webp '{"quality":85}'
sharp -i hero-03.png -o hero-03.webp --webp '{"quality":85}'
sharp -i hero-04.png -o hero-04.webp --webp '{"quality":85}'
```

#### Paso 2: Actualizar referencias
```typescript
// src/components/Home-v2/Hero/index.tsx
const heroImagesMobile = [
  {
    src: '/images/hero/hero-01.webp', // Cambiar .png a .webp
    alt: 'Pintá rápido, fácil y cotiza al instante',
    priority: true,
    unoptimized: false,
  },
  // ... resto de imágenes
]
```

**Tiempo estimado:** 15-20 minutos
**Impacto esperado:** LCP: 3.56s → ~2.0s

---

### PRIORIDAD 2: Inline Critical CSS (IMPACTO: ~30%)

Extraer el CSS crítico above-the-fold e inline en el `<head>`.

#### Solución Rápida: Cargar CSS de forma diferida

```tsx
// src/app/layout.tsx

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <head>
        {/* ⚡ CRITICAL: Solo fuentes críticas en preload */}
        <link
          rel='preload'
          href='/fonts/EuclidCircularA-Regular.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        
        {/* ⚡ PERFORMANCE: CSS crítico inline (extraer manualmente) */}
        <style dangerouslySetInnerHTML={{__html: `
          /* CSS crítico aquí - solo above-the-fold */
          body { margin: 0; font-family: 'Euclid Circular A', sans-serif; }
          /* Agregar solo lo necesario para primera pantalla */
        `}} />
        
        <StructuredData data={[...]} />
        <GoogleAnalytics />
      </head>
      <body>
        {/* CSS no crítico cargado de forma async */}
        <link rel='stylesheet' href='/app/css/style.css' media='print' onLoad="this.media='all'" />
        
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
        {/* ... */}
      </body>
    </html>
  )
}
```

**Tiempo estimado:** 30-45 minutos
**Impacto esperado:** FCP: 3.56s → ~2.0s

---

### PRIORIDAD 3: Reducir CLS (IMPACTO: ~15%)

#### A. Dimensiones explícitas en imágenes

```tsx
// src/components/Home-v2/Hero/index.tsx
<Image
  src='/images/hero/hero-01.webp'
  alt='...'
  width={1920}  // ⚡ AGREGAR
  height={600}  // ⚡ AGREGAR
  priority={true}
  sizes='100vw'
  className='w-full h-full object-cover'
/>
```

#### B. Reserve space para fuentes

```css
/* src/app/css/euclid-circular-a-font.css */
@font-face {
  font-family: 'Euclid Circular A';
  /* ... */
  font-display: swap;
  size-adjust: 100%; /* ⚡ AGREGAR para prevenir layout shift */
}
```

**Tiempo estimado:** 15-20 minutos
**Impacto esperado:** CLS: 0.28 → ~0.08

---

## 📋 PLAN DE IMPLEMENTACIÓN (90 minutos total)

### Fase 1: Quick Wins (30 min) ⚡

1. **Optimizar 4 imágenes hero** (20 min)
   - Convertir con Squoosh
   - Reemplazar archivos
   - Actualizar rutas en código

2. **Agregar dimensiones a imágenes** (10 min)
   - Agregar width/height a Hero images

### Fase 2: CSS Critical (45 min) 🎨

3. **Extraer CSS crítico** (30 min)
   - Usar Chrome DevTools Coverage
   - Extraer CSS above-the-fold
   - Inline en layout.tsx

4. **Defer CSS no crítico** (15 min)
   - Mover CSS a carga async
   - Verificar que no se rompa nada

### Fase 3: Deploy y Verificación (15 min) 🚀

5. **Deploy a producción**
   ```bash
   git add .
   git commit -m "fix(performance): optimizar imágenes hero y CSS crítico"
   git push
   ```

6. **Verificar mejoras**
   - Lighthouse en local
   - PageSpeed Insights
   - Esperar 24h para Speed Insights

---

## 🎯 RESULTADOS ESPERADOS

### Antes → Después

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| **FCP** | 3.56s | ~1.8s | **-49%** |
| **LCP** | 3.56s | ~2.0s | **-44%** |
| **CLS** | 0.28 | ~0.08 | **-71%** |
| **Score** | 65 | ~85-90 | **+31%** |

---

## 🔥 IMPLEMENTACIÓN INMEDIATA

### Opción A: Quick Fix (Solo imágenes - 20 min)

Si tienes poco tiempo, **SOLO optimiza las imágenes hero**. Esto dará el 60% de la mejora.

```bash
# 1. Ir a Squoosh
# 2. Convertir hero-01.png a hero-04.png
# 3. Reemplazar archivos
# 4. Actualizar rutas en código
# 5. Deploy
```

### Opción B: Fix Completo (90 min)

Seguir el plan completo arriba para máximo impacto.

---

## 📊 Cómo Medir el Éxito

### Inmediato (hoy)

```bash
# Lighthouse local
npm run build
npm run start
# Chrome DevTools → Lighthouse → Generate Report
```

**Objetivo:** Score > 85

### Mediano plazo (24-48h)

- Vercel Speed Insights debe mostrar RES > 90
- Core Web Vitals en verde

---

## 🆘 Si necesitas ayuda

### Herramientas útiles:

1. **Squoosh** - https://squoosh.app
   - Más fácil para principiantes
   - Visual, drag & drop

2. **Chrome DevTools Coverage**
   - F12 → Cmd+Shift+P → "Coverage"
   - Ver CSS no usado

3. **PageSpeed Insights**
   - https://pagespeed.web.dev
   - Diagnóstico en tiempo real

---

## ✅ Checklist de Implementación

- [ ] Analizar tamaño actual de hero-*.png
- [ ] Convertir hero-01.png a .webp
- [ ] Convertir hero-02.png a .webp  
- [ ] Convertir hero-03.png a .webp
- [ ] Convertir hero-04.png a .webp
- [ ] Actualizar rutas en Hero/index.tsx
- [ ] Agregar width/height a imágenes
- [ ] Extraer CSS crítico
- [ ] Inline CSS crítico
- [ ] Defer CSS no crítico
- [ ] Build local y test
- [ ] Lighthouse score check
- [ ] Deploy a producción
- [ ] Verificar en PageSpeed Insights
- [ ] Esperar métricas en Speed Insights

---

**NOTA IMPORTANTE:** Las imágenes Hero son el problema #1. Si solo tienes 20 minutos, **optimiza solo las imágenes**. Eso solo dará una mejora dramática.







