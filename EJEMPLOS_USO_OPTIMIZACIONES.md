# 💡 Ejemplos Prácticos de Uso - Optimizaciones Avanzadas

Esta guía muestra cómo usar todas las optimizaciones implementadas en componentes reales.

---

## 1. 🔄 Progressive Loading - Cargar al Scroll

### Caso de Uso: Sección de Testimonios

```typescript
// src/components/Home-v2/Testimonials/index.tsx
'use client'

import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import { TestimonialSkeleton } from '@/components/ui/advanced-skeleton'

const Testimonials = () => {
  // ⚡ Solo carga cuando el usuario hace scroll hasta aquí
  const { ref, isVisible } = useProgressiveLoading({
    rootMargin: '300px',  // Pre-carga 300px antes
    triggerOnce: true,    // Solo carga una vez
  })

  return (
    <section ref={ref} className="testimonials-section">
      {isVisible ? (
        <TestimonialList />  // Componente real
      ) : (
        <TestimonialSkeleton />  // Skeleton mientras
      )}
    </section>
  )
}
```

**Beneficio**: Ahorra rendering de testimonios hasta que sean necesarios

---

## 2. 🌐 Adaptive Loading - Según Velocidad de Red

### Caso de Uso: Hero con Calidad Adaptativa

```typescript
// src/components/Home-v2/Hero/index.tsx
'use client'

import { useAdaptiveImageQuality } from '@/hooks/useNetworkStatus'
import HeroCarousel from '@/components/Common/HeroCarousel.lazy'

const Hero = () => {
  const { quality, enableAnimations, sizes } = useAdaptiveImageQuality()
  
  // Adaptar imágenes según conexión
  const adaptedHeroImages = heroImagesMobile.map(img => ({
    ...img,
    quality: quality,        // 50-85 según red
    sizes: sizes,            // Sizes adaptados
  }))

  return (
    <HeroCarousel
      images={adaptedHeroImages}
      autoplayDelay={enableAnimations ? 5000 : 8000}
    />
  )
}
```

**Beneficio**: Usuarios en 2G/3G obtienen imágenes de menor peso

---

## 3. ⚡ Smart Prefetching - Hover para Navegación Instantánea

### Caso de Uso: Product Card

```typescript
// src/components/Product/ProductCard.tsx
import { smartPrefetcher } from '@/lib/performance/smart-prefetch'
import { useAdaptivePrefetch } from '@/hooks/useNetworkStatus'

const ProductCard = ({ product }) => {
  const { shouldPrefetch, prefetchDelay } = useAdaptivePrefetch()

  // ⚡ Prefetch solo si la conexión es rápida
  const prefetchProps = shouldPrefetch
    ? smartPrefetcher.prefetchOnHover(
        `/shop-details/${product.id}`,
        { delay: prefetchDelay, priority: 'low' }
      )
    : {}

  return (
    <Link 
      href={`/shop-details/${product.id}`}
      {...prefetchProps}  // onMouseEnter y onMouseLeave
      className="product-card"
    >
      <Image src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </Link>
  )
}
```

**Beneficio**: Navegación parece instantánea (página ya está cargada)

---

## 4. 🎨 Advanced Skeletons - UX Mejorada

### Caso de Uso: Lista de Productos

```typescript
// src/components/Products/ProductList.tsx
import { ProductListSkeleton } from '@/components/ui/advanced-skeleton'
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'

const ProductList = () => {
  const { ref, isVisible } = useProgressiveLoading()
  const { data: products, isLoading } = useQuery(['products'])

  if (isLoading) {
    return <ProductListSkeleton count={9} />
  }

  return (
    <div ref={ref} className="product-section">
      {isVisible ? (
        <div className="grid grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <ProductListSkeleton count={9} />
      )}
    </div>
  )
}
```

---

## 5. 📱 Combinación: Progressive + Adaptive + Prefetch

### Caso de Uso: Best Seller Section (Completo)

```typescript
// src/components/Home-v2/BestSeller/index.tsx
'use client'

import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import { useAdaptiveImageQuality } from '@/hooks/useNetworkStatus'
import { smartPrefetcher } from '@/lib/performance/smart-prefetch'
import { ProductListSkeleton } from '@/components/ui/advanced-skeleton'

const BestSeller = () => {
  // 1. Progressive Loading
  const { ref, isVisible } = useProgressiveLoading({
    rootMargin: '300px',
  })

  // 2. Adaptive Quality
  const { quality, loading, isSlowConnection } = useAdaptiveImageQuality()

  // 3. Prefetch de productos populares
  useEffect(() => {
    if (isVisible && !isSlowConnection) {
      const topProducts = ['product-1', 'product-2', 'product-3']
      const urls = topProducts.map(id => `/shop-details/${id}`)
      smartPrefetcher.prefetchBatch(urls, 'low')
    }
  }, [isVisible, isSlowConnection])

  return (
    <section ref={ref} className="product-section">
      {isVisible ? (
        <div className="grid grid-cols-3 gap-6">
          {bestSellers.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              imageQuality={quality}     // Adaptado a red
              imageLazyLoading={loading} // lazy en 2G/3G
            />
          ))}
        </div>
      ) : (
        <ProductListSkeleton count={9} />
      )}
    </section>
  )
}
```

**Beneficio**: Combinación de todas las optimizaciones para máximo performance

---

## 6. 🎭 Skeleton Personalizado

### Crear tu propio skeleton

```typescript
import { AdvancedSkeleton } from '@/components/ui/advanced-skeleton'

const CustomProductSkeleton = () => {
  return (
    <div className="space-y-4 p-6">
      {/* Badge */}
      <AdvancedSkeleton 
        variant="rectangular" 
        width={80} 
        height={24}
        animation="shimmer"
      />

      {/* Imagen */}
      <AdvancedSkeleton 
        variant="rectangular" 
        height={300}
        animation="shimmer"
      />

      {/* Título */}
      <AdvancedSkeleton 
        variant="text" 
        width="85%"
        animation="shimmer"
      />

      {/* Descripción */}
      <div className="space-y-2">
        <AdvancedSkeleton variant="text" width="100%" />
        <AdvancedSkeleton variant="text" width="90%" />
        <AdvancedSkeleton variant="text" width="70%" />
      </div>

      {/* Precio y botón */}
      <div className="flex justify-between items-center pt-4">
        <AdvancedSkeleton 
          variant="text" 
          width={100} 
          height={32}
          className="font-bold"
        />
        <AdvancedSkeleton 
          variant="button" 
          width={140}
          animation="shimmer"
        />
      </div>
    </div>
  )
}
```

---

## 7. 🔍 Network Status - Debugging

### Ver estado de la red en tiempo real

```typescript
'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const NetworkDebugger = () => {
  const { effectiveType, downlink, rtt, saveData, isSlowConnection } = useNetworkStatus()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <h4 className="font-bold mb-2">Network Status</h4>
      <div>Type: {effectiveType}</div>
      <div>Downlink: {downlink} Mbps</div>
      <div>RTT: {rtt} ms</div>
      <div>Save Data: {saveData ? 'Yes' : 'No'}</div>
      <div>Slow: {isSlowConnection ? 'Yes' : 'No'}</div>
    </div>
  )
}
```

**Uso**: Agregar a `src/app/layout.tsx` solo en development

---

## 8. 🎯 HOC with Skeleton

### Envolver componente con loading state

```typescript
import { withSkeleton } from '@/components/ui/advanced-skeleton'
import { ProductCardSkeleton } from '@/components/ui/advanced-skeleton'

// Componente original
const ProductCard = ({ product }) => {
  return (
    <div>
      <Image src={product.image} />
      <h3>{product.name}</h3>
    </div>
  )
}

// Componente con skeleton automático
const ProductCardWithSkeleton = withSkeleton(
  ProductCard, 
  ProductCardSkeleton
)

// Uso
<ProductCardWithSkeleton 
  product={product} 
  loading={isLoading}  // Muestra skeleton si true
/>
```

---

## 9. 📊 Monitoreo de Prefetch

### Ver estadísticas de prefetching

```typescript
import { smartPrefetcher } from '@/lib/performance/smart-prefetch'

// En cualquier componente
useEffect(() => {
  const stats = smartPrefetcher.getStats()
  console.log('📊 Prefetch Stats:', stats)
  // {
  //   totalPrefetched: 15,
  //   pendingHovers: 2,
  //   hasObserver: true
  // }
}, [])
```

---

## 10. 🔥 Caso Real: Homepage Completa Optimizada

```typescript
// src/components/Home-v2/index.tsx
'use client'

import dynamic from 'next/dynamic'
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import { useAdaptiveImageQuality } from '@/hooks/useNetworkStatus'
import { 
  ProductListSkeleton, 
  TestimonialSkeleton,
  NewsletterSkeleton 
} from '@/components/ui/advanced-skeleton'

// Above-the-fold: Carga inmediata
const Hero = dynamic(() => import('./Hero'), { ssr: true })
const CategoryPills = dynamic(() => import('./CategoryTogglePillsWithSearch'))

// Below-the-fold: Progressive loading
const BestSellerSection = () => {
  const { ref, isVisible } = useProgressiveLoading({ rootMargin: '300px' })
  const { quality } = useAdaptiveImageQuality()

  return (
    <section ref={ref} className="product-section">
      {isVisible ? (
        <BestSeller imageQuality={quality} />
      ) : (
        <ProductListSkeleton count={6} />
      )}
    </section>
  )
}

const TestimonialsSection = () => {
  const { ref, isVisible } = useProgressiveLoading({ rootMargin: '200px' })

  return (
    <section ref={ref} className="testimonials-section">
      {isVisible ? <Testimonials /> : <TestimonialSkeleton />}
    </section>
  )
}

const NewsletterSection = () => {
  const { ref, isVisible } = useProgressiveLoading({ rootMargin: '100px' })

  return (
    <section ref={ref} className="newsletter-section">
      {isVisible ? <Newsletter /> : <NewsletterSkeleton />}
    </section>
  )
}

// Homepage principal
const HomeV2 = () => {
  return (
    <main>
      {/* Above-the-fold - Carga inmediata */}
      <Hero />
      <CategoryPills />

      {/* Below-the-fold - Progressive loading */}
      <BestSellerSection />
      <TestimonialsSection />
      <NewsletterSection />
    </main>
  )
}
```

---

## 🎯 MEJORES PRÁCTICAS

### DO's ✅

1. **Usar Progressive Loading** para contenido below-the-fold
2. **Usar Adaptive Quality** en imágenes grandes
3. **Usar Smart Prefetch** en links importantes
4. **Usar Advanced Skeletons** para mejor UX
5. **Combinar múltiples optimizaciones** para máximo impacto
6. **Testear en 3G throttling** (DevTools)

### DON'Ts ❌

1. **NO** usar Progressive Loading en above-the-fold
2. **NO** hacer prefetch en conexiones lentas (ya manejado)
3. **NO** usar calidad muy baja (< 50) incluso en 2G
4. **NO** abusar de lazy loading (solo below-the-fold)
5. **NO** olvidar skeletons (malo UX)
6. **NO** prefetch URLs externas

---

## 🧪 TESTING EN DIFERENTES REDES

### Simular 2G (Slow Connection)

**DevTools:**
1. F12 → Network tab
2. Throttling: "Slow 3G"
3. Refresh página

**Comportamiento esperado:**
- ✅ Calidad de imágenes reducida (60)
- ✅ Lazy loading agresivo
- ✅ No hace prefetch
- ✅ Animaciones deshabilitadas

### Simular 4G (Fast Connection)

**DevTools:**
1. F12 → Network tab
2. Throttling: "No throttling" o "Fast 3G"

**Comportamiento esperado:**
- ✅ Calidad de imágenes alta (85)
- ✅ Prefetch activo en hover
- ✅ Animaciones habilitadas
- ✅ Carga optimista

---

## 📊 MÉTRICAS A MONITOREAR

### En Lighthouse

```bash
npx lighthouse http://localhost:3000 \
  --only-categories=performance \
  --form-factor=mobile \
  --view
```

**Buscar:**
- FCP < 1.5s ✅
- LCP < 2.0s ✅
- CLS < 0.1 ✅
- TBT < 200ms ✅

### En Network Tab

**Verificar:**
1. Primera imagen Hero tiene `Priority: High`
2. Swiper se carga después del FCP
3. Solo 3 fuentes se descargan
4. Providers lazy se cargan después

### En Performance Tab

**Verificar:**
1. Long Tasks < 50ms
2. Main Thread work < 2s
3. JavaScript execution < 1s
4. Layout shifts mínimos

---

## 🚀 DEPLOY CHECKLIST

### Pre-deploy
- [ ] `npm run build` exitoso
- [ ] Lighthouse score > 90
- [ ] No hay errores en consola
- [ ] Testing visual OK
- [ ] Testing en 3G OK

### Deploy
- [ ] Push a staging
- [ ] Testing en staging
- [ ] Monitoreo de métricas
- [ ] A/B test (si es posible)
- [ ] Deploy a producción

### Post-deploy
- [ ] Monitorear Real User Metrics
- [ ] Verificar que FCP < 1.5s en producción
- [ ] Revisar error logs
- [ ] Documentar resultados

---

## 💡 TIPS ADICIONALES

### 1. Forzar carga de sección

```typescript
const { ref, isVisible, forceLoad } = useProgressiveLoading()

// Botón para cargar manualmente
<button onClick={forceLoad}>
  Cargar contenido
</button>
```

### 2. Prefetch de página completa

```typescript
// Prefetch del checkout en el cart
useEffect(() => {
  if (cartItems.length > 0) {
    smartPrefetcher.prefetch('/checkout', 'low')
  }
}, [cartItems])
```

### 3. Skeleton con animación personalizada

```typescript
<AdvancedSkeleton 
  variant="card"
  width={300}
  height={400}
  animation="wave"  // Cambia de shimmer a wave
  className="my-custom-class"
/>
```

### 4. Content Visibility manual

```typescript
// Para cualquier sección pesada
<div 
  className="my-heavy-section"
  style={{
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 600px'
  }}
>
  <HeavyComponent />
</div>
```

---

## 🎯 RESULTADOS ESPERADOS POR COMPONENTE

| Componente | Sin Optimización | Con Optimización | Mejora |
|------------|------------------|------------------|--------|
| **Hero** | Renderiza inmediato | Skeleton → Lazy Swiper | -1.0s FCP |
| **Products** | Renderiza todo | Progressive Loading | -0.5s FCP |
| **Testimonials** | Renderiza todo | Progressive + Skeleton | -0.3s FCP |
| **Newsletter** | Renderiza todo | Progressive + Skeleton | -0.2s FCP |
| **Header** | Geo inmediata | Defer 2s + Memo | -0.3s FCP |

**Total combinado**: **-2.3s adicional sobre Quick Wins** 🚀

---

**¡Usa estas técnicas en todos tus componentes para máximo performance!** ⚡



