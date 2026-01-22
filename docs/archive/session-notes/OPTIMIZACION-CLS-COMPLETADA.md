# ⚡ Optimización CLS: Reducción de Layout Shifts

## 📊 Problema Identificado

**CLS Total: 0.474** (objetivo: < 0.1)

### Elementos Causantes:

1. **Combo destacado - slide 3**: 0.386 🔴 (81% del total)
2. **30% OFF PINTURA FLASH DAYS**: 0.088 ⚠️ (19% del total)

---

## ✅ Soluciones Implementadas

### 1. **CombosSection** - Dimensiones Fijas y Skeleton Placeholder

**Problema:**
- `aspectRatio: '2.77'` se calculaba después de que las imágenes cargaban
- Las imágenes con `fill` no tenían dimensiones explícitas
- El contenedor cambiaba de tamaño cuando las imágenes se cargaban

**Solución:**
- ✅ Agregado `minHeight: '277px'` en el contenedor principal (mobile: 768px / 2.77)
- ✅ Agregado `aspectRatio: '2.77'` fijo en cada slide individual
- ✅ Agregado skeleton placeholder con mismo aspectRatio mientras carga
- ✅ `objectFit: 'contain'` explícito en las imágenes
- ✅ Ajustado `minHeight` en el contenedor padre de `400px` a `277px` (más preciso)

**Código clave:**
```tsx
// Contenedor con dimensiones fijas
<div style={{ 
  aspectRatio: '2.77',
  minHeight: '277px' // Mobile: 768px / 2.77
}}>
  {/* Skeleton placeholder */}
  <div 
    className='absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse'
    style={{ aspectRatio: '2.77' }}
  />
  
  {/* Slides con aspectRatio fijo */}
  <div style={{ aspectRatio: '2.77' }}>
    <Image style={{ objectFit: 'contain' }} />
  </div>
</div>
```

---

### 2. **PromoBanners** - Altura Fija y Placeholder

**Problema:**
- La imagen de fondo con `fill` causaba layout shift al cargar
- No había placeholder mientras la imagen se cargaba
- La altura podía cambiar durante la carga

**Solución:**
- ✅ Agregado `minHeight: '48px'` fijo (h-12 = 48px)
- ✅ Agregado skeleton placeholder mientras carga la imagen
- ✅ `objectFit: 'cover'` explícito
- ✅ Ajustado z-index para capas correctas (skeleton → imagen → gradient → contenido)
- ✅ Ajustado `minHeight` en el contenedor padre de `120px` a `48px` (más preciso)

**Código clave:**
```tsx
<div 
  className='relative h-12 md:h-14'
  style={{ minHeight: '48px' }} // Altura fija desde el inicio
>
  {/* Skeleton placeholder */}
  <div className='absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse z-0' />
  
  {/* Imagen con z-index correcto */}
  <Image 
    className='z-10'
    style={{ objectFit: 'cover' }}
  />
  
  {/* Gradient overlay */}
  <div className='z-20' />
  
  {/* Contenido */}
  <div className='z-30' />
</div>
```

---

### 3. **Home-v2** - Ajuste de minHeight Precisos

**Cambios:**
- ✅ `PromoBanners`: `minHeight: '120px'` → `'48px'` (altura exacta del componente)
- ✅ `CombosSection`: `minHeight: '400px'` → `'277px'` (altura calculada: 768px / 2.77)
- ✅ Agregado `height: 'auto'` para permitir que el contenido defina la altura final

---

## 📈 Impacto Esperado

| Elemento | CLS Antes | CLS Esperado | Mejora |
|----------|-----------|--------------|--------|
| **CombosSection** | 0.386 | < 0.05 | **-87%** ⚡ |
| **PromoBanners** | 0.088 | < 0.01 | **-89%** ⚡ |
| **Total CLS** | 0.474 | < 0.1 | **-79%** ⚡ |

---

## 🎯 Técnicas Aplicadas

### 1. **Dimensiones Fijas desde el Inicio**
- `minHeight` calculado basado en `aspectRatio` y viewport
- Evita que el contenedor cambie de tamaño cuando las imágenes cargan

### 2. **Skeleton Placeholders**
- Mismo `aspectRatio` que el contenido final
- Ocupa el espacio desde el inicio, evitando layout shift
- Se oculta automáticamente cuando la imagen carga

### 3. **ObjectFit Explícito**
- `objectFit: 'contain'` para CombosSection (mantiene proporción)
- `objectFit: 'cover'` para PromoBanners (llena el espacio)
- Evita cambios de tamaño inesperados

### 4. **Z-Index Correcto**
- Skeleton: `z-0` (fondo)
- Imagen: `z-10` (medio)
- Gradient: `z-20` (overlay)
- Contenido: `z-30` (frente)
- Asegura que las capas se apilen correctamente

---

## 🔍 Cómo Verificar

### 1. **Chrome DevTools - Performance Tab**
1. Abrir DevTools → Performance
2. Grabar una carga de página
3. Verificar que no haya layout shifts en:
   - CombosSection (slide 3)
   - PromoBanners (PINTURA FLASH DAYS)

### 2. **Lighthouse**
```bash
npx lighthouse http://localhost:3000 --view
```
- Verificar que CLS < 0.1
- Revisar "Causantes del cambio de diseño" - deben estar resueltos

### 3. **Visualmente**
- La página no debe "saltar" cuando las imágenes cargan
- Los placeholders deben aparecer inmediatamente
- Las imágenes deben aparecer sin causar movimiento

---

## 📝 Archivos Modificados

1. ✅ `src/components/Home-v2/CombosSection/index.tsx`
   - Agregado skeleton placeholder
   - Agregado `minHeight` y `aspectRatio` fijos
   - Agregado `objectFit` explícito

2. ✅ `src/components/Home-v2/PromoBanners/index.tsx`
   - Agregado skeleton placeholder
   - Agregado `minHeight` fijo
   - Agregado `objectFit` explícito
   - Ajustado z-index de capas

3. ✅ `src/components/Home-v2/index.tsx`
   - Ajustado `minHeight` a valores precisos
   - Agregado `height: 'auto'` para flexibilidad

---

## 🚀 Próximos Pasos

1. **Probar en desarrollo:**
   - Verificar que no haya layout shifts visuales
   - Confirmar que los placeholders aparecen correctamente

2. **Ejecutar Lighthouse:**
   - Verificar que CLS < 0.1
   - Confirmar que los elementos problemáticos están resueltos

3. **Desplegar a producción:**
   - Monitorear métricas reales de usuarios
   - Verificar que CLS se mantiene bajo en diferentes dispositivos

---

## 📚 Referencias

- [Web.dev - Cumulative Layout Shift](https://web.dev/cls/)
- [Next.js - Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)
- [MDN - aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)

---

**Fecha de implementación**: 2025-01-XX
**Impacto esperado**: Reducción del 79% en CLS (0.474 → < 0.1)

