# Optimizaciones de Rendimiento Lighthouse - Implementadas

**Fecha**: 5 de Diciembre 2025  
**Puntaje Objetivo**: De 13/100 → 90+/100

## Resumen de Optimizaciones Implementadas

### ✅ Fase 1: Optimización de Imágenes (CRÍTICA)

#### 1.1 fetchPriority en imagen LCP
- **Archivo**: `src/components/Home-v2/HeroCarousel/index.tsx`
- **Cambio**: Agregado `fetchPriority="high"` explícitamente a la primera imagen del carrusel
- **Impacto**: Reduce retraso de carga de recursos de 1,490ms
- **Estado**: ✅ Completado

#### 1.2 fetchPriority en CombosSection
- **Archivo**: `src/components/Home-v2/CombosSection/index.tsx`
- **Cambio**: Agregado `fetchPriority="high"` a la primera imagen del carrusel de combos
- **Impacto**: Mejora carga de imágenes secundarias
- **Estado**: ✅ Completado

#### 1.3 Optimización de icono de carrito
- **Archivo**: `src/components/ui/optimized-cart-icon.tsx`
- **Cambio**: Reemplazado imagen WebP de 512x512px por SVG directo para iconos de 32x32px
- **Impacto**: Elimina desperdicio de 45.4 KiB según Lighthouse
- **Estado**: ✅ Completado

#### 1.4 Mejora de atributo sizes en imágenes de productos
- **Archivo**: `src/components/ui/product-card-commercial.tsx`
- **Cambio**: Mejorado atributo `sizes` de genérico a específico: `"(max-width: 640px) 153px, (max-width: 1024px) 200px, 250px"`
- **Impacto**: Evita cargar imágenes de 384px cuando se muestran en 153px
- **Estado**: ✅ Completado

#### 1.5 Optimización de hero6.svg
- **Archivo**: `public/images/hero/hero2/hero6.svg`
- **Problema**: SVG de 8.7 MB bloquea renderizado
- **Estado**: ⚠️ Pendiente - Requiere conversión externa a WebP/AVIF o simplificación de vectores

### ✅ Fase 2: CSS Bloqueante (ALTA)

#### 2.1 Mejora de DeferredCSS
- **Archivo**: `src/components/Performance/DeferredCSS.tsx`
- **Cambio**: Implementada técnica `media="print"` para cargar CSS sin bloquear renderizado
- **Impacto**: Reduce bloqueo de renderizado en 810ms según Lighthouse
- **Estado**: ✅ Completado

**Nota**: El CSS crítico ya está inline en `layout.tsx`. Los CSS no críticos se cargan de forma asíncrona.

### ✅ Fase 3: CLS (Cumulative Layout Shift) - ALTA

#### 3.1 Dimensiones fijas en product-section
- **Archivo**: `src/components/Home-v2/index.tsx`
- **Cambio**: Agregado `min-height` a contenedores `product-section`:
  - CombosSection: `minHeight: '400px'`
  - DynamicProductCarousel: `minHeight: '350px'`
  - LazyNewArrivals: `minHeight: '500px'`
- **Impacto**: Reduce CLS de 0.371 (90% del problema)
- **Estado**: ✅ Completado

#### 3.2 Reserva de espacio para banner
- **Archivo**: `src/components/Home-v2/index.tsx`
- **Cambio**: Agregado `minHeight: '120px'` al contenedor del banner "30% OFF"
- **Impacto**: Reduce CLS de 0.041
- **Estado**: ✅ Completado

### ✅ Fase 4: Analytics fuera de Ruta Crítica (CRÍTICA)

#### 4.1 Google Analytics carga diferida
- **Archivo**: `src/components/Analytics/GoogleAnalytics.tsx`
- **Cambio**: Implementada carga después de LCP e interacción del usuario
  - Carga después de primera interacción (mousedown, touchstart, keydown, scroll)
  - Fallback: carga después de 3 segundos si no hay interacción
- **Impacto**: Elimina bloqueo de ruta crítica de 5,863ms
- **Estado**: ✅ Completado

#### 4.2 Meta Pixel carga diferida
- **Archivo**: `src/components/Analytics/MetaPixel.tsx`
- **Cambio**: Misma estrategia que Google Analytics - carga después de LCP e interacción
- **Impacto**: Elimina bloqueo de ruta crítica
- **Estado**: ✅ Completado

### ✅ Fase 5: JavaScript y Red (MEDIA)

#### 5.1 Política de caché mejorada
- **Archivo**: `next.config.js`
- **Cambio**: Actualizado `max-age` de 86400 (1 día) a 31536000 (1 año) para imágenes estáticas
- **Impacto**: Ahorro potencial de 1,327 KiB según Lighthouse
- **Estado**: ✅ Completado

#### 5.2 Preconnects mejorados
- **Archivo**: `src/app/layout.tsx`
- **Cambio**: Agregado `crossOrigin="anonymous"` a todos los preconnects para recursos CORS
- **Impacto**: Mejora conexiones a dominios externos
- **Estado**: ✅ Completado

#### 5.3 Optimización de reprocesamiento forzado
- **Archivos**: 
  - `src/components/ui/testimonial-slider.tsx`
  - `src/components/Home/CategoryTogglePills/index.tsx`
- **Cambio**: Uso de `requestAnimationFrame` para agrupar lecturas de geometría antes de cambios de estilo
- **Impacto**: Reduce reprocesamiento forzado de 41ms
- **Estado**: ✅ Completado

## Métricas Esperadas

### Antes (Actual)
- **LCP**: 64.3s (Pobre)
- **TBT**: 2,120ms (Pobre)
- **CLS**: 0.413 (Pobre)
- **FCP**: 3.1s (Pobre)
- **Speed Index**: 16.0s (Pobre)
- **Puntaje General**: 13/100

### Después (Objetivo)
- **LCP**: < 2.5s (Bueno) - Reducción esperada de ~62s
- **TBT**: < 200ms (Bueno) - Reducción esperada de ~1,920ms
- **CLS**: < 0.1 (Bueno) - Reducción esperada de ~0.313
- **FCP**: < 1.8s (Bueno) - Reducción esperada de ~1.3s
-<parameter name="Speed Index": < 3.4s (Bueno) - Reducción esperada de ~12.6s
- **Puntaje General**: 90+/100

## Tareas Pendientes

1. **Optimizar hero6.svg** (8.7 MB)
   - Convertir a formato rasterizado moderno (WebP/AVIF)
   - O simplificar vectores en el SVG
   - Requiere herramientas externas de optimización

2. **Verificación post-implementación**
   - Ejecutar Lighthouse nuevamente para validar mejoras
   - Verificar que los analytics se carguen correctamente después de LCP
   - Confirmar que el CLS se haya reducido significativamente

## Notas Técnicas

- Los analytics ahora se cargan solo después de interacción del usuario o 3 segundos después de la carga inicial
- El CSS crítico permanece inline en `layout.tsx` para FCP rápido
- Los preconnects incluyen `crossOrigin` para recursos CORS
- Las imágenes LCP tienen `fetchPriority="high"` explícito para mejor descubrimiento

## Próximos Pasos

1. Ejecutar Lighthouse para validar mejoras
2. Optimizar hero6.svg externamente
3. Monitorear métricas en producción
4. Ajustar tiempos de carga de analytics si es necesario














