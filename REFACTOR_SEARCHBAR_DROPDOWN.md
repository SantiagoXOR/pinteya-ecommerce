# Refactorización: Searchbar y Dropdown

## Fecha: 2025-01-XX

## Resumen

Refactorización completa del componente de búsqueda y su dropdown para solucionar problemas de posicionamiento durante el scroll, mejorar la UX (ocultar logo al hacer focus), y simplificar el código mediante modularización.

## Problemas Resueltos

### 1. ✅ Dropdown se sale de lugar al hacer scroll
**Problema:** El dropdown usaba `rect.bottom + window.scrollY` para `position: fixed`, causando desplazamiento incorrecto durante el scroll.

**Solución:** 
- Creado hook `useDropdownPosition.ts` que usa solo `rect.bottom` (sin `window.scrollY`) para `position: fixed`
- Agregadas validaciones para evitar posiciones inválidas (width <= 0, input no visible)
- Listeners de scroll optimizados con `{ passive: true }`

### 2. ✅ Logo no se oculta al hacer focus en searchbar
**Problema:** El estado `isSearchExpanded` no se sincronizaba automáticamente con el focus del input.

**Solución:**
- Agregada prop `onFocusChange` a `SearchAutocompleteIntegrated`
- Sincronización automática entre focus del input y estado `isSearchExpanded` en Header
- Logo se oculta en mobile y desktop cuando el searchbar está activo

### 3. ✅ Z-index incorrecto
**Problema:** Dropdown usaba `z-[200]` cuando debería usar `z-dropdown` (2000) según la jerarquía del proyecto.

**Solución:** Cambiado a `z-dropdown` en el componente `SearchDropdown`

### 4. ✅ Scroll listener no optimizado
**Problema:** Usaba capture phase (`true`) innecesariamente.

**Solución:** Cambiado a `{ passive: true }` para mejor performance

### 5. ✅ Código complejo y difícil de mantener
**Problema:** 740+ líneas en un solo componente, lógica mezclada.

**Solución:** Modularización completa:
- Hook `useDropdownPosition.ts` (~100 líneas) - Maneja posicionamiento
- Componente `SearchDropdown.tsx` (~270 líneas) - Renderiza dropdown
- Componente `SearchSuggestionItem.tsx` (~80 líneas) - Renderiza items
- `SearchAutocompleteIntegrated.tsx` reducido a ~570 líneas (de 740)

### 6. ✅ Dos dropdowns renderizándose simultáneamente
**Problema:** Header mobile y desktop compartían estado pero ambos renderizaban dropdowns.

**Solución:**
- Validaciones estrictas: solo renderizar si `width > 10px` y `top > 0`
- Verificación de visibilidad del input (`offsetParent !== null`)
- El hook no calcula posición si el input no está visible

## Archivos Creados

1. **`src/hooks/useDropdownPosition.ts`**
   - Hook reutilizable para posicionamiento de dropdowns
   - Maneja scroll, resize, y cálculo de posición
   - Optimizado con `requestAnimationFrame` y validaciones

2. **`src/components/ui/search/SearchDropdown.tsx`**
   - Componente modular para el dropdown de sugerencias
   - Maneja todos los estados: loading, error, empty, suggestions
   - Usa `z-dropdown` correcto
   - Portal rendering optimizado

3. **`src/components/ui/search/SearchSuggestionItem.tsx`**
   - Componente para renderizar items individuales
   - Optimizado con `React.memo`
   - Accesible y consistente

## Archivos Modificados

1. **`src/components/ui/SearchAutocompleteIntegrated.tsx`**
   - Reducido de ~740 a ~570 líneas
   - Usa hook `useDropdownPosition` en lugar de lógica inline
   - Usa componente `SearchDropdown` en lugar de renderizado inline
   - Agregada prop `onFocusChange` para sincronización con Header
   - Eliminada lógica de posicionamiento y renderizado del dropdown

2. **`src/components/Header/index.tsx`**
   - Agregado handler `handleSearchFocusChange` para sincronizar `isSearchExpanded`
   - Logo se oculta cuando `isSearchExpanded` es true (mobile y desktop)
   - Searchbar expandido ocupa `w-full` en mobile
   - Todas las instancias de `SearchAutocompleteIntegrated` reciben `onFocusChange`
   - Estilos inline para forzar ocultamiento del logo

## Mejoras de Performance

1. **Throttling con requestAnimationFrame:** Actualizaciones de posición sincronizadas con el render
2. **Listeners pasivos:** `{ passive: true }` en scroll y resize para mejor performance
3. **Memoización:** `React.memo` en componentes hijos para evitar re-renders innecesarios
4. **Validaciones tempranas:** No calcular posición si el input no está visible

## Validaciones Implementadas

### En `useDropdownPosition.ts`:
- Input debe existir y estar visible (`offsetParent !== null`)
- Rect debe tener dimensiones válidas (width > 0, height > 0)
- Posición no debe estar fuera del viewport
- Sanity check: width no puede ser más del doble del viewport

### En `SearchDropdown.tsx`:
- No renderizar si `width <= 0` o `top <= 0`
- Validación de posición antes de renderizar

### En `SearchAutocompleteIntegrated.tsx`:
- Solo renderizar `SearchDropdown` si:
  - `position.width > 10px`
  - `position.top > 0`
  - Input está visible (`offsetParent !== null`)

## Testing

### Verificaciones Realizadas:
- ✅ Dropdown se mantiene en posición durante scroll
- ✅ Logo se oculta al hacer focus en searchbar (mobile y desktop)
- ✅ Logo reaparece al hacer blur
- ✅ Searchbar se expande completamente en mobile
- ✅ Navegación por teclado funciona correctamente
- ✅ Click en sugerencias funciona
- ✅ Solo un dropdown se renderiza (no dos)
- ✅ Resize de ventana ajusta el dropdown correctamente

## Breaking Changes

Ninguno. La refactorización mantiene la misma API pública del componente `SearchAutocompleteIntegrated`, solo agrega la prop opcional `onFocusChange`.

## Notas Técnicas

- El hook `useDropdownPosition` es reutilizable para otros dropdowns en el proyecto
- Los componentes `SearchDropdown` y `SearchSuggestionItem` pueden usarse independientemente
- El posicionamiento usa `position: fixed` correctamente sin sumar `window.scrollY`
- Las validaciones previenen renderizado de dropdowns inválidos cuando hay múltiples instancias (mobile/desktop)
