# ⚠️ Hero Banner - NO MODIFICAR

**Fecha**: 23 de Enero 2026  
**Estado**: Funcionando correctamente tras fix  
**Última modificación documentada**: Fix conflicto de posicionamiento

---

## 🚫 Archivos que NO deben tocarse

Sin revisar este documento y `FIX_HERO_BANNER.md`, **no modificar**:

1. **`src/components/Home/sections/HeroSection.tsx`**
   - Contenedor de la imagen estática (div con `absolute inset-0`).
   - **NO** añadir `style` inline con `position: 'relative'` en ese div.
   - La imagen hero usa `fill`, `priority`, `fetchPriority="high"`, `decoding="sync"`.

2. **`src/components/Home/Hero/SimpleHeroCarousel.tsx`**
   - Imágenes del carousel: `fetchPriority` debe ser `'high'` solo para `index === 1`, y **`'auto'`** para el resto (no `'low'`).
   - Usar `fetchPriority="low"` hizo que el hero dejara de cargar.

---

## 📐 Estructura correcta (mantener)

### HeroSection – contenedor imagen estática

```tsx
<div 
  className={`absolute inset-0 z-10 transition-opacity duration-500 ${
    shouldLoadCarousel ? 'opacity-0 pointer-events-none' : 'opacity-100'
  }`}
>
  <Image ... fill priority fetchPriority="high" decoding="sync" ... />
</div>
```

- **NO** añadir `style={{ width: '100%', height: '100%', position: 'relative' }}` al div.
- El padre tiene `position: relative`; el div usa `absolute inset-0`. Añadir `position: relative` aquí rompe el layout y la imagen no carga.

### SimpleHeroCarousel – imágenes del carousel

```tsx
fetchPriority={index === 1 ? 'high' : 'auto'}  // ✅ Mantener 'auto', NO usar 'low'
```

---

## 🐛 Qué se rompió (ya corregido)

1. **Style conflictivo en HeroSection**: se añadió `style` con `position: 'relative'` al div con `absolute inset-0` → conflicto de posicionamiento, imagen no se renderizaba.
2. **`fetchPriority="low"` en carousel**: en imágenes no-LCP se usó `low` → afectó la carga del hero. Corregido a `auto`.

---

## ✅ Antes de tocar el hero

1. Revisar este archivo y `FIX_HERO_BANNER.md`.
2. No modificar el contenedor de la imagen estática ni añadir `position: relative` ahí.
3. No usar `fetchPriority="low"` en imágenes del hero/carousel; usar `'auto'` para las no críticas.
4. Probar carga inicial (imagen hero visible de inmediato) y transición al carousel (~3 s).
5. Probar en desktop y móvil.

---

## 📎 Referencias

- `FIX_HERO_BANNER.md` – Detalle del fix.
- `PLAN_ACCION_OPTIMIZACIONES.md` – Plan de optimizaciones (hero excluido de cambios).

---

**Documentado para evitar regresiones. No modificar hero sin seguir esta guía.**
