# 🎯 Optimizaciones Propuestas: Scroll en Product Cards

## 📊 Análisis de Resultados de Tests

### Problemas Detectados

1. **FPS Muy Bajo**
   - Chrome Desktop: ~23-38fps (objetivo: 60fps)
   - Mobile Chrome: ~23-55fps (inconsistente)
   - Firefox/Safari: ~2-25fps (crítico)

2. **Jank Alto**
   - Hasta 100% de jank en algunos casos
   - Promedio: 15-40% (objetivo: <5-15%)

3. **Smoothness Score Muy Bajo**
   - Mayormente 0.00/100 (objetivo: 80+/100)

4. **Frames Dropped**
   - Hasta 48% en algunos casos

---

## 🔧 Optimizaciones Específicas Propuestas

### 1. Deshabilitar Animaciones Durante Scroll Activo

**Problema**: Las animaciones de hover y transform se ejecutan durante el scroll, causando jank.

**Solución**: Detectar cuando el usuario está haciendo scroll y deshabilitar animaciones temporalmente.

```tsx
// Hook para detectar scroll activo
const useScrollActive = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    let rafId: number | null = null
    
    const handleScroll = () => {
      setIsScrolling(true)
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150) // Desactivar después de 150ms sin scroll
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return isScrolling
}

// Usar en CommercialProductCard
const isScrolling = useScrollActive()

// En el style del card:
transition: (isScrolling || isLowPerformance) ? 'none' : 'transform 0.3s ease-out',
willChange: (isScrolling || isLowPerformance) ? 'auto' : 'transform',
```

**Impacto esperado**: Reducción de 30-50% en jank durante scroll.

---

### 2. Optimizar `will-change` y `transform`

**Problema**: `will-change: transform` se aplica constantemente, causando overhead de GPU incluso cuando no hay animaciones.

**Solución**: Solo aplicar `will-change` cuando realmente se necesita (durante hover).

```tsx
// En lugar de:
willChange: isLowPerformance ? 'auto' : 'transform',

// Usar:
willChange: (isScrolling || isLowPerformance || !state.isHovered) ? 'auto' : 'transform',
```

**Impacto esperado**: Reducción de 10-20% en uso de GPU.

---

### 3. Reducir `backdrop-filter` en Más Dispositivos

**Problema**: `backdrop-filter: blur(30px)` es muy costoso, especialmente en móviles y durante scroll.

**Solución**: 
- Deshabilitar completamente durante scroll
- Reducir blur de 30px a 10px en gama media
- Usar solo en desktop y cuando no hay scroll

```tsx
// En CommercialProductCard
backdropFilter: (isScrolling || isLowPerformance || isMediumPerformance) 
  ? 'none' 
  : 'blur(10px)', // Reducido de 30px
WebkitBackdropFilter: (isScrolling || isLowPerformance || isMediumPerformance) 
  ? 'none' 
  : 'blur(10px)',
```

**Impacto esperado**: Reducción de 40-60% en tiempo de composición.

---

### 4. Usar `content-visibility` para Product Cards Fuera del Viewport

**Problema**: Todos los product cards se renderizan y procesan, incluso los que no son visibles.

**Solución**: Usar `content-visibility: auto` para cards fuera del viewport.

```tsx
// Agregar al style del card:
contentVisibility: 'auto',
containIntrinsicSize: '280px 500px', // Tamaño aproximado del card
```

**Impacto esperado**: Reducción de 50-70% en trabajo de renderizado inicial.

---

### 5. Optimizar Box-Shadow Durante Scroll

**Problema**: Box-shadows complejos se recalculan en cada frame durante scroll.

**Solución**: Simplificar box-shadow durante scroll activo.

```tsx
// Box-shadow simplificado durante scroll
boxShadow: isScrolling 
  ? '0 2px 4px rgba(0, 0, 0, 0.1)' // Simple durante scroll
  : '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)', // Completo cuando estático
```

**Impacto esperado**: Reducción de 15-25% en tiempo de pintura.

---

### 6. Lazy Loading de Imágenes con `loading="lazy"`

**Problema**: Todas las imágenes se cargan inmediatamente, causando trabajo durante scroll.

**Solución**: Asegurar que todas las imágenes usen `loading="lazy"`.

```tsx
// En ProductCardImage
<Image
  loading="lazy"
  decoding="async"
  // ... otras props
/>
```

**Impacto esperado**: Reducción de 20-30% en trabajo de red durante scroll.

---

### 7. Usar `transform` en lugar de `top/left` para Animaciones

**Problema**: Si hay animaciones que usan `top` o `left`, causan reflow.

**Solución**: Asegurar que todas las animaciones usen `transform`.

```css
/* ✅ Correcto */
transform: translateY(-4px);

/* ❌ Incorrecto */
top: -4px;
```

**Impacto esperado**: Reducción de 10-15% en reflows.

---

### 8. Reducir `perspective` en Dispositivos de Gama Media/Baja

**Problema**: `perspective(1000px)` es costoso en dispositivos limitados.

**Solución**: Reducir o eliminar perspective en dispositivos de gama media/baja.

```tsx
transform: (isLowPerformance || isMediumPerformance || isScrolling)
  ? (state.isHovered ? 'translateY(-2px)' : 'translateY(0)')
  : (state.isHovered 
    ? 'perspective(500px) rotateX(1deg) translateY(-4px)' // Reducido de 1000px y 2deg
    : 'perspective(500px) rotateX(0deg)'),
```

**Impacto esperado**: Reducción de 20-30% en trabajo de composición.

---

### 9. Usar `IntersectionObserver` para Detectar Cards Visibles

**Problema**: No hay optimización basada en visibilidad.

**Solución**: Usar IntersectionObserver para aplicar optimizaciones solo a cards visibles.

```tsx
const useCardVisibility = (ref: RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin: '50px' } // Pre-cargar 50px antes
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return isVisible
}
```

**Impacto esperado**: Reducción de 30-40% en trabajo de renderizado.

---

### 10. Agregar `contain: layout style paint` a Product Cards

**Problema**: Los cambios en un card pueden afectar el layout de otros cards.

**Solución**: Aislar cada card con `contain`.

```tsx
// En el style del card
contain: 'layout style paint',
```

**Impacto esperado**: Reducción de 15-25% en trabajo de layout.

---

## 📋 Priorización de Optimizaciones

### Alta Prioridad (Implementar Primero)
1. ✅ Deshabilitar animaciones durante scroll activo
2. ✅ Reducir `backdrop-filter` durante scroll
3. ✅ Usar `content-visibility` para cards fuera del viewport
4. ✅ Optimizar `will-change` (solo cuando necesario)

### Media Prioridad
5. ✅ Optimizar box-shadow durante scroll
6. ✅ Reducir `perspective` en gama media/baja
7. ✅ Agregar `contain: layout style paint`

### Baja Prioridad (Mejoras Incrementales)
8. ✅ Lazy loading de imágenes (ya debería estar implementado)
9. ✅ Usar `IntersectionObserver` para visibilidad
10. ✅ Asegurar que todas las animaciones usen `transform`

---

## 🎯 Objetivos de Rendimiento Post-Optimización

### Gama Alta (Desktop)
- FPS promedio: ≥ 50fps (actual: ~23-38fps)
- Jank: < 10% (actual: 15-40%)
- Smoothness: ≥ 60/100 (actual: 0-20/100)

### Gama Media (Tablet)
- FPS promedio: ≥ 40fps (actual: ~25-45fps)
- Jank: < 20% (actual: 30-40%)
- Smoothness: ≥ 40/100 (actual: 0-30/100)

### Gama Baja (Móvil)
- FPS promedio: ≥ 30fps (actual: ~12-55fps)
- Jank: < 30% (actual: 50-100%)
- Smoothness: ≥ 30/100 (actual: 0-5/100)

---

## 📝 Notas de Implementación

1. **Testing**: Ejecutar tests después de cada optimización para medir impacto
2. **Progressive Enhancement**: Las optimizaciones deben degradarse gracefully
3. **Monitoring**: Agregar métricas de rendimiento en producción
4. **User Testing**: Verificar que la experiencia visual no se degrade significativamente

---

**Fecha de creación**: 26 de Diciembre, 2025
**Basado en**: Resultados de tests de Playwright en `product-cards-scroll-performance.spec.ts`

