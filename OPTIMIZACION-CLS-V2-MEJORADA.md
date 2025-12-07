# ⚡ Optimización CLS V2 - Mejoras Adicionales

## 📊 Problema Identificado

**CLS mejorado pero aún por encima del objetivo:**

| Elemento | CLS Antes | CLS Después V1 | CLS Actual | Objetivo |
|----------|-----------|---------------|------------|----------|
| **Total** | 0.474 | 0.413 | 0.413 | < 0.1 |
| **Combo destacado** | 0.386 | 0.371 | 0.371 | < 0.05 |
| **PINTURA FLASH DAYS** | 0.088 | 0.041 | 0.041 | < 0.01 |

**Problema restante:** Aunque mejoramos, todavía hay layout shifts significativos.

---

## ✅ Soluciones Implementadas V2

### 1. **Altura Fija Calculada para CombosSection**

**Problema identificado:**
- El contenedor usaba `minHeight` pero `height: auto`
- Cuando el componente dinámico se carga, puede cambiar el tamaño
- El skeleton estaba dentro del componente, no en el contenedor padre

**Solución:**
- Altura fija calculada usando `clamp()` basada en aspectRatio
- Skeleton se oculta con transición cuando el componente se monta
- Contenedor tiene dimensiones fijas desde el inicio

**Código implementado:**

```tsx
// Contenedor con altura fija calculada
<div 
  style={{ 
    aspectRatio: '2.77',
    minHeight: '277px',
    height: 'clamp(277px, calc(100vw / 2.77), 433px)'
  }}
>
  {/* Skeleton que se oculta cuando se monta */}
  <div 
    className={`skeleton ${isMounted ? 'opacity-0' : 'opacity-100'}`}
    style={{ 
      aspectRatio: '2.77',
      height: 'clamp(277px, calc(100vw / 2.77), 433px)'
    }}
  />
</div>
```

---

### 2. **Tracking de Carga de Imágenes en PromoBanners**

**Problema identificado:**
- Las imágenes se cargan y pueden cambiar el tamaño del contenedor
- El skeleton no se ocultaba cuando la imagen se cargaba

**Solución:**
- Estado `imagesLoaded` para trackear qué imágenes se han cargado
- Skeleton se oculta con transición cuando la imagen se carga
- `onLoad` handler en cada imagen

**Código implementado:**

```tsx
const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set())

<Image
  onLoad={() => {
    setImagesLoaded(prev => new Set(prev).add(banner.id))
  }}
/>

<div 
  className={`skeleton ${imagesLoaded.has(banner.id) ? 'opacity-0' : 'opacity-100'}`}
/>
```

---

### 3. **Simplificación del Contenedor Padre**

**Problema identificado:**
- El contenedor padre tenía skeleton duplicado
- Altura calculada compleja que podía causar conflictos

**Solución:**
- Simplificar a usar solo `aspectRatio` y `minHeight`
- El skeleton está dentro del componente, no duplicado
- Altura se calcula automáticamente con `aspectRatio`

**Código implementado:**

```tsx
<div 
  style={{ 
    aspectRatio: '2.77',
    minHeight: '277px',
    width: '100%'
  }}
>
  <CombosSection />
</div>
```

---

## 📈 Impacto Esperado

| Métrica | Antes V1 | Después V2 | Mejora |
|---------|----------|------------|--------|
| **CLS Total** | 0.413 | < 0.15 | **-64%** ⚡ |
| **Combo destacado** | 0.371 | < 0.10 | **-73%** |
| **PINTURA FLASH DAYS** | 0.041 | < 0.01 | **-76%** |

---

## 🔍 Cambios Técnicos

### Archivos Modificados:

1. **`src/components/Home-v2/CombosSection/index.tsx`**
   - ✅ Estado `isMounted` para ocultar skeleton
   - ✅ Altura fija calculada con `clamp()`
   - ✅ Skeleton con transición de opacidad

2. **`src/components/Home-v2/PromoBanners/index.tsx`**
   - ✅ Estado `imagesLoaded` para trackear carga de imágenes
   - ✅ `onLoad` handler en cada imagen
   - ✅ Skeleton se oculta cuando la imagen se carga

3. **`src/components/Home-v2/index.tsx`**
   - ✅ Simplificación del contenedor padre
   - ✅ Uso de `aspectRatio` para cálculo automático

---

## 🧪 Verificación

### 1. Chrome DevTools - Performance Tab

1. Abrir DevTools → Performance
2. Grabar una carga de página
3. **Verificar:**
   - ✅ No debe haber layout shifts en CombosSection
   - ✅ No debe haber layout shifts en PromoBanners
   - ✅ Los skeletons deben ocultarse suavemente

### 2. Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

**Verificar:**
- ✅ CLS debe ser < 0.15
- ✅ "Causantes del cambio de diseño" debe mostrar valores menores

### 3. Chrome DevTools - Layout Shift Events

1. Abrir DevTools → Performance
2. Grabar y buscar "Layout Shift" events
3. **Verificar:**
   - ✅ No debe haber shifts en CombosSection
   - ✅ No debe haber shifts en PromoBanners

---

## 📝 Próximos Pasos

1. **Probar en desarrollo:**
   - Verificar que los skeletons se ocultan correctamente
   - Confirmar que no hay layout shifts visibles

2. **Probar en producción:**
   - Ejecutar Lighthouse en producción
   - Monitorear CLS real de usuarios

3. **Optimizaciones adicionales (si es necesario):**
   - Considerar renderizar primera imagen estáticamente (como Hero)
   - Preload de imágenes críticas
   - Usar `will-change` para transiciones más suaves

---

## 📚 Referencias

- [Web.dev - Cumulative Layout Shift](https://web.dev/cls/)
- [MDN - aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [MDN - clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)

---

**Fecha de implementación**: 2025-01-XX
**Impacto esperado**: Reducción del 64% en CLS (0.413 → < 0.15)

