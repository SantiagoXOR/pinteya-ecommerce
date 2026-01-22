# 🔍 Guía de Verificación - Optimización LCP en Desarrollo

## ✅ Servidor de Desarrollo

El servidor está corriendo en: **http://localhost:3000**

---

## 🧪 Pasos para Verificar las Optimizaciones

### 1. **Verificar que la Imagen Estática se Renderiza Inmediatamente**

#### A. Abrir Chrome DevTools
1. Abre **http://localhost:3000** en Chrome
2. Presiona `F12` o `Ctrl+Shift+I` para abrir DevTools
3. Ve a la pestaña **Network**

#### B. Verificar Carga Inmediata de la Imagen
1. **Recarga la página** con `Ctrl+R` (o `Cmd+R` en Mac)
2. En la pestaña Network, filtra por **"Img"**
3. Busca `hero1.webp` en la lista
4. **Verifica:**
   - ✅ La imagen debe aparecer **inmediatamente** (no espera JavaScript)
   - ✅ La columna **Priority** debe mostrar **"High"**
   - ✅ El **Start Time** debe ser muy temprano (< 100ms desde el inicio)

#### C. Verificar en el HTML
1. Ve a la pestaña **Elements** (o **Inspeccionar elemento**)
2. Busca `hero1.webp` en el HTML
3. **Verifica:**
   - ✅ La imagen debe estar en el HTML inicial (no generada por JavaScript)
   - ✅ Debe tener `fetchpriority="high"`
   - ✅ Debe tener `priority` en el componente Image

---

### 2. **Verificar el Preload en el Head**

1. En la pestaña **Elements**, expande el `<head>`
2. Busca el `<link rel="preload">` para `hero1.webp`
3. **Verifica:**
   - ✅ Debe estar **justo después del CSS crítico**
   - ✅ Debe tener `fetchPriority="high"`
   - ✅ Debe tener `type="image/webp"`

---

### 3. **Verificar Performance con Performance Tab**

#### A. Grabar una Carga de Página
1. Ve a la pestaña **Performance**
2. Haz clic en el botón **Record** (círculo rojo)
3. Recarga la página con `Ctrl+R`
4. Espera a que la página cargue completamente
5. Haz clic en **Stop** para detener la grabación

#### B. Analizar el Timeline
1. En el timeline, busca la línea de `hero1.webp`
2. **Verifica:**
   - ✅ La imagen debe comenzar a cargarse **inmediatamente** (sin retraso)
   - ✅ No debe haber un gap grande antes de que comience la carga
   - ✅ El **Resource Load Delay** debe ser < 200ms (antes era 2,270ms)

#### C. Verificar LCP
1. En el timeline, busca el marcador **LCP** (Largest Contentful Paint)
2. Haz clic en el marcador para ver los detalles
3. **Verifica:**
   - ✅ El elemento LCP debe ser `hero1.webp`
   - ✅ El tiempo de LCP debe ser < 500ms (objetivo)
   - ✅ El **Resource Load Delay** debe ser < 200ms

---

### 4. **Verificar que el Carousel se Carga Después**

1. En la pestaña **Network**, filtra por **"JS"**
2. Busca archivos relacionados con `HeroCarousel` o `swiper`
3. **Verifica:**
   - ✅ Estos archivos deben cargarse **después** de `hero1.webp`
   - ✅ No deben bloquear la carga de la imagen hero

---

### 5. **Verificar Transición del Carousel**

1. En la página, observa el hero
2. **Verifica:**
   - ✅ La imagen hero debe aparecer **inmediatamente**
   - ✅ Después de ~100-200ms, el carousel debe aparecer con una transición suave
   - ✅ No debe haber layout shift cuando el carousel aparece

---

## 📊 Métricas Esperadas

### Antes de la Optimización:
- **Retraso en carga de recursos**: 2,270 ms 🔴
- **LCP Total**: ~2,600 ms 🔴

### Después de la Optimización:
- **Retraso en carga de recursos**: < 200 ms ✅
- **LCP Total**: < 500 ms ✅

---

## 🐛 Troubleshooting

### Si la imagen no se carga inmediatamente:

1. **Verifica que el componente Hero esté usando la versión optimizada:**
   - Abre `src/components/Home-v2/Hero/index.tsx`
   - Verifica que tenga `HeroImageStatic` y `dynamic(() => import(...))`

2. **Verifica el preload en layout.tsx:**
   - Abre `src/app/layout.tsx`
   - Verifica que el preload esté justo después del CSS crítico

3. **Limpia la caché:**
   - En DevTools, haz clic derecho en el botón de recarga
   - Selecciona **"Empty Cache and Hard Reload"**

### Si el carousel no aparece:

1. **Verifica la consola:**
   - Ve a la pestaña **Console**
   - Busca errores relacionados con `HeroCarousel` o `swiper`

2. **Verifica que el componente se monte:**
   - En la consola, escribe: `document.querySelector('.hero-carousel')`
   - Debe retornar un elemento después de ~100ms

---

## 🎯 Checklist de Verificación

- [ ] La imagen `hero1.webp` se carga inmediatamente (< 100ms desde inicio)
- [ ] El preload está en el `<head>` con `fetchPriority="high"`
- [ ] La imagen está en el HTML inicial (no generada por JS)
- [ ] El Resource Load Delay es < 200ms
- [ ] El LCP es < 500ms
- [ ] El carousel se carga después de la imagen hero
- [ ] La transición del carousel es suave (sin layout shift)
- [ ] No hay errores en la consola

---

## 📸 Screenshots de Referencia

### Network Tab - Imagen Hero
```
Name: hero1.webp
Type: img
Priority: High
Start Time: ~50ms
Duration: ~170ms
```

### Performance Tab - Timeline
```
[0ms] HTML Parse
[50ms] hero1.webp Start Loading
[220ms] hero1.webp Finish Loading
[250ms] LCP (hero1.webp)
[350ms] HeroCarousel JS Start Loading
```

---

## 🚀 Próximos Pasos

Una vez verificado en desarrollo:

1. **Ejecutar Lighthouse:**
   ```bash
   npx lighthouse http://localhost:3000 --view
   ```

2. **Verificar métricas:**
   - LCP < 2.5s
   - Retraso en carga de recursos < 200ms

3. **Desplegar a producción** y monitorear métricas reales

---

**Fecha de creación**: 2025-01-XX
**Última actualización**: 2025-01-XX

