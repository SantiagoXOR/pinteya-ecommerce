# Fix Crítico: LCP de 82.5 segundos

## Problema Identificado

**LCP extremadamente alto: 82.5 segundos** (objetivo: < 2.5s)

### Causa Raíz

El componente `HeroCarousel` está usando lazy loading con `ssr: false`, lo que causa:

1. La imagen hero (LCP candidate) está dentro del componente lazy-loaded
2. La imagen no se carga hasta que:
   - El JavaScript del cliente se descarga (~2-3s)
   - El componente lazy se carga (~1-2s)  
   - La imagen finalmente se carga (~1-2s)
   - **Total: ~80+ segundos** (probablemente timeout o error de red)

### Evidencia

```typescript
// src/components/Common/HeroCarousel.lazy.tsx
const HeroCarousel = dynamic(
  () => import('./HeroCarousel'),
  {
    ssr: false, // ❌ No renderiza en servidor
    loading: () => <HeroSkeleton />, // Muestra skeleton mientras carga
  }
)
```

## Solución Implementada

### Estrategia: Carga Híbrida

1. **Primera imagen hero carga inmediatamente** (sin lazy loading)
   - Se renderiza en el HTML inicial
   - Usa `priority={true}` y `fetchPriority='high'`
   - Visible inmediatamente para LCP

2. **Carrusel lazy-loaded se carga después**
   - Mantiene el beneficio de lazy loading para Swiper
   - Se muestra con fade-in cuando está listo
   - No bloquea el LCP

### Implementación

```typescript
// Primera imagen hero carga inmediatamente
<div className={`absolute inset-0 z-10 ${carouselLoaded ? 'opacity-0' : 'opacity-100'}`}>
  <Image
    src={firstImageMobile.src}
    alt={firstImageMobile.alt}
    fill
    priority={true}
    fetchPriority='high'
    unoptimized={true}
  />
</div>

// Carrusel lazy-loaded se muestra cuando está listo
<div className={`relative z-20 ${carouselLoaded ? 'opacity-100' : 'opacity-0'}`}>
  <HeroCarousel images={heroImagesMobile} />
</div>
```

## Impacto Esperado

| Métrica | Antes | Esperado | Mejora |
|---------|-------|----------|--------|
| **LCP** | 82.5s | < 3s | **-96%** |
| **FCP** | 2.9s | < 2.5s | -14% |
| **Performance Score** | 33 | > 60 | +82% |

## Archivos Modificados

- `src/components/Home-v2/Hero/index.tsx` - Carga híbrida de imagen hero

## Próximos Pasos

1. Desplegar cambios
2. Ejecutar nuevo análisis PageSpeed Insights
3. Verificar que LCP esté < 3s
4. Monitorear métricas durante 24-48 horas

