# Optimizaciones de Performance Post-Deploy - 23 de Enero 2026

## Resumen de Optimizaciones Implementadas

Este documento resume las optimizaciones realizadas según el plan de optimización post-deploy.

### ✅ Fase 1: Investigación y Análisis

**Estado:** Completado

- ✅ Verificado que el preload de imagen hero está configurado en `layout.tsx`
- ✅ Verificado que HeroSection usa imagen estática inicial para LCP
- ✅ Analizado código para identificar oportunidades de optimización

### ✅ Fase 2: Optimización de JavaScript No Utilizado (1.3s de ahorro)

**Estado:** Completado

**Optimizaciones realizadas:**

1. **Framer Motion - Lazy Loading**
   - ✅ Convertidos imports directos de `framer-motion` a `@/lib/framer-motion-lazy` en:
     - `src/app/about/page.tsx`
     - `src/components/admin/products/ExpandableVariantsRow.tsx`
     - `src/components/admin/products/VariantModal.tsx`
     - `src/components/admin/products/ProductFilters.tsx`
     - `src/components/Analytics/ExternalAnalyticsPanel.tsx`
   
   **Impacto:** Reduce bundle inicial en ~40KB al cargar Framer Motion solo cuando se necesita

2. **Verificación de imports modulares**
   - ✅ Verificado que `lodash-es` y `date-fns` ya usan imports modulares
   - ✅ Verificado que `recharts` y `swiper` ya están configurados para lazy loading async

### ✅ Fase 3: Optimización de Imágenes (250ms de ahorro total)

**Estado:** Completado

**Optimizaciones realizadas:**

1. **Lazy Loading de Imágenes Offscreen (100ms)**
   - ✅ Agregado `loading="lazy"` y `sizes` a imágenes en `ProductImageGallery.tsx`
   - ✅ Agregado `loading="lazy"` y `sizes` a `SafeImage.tsx`
   - ✅ Agregado `loading="lazy"` y `sizes` a imágenes en `ExpandableVariantsRow.tsx`

2. **Optimización de Sizing de Imágenes (150ms)**
   - ✅ Agregado `sizes` correcto a todas las imágenes optimizadas
   - ✅ Agregado `quality={75}` y `decoding="async"` para mejor rendimiento
   - ✅ Verificado que imágenes de productos ya tienen `sizes` optimizado (308x308)

**Archivos modificados:**
- `src/components/ShopDetails/ShopDetailModal/components/ProductImageGallery.tsx`
- `src/components/Common/SafeImage.tsx`
- `src/components/admin/products/ExpandableVariantsRow.tsx`

### ✅ Fase 4: Optimización de Tiempo de Respuesta del Servidor (44ms)

**Estado:** Completado

**Optimizaciones realizadas:**

1. **Índices de Base de Datos**
   - ✅ Creada migración SQL para índices optimizados (ver `supabase/migrations/20260123_optimize_data_server_queries.sql`)
   - ✅ Índices creados para:
     - `categories(display_order, name)` - Optimiza `getCategoriesServer`
     - `products(slug, is_active)` - Optimiza búsqueda por slug
     - `products(brand, is_active, created_at)` - Optimiza filtrado por marca
     - `product_categories(category_id, product_id)` - Optimiza JOINs
     - `product_variants(product_id, is_active, is_default)` - Optimiza queries de variantes
     - `product_images(product_id, is_primary, display_order)` - Optimiza queries de imágenes

2. **Configuración de Caché**
   - ✅ Verificado que `next.config.js` tiene headers de caché optimizados
   - ✅ Cache-Control configurado con `stale-while-revalidate` para mejor rendimiento
   - ✅ ISR configurado con `revalidate = 60` en `page.tsx`

### 📋 Migración SQL Requerida

**Archivo:** `supabase/migrations/20260123_optimize_data_server_queries.sql`

```sql
-- ⚡ OPTIMIZACIÓN: Índices para optimizar queries de data-server.ts
-- Mejora significativa en getCategoriesServer y getBestSellerProductsServer
-- Ahorro estimado: 44ms en tiempo de respuesta del servidor

BEGIN;

-- Índice compuesto para categories (display_order, name)
CREATE INDEX IF NOT EXISTS idx_categories_display_order_name 
ON categories(display_order NULLS LAST, name);

-- Índice para products.slug (usado en IN queries)
CREATE INDEX IF NOT EXISTS idx_products_slug_active 
ON products(slug, is_active) 
WHERE is_active = true;

-- Índice compuesto para products (brand, is_active, created_at)
CREATE INDEX IF NOT EXISTS idx_products_brand_active_created 
ON products(brand, is_active, created_at DESC) 
WHERE is_active = true;

-- Índice para product_categories (category_id, product_id)
CREATE INDEX IF NOT EXISTS idx_product_categories_category_product 
ON product_categories(category_id, product_id);

-- Índice para product_categories (product_id)
CREATE INDEX IF NOT EXISTS idx_product_categories_product 
ON product_categories(product_id);

-- Índice compuesto para product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active_default 
ON product_variants(product_id, is_active, is_default DESC) 
WHERE is_active = true;

-- Índice compuesto para product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_primary_order 
ON product_images(product_id, is_primary DESC, display_order);

COMMIT;
```

**✅ Migración aplicada:** 23 de Enero 2026
- Todos los índices fueron creados exitosamente usando MCP Supabase tools
- Verificación completada: 7 índices creados correctamente

### 📊 Métricas Esperadas Post-Optimización

**Antes:**
- Performance: 44/100
- LCP: 15.20s
- FCP: 3.07s
- TBT: 746.5ms
- SI: 6.48s

**Objetivo Inicial (después de estas optimizaciones):**
- Performance: 44 → 60-70+ (objetivo final: >85)
- LCP: 15.20s → <8s inicialmente (objetivo final: <2.5s)
- FCP: 3.07s → <2.8s (objetivo final: <2.5s)
- TBT: 746.5ms → <500ms (objetivo final: <300ms)
- SI: 6.48s → <5.5s (objetivo final: <3.4s)

### 🔍 Notas sobre LCP

El LCP puede no haber mejorado significativamente debido a:
1. **Variabilidad de Lighthouse:** Las métricas pueden variar entre ejecuciones
2. **CDN/Servidor:** El tiempo de respuesta del servidor puede estar afectando el LCP
3. **Imagen Hero:** Verificar que la imagen hero se está sirviendo correctamente desde el CDN

**Recomendaciones adicionales:**
- Verificar que la imagen hero está en el CDN y tiene caché apropiado
- Considerar usar `fetchPriority="high"` en la imagen hero (ya implementado)
- Verificar que el preload de imagen hero está funcionando correctamente

### 📝 Próximos Pasos

1. **Aplicar migración SQL** para índices de base de datos
2. **Ejecutar análisis post-optimización:**
   ```bash
   npm run lighthouse:json
   npm run lighthouse:analyze
   ```
3. **Comparar métricas** antes/después
4. **Verificar LCP** en diferentes condiciones de red
5. **Considerar optimizaciones adicionales** si las métricas no mejoran lo suficiente

### ✅ Archivos Modificados

1. `src/app/about/page.tsx` - Lazy loading de framer-motion
2. `src/components/admin/products/ExpandableVariantsRow.tsx` - Lazy loading + optimización de imágenes
3. `src/components/admin/products/VariantModal.tsx` - Lazy loading de framer-motion
4. `src/components/admin/products/ProductFilters.tsx` - Lazy loading de framer-motion
5. `src/components/Analytics/ExternalAnalyticsPanel.tsx` - Lazy loading de framer-motion
6. `src/components/ShopDetails/ShopDetailModal/components/ProductImageGallery.tsx` - Optimización de imágenes
7. `src/components/Common/SafeImage.tsx` - Optimización de imágenes

### 🎯 Impacto Total Estimado

- **JavaScript no utilizado:** ~1.3s de ahorro (reducción de bundle inicial)
- **Imágenes offscreen:** ~100ms de ahorro (lazy loading)
- **Sizing de imágenes:** ~150ms de ahorro (tamaños correctos)
- **Tiempo de respuesta del servidor:** ~44ms de ahorro (índices de BD)

**Total estimado:** ~1.6s de mejora en métricas de performance

---

**Fecha de implementación:** 23 de Enero 2026
**Estado:** ✅ Completado - Migración SQL aplicada exitosamente
