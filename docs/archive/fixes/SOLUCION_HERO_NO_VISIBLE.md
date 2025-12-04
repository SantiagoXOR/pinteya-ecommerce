# 🔧 Solución: Hero Nuevo No Visible en Local

## 🎯 Problema

Los nuevos componentes del hero (con SVG y layout responsive) no se ven en `localhost:3000`.

## ✅ Soluciones (en orden de probabilidad)

### 1. 🔥 Cache del Navegador (MÁS PROBABLE)

El navegador está mostrando la versión cacheada del hero antiguo.

**Solución rápida:**

1. **Presiona** `Ctrl + Shift + R` (Hard Reload)
2. **O** `Ctrl + F5`
3. **O** abre **DevTools** (`F12`) → click derecho en el botón de refresh → **"Empty Cache and Hard Reload"**

**Solución definitiva:**

```
1. Presiona Ctrl + Shift + Delete
2. Selecciona "Imágenes y archivos en caché"
3. Click "Borrar datos"
4. Presiona F5
```

---

### 2. 🌐 Navegador en Incógnito

Abre una **ventana de incógnito** para evitar cache:

```
Ctrl + Shift + N (Chrome/Edge)
```

Luego ve a: `http://localhost:3000`

---

### 3. 🔄 Reiniciar Servidor Completamente

En PowerShell:

```powershell
# 1. Detener procesos Node
Get-Process -Name "node" | Stop-Process -Force

# 2. Limpiar .next
Remove-Item -Recurse -Force .next

# 3. Esperar
Start-Sleep -Seconds 2

# 4. Reiniciar
npm run dev
```

Espera a ver:
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

---

### 4. 🐛 Verificar Errores en DevTools

1. Abre DevTools (`F12`)
2. Ve a la pestaña **Console**
3. Busca errores rojos

**Errores comunes:**

**❌ Error de importación:**
```
Module not found: Can't resolve '@/components/Home/Hero/HeroSlide'
```

**Solución:** Verifica que existe `src/components/Home/Hero/HeroSlide.tsx`

**❌ Error de SVG:**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
/images/hero/hero2/hero1.svg
```

**Solución:** Verifica que existan los SVG en `public/images/hero/hero2/`

**❌ Error de tipos:**
```
Property 'slides' does not exist on type 'HeroCarouselProps'
```

**Solución:** El componente HeroCarousel.tsx no se actualizó correctamente

---

### 5. 📱 Verificar URL Correcta

Asegúrate de estar en:
```
http://localhost:3000
```

**NO** en:
```
http://localhost:3000/home-v0
http://localhost:3000/home-v2
```

La página principal (`/`) es la que usa el hero actualizado.

---

### 6. 🔍 Verificar Componente en DevTools

1. Abre DevTools (`F12`)
2. Ve a **Elements** o **Inspector**
3. Busca en el DOM:
   - `<section class="relative overflow-hidden w-full">`
   - Dentro debería haber `<div class="hero-carousel">`
   - Y dentro `<div class="swiper">`

Si ves esto pero sin contenido visual, es un problema de CSS/estilos.

---

### 7. 🎨 Verificar Estilos CSS

Abre DevTools → **Sources** → busca:
```
hero-carousel.css
```

Verifica que tenga los estilos nuevos:
```css
.hero-carousel {
  min-height: 400px;
}
```

Si tiene los estilos antiguos (`.mobile-carousel`), el CSS no se actualizó.

**Solución:**
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

### 8. 🔄 Lazy Loading Cacheado

El componente `HeroCarousel.lazy.tsx` puede estar sirviendo la versión antigua.

**Verificación temporal:**

Edita `src/components/Home/Hero/index.tsx`:

```typescript
// Comentar esta línea:
// import HeroCarousel from '@/components/Common/HeroCarousel.lazy'

// Usar importación directa:
import HeroCarousel from '@/components/Common/HeroCarousel'
```

Guarda y verifica si aparece el hero.

Si funciona, el problema era el lazy loading. Puedes volver a habilitarlo después.

---

### 9. 🚨 Verificar Errores Específicos del Hero

En la **consola de DevTools**, busca errores que contengan:
- `HeroSlide`
- `HeroBadge`
- `hero1.svg`
- `hero2.svg`
- `hero3.svg`

Copia el error exacto para diagnóstico.

---

### 10. 📸 Inspeccionar Network Tab

1. DevTools → **Network**
2. Recarga la página (`Ctrl + Shift + R`)
3. Busca:
   - `hero1.svg` - Debería estar con status `200`
   - `hero2.svg` - Debería estar con status `200`
   - `hero3.svg` - Debería estar con status `200`

Si ves `404 Not Found`, los archivos SVG no están en el lugar correcto.

Si ves `400 Bad Request`, hay un problema con Next.js manejando SVG.

---

## 🆘 Debug Paso a Paso

### Paso 1: Verifica que el servidor esté corriendo

En la terminal deberías ver:
```
▲ Next.js 15.5.3
- Local: http://localhost:3000
✓ Ready in X.Xs
```

### Paso 2: Abre en navegador

```
http://localhost:3000
```

### Paso 3: Hard Reload

```
Ctrl + Shift + R
```

### Paso 4: Abre DevTools Console

```
F12 → Console tab
```

¿Qué errores ves? (cópialos aquí)

### Paso 5: Verifica Network

```
F12 → Network tab → Recarga (Ctrl + R)
```

Busca `hero1.svg`, `hero2.svg`, `hero3.svg` en la lista.

¿Cuál es el status code? (200 = OK, 404 = No encontrado, 400 = Error)

---

## 🎯 Qué Deberías Ver

### En Desktop:

```
┌─────────────────────────────────────────────┐
│                                             │
│  Pintá rápido,          [Imagen SVG]       │
│  fácil y cotiza         con personajes     │
│  al instante!           y productos        │
│                                             │
│  [30% OFF] [Envío]                         │
│  [Llega hoy]                               │
│                                             │
│  [Ver Todos los Productos →]               │
│                                             │
└─────────────────────────────────────────────┘
```

### En Mobile:

```
┌──────────────────────┐
│                      │
│  Pintá rápido,      │
│  fácil y cotiza     │
│  al instante!       │
│                      │
│ [30%] [Envío] [Hoy] │
│                      │
│  ┌────────────────┐ │
│  │  Imagen SVG    │ │
│  └────────────────┘ │
│                      │
│ [Ver Productos →]   │
│                      │
└──────────────────────┘
```

---

## 📝 Información Necesaria para Debug

Si nada de lo anterior funciona, necesito que me compartas:

1. **URL que estás visitando:**
   - ¿Es exactamente `http://localhost:3000`?

2. **Errores en Console:**
   - Abre DevTools (`F12`) → pestaña Console
   - Copia todos los errores rojos

3. **Status de SVG en Network:**
   - DevTools → Network → busca `hero1.svg`
   - ¿Qué status code tiene? (200, 404, 400, etc.)

4. **HTML del hero:**
   - DevTools → Elements
   - Busca `<section class="relative overflow-hidden w-full">`
   - ¿Qué hay dentro? (copia el HTML)

5. **Ancho de ventana:**
   - ¿Estás en mobile (<1024px) o desktop (≥1024px)?
   - Verifica en DevTools → Toggle device toolbar

---

## 🔧 Fix Rápido Alternativo

Si sigues sin ver el hero, prueba esta versión **sin lazy loading**:

Edita `src/components/Home/Hero/index.tsx`:

```typescript
// LÍNEA 6 - Cambiar de:
import HeroCarousel from '@/components/Common/HeroCarousel.lazy'

// A:
import HeroCarousel from '@/components/Common/HeroCarousel'
```

Guarda, espera que el servidor recargue, y presiona `Ctrl + Shift + R` en el navegador.

¿Ahora sí lo ves?

---

**Por favor, comparte:**
1. ¿Qué ves exactamente en `http://localhost:3000`?
2. ¿Hay errores en la consola de DevTools (F12)?
3. ¿Cuál es el status de `hero1.svg` en Network tab?

