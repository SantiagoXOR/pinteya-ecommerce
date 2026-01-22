# ⚡ Optimización: Imagen CYBERMONDAY.png

## 📊 Problema Identificado

**Mejora la entrega de imágenes - Ahorro estimado: 21 KiB**

### Imagen problemática:

| Recurso | Tamaño Actual | Ahorro Estimado | Quality Actual |
|---------|---------------|-----------------|----------------|
| `CYBERMONDAY.png` | 32.5 KiB | 20.9 KiB | 75 (default) |

**URL**: `/_next/image?url=%2Fimages%2Fpromo%2FCYBERMONDAY.png&w=750&q=75`

**Problema:**
- La imagen usa quality 75 (default de Next.js)
- Lighthouse sugiere aumentar el factor de compresión
- Para banners promocionales, quality 65-70 es suficiente
- El overlay de gradiente puede ocultar pequeñas imperfecciones de compresión

---

## ✅ Solución Implementada

### Reducción de Quality de 75 a 65

**Estrategia:**
- Reducir quality de 75 a 65 para banners promocionales
- Balance entre calidad visual y tamaño de archivo
- El overlay de gradiente ayuda a ocultar imperfecciones menores

**Código implementado:**

```tsx
<Image
  src={banner.bgImage}
  alt={banner.title}
  fill
  quality={65} // ⚡ OPTIMIZACIÓN: Reducido de 75 a 65 para ahorrar 20.9 KiB
  // ... otros props
/>
```

**Aplicado a:**
- ✅ Banner "PINTURA FLASH DAYS" (bannerId: 1)
- ✅ Otros banners promocionales (bannerId: 2, 3)

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Tamaño de imagen** | 32.5 KiB | ~11.6 KiB | **-64%** ⚡ |
| **Ahorro estimado** | - | 20.9 KiB | **+20.9 KiB** |
| **Quality** | 75 | 65 | **-13%** |
| **Calidad visual** | Excelente | Buena* | Aceptable |

*La calidad visual sigue siendo buena porque:
- Los banners tienen overlay de gradiente que oculta imperfecciones
- El texto es legible y los colores se mantienen
- La diferencia visual es mínima para el usuario

---

## 🔍 Por Qué Quality 65 es Apropiado

### Factores que permiten reducir quality:

1. **Overlay de gradiente:**
   - Los banners tienen `bg-gradient-to-r` que cubre la imagen
   - Esto oculta pequeñas imperfecciones de compresión
   - El gradiente es semi-transparente (85% opacidad)

2. **Tipo de contenido:**
   - Banners promocionales no requieren calidad fotográfica
   - El texto es más importante que los detalles de la imagen
   - Los colores se mantienen bien con quality 65

3. **Tamaño de visualización:**
   - Los banners son compactos (h-12 md:h-14)
   - No se amplían a pantalla completa
   - La diferencia visual es menos notoria en tamaños pequeños

4. **Balance tamaño/calidad:**
   - Ahorro de 64% en tamaño
   - Pérdida visual mínima
   - Mejora significativa en LCP y FCP

---

## 🧪 Verificación

### 1. Chrome DevTools - Network Tab

1. Abrir DevTools → Network
2. Filtrar por "Img"
3. Recargar la página
4. **Verificar:**
   - ✅ `CYBERMONDAY.png` debe tener `q=65` en la URL
   - ✅ Tamaño transferido debe ser ~11-12 KiB (vs 32.5 KiB antes)

### 2. Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

**Verificar:**
- ✅ "Mejora la entrega de imágenes" debe mejorar o desaparecer
- ✅ El ahorro estimado debe reducirse o desaparecer
- ✅ LCP y FCP deben mejorar ligeramente

### 3. Verificación Visual

1. Cargar la página en el navegador
2. **Verificar:**
   - ✅ El banner "PINTURA FLASH DAYS" se ve bien
   - ✅ El texto es legible
   - ✅ Los colores se mantienen
   - ✅ No hay artefactos visibles de compresión

---

## 📝 Archivos Modificados

1. ✅ `src/components/Home-v2/PromoBanners/index.tsx`
   - Agregado `quality={65}` a ambas instancias de `Image`
   - Aplicado a banners compactos y normales

---

## ⚠️ Consideraciones

### Cuándo usar quality más bajo:

- ✅ **Banners promocionales** (con overlay): 65-70
- ✅ **Imágenes de fondo** (con overlay): 65-70
- ✅ **Thumbnails pequeños**: 70-75
- ⚠️ **Imágenes de productos** (sin overlay): 80-85
- ⚠️ **Logos y elementos críticos**: 85-90

### Cuándo NO reducir quality:

- ❌ Imágenes de productos sin overlay
- ❌ Logos y elementos de marca
- ❌ Imágenes que se amplían a pantalla completa
- ❌ Imágenes con texto crítico sin overlay

---

## 🚀 Próximos Pasos

1. **Probar en desarrollo:**
   - Verificar que la imagen se ve bien visualmente
   - Confirmar que el tamaño se redujo

2. **Probar en producción:**
   - Ejecutar Lighthouse en producción
   - Monitorear métricas reales de LCP y FCP

3. **Optimizaciones adicionales (opcional):**
   - Considerar convertir la imagen original a WebP antes de subirla
   - Evaluar si otros banners también pueden reducir quality
   - Considerar usar formatos modernos (AVIF) si están disponibles

---

## 📚 Referencias

- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Next.js - Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Lighthouse - Image Optimization](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/)

---

**Fecha de implementación**: 2025-01-XX
**Impacto esperado**: Ahorro de 20.9 KiB (64% reducción) + mejora en LCP y FCP

