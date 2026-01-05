# ⚡ Optimizaciones de Performance: Speed Index y Móviles de Gama Baja

## 📊 Resumen Ejecutivo

Este documento detalla todas las optimizaciones implementadas para mejorar el **Speed Index** de 5.0s a <3.4s y reducir el lag en dispositivos móviles de gama media y baja.

**Fecha de implementación:** 24 de Diciembre, 2025  
**Branch:** `fix/vercel-lambda-errors`  
**Commit:** `2124fd06`

---

## 🎯 Objetivos

| Métrica | Antes | Objetivo | Mejora Esperada |
|---------|-------|----------|-----------------|
| **Speed Index** | 5.0s | <3.4s | -32% (-1.6s) |
| **LCP** | ~2,080 ms | <1,000 ms | -52% (-1,080 ms) |
| **Retraso carga recursos LCP** | 1,570 ms | <300 ms | -64% a -100% |
| **CSS bloqueante** | 1,200 ms | <300 ms | -62% a -100% |
| **Latencia fuentes** | 2,271 ms | <500 ms | -66% a -88% |
| **Tamaño imágenes productos** | 207.1 KiB | 45 KiB | -78% (-162 KiB) |
| **JavaScript heredado** | 13.8 KiB | 0 KiB | -100% |
| **Lag en móviles** | Alto | Mínimo | -50% a -70% trabajo hilo principal |

---

## 🚀 Optimizaciones Implementadas

### Fase 1: Optimizaciones Generales (Speed Index)

#### 1.1 HeroOptimized Component

**Archivo:** `src/components/Home-v3/HeroOptimized.tsx` (NUEVO)

**Problema:**
- HeroCarousel cargaba todas las imágenes (3 imágenes) aunque solo la primera es visible
- JavaScript del carousel bloqueaba el renderizado visual inicial
- Imágenes hero 2 y 3 se cargaban aunque no eran visibles inicialmente

**Solución:**
- Crear componente `HeroOptimized` que renderiza imagen estática inicial en HTML (sin JavaScript)
- Cargar el carousel completo solo después del FCP (1.5s estimado)
- Esto elimina el JavaScript del carousel del render inicial

**Impacto esperado:** -1.5s a -2.0s en Speed Index

**Código clave:**
```tsx
// Renderiza imagen estática inicial
<Image
  src="/images/hero/hero2/hero1.webp"
  fill
  priority
  fetchPriority="high"
  // ... optimizaciones
/>

// Carga carousel después del FCP
useEffect(() => {
  const timer = setTimeout(() => {
    setShowCarousel(true)
  }, 1500)
  return () => clearTimeout(timer)
}, [])
```

---

#### 1.2 Lazy Loading Agresivo de Imágenes Hero

**Archivo:** `src/components/Home-v2/HeroCarousel/index.tsx`

**Problema:**
- Todas las imágenes del carousel se cargaban inmediatamente
- Imágenes 2 y 3 no eran visibles inicialmente pero se descargaban

**Solución:**
- Solo la primera imagen real tiene `priority={true}` y `fetchPriority="high"`
- Imágenes 2 y 3 usan `loading="lazy"` y `fetchPriority="auto"`
- Se cargan solo cuando el usuario interactúa con el carousel o después de un delay

**Impacto esperado:** -0.5s a -0.8s en Speed Index

**Código clave:**
```tsx
const isFirstRealSlide = index === 1
<Image
  priority={isFirstRealSlide}
  loading={isFirstRealSlide ? undefined : 'lazy'}
  fetchPriority={isFirstRealSlide ? 'high' : 'auto'}
/>
```

---

#### 1.3 Eliminación de JavaScript Heredado

**Archivo:** `.browserslistrc`

**Problema:**
- 13.8 KiB de JavaScript heredado innecesario en `chunks/78c1cbcf709aa237.js`
- Métodos modernos siendo transpilados innecesariamente:
  - `Array.prototype.at`, `flat`, `flatMap`
  - `Object.fromEntries`, `Object.hasOwn`
  - `String.prototype.trimEnd`, `trimStart`

**Solución:**
- Actualizar `.browserslistrc` de "last 3 versions" a "last 2 versions" para desktop
- Esto elimina transpilación de características ES2021+ que ya están soportadas nativamente
- Mantener compatibilidad móvil amplia (iOS 14+, Android 10+)

**Impacto esperado:**
- **-13.8 KiB** en bundle JavaScript
- **-20% a -30%** en tiempo de parsing/compilación en móviles
- **Mejora directa en lag** al reducir trabajo del hilo principal

**Cambio:**
```browserslist
# Desktop: Últimas 2 versiones (elimina transpilación innecesaria)
last 2 Chrome versions
last 2 Edge versions
last 2 Firefox versions
last 2 Safari versions

# Mobile: Mantener compatibilidad amplia
iOS >= 14
android >= 10
last 2 samsung versions
```

---

#### 1.4 Optimización de Carga de Fuentes

**Archivo:** `src/app/layout.tsx`

**Problema:**
- Fuentes bloqueando ruta crítica (2,271 ms de latencia máxima)
- Tres archivos woff2 cargándose secuencialmente:
  - `EuclidCircularA-Regular.woff2`: 2,271 ms
  - `EuclidCircularA-SemiBold.woff2`: 2,257 ms
  - `EuclidCircularA-Bold.woff2`: 2,244 ms
- No había preload explícito de fuentes críticas
- Todas las fuentes se cargaban aunque solo Regular es crítica inicialmente

**Solución:**
- Agregar preload de `EuclidCircularA-Regular.woff2` con `fetchPriority="high"`
- Inline `@font-face` de Regular en CSS crítico para eliminar dependencia del CSS externo
- Fuentes SemiBold y Bold se cargan diferidamente cuando se necesitan

**Impacto esperado:**
- **-1,500 ms a -2,000 ms** en latencia de ruta crítica
- **Mejora en FCP y LCP** al reducir bloqueo de renderizado

**Código clave:**
```tsx
{/* Preload de fuente Regular crítica */}
<link
  rel="preload"
  href="/fonts/EuclidCircularA-Regular.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
  fetchPriority="high"
/>

{/* @font-face inline en CSS crítico */}
@font-face{font-family:'Euclid Circular A';src:url('/fonts/EuclidCircularA-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
```

---

#### 1.5 Optimización de Imágenes de Productos

**Archivos:**
- `next.config.js`
- `src/components/ui/product-card-commercial/components/ProductCardImage.tsx`

**Problema:**
- Imágenes de productos con dimensiones incorrectas (162 KiB de ahorro potencial)
- Imágenes de 500x500 o 750x750 siendo mostradas a 263x263 o 286x286
- Aunque ya tenían `loading="lazy"` y `srcset`, las dimensiones intrínsecas eran demasiado grandes
- `deviceSizes` e `imageSizes` en next.config.js no estaban optimizados para productos

**Solución:**
1. **Optimizar `deviceSizes` e `imageSizes` en `next.config.js`**:
   - Agregar tamaños específicos para productos (263, 286, 320)
   - Reducir tamaños máximos innecesarios

2. **Ajustar atributo `sizes` en ProductCardImage**:
   - De: `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
   - A: `"(max-width: 640px) 263px, (max-width: 1024px) 286px, 320px"`

3. **Reducir `quality` para imágenes de productos**:
   - De: default 75
   - A: 70 (suficiente para thumbnails)

**Impacto esperado:**
- **-162 KiB** en tamaño total de imágenes
- **-20% a -30%** en tiempo de descarga de imágenes
- **Mejora en Speed Index** al reducir datos transferidos
- **Menos lag en móviles** al procesar menos píxeles

**Cambios:**
```javascript
// next.config.js
imageSizes: [16, 32, 48, 64, 96, 128, 256, 263, 286, 320, 384],
deviceSizes: [640, 750, 828, 1080, 1200, 1920],

// ProductCardImage.tsx
sizes="(max-width: 640px) 263px, (max-width: 1024px) 286px, 320px"
quality={70}
```

---

#### 1.6 Optimización de CSS Bloqueante

**Archivo:** `src/app/layout.tsx`

**Problema:**
- CSS bloqueante restante (33.5 KiB, ~1,200 ms de duración)
- Aunque ya había optimizaciones implementadas, Lighthouse seguía detectando CSS bloqueante:
  - `0978a751cee44550.css`: 1.5 KiB, 450 ms
  - `00737b3d4df67053.css`: 32.0 KiB, 750 ms
- El script inline para convertir CSS a no bloqueante no se ejecutaba a tiempo

**Solución:**
1. **Mejorar script inline** para ejecutarse inmediatamente (no esperar DOMContentLoaded)
2. **Agregar MutationObserver** para detectar CSS dinámico insertado por Next.js
3. **Técnica mejorada**: Preload + `media="print"` + `onload` para máxima efectividad

**Impacto esperado:**
- **-750 ms a -1,200 ms** en render-blocking
- **Mejora directa en Speed Index** al reducir bloqueo de renderizado
- **Mejor FCP y LCP** al permitir renderizado más temprano

**Código clave:**
```javascript
// Ejecutar inmediatamente, no esperar DOMContentLoaded
convertCSSToNonBlocking();

// MutationObserver para CSS dinámico
new MutationObserver(convertCSSToNonBlocking).observe(document.head, {
  childList: true,
  subtree: false
});
```

---

#### 1.7 Reducción de Retraso de Carga de Recursos LCP

**Archivos:**
- `src/app/layout.tsx`
- `src/components/Home-v3/HeroOptimized.tsx`

**Problema:**
- Retraso crítico de 1,570 ms en la carga de recursos del LCP
- Aunque había preload de `hero1.webp`, el retraso persistía
- La imagen podía no estar en el HTML inicial (componente client-side)
- Recursos bloqueantes podían estar retrasando el descubrimiento de la imagen

**Solución:**
1. **Asegurar que la imagen esté en el HTML inicial**:
   - `HeroOptimized` renderiza la imagen estática en el HTML del servidor
   - No depende de JavaScript para descubrir la imagen
   - Usa `Image` component de Next.js con `priority` y `fetchPriority="high"`

2. **Mejorar preload de hero1.webp**:
   - Agregar `crossOrigin="anonymous"` si es necesario
   - Verificar que esté posicionado ANTES de cualquier otro recurso

3. **Eliminar recursos bloqueantes antes del LCP**:
   - Asegurar que CSS crítico no bloquee el descubrimiento de la imagen
   - Verificar que JavaScript no bloquee el renderizado inicial

**Impacto esperado:**
- **-1,000 ms a -1,570 ms** en retraso de carga de recursos LCP
- **LCP mejorado de ~2,080 ms a <1,000 ms**
- **Mejora directa en Speed Index** al reducir tiempo hasta contenido visible

---

### Fase 2: Optimizaciones para Móviles de Gama Baja

#### 2.1 Hook de Detección de Rendimiento

**Archivo:** `src/hooks/useDevicePerformance.ts` (NUEVO)

**Problema:**
- Falta de detección de dispositivos de bajo rendimiento para aplicar optimizaciones específicas
- No se respetaba `prefers-reduced-motion`

**Solución:**
- Crear hook `useDevicePerformance` que detecta nivel de rendimiento usando:
  - `navigator.hardwareConcurrency` (núcleos de CPU)
  - `navigator.deviceMemory` (RAM disponible)
  - `navigator.connection.effectiveType` (tipo de conexión)
  - `window.matchMedia('(prefers-reduced-motion: reduce)')` (preferencia del usuario)
- Retorna nivel de rendimiento: `'high' | 'medium' | 'low'`
- Maneja correctamente la hidratación para evitar mismatches

**Impacto esperado:** Base para optimizaciones adaptativas

**Código clave:**
```typescript
export function useDevicePerformance(): PerformanceLevel {
  const [level, setLevel] = useState<PerformanceLevel>('medium')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    // Calcular nivel basado en hardware y preferencias
    const performanceLevel = calculatePerformanceLevel()
    setLevel(performanceLevel)
  }, [])

  // Retornar 'medium' hasta hidratación para consistencia SSR/cliente
  return isHydrated ? level : 'medium'
}
```

---

#### 2.2 Reducción de Animaciones en Dispositivos de Bajo Rendimiento

**Archivos:**
- `src/styles/mobile-performance.css` (NUEVO)
- `src/styles/home-v2-animations.css`

**Problema:**
- Animaciones CSS costosas en dispositivos de bajo rendimiento
- Animaciones no respetaban `prefers-reduced-motion`

**Solución:**
- Crear `mobile-performance.css` con optimizaciones para `prefers-reduced-motion`
- Agregar media queries en `home-v2-animations.css` para respetar `prefers-reduced-motion`
- Deshabilitar animaciones costosas cuando:
  - `prefers-reduced-motion: reduce` está activo
  - Dispositivo detectado como de bajo rendimiento

**Impacto esperado:** -50% a -70% en trabajo del hilo principal en móviles de gama baja

**Código clave:**
```css
/* mobile-performance.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

#### 2.3 Optimización de JavaScript para Móviles

**Archivo:** `src/components/Home-v3/index.tsx`

**Problema:**
- Componentes se cargaban inmediatamente sin considerar rendimiento del dispositivo
- No había lazy loading adaptativo

**Solución:**
- Usar `useDevicePerformance` para aplicar lazy loading más agresivo en dispositivos de bajo rendimiento
- Diferir más componentes en dispositivos de bajo rendimiento:
  - CategoryTogglePillsWithSearch: delay de 2s en lugar de carga inmediata
  - BestSeller: cargar después de 3s en dispositivos de bajo rendimiento
  - CombosSection: cargar después de 4s

**Impacto esperado:** -30% a -50% en Script Evaluation en móviles de gama baja

**Código clave:**
```tsx
const performanceLevel = useDevicePerformance()
const isLowPerformance = performanceLevel === 'low'

const categoryToggleDelay = isLowPerformance ? 2000 : 0
const bestSellerDelay = isLowPerformance ? 3000 : 0

<DelayedCategoryToggle delay={categoryToggleDelay} />
<LazyBestSeller delay={bestSellerDelay} />
```

---

#### 2.4 Simplificación de Renderizado en Móviles

**Archivo:** `src/components/Home-v2/BestSeller/index.tsx`

**Problema:**
- Número fijo de productos iniciales (12) sin considerar rendimiento del dispositivo
- No había optimización adaptativa

**Solución:**
- Reducir número de productos iniciales en dispositivos de bajo rendimiento (4 en lugar de 12)
- Usar `useDevicePerformance` para detectar nivel de rendimiento
- Aplicar límite solo después de la hidratación para evitar mismatch

**Impacto esperado:** -20% a -30% en tiempo de renderizado

**Código clave:**
```tsx
const performanceLevel = useDevicePerformance()
const isLowPerformance = performanceLevel === 'low'
const initialProductCount = isLowPerformance ? 4 : 12

const bestSellerProducts = useMemo(() => {
  const allProducts = [...inStock, ...outOfStock]
  return isLowPerformance ? allProducts.slice(0, initialProductCount) : allProducts
}, [products, isLowPerformance, initialProductCount])
```

---

#### 2.5 Deshabilitar Funcionalidades No Críticas en Móviles de Bajo Rendimiento

**Archivo:** `src/components/Home-v2/HeroCarousel/index.tsx`

**Problema:**
- Auto-play del carousel se ejecutaba en todos los dispositivos
- No se deshabilitaba en dispositivos de bajo rendimiento

**Solución:**
- Deshabilitar auto-play por defecto en dispositivos de bajo rendimiento
- Los callbacks de navegación solo re-habilitan auto-play si NO es dispositivo de bajo rendimiento
- Usar `useDevicePerformance` para detectar nivel de rendimiento

**Impacto esperado:** -40% a -60% en trabajo del hilo principal

**Código clave:**
```tsx
const performanceLevel = useDevicePerformance()
const isLowPerformance = performanceLevel === 'low'
const [isAutoPlaying, setIsAutoPlaying] = useState(false)

useEffect(() => {
  setIsAutoPlaying(!isLowPerformance)
}, [isLowPerformance])

// En callbacks de navegación
if (!isLowPerformance) {
  setTimeout(() => setIsAutoPlaying(true), 10000)
}
```

---

## 🐛 Bugs Corregidos

### Bug 1: Auto-play se re-habilitaba en dispositivos de bajo rendimiento
**Solución:** Los callbacks de navegación verifican `isLowPerformance` antes de re-habilitar auto-play.

### Bug 2: Mismatch de hidratación en `useDevicePerformance`
**Solución:** El hook retorna `'medium'` consistentemente hasta que se complete la hidratación.

### Bug 3: Contenido desaparecía después de la hidratación
**Solución:** Agregado flag `hasRendered` para prevenir que el contenido desaparezca una vez renderizado.

### Bug 4: Requests duplicados de imagen hero
**Solución:** Eliminado `<img>` tag duplicado, solo se usa `Image` component de Next.js.

### Bug 5: Preload de CSS con hash hardcodeado
**Solución:** Eliminado preload hardcodeado, el script inline maneja CSS dinámicamente.

### Bug 6: Console.log statements en producción
**Solución:** Eliminados todos los `console.log` y `console.warn` de debugging.

---

## 📁 Archivos Nuevos

1. **`src/components/Home-v3/HeroOptimized.tsx`**
   - Componente optimizado que renderiza imagen estática inicial

2. **`src/hooks/useDevicePerformance.ts`**
   - Hook para detectar nivel de rendimiento del dispositivo

3. **`src/styles/mobile-performance.css`**
   - CSS con optimizaciones para móviles de bajo rendimiento

4. **`scripts/optimize-hero-images.js`**
   - Script para verificar y comprimir imágenes hero si es necesario

---

## 📝 Archivos Modificados

1. `.browserslistrc` - Eliminación de JavaScript heredado
2. `next.config.js` - Optimización de imágenes
3. `src/app/layout.tsx` - Optimizaciones de CSS, fuentes y LCP
4. `src/components/Home-v2/BestSeller/index.tsx` - Optimizaciones adaptativas
5. `src/components/Home-v2/HeroCarousel/index.tsx` - Lazy loading y auto-play adaptativo
6. `src/components/Home-v3/index.tsx` - Lazy loading adaptativo
7. `src/components/ui/product-card-commercial/components/ProductCardImage.tsx` - Optimización de imágenes
8. `src/styles/home-v2-animations.css` - Optimizaciones de animaciones

---

## ✅ Verificación

Después de implementar estas optimizaciones, ejecutar:

```bash
npm run build
npm start
npx lighthouse http://localhost:3000 --view
```

**Métricas a verificar:**
- Speed Index < 3.4s
- LCP < 1,000 ms
- FCP < 1.5s
- CSS bloqueante < 300 ms
- Sin warnings de hidratación en consola
- Sin console.log en producción

---

## 🔄 Próximos Pasos

1. **Verificar imágenes hero**: Ejecutar `node scripts/optimize-hero-images.js` para verificar tamaños
2. **Monitorear métricas**: Usar Lighthouse CI para monitorear métricas en producción
3. **Ajustar delays**: Ajustar delays adaptativos basados en métricas reales
4. **Optimizar más imágenes**: Considerar comprimir más imágenes si es necesario

---

## 📚 Referencias

- [Web.dev - Speed Index](https://web.dev/speed-index/)
- [Web.dev - Largest Contentful Paint](https://web.dev/lcp/)
- [Next.js - Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

**Última actualización:** 24 de Diciembre, 2025  
**Autor:** Equipo de Desarrollo  
**Versión:** 1.0

