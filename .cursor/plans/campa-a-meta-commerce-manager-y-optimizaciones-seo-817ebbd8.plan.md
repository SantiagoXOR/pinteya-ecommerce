<!-- 817ebbd8-c864-400d-8742-d3679e5e8d24 0900453f-8123-4b5a-a3a5-5b1f614597ee -->
# Campaña Meta Commerce Manager y Optimizaciones SEO

## Objetivos

1. **Campaña Principal de Performance**: Catálogo dinámico conectado con Meta Commerce Manager
2. **Remarketing**: Tracking mejorado para usuarios que visitaron/agregaron productos
3. **SEO**: Migrar rutas de `/products/[id]` a `/products/[slug]`
4. **UX**: Agregar carrusel de productos sugeridos en modal
5. **Performance**: Optimizar carga de productos

---

## 1. Catálogo Dinámico para Meta Commerce Manager

### 1.1 Endpoint de Feed XML/CSV

- **Archivo**: `src/app/api/meta-catalog/feed.xml/route.ts`
- Generar feed XML en formato requerido por Meta Commerce Manager
- Incluir campos: `id`, `title`, `description`, `image_link`, `link`, `price`, `availability`, `brand`, `category`
- URL base: `https://www.pinteya.com/products/[slug]` (después de migración)

### 1.2 Sincronización Automática

- Endpoint para actualizar catálogo cuando cambian productos
- Webhook o job programado para mantener sincronización
- Validación de formato antes de enviar a Meta

### 1.3 Configuración en Meta Commerce Manager

- Documentación para conectar feed XML
- Variables de entorno para configuración

---

## 2. Migración de Rutas a Slugs para SEO

### 2.1 Nueva Ruta con Slug

- **Archivo**: `src/app/(site)/(pages)/products/[slug]/page.tsx` (nuevo)
- Buscar producto por slug en lugar de ID
- Mantener compatibilidad con IDs durante transición

### 2.2 API para Producto por Slug

- **Archivo**: `src/app/api/products/slug/[slug]/route.ts` (nuevo)
- Endpoint que busca producto por slug
- Fallback a ID si slug no existe

### 2.3 Redirecciones 301

- **Archivo**: `src/app/(site)/(pages)/products/[id]/page.tsx` (modificar)
- Redirigir `/products/[id]` → `/products/[slug]` con 301
- Obtener slug desde BD y redirigir

### 2.4 Actualizar Navegación

- **Archivos**: 
- `src/hooks/useSearchNavigation.ts`
- `src/components/Common/ProductItem.tsx`
- Todos los componentes que generan links a productos
- Usar slug en lugar de ID para URLs

### 2.5 Sitemap y Metadata

- Actualizar sitemap para usar slugs
- Metadata dinámica con slug en URL

---

## 3. Carrusel de Productos Sugeridos en Modal

### 3.1 Componente de Productos Sugeridos

- **Archivo**: `src/components/ShopDetails/SuggestedProductsCarousel.tsx` (nuevo)
- Usar función existente `getRelatedProducts` de `src/lib/api/related-products.ts`
- Carrusel con Swiper similar a `RecentlyViewd`
- Mostrar productos de misma categoría o relacionados

### 3.2 Integración en Modal

- **Archivo**: `src/components/ShopDetails/ShopDetailModal.tsx` (modificar)
- Agregar carrusel al final del modal, antes del footer
- Cargar productos sugeridos cuando se abre el modal
- Loading state mientras carga

### 3.3 Optimización de Carga

- Cargar productos sugeridos de forma lazy (solo cuando modal está abierto)
- Limitar a 8-12 productos sugeridos

---

## 4. Optimización de Carga de Productos

### 4.1 Identificar Problemas de Performance

- **Archivo**: `src/app/(site)/(pages)/products/[id]/page.tsx`
- Problema actual: carga secuencial (producto → luego modal)
- Solución: usar React Suspense y loading states optimizados

### 4.2 Mejoras en API

- **Archivo**: `src/app/api/products/[id]/route.ts`
- Agregar caché con headers apropiados
- Optimizar query de Supabase (solo campos necesarios)
- Considerar agregar índice en slug si no existe

### 4.3 Prefetch y Preload

- Prefetch de productos relacionados cuando se carga producto principal
- Preload de imágenes críticas

---

## 5. Tracking Mejorado para Remarketing

### 5.1 Eventos Meta Pixel Existentes

- Ya implementados: `ViewContent`, `AddToCart`, `Purchase`
- Verificar que incluyan todos los parámetros necesarios

### 5.2 Parámetros Adicionales

- **Archivo**: `src/lib/meta-pixel.ts` (modificar si es necesario)
- Asegurar que eventos incluyan `content_ids`, `content_name`, `content_type`
- Agregar `content_category` cuando esté disponible

### 5.3 URLs en Eventos

- Incluir URL completa del producto en eventos
- Usar slug en lugar de ID después de migración

---

## Archivos Clave a Modificar/Crear

### Nuevos Archivos

- `src/app/(site)/(pages)/products/[slug]/page.tsx`
- `src/app/api/products/slug/[slug]/route.ts`
- `src/app/api/meta-catalog/feed.xml/route.ts`
- `src/components/ShopDetails/SuggestedProductsCarousel.tsx`

### Archivos a Modificar

- `src/app/(site)/(pages)/products/[id]/page.tsx` (redirección)
- `src/components/ShopDetails/ShopDetailModal.tsx` (carrusel)
- `src/hooks/useSearchNavigation.ts` (usar slug)
- `src/components/Common/ProductItem.tsx` (usar slug)
- `src/lib/api/products.ts` (función getProductBySlug)
- `src/app/api/products/[id]/route.ts` (optimización)

---

## Consideraciones Técnicas

1. **Compatibilidad**: Mantener soporte para IDs durante transición (redirecciones)
2. **SEO**: Slugs deben ser únicos y descriptivos
3. **Performance**: Feed XML puede ser pesado, considerar paginación o generación incremental
4. **Meta Commerce Manager**: Requiere configuración manual en plataforma Meta
5. **Testing**: Verificar redirecciones, carrusel, y feed XML antes de deploy

---

## Orden de Implementación Recomendado

1. Migración a slugs (crítico para SEO y URLs en feed)
2. Optimización de carga de productos
3. Carrusel de productos sugeridos
4. Feed dinámico para Meta Commerce Manager
5. Testing y ajustes finales

### To-dos

- [ ] Migrar rutas de productos de /products/[id] a /products/[slug] con redirecciones 301
- [ ] Crear API endpoint para buscar productos por slug
- [ ] Actualizar todos los componentes de navegación para usar slugs en lugar de IDs
- [ ] Optimizar carga de productos (caché, queries, loading states)
- [ ] Crear componente de carrusel de productos sugeridos e integrarlo en modal
- [ ] Implementar endpoint de feed XML dinámico para Meta Commerce Manager
- [ ] Actualizar eventos de Meta Pixel para incluir slugs y parámetros completos
- [ ] Actualizar sitemap y metadata para usar slugs en URLs