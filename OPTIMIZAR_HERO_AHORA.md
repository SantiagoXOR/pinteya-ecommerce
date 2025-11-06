# 🚨 OPTIMIZAR IMÁGENES HERO - GUÍA URGENTE

## 🎯 Problema Identificado

Las imágenes hero están sin optimizar:

- ❌ hero-01.png: **5.0 MB**
- ❌ hero-02.png: **4.5 MB**
- ❌ hero-03.png: **5.3 MB**
- ❌ hero-04.png: **4.9 MB**

**Total: ~20 MB** causando LCP de 3.56 segundos

---

## ✅ Objetivo

- ✓ hero-01.webp: **~100-150 KB** (97% reducción)
- ✓ hero-02.webp: **~100-150 KB**
- ✓ hero-03.webp: **~100-150 KB**
- ✓ hero-04.webp: **~100-150 KB**

**Resultado esperado:** LCP de ~3.5s → **~0.8-1.2s**

---

## 🚀 OPCIÓN A: Squoosh (Recomendado, Más Fácil)

### Paso 1: Abrir Squoosh
1. Ir a **https://squoosh.app**
2. Dejar la página abierta

### Paso 2: Optimizar cada imagen

**Para hero-01.png:**
1. Arrastrar `public/images/hero/hero-01.png` a Squoosh
2. En el panel derecho, seleccionar **WebP**
3. Ajustar **Quality: 82**
4. Verificar que el tamaño sea ~100-150KB
5. Click **Download**
6. Renombrar descarga a `hero-01.webp`
7. Mover a `public/images/hero/`

**Repetir para hero-02.png, hero-03.png, hero-04.png**

**Tiempo estimado:** 10-15 minutos

---

## 🚀 OPCIÓN B: Sharp-CLI (Automatizado, Más Rápido)

### Paso 1: Instalar Sharp
```bash
npm install -g sharp-cli
```

### Paso 2: Navegar al directorio
```bash
cd "C:\Users\marti\Desktop\DESARROLLOSW\BOILERPLATTE E-COMMERCE\public\images\hero"
```

### Paso 3: Convertir todas las imágenes
```bash
sharp -i hero-01.png -o hero-01.webp --webp '{"quality":82,"effort":6}'
sharp -i hero-02.png -o hero-02.webp --webp '{"quality":82,"effort":6}'
sharp -i hero-03.png -o hero-03.webp --webp '{"quality":82,"effort":6}'
sharp -i hero-04.png -o hero-04.webp --webp '{"quality":82,"effort":6}'
```

**Tiempo estimado:** 5 minutos

---

## 📝 Paso 3: Actualizar el Código

Editar `src/components/Home-v2/Hero/index.tsx`:

```typescript
// ANTES:
const heroImagesMobile = [
  {
    src: '/images/hero/hero-01.png',  // ❌
    // ...
  },
]

// DESPUÉS:
const heroImagesMobile = [
  {
    src: '/images/hero/hero-01.webp',  // ✅
    // ...
  },
]
```

**Cambiar todas las referencias de `.png` a `.webp`:**
- hero-01.png → hero-01.webp
- hero-02.png → hero-02.webp
- hero-03.png → hero-03.webp
- hero-04.png → hero-04.webp

---

## 🚀 Paso 4: Deploy

```bash
# Volver a la raíz del proyecto
cd "C:\Users\marti\Desktop\DESARROLLOSW\BOILERPLATTE E-COMMERCE"

# Commit y push
git add .
git commit -m "fix(performance): optimizar imágenes hero de 20MB a ~500KB"
git push
```

---

## 📊 Verificar Mejoras

### Inmediato (en 5 minutos):
```bash
# Build local
npm run build
npm run start

# Abrir http://localhost:3000
# Chrome DevTools → Lighthouse → Generate Report
```

**Objetivo:** LCP < 2.0s

### En producción (24-48h):
- Vercel Speed Insights debe mostrar LCP < 2.5s
- Real Experience Score debe subir a 85-90

---

## ⚡ HAZLO AHORA - Checklist Rápido

```
[ ] Abrir Squoosh.app (o instalar sharp-cli)
[ ] Convertir hero-01.png → hero-01.webp
[ ] Convertir hero-02.png → hero-02.webp
[ ] Convertir hero-03.png → hero-03.webp
[ ] Convertir hero-04.png → hero-04.webp
[ ] Verificar tamaños (cada uno ~100-150KB)
[ ] Actualizar Hero/index.tsx (cambiar .png a .webp)
[ ] git commit y push
[ ] Esperar deploy en Vercel
[ ] Verificar con Lighthouse
```

**Tiempo total:** 20-30 minutos
**Mejora esperada:** LCP -50% (de 3.5s a ~1.5-2.0s)

---

## 🎯 ESTO ES LO MÁS IMPORTANTE

Esta única optimización va a mejorar:
- ✅ LCP de 3.56s → ~1.5-2.0s
- ✅ FCP de 3.56s → ~1.8-2.2s  
- ✅ Real Experience Score de 65 → ~80-85

**¡Es el 80% de la solución!**

---

## 💡 Tip Pro

Si Squoosh muestra un tamaño > 200KB después de convertir:
- Bajar Quality a 75-78
- Verificar que esté en formato WebP, no AVIF
- El objetivo es ~100-150KB por imagen

---

## 📞 ¿Problemas?

**Error: "sharp-cli no reconocido"**
```bash
# Usar npx en lugar de sharp directamente
npx sharp-cli -i hero-01.png -o hero-01.webp --webp
```

**Error: "No se puede abrir Squoosh"**
- Usar otro navegador
- O descargar ImageMagick
- O usar la opción sharp-cli

**¿No sabes cómo editar el archivo?**
1. Abrir VSCode
2. Buscar "hero-01.png" (Ctrl+Shift+F)
3. Reemplazar todo con "hero-01.webp"
4. Repetir para hero-02, 03, 04

---

**¡HAZLO AHORA! Es la optimización más importante. 20 minutos de trabajo = 50% mejora en performance.** 🚀










