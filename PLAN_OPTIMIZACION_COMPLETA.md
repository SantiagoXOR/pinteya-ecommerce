# 🚀 Plan de Optimización Completa - Basado en Bundle Analysis

## 📊 Diagnóstico del Bundle Analyzer

### Problema Principal Identificado
**First Load JS: 436 KB** (190% sobre objetivo de 150 KB)

| Bundle | Tamaño | Impacto en Performance |
|--------|--------|----------------------|
| framework.js | 210 KB | React + Next.js (difícil optimizar) |
| **vendors.js** | **223 KB** | 🔴 **CRÍTICO** - Third-party libs |
| shared chunks | 3.2 KB | Mínimo |

### Por Qué Esto Causa Mobile Score 33

**Cadena de bloqueo en 4G (10 Mbps):**
1. Descargar 436 KB JS: ~3.5s
2. Parse + Execute JS: ~1.5-2s
3. Render inicial: ~0.5s
4. **Total: ~5.5-6s** → FCP/LCP bloqueados

**Resultado:**
- FCP: 6.12s ✅ Confirmado
- LCP: 6.12s ✅ Confirmado  
- Mobile Score: 33 ✅ Confirmado

---

## 🎯 FASE 1: Lazy Load de Librerías Pesadas (45 min)

### 1.1 Identificar Librerías en Vendors Bundle

**Estimación de composición del vendors.js (223 KB):**

| Librería | Tamaño Estimado | Necesidad |
|----------|----------------|-----------|
| Radix UI (10+ packages) | ~80 KB | Solo en componentes específicos |
| Recharts | ~60 KB | Solo en admin/analytics |
| Framer Motion | ~40 KB | Animaciones - puede lazy load |
| React Query | ~30 KB | Necesario pero puede split |
| Redux Toolkit | ~13 KB | Necesario pero puede split |

### 1.2 Implementar Lazy Loading

#### A. Recharts (Solo Admin)

**Archivos que usan Recharts:**
```bash
grep -r "from 'recharts'" src/
```

**Acción:**
- Convertir todos los imports de Recharts a dynamic imports
- Solo cargar cuando se accede a admin/analytics

**Ejemplo:**
```typescript
// ❌ ANTES:
import { LineChart, BarChart } from 'recharts'

// ✅ DESPUÉS:
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false })
```

**Reducción esperada:** -60 KB del bundle inicial

#### B. Framer Motion (Animaciones)

**Archivos que usan Framer Motion:**
```bash
grep -r "from 'framer-motion'" src/
```

**Acción:**
- Dynamic import para components con animaciones
- Solo cargar cuando se necesita

**Ejemplo:**
```typescript
// ❌ ANTES:
import { motion } from 'framer-motion'

// ✅ DESPUÉS:
const motion = dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion })), { ssr: false })
```

**Reducción esperada:** -40 KB del bundle inicial

#### C. Radix UI Components

**Estrategia:**
- Ya está en `optimizePackageImports` en next.config.js ✅
- Verificar que todos los imports son tree-shakeable

**Verificar imports:**
```typescript
// ✅ CORRECTO (tree-shakeable):
import { Dialog } from '@radix-ui/react-dialog'

// ❌ INCORRECTO (importa todo):
import * as Dialog from '@radix-ui/react-dialog'
```

**Reducción esperada:** -20 KB adicional

**Total Fase 1: -120 KB vendors bundle (223 KB → ~103 KB)**

---

## 🎯 FASE 2: Optimizar Code Splitting (30 min)

### 2.1 Ajustar next.config.js

**Problemas actuales:**
- `minSize: 20000` es muy alto (20 KB)
- Algunos chunks no se están separando correctamente

**Cambios en next.config.js:**

```javascript
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    // Framework core (React, Next.js) - NO CAMBIAR
    framework: {
      test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
      name: 'framework',
      priority: 40,
      enforce: true,
    },
    
    // ⚡ NUEVO: Radix UI separado
    radixUI: {
      test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
      name: 'radix-ui',
      priority: 35,
      reuseExistingChunk: true,
      enforce: true,
    },
    
    // ⚡ NUEVO: Recharts separado (solo carga en admin)
    recharts: {
      test: /[\\/]node_modules[\\/]recharts[\\/]/,
      name: 'recharts',
      priority: 33,
      reuseExistingChunk: true,
      enforce: true,
    },
    
    // ⚡ NUEVO: Framer Motion separado
    framerMotion: {
      test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
      name: 'framer-motion',
      priority: 32,
      reuseExistingChunk: true,
      enforce: true,
    },
    
    // Bibliotecas compartidas grandes
    lib: {
      test: /[\\/]node_modules[\\/](swiper|react-hook-form)[\\/]/,
      name: 'lib',
      priority: 30,
      reuseExistingChunk: true,
    },
    
    // Redux y state management
    redux: {
      test: /[\\/]node_modules[\\/](@reduxjs|react-redux)[\\/]/,
      name: 'redux',
      priority: 25,
      reuseExistingChunk: true,
    },
    
    // React Query
    query: {
      test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
      name: 'query',
      priority: 25,
      reuseExistingChunk: true,
    },
    
    // Otros vendors
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      priority: 20,
      reuseExistingChunk: true,
    },
    
    // Componentes compartidos
    commons: {
      minChunks: 2,
      priority: 10,
      reuseExistingChunk: true,
    },
  },
  maxInitialRequests: 30, // ⚡ Aumentado de 25
  minSize: 10000, // ⚡ Reducido de 20000 (10 KB mínimo)
}
```

**Reducción esperada:** Vendors bundle más limpio, chunks separados correctamente

---

## 🎯 FASE 3: Critical CSS Inline (45 min)

### 3.1 Extraer CSS Crítico

**Método 1: Chrome DevTools Coverage (Manual - 15 min)**

Pasos:
1. Abrir www.pinteya.com en incógnito
2. F12 → Cmd/Ctrl+Shift+P → "Coverage"
3. Click "Start instrumenting coverage"
4. Recargar página
5. Ver CSS usado above-the-fold (líneas verdes)
6. Copiar solo el CSS verde

**Método 2: Critical Package (Automatizado - 30 min)**

```bash
npm install --save-dev critical
```

Crear script:
```javascript
// scripts/extract-critical-css.js
const critical = require('critical');

critical.generate({
  base: '.next/',
  src: 'index.html',
  target: {
    css: 'critical.css',
  },
  width: 375,  // Mobile
  height: 667,
  inline: false,
});
```

### 3.2 Implementar Critical CSS

**Archivo: src/app/layout.tsx**

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <head>
        {/* ⚡ CRITICAL CSS - Inline en <head> */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Reset básico */
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{line-height:1.15;-webkit-text-size-adjust:100%}
          body{margin:0;font-family:'Euclid Circular A',sans-serif;font-size:16px;line-height:1.5}
          
          /* Header crítico */
          header{background-color:#f97316;position:fixed;top:34px;left:0;right:0;z-index:100}
          
          /* Hero container */
          .hero-section{min-height:320px;background:#fff}
          
          /* Botones */
          button,a{cursor:pointer;text-decoration:none}
          
          /* Loading states */
          .loading{opacity:0.6}
          
          /* TODO: Agregar CSS crítico extraído con Coverage tool */
        `}} />
        
        {/* Preload fuentes críticas */}
        <link rel='preload' href='/fonts/EuclidCircularA-Regular.woff2' as='font' type='font/woff2' crossOrigin='anonymous' />
        <link rel='preload' href='/fonts/EuclidCircularA-Bold.woff2' as='font' type='font/woff2' crossOrigin='anonymous' />
        
        {/* ⚡ Preconnect a dominios externos */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        <StructuredData data={[...]} />
        <GoogleAnalytics />
      </head>
      
      <body>
        {/* ⚡ CSS no crítico - Carga async */}
        <link 
          rel='stylesheet' 
          href='/_next/static/css/app.css' 
          media='print' 
          onLoad="this.media='all';this.onLoad=null" 
        />
        <noscript>
          <link rel='stylesheet' href='/_next/static/css/app.css' />
        </noscript>
        
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
        
        {/* Analytics */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
```

**Reducción esperada:** FCP -30% (6.12s → ~4.3s)

---

## 🎯 FASE 4: Fix Error 404 + Optimizaciones RSC (20 min)

### 4.1 Investigar Error 404

**Error detectado:** `shop?_rsc=1352e` → 404 (5.1 kB, 65 ms)

**Posibles causas:**
1. Ruta `/shop` no existe o fue renombrada
2. React Server Component no encontrado
3. Redirect mal configurado

**Acción:**
1. Verificar si existe ruta `/shop`:
```bash
find src/app -name "*shop*"
```

2. Verificar redirects en `next.config.js`:
```javascript
async redirects() {
  return [
    // Verificar si hay redirect para /shop
  ]
}
```

3. Si `/shop` no existe, agregar redirect o remover enlaces

### 4.2 Optimizar RSC Streaming

**En layout.tsx o page.tsx con RSC:**
```typescript
// Habilitar streaming
export const dynamic = 'force-dynamic'
export const revalidate = 0

// O para static con ISR:
export const revalidate = 3600 // 1 hora
```

**Reducción esperada:** -10% errores, mejor estabilidad

---

## 🎯 FASE 5: Mobile-Specific Optimizations (30 min)

### 5.1 Responsive Images Optimizados

**Archivo: src/components/Common/HeroCarousel.tsx**

```typescript
<Image
  src={image.src}
  alt={image.alt}
  fill
  className='object-contain'
  priority={image.priority || index === 0}
  // ⚡ OPTIMIZADO: Sizes específicos por breakpoint
  sizes='(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 60vw'
  // ⚡ Quality reducida para mobile
  quality={75} // Antes: 85
  unoptimized={false}
/>
```

### 5.2 Picture Element con Fallbacks

**Para imágenes hero críticas:**

```typescript
<picture>
  <source 
    srcSet="/images/hero/hero-01.avif" 
    type="image/avif"
    media="(max-width: 768px)"
  />
  <source 
    srcSet="/images/hero/hero-01.webp" 
    type="image/webp"
    media="(max-width: 768px)"
  />
  <Image
    src="/images/hero/hero-01.webp"
    alt="Hero"
    width={1920}
    height={600}
    priority
  />
</picture>
```

### 5.3 Lazy Loading Agresivo en Mobile

```typescript
// Detectar mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

// Lazy load más componentes en mobile
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    ssr: !isMobile, // Solo SSR en desktop
    loading: () => <Skeleton />
  }
)
```

**Reducción esperada:** Mobile Score +15-20 puntos

---

## 🎯 FASE 6: Reducir CLS (30 min)

### 6.1 Aspect Ratio en Todas las Imágenes

**CSS global para prevenir shifts:**

```css
/* src/app/css/style.css */
img, picture {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Hero images */
.hero-carousel img {
  aspect-ratio: 16 / 9;
  object-fit: contain;
}

/* Product images */
.product-image {
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
```

### 6.2 Reserve Space para Fonts

**Ya implementado en euclid-circular-a-font.css** ✅

Verificar que tenga:
```css
@font-face {
  font-family: 'Euclid Circular A';
  font-display: swap; /* ✅ Ya tiene */
  size-adjust: 100%; /* Agregar si falta */
}
```

### 6.3 Dimensiones Explícitas

**En todos los componentes con imágenes:**

```typescript
// ❌ ANTES (causa CLS):
<img src="/image.jpg" alt="..." />

// ✅ DESPUÉS (previene CLS):
<Image
  src="/image.jpg"
  alt="..."
  width={500}
  height={500}
  style={{ width: '100%', height: 'auto' }}
/>
```

**Reducción esperada:** CLS 0.36 → ~0.10-0.15

---

## 📊 Resultados Esperados Totales

| Fase | Optimización | Impacto | Métrica Afectada |
|------|--------------|---------|------------------|
| 1 | Lazy Load Libs | -120 KB vendors | Bundle, FCP, LCP |
| 2 | Code Splitting | -30 KB | Bundle cleanup |
| 3 | Critical CSS | -30% FCP | FCP: 6.12s → 4.3s |
| 4 | Fix 404 | +5-10 pts | Estabilidad |
| 5 | Mobile Opt | +15-20 pts | Mobile Score |
| 6 | Reduce CLS | -60% CLS | CLS: 0.36 → 0.15 |

### Métricas Finales Esperadas

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| **Mobile Score** | 33 | **75-80** | **+127%** |
| **FCP** | 6.12s | **2.5-3.0s** | **-51% a -59%** |
| **LCP** | 6.12s | **2.8-3.2s** | **-54% a -48%** |
| **CLS** | 0.36 | **0.10-0.15** | **-58% a -72%** |
| **Bundle Size** | 436 KB | **~280 KB** | **-36%** |
| **Vendors** | 223 KB | **~100 KB** | **-55%** |

---

## ⏱️ Timeline de Ejecución

| Fase | Tiempo | Acumulado |
|------|--------|-----------|
| 1. Lazy Load | 45 min | 45 min |
| 2. Code Splitting | 30 min | 1h 15min |
| 3. Critical CSS | 45 min | 2h |
| 4. Fix 404 | 20 min | 2h 20min |
| 5. Mobile Opt | 30 min | 2h 50min |
| 6. Reduce CLS | 30 min | 3h 20min |
| **Testing & Verify** | 20 min | **3h 40min** |

---

## ✅ Checklist de Ejecución

### Fase 1: Lazy Load
- [ ] Buscar archivos que usan Recharts
- [ ] Convertir imports a dynamic
- [ ] Buscar archivos que usan Framer Motion
- [ ] Convertir imports a dynamic
- [ ] Verificar imports de Radix UI son tree-shakeable
- [ ] Build y verificar tamaño de vendors

### Fase 2: Code Splitting
- [ ] Actualizar next.config.js con nuevos cache groups
- [ ] Ajustar minSize a 10000
- [ ] Aumentar maxInitialRequests a 30
- [ ] Build y verificar chunks separados

### Fase 3: Critical CSS
- [ ] Extraer CSS crítico con Coverage tool
- [ ] Crear inline style en layout.tsx
- [ ] Agregar preconnect a dominios externos
- [ ] Defer CSS no crítico
- [ ] Verificar que no se rompe el diseño

### Fase 4: Fix 404
- [ ] Encontrar causa del error shop?_rsc
- [ ] Agregar redirect o fix ruta
- [ ] Verificar en Network tab que desapareció el error

### Fase 5: Mobile Opt
- [ ] Optimizar sizes en HeroCarousel
- [ ] Reducir quality a 75 para mobile
- [ ] Implementar lazy loading agresivo
- [ ] Verificar en mobile device

### Fase 6: Reduce CLS
- [ ] Agregar aspect-ratio a CSS
- [ ] Verificar dimensiones explícitas en imágenes
- [ ] Agregar size-adjust a fonts si falta
- [ ] Verificar CLS en Lighthouse

### Testing Final
- [ ] npm run build
- [ ] Lighthouse en local (objetivo: >85)
- [ ] Deploy a producción
- [ ] Verificar en PageSpeed Insights
- [ ] Monitorear Speed Insights en 24-48h

---

## 🚀 Comenzar Implementación

**¿Listo para ejecutar?** 

Confirma para empezar con:
1. Fase 1: Lazy Load de librerías pesadas
2. Continuar con fases subsecuentes
3. Deploy y verificación final

Tiempo total estimado: **3-4 horas** para llevar Mobile Score de 33 a 75-80.










