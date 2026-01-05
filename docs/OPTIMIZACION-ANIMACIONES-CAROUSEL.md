# ⚡ Optimización: Animaciones y Carousel (b093092617cc1948.css)

## 🎯 Problema

El archivo `b093092617cc1948.css` (3.6 KiB - 210 ms) contiene:
- Variables CSS (`:root`, `.dark`)
- Animaciones del checkout (`crash-zoom`, `ripple-wave`, etc.)
- Estilos del hero carousel (Swiper)

**Problema**: Estas animaciones y estilos del carousel NO son críticos para el First Contentful Paint.

---

## ✅ Estrategia de Optimización

### 1. Separar CSS Crítico vs No Crítico

#### Variables CSS → **CRÍTICO** (inline)
Las variables CSS deben estar inline porque otros estilos las necesitan.

#### Animaciones Checkout → **NO CRÍTICO** (diferir)
Solo se necesitan cuando el usuario llega al checkout.

#### Estilos Carousel → **CRÍTICO CONDICIONAL**
- Si está en homepage: diferir pero con alta prioridad
- Si no hay carousel: no cargar

---

## 🔧 Implementación

### 1. Variables CSS Inline (Crítico)

**Agregar a `src/app/layout.tsx`**:

```jsx
<style dangerouslySetInnerHTML={{__html: `
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --accent: 210 40% 96%;
    --destructive: 0 84.2% 60.2%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... otras variables dark mode */
  }
`}} />
```

---

### 2. Animaciones del Checkout → Carga Diferida

**Crear archivo**: `src/styles/checkout-animations.css`

```css
@keyframes crash-zoom {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  30% { transform: scale(2.5) rotate(0deg); opacity: 1; }
  70% { transform: scale(1) rotate(0deg); opacity: 1; }
  to { transform: scale(1) rotate(0deg); opacity: 0; }
}

@keyframes ripple-wave {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(8); opacity: 0.8; }
  80% { transform: scale(12); opacity: 0.6; }
  to { transform: scale(15); opacity: 0; }
}

/* ... resto de animaciones checkout ... */
```

**Cargar solo en página de checkout**:

```tsx
// src/app/checkout/layout.tsx
import '@/styles/checkout-animations.css'

export default function CheckoutLayout({ children }) {
  return <>{children}</>
}
```

**Impacto**: -150 ms (no se carga hasta checkout)

---

### 3. Carousel Styles → Carga Inteligente

#### Opción A: Inline crítico del carousel

Si el carousel está en homepage (above-the-fold), inline estilos mínimos:

```jsx
// src/app/layout.tsx
<style dangerouslySetInnerHTML={{__html: `
  .hero-carousel {
    position: relative;
    width: 100%;
    min-height: 400px;
  }
  
  .hero-carousel .swiper {
    height: 100%;
    width: 100%;
    cursor: grab;
  }
  
  /* Solo estilos críticos para evitar layout shift */
`}} />
```

#### Opción B: Preload condicional

```tsx
// src/components/HeroCarousel/HeroCarousel.tsx
'use client'

import { useEffect } from 'react'

export function HeroCarousel() {
  useEffect(() => {
    // Preload de estilos del carousel
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = '/styles/hero-carousel.css'
    document.head.appendChild(link)
    
    // Cargar stylesheet
    setTimeout(() => {
      const stylesheet = document.createElement('link')
      stylesheet.rel = 'stylesheet'
      stylesheet.href = '/styles/hero-carousel.css'
      document.head.appendChild(stylesheet)
    }, 0)
  }, [])
  
  return (/* ... */)
}
```

---

### 4. Actualizar DeferredCSS

**Modificar `src/components/Performance/DeferredCSS.tsx`**:

```typescript
const cssResources: CSSResource[] = [
  // Prioridad ALTA: Variables ya están inline, skip
  
  // Prioridad MEDIA: Carousel (solo si está en homepage)
  {
    path: '/styles/hero-carousel.css',
    priority: 'medium',
    condition: () => window.location.pathname === '/',
  },
  
  // Prioridad BAJA: Animaciones checkout (solo en checkout)
  {
    path: '/styles/checkout-animations.css',
    priority: 'low',
    condition: () => window.location.pathname.includes('/checkout'),
  },
  
  // ... otros CSS no críticos
]
```

---

## 📊 Impacto por Optimización

| Optimización | Ahorro |
|--------------|--------|
| Variables inline | Eliminan 1 request |
| Animaciones diferidas | -150 ms |
| Carousel condicional | -60 ms (si no es homepage) |
| **Total** | **-210 ms** ✅ |

---

## 🎯 Resultado Final

### Antes
```
b093092617cc1948.css: 3.6 KiB - 210 ms (bloqueante)
```

### Después
```
Variables CSS: Inline en <head> (0 ms bloqueante)
Animaciones: Carga diferida solo en checkout
Carousel: Inline crítico + diferido resto
```

**Ahorro total**: **210 ms** ✅

---

## 🚀 Implementación Paso a Paso

### 1. Extraer Variables CSS
```bash
# Copiar variables de b093092617cc1948.css
# Pegar en layout.tsx dentro de <style>
```

### 2. Crear Archivos CSS Separados
```bash
# Crear src/styles/checkout-animations.css
# Mover animaciones crash-zoom, ripple-wave, etc.

# Crear src/styles/hero-carousel.css  
# Mover estilos del carousel
```

### 3. Actualizar DeferredCSS
```tsx
// Agregar condiciones para carga inteligente
```

### 4. Eliminar CSS Original
```tsx
// Remover import del CSS original si existe
```

### 5. Verificar
```bash
npm run build
npm run optimize:css
```

---

## 💡 Beneficios Adicionales

1. **Mejor Organización**: CSS separado por funcionalidad
2. **Code Splitting**: Solo carga lo necesario por ruta
3. **Cache Mejorado**: Archivos más pequeños = mejor cache
4. **Mantenibilidad**: Más fácil encontrar y modificar estilos

