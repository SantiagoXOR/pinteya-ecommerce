# Lógica de Obtención de Productos: Best Seller y Carrusel de Envío Gratis

## 📋 Resumen Ejecutivo

Este documento explica cómo se obtienen y filtran los productos en dos secciones clave:
1. **Best Seller**: Productos más vendidos (hardcodeados o por categoría)
2. **Carrusel de Envío Gratis**: Productos con precio > $50,000

---

## 🏆 1. BEST SELLER

### Flujo de Obtención

```
page.tsx (Server)
  ↓ getBestSellerProductsServer(null)
  ↓ Supabase: SELECT * WHERE slug IN (BESTSELLER_PRODUCTS_SLUGS)
  ↓ Ordenar según prioridad de BESTSELLER_PRODUCTS_SLUGS
  ↓ Adaptar productos
  ↓
BestSellerSection (Server Component)
  ↓ initialProducts prop
  ↓
BestSellerClient (Client Component)
  ↓ useBestSellerProducts({ categorySlug, initialData })
  ↓ BestsellerStrategy
  ↓ React Query (con cache)
  ↓ ProductItem[]
```

### Lógica Detallada

#### A. Sin Categoría Seleccionada (Modo Default)

**1. Productos Hardcodeados:**
```typescript
// Lista de 10 productos específicos (en orden de prioridad)
BESTSELLER_PRODUCTS_SLUGS = [
  'latex-impulso-generico',                    // 1. Latex Impulso 20L
  'plavipint-fibrado-plavicon',                // 2. Plavicon Fibrado 20L
  'membrana-performa-20l-plavicon',            // 3. Membrana Performa Plavicon 20L
  'plavipint-techos-poliuretanico',            // 4. Recuplast Techos 20L
  'recuplast-interior',                         // 5. Recuplast Interior 20L
  'techos-poliuretanico',                       // 6. Plavicon Interior 20L
  'latex-muros',                                // 7. Plavicon Muros 20L
  'hidroesmalte-4l',                            // 8. Hidroesmalte 4L
  'piscinas-solvente-plavipint-plavicon',      // 9. Pintura Piscinas Plavicon
  'cielorrasos',                                // 10. Cielorraso Plavicon 20L
]
```

**2. Query al Servidor:**
```sql
SELECT * FROM products 
WHERE slug IN (BESTSELLER_PRODUCTS_SLUGS)
AND is_active = true
```

**3. Ordenamiento:**
- Ordenar según la prioridad de `BESTSELLER_PRODUCTS_SLUGS`
- Luego por precio descendente
- Productos con stock primero, luego sin stock

**4. Límite:**
- Máximo **10 productos** (`PRODUCT_LIMITS.BESTSELLER = 10`)

#### B. Con Categoría Seleccionada

**1. Query al Servidor:**
```sql
-- Primero obtener la categoría
SELECT id FROM categories WHERE slug = :categorySlug

-- Luego obtener productos de esa categoría
SELECT * FROM products 
WHERE category_id = :categoryId
AND is_active = true
ORDER BY created_at DESC
LIMIT 20
```

**2. Ordenamiento:**
- Por precio descendente
- Productos con stock primero, luego sin stock

**3. Límite:**
- Máximo **20 productos** (`PRODUCT_LIMITS.CATEGORY = 20`)

### Estrategia: BestsellerStrategy

```typescript
class BestsellerStrategy {
  // Sin categoría: filtra por BESTSELLER_PRODUCTS_SLUGS
  filter(products) {
    if (categorySlug) return products // Sin filtrar
    return filterBestsellerProducts(products) // Filtrar por slugs
  }
  
  // Ordena según prioridad y precio
  sort(products) {
    if (categorySlug) {
      // Ordenar por precio descendente
      return sortByPrice(products, 'desc')
    }
    // Ordenar por prioridad de slugs, luego por precio
    return orderProductsByPriority(products, BESTSELLER_PRODUCTS_SLUGS)
      .then(sortByPrice(products, 'desc'))
  }
}
```

### Cache y Optimización

- **Query Key Única**: `productQueryKeys.bestseller(categorySlug)`
- **Pre-población**: Los productos se pre-fetchean en el servidor y se pre-poblan en React Query cache
- **Initial Data**: Se pasan `initialProducts` como `initialData` para evitar fetches innecesarios

---

## 🚚 2. CARRUSEL DE ENVÍO GRATIS

### Flujo de Obtención

```
DynamicProductCarousel (freeShippingOnly=true)
  ↓ useFilteredProducts({ limit: 30, sortBy: 'price', sortOrder: 'desc' })
  ↓ GET /api/products?limit=30&sortBy=price&sortOrder=desc
  ↓ Adaptar productos
  ↓ updateProductWithMostExpensiveVariant (actualizar con variante más cara)
  ↓ Filtrar: precio > FREE_SHIPPING_THRESHOLD ($50,000)
  ↓ Si no hay productos > threshold: mostrar los más caros disponibles
  ↓ ProductItem[]
```

### Lógica Detallada

#### Paso 1: Obtener Productos

**Hook usado:**
```typescript
const freeShippingQuery = useFilteredProducts({
  limit: 30, // PRODUCT_LIMITS.FREE_SHIPPING
  sortBy: 'price',
  sortOrder: 'desc',
})
```

**Query a la API:**
```
GET /api/products?limit=30&sortBy=price&sortOrder=desc
```

**Respuesta:**
- Hasta 30 productos ordenados por precio descendente
- Sin filtros de categoría (todos los productos)

#### Paso 2: Actualizar con Variante Más Costosa

**Problema:**
- Los productos pueden tener múltiples variantes (colores, medidas, etc.)
- Cada variante tiene su propio precio
- Necesitamos usar el precio de la variante más cara para determinar si califica para envío gratis

**Solución:**
```typescript
const productsWithMostExpensiveVariants = adaptedProducts.map(
  updateProductWithMostExpensiveVariant
)
```

**Lógica:**
- Para cada producto, encontrar la variante con el precio más alto
- Actualizar `product.price` con el precio de esa variante
- Esto asegura que si un producto tiene variantes de $30,000 y $60,000, se use $60,000

#### Paso 3: Filtrar por Precio Mínimo

**Umbral:**
```typescript
FREE_SHIPPING_THRESHOLD = 50000 // $50,000 pesos argentinos
```

**Filtrado:**
```typescript
const freeShippingProducts = productsWithMostExpensiveVariants.filter(p => {
  const price = Number(p.price) || 0
  const discountedPrice = Number(p.discountedPrice) || price
  const finalPrice = discountedPrice > 0 ? discountedPrice : price
  return finalPrice > FREE_SHIPPING_THRESHOLD // > $50,000
})
```

**Nota importante:**
- Se usa el precio con descuento si existe (precio final después de descuento)
- Si no hay descuento, se usa el precio original
- Solo productos con precio final > $50,000 califican

#### Paso 4: Fallback si No Hay Productos

**Problema:**
- Si no hay productos con precio > $50,000, el carrusel estaría vacío

**Solución:**
```typescript
if (freeShippingProducts.length === 0) {
  // Mostrar los productos más caros disponibles (aunque sean < $50,000)
  products = productsWithMostExpensiveVariants
    .sort((a, b) => {
      const priceA = Number(b.discountedPrice) || Number(b.price) || 0
      const priceB = Number(a.discountedPrice) || Number(a.price) || 0
      return priceA - priceB // Ordenar descendente
    })
    .slice(0, maxProducts) // Limitar según maxProducts (default: 12)
} else {
  products = freeShippingProducts
}
```

### Estrategia: FreeShippingStrategy

```typescript
class FreeShippingStrategy {
  // Filtra productos con precio > FREE_SHIPPING_THRESHOLD
  filter(products) {
    return products.filter(p => {
      const finalPrice = p.discountedPrice || p.price
      return finalPrice > FREE_SHIPPING_THRESHOLD // $50,000
    })
  }
  
  // Ordena por precio descendente
  sort(products) {
    return products.sort((a, b) => {
      const priceA = b.discountedPrice || b.price
      const priceB = a.discountedPrice || a.price
      return priceA - priceB
    })
  }
  
  // Ejecuta con fallback
  execute(products) {
    const filtered = this.filter(products)
    if (filtered.length === 0) {
      // Si no hay productos > threshold, usar los más caros disponibles
      return this.limit(this.sort(products))
    }
    return this.limit(this.sort(filtered))
  }
}
```

### Cache y Optimización

- **Query Key Compartida**: `['filtered-products', normalizedFilters]`
- **Comparte Cache**: `DynamicProductCarousel` y `FreeShippingSection` comparten el mismo cache cuando usan los mismos filtros
- **Límite**: Se obtienen 30 productos inicialmente, luego se filtran y limitan según `maxProducts`

---

## 🔄 Comparación: Best Seller vs Envío Gratis

| Aspecto | Best Seller | Envío Gratis |
|---------|-------------|--------------|
| **Fuente de datos** | 10 productos hardcodeados (sin categoría) o categoría completa | Todos los productos (sin filtro de categoría) |
| **Filtrado** | Por slugs específicos o por categoría | Por precio > $50,000 |
| **Ordenamiento** | Por prioridad de slugs (sin categoría) o por precio (con categoría) | Por precio descendente |
| **Límite inicial** | 10 productos (sin categoría) o 20 (con categoría) | 30 productos |
| **Límite final** | 10 o 20 productos | 12 productos (configurable) |
| **Considera variantes** | No | Sí (usa variante más cara) |
| **Umbral de precio** | No aplica | $50,000 |
| **Fallback** | No aplica | Si no hay productos > $50,000, muestra los más caros |

---

## 📊 Diagrama de Flujo

### Best Seller (Sin Categoría)
```
1. Obtener productos con slugs en BESTSELLER_PRODUCTS_SLUGS
2. Ordenar según prioridad de BESTSELLER_PRODUCTS_SLUGS
3. Ordenar por precio descendente
4. Separar: productos con stock primero
5. Limitar a 10 productos
```

### Best Seller (Con Categoría)
```
1. Obtener categoría por slug
2. Obtener productos de esa categoría
3. Ordenar por created_at descendente
4. Separar: productos con stock primero
5. Limitar a 20 productos
```

### Envío Gratis
```
1. Obtener 30 productos ordenados por precio descendente
2. Actualizar cada producto con su variante más cara
3. Filtrar: precio final > $50,000
4. Si no hay productos > $50,000:
   - Mostrar los productos más caros disponibles
5. Limitar a 12 productos (o maxProducts)
```

---

## 🔧 Configuración y Constantes

### Límites de Productos
```typescript
PRODUCT_LIMITS = {
  BESTSELLER: 10,        // Sin categoría
  CATEGORY: 20,          // Con categoría
  FREE_SHIPPING: 30,     // Límite inicial para envío gratis
  NEW_ARRIVALS: 8,
  LOW_PERFORMANCE: 4,
  STANDARD: 12,
}
```

### Umbral de Envío Gratis
```typescript
FREE_SHIPPING_THRESHOLD = 50000 // $50,000 pesos argentinos
```

### Productos Best Seller
```typescript
BESTSELLER_PRODUCTS_SLUGS = [
  'latex-impulso-generico',
  'plavipint-fibrado-plavicon',
  'membrana-performa-20l-plavicon',
  // ... 7 más
]
```

---

## 🎯 Puntos Clave

1. **Best Seller sin categoría**: Siempre muestra los mismos 10 productos hardcodeados
2. **Best Seller con categoría**: Muestra hasta 20 productos de la categoría seleccionada
3. **Envío Gratis**: Filtra productos con precio > $50,000, considerando la variante más cara
4. **Fallback Envío Gratis**: Si no hay productos > $50,000, muestra los más caros disponibles
5. **Cache compartido**: Envío Gratis comparte cache entre `DynamicProductCarousel` y `FreeShippingSection`
6. **Query keys únicas**: Best Seller tiene query key única para evitar conflictos de cache

---

## 📝 Notas Técnicas

- **React Query**: Ambos usan React Query para cache y gestión de estado
- **Estrategias**: Ambos usan el patrón Strategy para encapsular la lógica de filtrado/ordenamiento
- **Adaptadores**: Los productos se adaptan del formato API al formato de componentes
- **Variantes**: Envío Gratis considera variantes para determinar el precio máximo
- **Stock**: Best Seller prioriza productos con stock sobre productos sin stock
