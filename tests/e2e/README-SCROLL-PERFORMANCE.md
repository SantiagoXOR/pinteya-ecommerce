# 🎯 Tests de Performance: Scroll en Product Cards

Este documento explica cómo usar los tests de Playwright para medir y mejorar el rendimiento de scroll en product cards, especialmente en dispositivos de gama media y baja.

## 📋 Descripción

Los tests en `product-cards-scroll-performance.spec.ts` miden específicamente:

- **FPS durante scroll** (objetivo: 60fps en gama alta, 50fps en gama media, 40fps en gama baja)
- **Frame time consistency** (tiempo entre frames)
- **Jank detection** (frames > 50ms = < 20fps)
- **Dropped frames** (frames > 100ms = < 10fps)
- **Long tasks** (tareas que bloquean el hilo principal > 50ms)
- **Scroll smoothness score** (0-100)

## 🚀 Ejecutar Tests

### Ejecución Básica
```bash
npm run test:performance:scroll
```

### Con UI Interactiva
```bash
npm run test:performance:scroll:ui
```

### Con Navegador Visible (Headed)
```bash
npm run test:performance:scroll:headed
```

### Modo Debug
```bash
npm run test:performance:scroll:debug
```

## 📊 Perfiles de Dispositivos

Los tests simulan tres perfiles de dispositivos:

### 1. High-End (Gama Alta)
- **CPU Throttling**: 1x (sin throttling)
- **Viewport**: 1920x1080
- **Objetivos**:
  - FPS promedio: ≥ 55fps
  - FPS mínimo: ≥ 50fps
  - Jank: < 5%
  - Smoothness: ≥ 85/100

### 2. Mid-Range (Gama Media)
- **CPU Throttling**: 2x (2 veces más lento)
- **Viewport**: 768x1024 (tablet)
- **Objetivos**:
  - FPS promedio: ≥ 45fps
  - FPS mínimo: ≥ 30fps
  - Jank: < 15%
  - Smoothness: ≥ 70/100

### 3. Low-End (Gama Baja)
- **CPU Throttling**: 4x (4 veces más lento)
- **Viewport**: 375x667 (móvil)
- **Objetivos**:
  - FPS promedio: ≥ 35fps
  - FPS mínimo: ≥ 20fps
  - Jank: < 25%
  - Smoothness: ≥ 60/100

## 🧪 Escenarios de Test

### 1. Scroll Medio
Mide rendimiento durante scroll a velocidad media (15px por frame).

**Duración**: 3 segundos

### 2. Scroll Rápido
Mide rendimiento durante scroll rápido (30px por frame) para detectar problemas de lag.

**Duración**: 2 segundos

### 3. Scroll Continuo Prolongado
Mide rendimiento durante scroll continuo largo para detectar degradación de rendimiento.

**Duración**: 5 segundos

### 4. Detección de Problemas
Analiza métricas y reporta problemas específicos sin fallar (solo reporta).

## 📈 Interpretación de Métricas

### FPS (Frames Per Second)
- **60fps**: Ideal, scroll perfectamente fluido
- **50-59fps**: Muy bueno, scroll fluido
- **40-49fps**: Aceptable, scroll aceptable
- **30-39fps**: Bajo, scroll con lag perceptible
- **< 30fps**: Muy bajo, scroll muy laggy

### Jank Percentage
- **< 5%**: Excelente
- **5-10%**: Bueno
- **10-20%**: Aceptable
- **> 20%**: Problema, necesita optimización

### Smoothness Score
- **90-100**: Excelente
- **80-89**: Muy bueno
- **70-79**: Bueno
- **60-69**: Aceptable
- **< 60**: Necesita optimización

### Long Tasks
Cualquier tarea que bloquea el hilo principal por más de 50ms causa jank visible. Idealmente debería ser 0.

## 🔧 Optimizaciones Recomendadas

Si los tests fallan o reportan problemas, considera:

### 1. Reducir Animaciones en Scroll
```tsx
// En product cards, deshabilitar animaciones durante scroll
const isScrolling = useRef(false)

useEffect(() => {
  let scrollTimeout: NodeJS.Timeout
  const handleScroll = () => {
    isScrolling.current = true
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      isScrolling.current = false
    }, 150)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

// Usar isScrolling para deshabilitar animaciones
transition: isScrolling.current ? 'none' : 'transform 0.3s ease-out'
```

### 2. Usar `will-change` con Precaución
```tsx
// Solo en elementos que realmente necesitan GPU acceleration
willChange: isHovered ? 'transform' : 'auto'
```

### 3. Reducir `backdrop-filter` en Móviles
```tsx
// Ya implementado en CommercialProductCard
backdropFilter: isLowPerformance ? 'none' : 'blur(30px)'
```

### 4. Lazy Loading de Imágenes
```tsx
// Asegurar que las imágenes usen loading="lazy"
<img loading="lazy" ... />
```

### 5. Virtualización para Listas Largas
Si hay muchos product cards, considerar virtualización (react-window, react-virtual).

## 📝 Ejemplo de Salida

```
🎯 Testing: Dispositivo de gama media (2x throttling)
   CPU Throttling: 2x
   Viewport: 768x1024

📊 Métricas de Scroll:
   FPS Promedio: 47.32fps
   FPS Mínimo: 31.25fps
   FPS Máximo: 60.00fps
   Total Frames: 142
   Jank Count: 8 (5.63%)
   Dropped Frames: 1
   Smoothness Score: 78.45/100
   Long Tasks: 0
```

## 🐛 Troubleshooting

### Test no encuentra product cards
- Verificar que la página tenga product cards con `data-testid="commercial-product-card"` o `data-testid="product-card"`
- Verificar que la página esté completamente cargada antes de medir

### FPS muy bajo incluso en high-end
- Verificar que no haya procesos pesados ejecutándose
- Verificar que el servidor de desarrollo esté en modo producción (`npm run build && npm start`)
- Verificar que no haya extensiones del navegador interfiriendo

### Jank alto
- Revisar long tasks en Chrome DevTools Performance tab
- Verificar que no haya JavaScript bloqueante durante scroll
- Considerar usar `requestIdleCallback` para tareas no críticas

## 📚 Referencias

- [Playwright Performance Testing](https://playwright.dev/docs/test-timeouts#performance-testing)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Vitals](https://web.dev/vitals/)
- [RAIL Model](https://web.dev/rail/)

