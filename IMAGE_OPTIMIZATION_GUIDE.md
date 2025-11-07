# Guía de Optimización de Imágenes

## 📊 Análisis de Imágenes Actual

Para analizar qué imágenes necesitan optimización:

```bash
npm run optimize:images
```

Este comando generará un reporte detallado mostrando:
- Total de imágenes y tamaño
- Imágenes prioritarias (hero, products, categories, logo)
- Top 10 imágenes más grandes
- Imágenes sin versión WebP

## 🎯 Prioridades de Optimización

### 1. Imágenes Hero (Mayor Impacto en LCP)
Directorio: `/public/images/hero/`

Estas imágenes aparecen en la parte superior de la página (above-the-fold) y afectan directamente el LCP (Largest Contentful Paint).

**Acción requerida:**
- Convertir a WebP/AVIF
- Reducir tamaño a máximo 200KB por imagen
- Implementar responsive images con `srcset`

### 2. Imágenes de Productos
Directorio: `/public/images/products/`

Las imágenes de productos se cargan en múltiples páginas y tienen alto impacto en el peso total.

**Acción requerida:**
- Convertir a WebP
- Mantener calidad 80-85%
- Crear versiones thumbnail (256px) y full (1024px)
- Implementar lazy loading

### 3. Categorías
Directorio: `/public/images/categories/`

**Acción requerida:**
- Convertir a WebP
- Tamaño máximo 100KB por imagen
- Lazy loading en carrusel

### 4. Logos y Marcas
Directorio: `/public/images/logo/` y `/public/images/marks/`

**Acción requerida:**
- Preferir SVG cuando sea posible
- Si son PNG, optimizar con TinyPNG o similar
- Considerar convertir a WebP solo si son fotos (no logos con transparencia)

## 🛠️ Herramientas de Optimización

### Opción 1: Squoosh (Recomendado para principiantes)

**Ventajas:**
- Interfaz visual
- Comparación lado a lado
- Control granular de calidad
- Gratis y sin instalación

**Uso:**
1. Ve a [squoosh.app](https://squoosh.app)
2. Arrastra tu imagen
3. Selecciona WebP en la derecha
4. Ajusta calidad (recomendado: 80-85)
5. Descarga la imagen optimizada

### Opción 2: Sharp CLI (Para conversión masiva)

**Instalación:**
```bash
npm install -g sharp-cli
```

**Conversión individual:**
```bash
sharp -i input.jpg -o output.webp --webp '{"quality":85}'
```

**Conversión masiva (Bash):**
```bash
cd public/images/hero

# Convertir todas las JPG/PNG a WebP
for file in *.{jpg,jpeg,png}; do
  if [ -f "$file" ]; then
    sharp -i "$file" -o "${file%.*}.webp" --webp '{"quality":85}'
  fi
done
```

**Conversión masiva (PowerShell - Windows):**
```powershell
cd public\images\hero

# Convertir todas las JPG/PNG a WebP
Get-ChildItem -Include *.jpg,*.jpeg,*.png -Recurse | ForEach-Object {
  $outputPath = $_.FullName -replace '\.(jpg|jpeg|png)$', '.webp'
  npx sharp-cli -i $_.FullName -o $outputPath --webp
}
```

### Opción 3: ImageMagick (Avanzado)

**Instalación:**
- Windows: Descargar de [imagemagick.org](https://imagemagick.org)
- Mac: `brew install imagemagick`
- Linux: `apt-get install imagemagick`

**Conversión:**
```bash
# WebP con calidad 85
convert input.jpg -quality 85 output.webp

# AVIF con calidad 80
convert input.jpg -quality 80 output.avif

# Redimensionar y convertir
convert input.jpg -resize 1024x1024\> -quality 85 output.webp
```

## 📝 Implementación en Next.js

### Usando next/image (Recomendado)

```jsx
import Image from 'next/image'

// Con imágenes locales
<Image
  src="/images/hero/banner-1.webp"
  alt="Banner principal"
  width={1920}
  height={1080}
  priority // Solo para imágenes above-the-fold
  placeholder="blur"
  blurDataURL="data:image/webp;base64,..."
/>

// Con lazy loading (below-the-fold)
<Image
  src="/images/products/producto-1.webp"
  alt="Producto 1"
  width={500}
  height={500}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Implementar picture element para fallback

```jsx
<picture>
  <source srcSet="/images/hero/banner-1.avif" type="image/avif" />
  <source srcSet="/images/hero/banner-1.webp" type="image/webp" />
  <img src="/images/hero/banner-1.jpg" alt="Banner" />
</picture>
```

## 🎨 Optimización por Tipo de Imagen

### Fotografías (productos, hero)
- **Formato:** WebP o AVIF
- **Calidad:** 80-85%
- **Compresión:** Lossy
- **Tamaño objetivo:** < 200KB para hero, < 100KB para productos

### Gráficos e ilustraciones
- **Formato:** SVG (si es vectorial)
- **Alternativa:** WebP con calidad 90%
- **PNG solo si necesitas transparencia y no puedes usar WebP**

### Logos y iconos
- **Formato preferido:** SVG
- **Alternativa:** PNG optimizado con TinyPNG
- **Evitar:** JPG (no tiene transparencia)

### Screenshots y capturas
- **Formato:** WebP con calidad 75-80%
- **Considerar:** Reducir resolución si no se necesita ver detalles

## 📊 Métricas de Éxito

### Antes de optimizar
Ejecuta el análisis:
```bash
npm run optimize:images
```

Anota:
- Tamaño total del directorio `/public/images/`
- Top 10 imágenes más pesadas
- LCP actual en PageSpeed Insights

### Después de optimizar
- **Reducción de tamaño:** Objetivo 50-70%
- **LCP:** Mejora de 30-50%
- **Formato:** 100% de imágenes críticas en WebP/AVIF

## ⚡ Quick Wins (Impacto Inmediato)

1. **Optimiza las 5 imágenes más grandes:**
   ```bash
   npm run optimize:images
   # Ver top 10 en el reporte
   # Optimizar las 5 primeras manualmente con Squoosh
   ```

2. **Convierte imágenes hero:**
   ```bash
   cd public/images/hero
   # Convertir todas a WebP manualmente o con sharp
   ```

3. **Añade lazy loading:**
   - Buscar todas las etiquetas `<img>` sin `loading="lazy"`
   - Buscar componentes `Image` sin `priority` above-the-fold
   - Agregar `loading="lazy"` a imágenes below-the-fold

## 🔧 Automatización (Futuro)

Para automatizar este proceso en el futuro:

1. **Pre-commit hook:**
   ```bash
   # En .husky/pre-commit
   npm run optimize:images -- --check
   ```

2. **CI/CD:**
   - Añadir verificación de tamaño de imágenes en GitHub Actions
   - Rechazar commits con imágenes > 500KB

3. **Build-time optimization:**
   - next-optimized-images
   - Sharp automático en build

## 📚 Recursos

- [Squoosh](https://squoosh.app) - Optimizador visual
- [TinyPNG](https://tinypng.com) - Compresor PNG/JPG
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - Optimizador SVG
- [WebP Converter](https://developers.google.com/speed/webp) - Herramientas oficiales
- [Image CDN](https://vercel.com/docs/image-optimization) - Optimización automática Vercel

## 🎯 Plan de Acción Recomendado

### Semana 1: Imágenes Críticas
- [ ] Ejecutar `npm run optimize:images`
- [ ] Optimizar top 10 imágenes más grandes
- [ ] Convertir todas las imágenes hero a WebP
- [ ] Implementar lazy loading en productos

### Semana 2: Categorías y Productos
- [ ] Convertir imágenes de categorías a WebP
- [ ] Optimizar imágenes de productos (top 20)
- [ ] Crear versiones thumbnail

### Semana 3: Resto de imágenes
- [ ] Optimizar logos y marcas
- [ ] Convertir imágenes restantes
- [ ] Implementar picture element para fallback

### Semana 4: Verificación
- [ ] Re-ejecutar análisis
- [ ] Comparar métricas antes/después
- [ ] Ajustar configuración según resultados














