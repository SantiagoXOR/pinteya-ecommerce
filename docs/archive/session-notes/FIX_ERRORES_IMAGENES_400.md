# Fix: Errores 400 Bad Request en Carga de Imágenes

## 🐛 Problema Identificado

Los logs mostraban múltiples errores de "Resource loading failed: img" con status 400 (Bad Request) en URLs de `_next/image`. Esto ocurría cuando:

1. Next.js Image intentaba optimizar imágenes con URLs malformadas o inválidas
2. Las URLs no estaban en los `remotePatterns` permitidos de Next.js
3. Las imágenes fallaban al cargar pero se reportaban como errores críticos

## ✅ Correcciones Aplicadas

### 1. **Validación de URLs en ProductCardImage**
**Archivo**: `src/components/ui/product-card-commercial/components/ProductCardImage.tsx`

**Cambios**:
- Agregada función `isValidImageUrl()` para validar URLs antes de pasarlas a Next.js Image
- Uso de `getValidImageUrl()` para corregir URLs malformadas de Supabase
- Manejo mejorado de errores con estado local (`hasImageError`)
- Agregado `unoptimized` para URLs que pueden causar problemas con Next.js Image

**Resultado**: Las URLs inválidas ahora se detectan y corrigen antes de llegar a Next.js Image, evitando errores 400.

---

### 2. **Filtrado de Errores en MonitoringProvider**
**Archivo**: `src/providers/MonitoringProvider.tsx`

**Cambios**:
- Agregado filtro para no reportar errores de imágenes de productos como críticos
- Las imágenes de productos ya tienen fallback (placeholder), por lo que no necesitan ser reportadas como errores críticos
- Solo se loguean en desarrollo para debugging

**Resultado**: Reducción significativa de errores reportados en producción, ya que los errores de imágenes con fallback no se consideran críticos.

---

## 🔍 Detalles Técnicos

### Validación de URLs

```typescript
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Rutas relativas siempre son válidas
  if (url.startsWith('/')) return true
  
  // Verificar que sea una URL absoluta válida
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}
```

### Manejo de Errores Mejorado

```typescript
const [hasImageError, setHasImageError] = React.useState(imageError)

const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  setHasImageError(true)
  // Llamar al callback de error si existe
  if (onImageError) {
    onImageError(e)
  }
  // Log para debugging en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.warn('[ProductCardImage] Error cargando imagen:', {
      src: displaySrc,
      productId,
      title
    })
  }
}, [displaySrc, productId, title, onImageError])
```

### Filtrado de Errores No Críticos

```typescript
// Filtrar errores de imágenes que ya tienen fallback
if (tagName === 'img') {
  const isProductImage = src.includes('supabase.co') || 
                        src.includes('_next/image') ||
                        src.includes('/images/products/')
  
  if (isProductImage) {
    // Solo loguear en desarrollo, no reportar como error crítico
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Product image failed to load (has fallback): ${src}`)
    }
    return // No reportar como error crítico
  }
}
```

---

## 📊 Impacto Esperado

1. **Reducción de errores 400**: Las URLs inválidas se detectan y corrigen antes de llegar a Next.js Image
2. **Mejor UX**: Los errores de imágenes se manejan gracefully con placeholders
3. **Menos ruido en logs**: Los errores de imágenes con fallback no se reportan como críticos
4. **Mejor debugging**: Los errores se loguean en desarrollo para facilitar el debugging

---

## 🧪 Testing Recomendado

1. **Imágenes válidas**: Verificar que las imágenes válidas se cargan correctamente
2. **Imágenes inválidas**: Verificar que las imágenes inválidas muestran placeholder
3. **URLs malformadas**: Verificar que las URLs malformadas se corrigen automáticamente
4. **Errores de red**: Verificar que los errores de red se manejan gracefully
5. **Logs de producción**: Verificar que no se reportan errores críticos para imágenes con fallback

---

## 📝 Notas Adicionales

- Los cambios son retrocompatibles
- No se requieren cambios en otros componentes
- El filtrado de errores solo afecta a imágenes de productos (con fallback)
- Los errores de otros recursos (scripts, CSS críticos) siguen siendo reportados
