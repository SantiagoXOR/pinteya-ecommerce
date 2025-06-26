# ⚡ Estados e Interacciones - Design System Pinteya

> Especificaciones completas de estados interactivos y animaciones para una experiencia de usuario fluida y profesional

## 📋 Índice

- [🎯 Estados Básicos](#-estados-básicos)
- [🎬 Animaciones](#-animaciones)
- [📱 Estados Móviles](#-estados-móviles)
- [🛍️ Estados E-commerce](#️-estados-e-commerce)
- [♿ Accesibilidad](#-accesibilidad)
- [💻 Implementación](#-implementación)

---

## 🎯 Estados Básicos

### Hover - Interacción Principal

**Especificaciones:**
- **Duración**: 200ms
- **Easing**: ease-out
- **Transformación**: scale(1.02) + shadow-lg
- **Color**: Transición suave al color hover

```css
/* Hover genérico */
.interactive-element {
  transition: all 0.2s ease-out;
}

.interactive-element:hover {
  transform: scale(1.02);
  box-shadow: 0px 6px 24px rgba(235, 238, 251, 0.40);
}

/* Hover específico para botones */
.btn-primary:hover {
  background-color: #ef7d00; /* tahiti-gold-600 */
  box-shadow: 0px 6px 24px rgba(252, 157, 4, 0.25);
}
```

### Active/Pressed - Feedback Táctil

**Especificaciones:**
- **Duración**: 150ms
- **Transformación**: scale(0.98)
- **Color**: Versión más oscura del color base

```css
.interactive-element:active {
  transform: scale(0.98);
  transition-duration: 150ms;
}

.btn-primary:active {
  background-color: #b95004; /* tahiti-gold-700 */
  transform: scale(0.98);
}
```

### Focus - Accesibilidad

**Especificaciones:**
- **Ring**: 2px solid primary color
- **Offset**: 2px
- **Visible**: Siempre visible en navegación por teclado

```css
.focusable:focus-visible {
  outline: none;
  ring: 2px solid #fc9d04;
  ring-offset: 2px;
}

/* Focus específico para inputs */
.input:focus-visible {
  border-color: #fc9d04;
  ring: 2px solid rgba(252, 157, 4, 0.2);
}
```

### Disabled - No Disponible

**Especificaciones:**
- **Opacidad**: 50%
- **Cursor**: not-allowed
- **Interacciones**: Deshabilitadas

```css
.element:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Loading - Procesando

**Especificaciones:**
- **Spinner**: Rotación continua
- **Texto**: Cambio contextual
- **Interacciones**: Deshabilitadas temporalmente

```css
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 🎬 Animaciones

### Fade In - Aparición Suave

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

### Slide Up - Entrada desde Abajo

```css
@keyframes slide-up {
  from { 
    transform: translateY(10px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

### Scale In - Crecimiento

```css
@keyframes scale-in {
  from { 
    transform: scale(0.95); 
    opacity: 0; 
  }
  to { 
    transform: scale(1); 
    opacity: 1; 
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
```

### Bounce In - Entrada Dinámica

```css
@keyframes bounce-in {
  0% { 
    transform: scale(0.3); 
    opacity: 0; 
  }
  50% { 
    transform: scale(1.05); 
  }
  70% { 
    transform: scale(0.9); 
  }
  100% { 
    transform: scale(1); 
    opacity: 1; 
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s ease-out;
}
```

### Shake - Error/Atención

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
```

---

## 📱 Estados Móviles

### Touch States

**Especificaciones móviles específicas:**
- **Touch target**: Mínimo 44px
- **Feedback**: Inmediato al touch
- **Ripple effect**: Opcional para Material Design feel

```css
/* Touch feedback */
@media (hover: none) {
  .touch-element:active {
    background-color: rgba(252, 157, 4, 0.1);
    transform: scale(0.98);
  }
}

/* Ripple effect */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple:active::before {
  width: 300px;
  height: 300px;
}
```

### Swipe Gestures

```css
/* Swipe indicators */
.swipeable {
  position: relative;
}

.swipe-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.swipeable:hover .swipe-indicator {
  opacity: 1;
}
```

---

## 🛍️ Estados E-commerce

### Producto en Carrito

```css
.product-added {
  animation: added-to-cart 0.8s ease-out;
  border: 2px solid #22ad5c;
}

@keyframes added-to-cart {
  0% { 
    transform: scale(1); 
    border-color: transparent; 
  }
  50% { 
    transform: scale(1.05); 
    border-color: #22ad5c; 
  }
  100% { 
    transform: scale(1); 
    border-color: #22ad5c; 
  }
}
```

### Stock Bajo

```css
.low-stock {
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); 
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); 
  }
}
```

### Descuento Activo

```css
.discount-badge {
  animation: discount-pulse 1.5s ease-in-out infinite;
}

@keyframes discount-pulse {
  0%, 100% { 
    transform: scale(1); 
    background-color: #f23030; 
  }
  50% { 
    transform: scale(1.1); 
    background-color: #e10e0e; 
  }
}
```

### Envío Gratis

```css
.free-shipping {
  position: relative;
  overflow: hidden;
}

.free-shipping::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(34, 173, 92, 0.2), 
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

---

## ♿ Accesibilidad

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  .btn-primary {
    border: 2px solid currentColor;
  }
  
  .focus-ring:focus-visible {
    ring-width: 3px;
    ring-color: currentColor;
  }
}
```

### Screen Reader States

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Announce state changes */
.loading[aria-live="polite"]::after {
  content: "Cargando...";
}

.success[aria-live="polite"]::after {
  content: "Completado exitosamente";
}
```

---

## 💻 Implementación

### React Hook para Estados

```tsx
// hooks/useInteractionState.ts
import { useState, useCallback } from 'react'

interface InteractionState {
  isHovered: boolean
  isPressed: boolean
  isFocused: boolean
  isLoading: boolean
}

export function useInteractionState() {
  const [state, setState] = useState<InteractionState>({
    isHovered: false,
    isPressed: false,
    isFocused: false,
    isLoading: false
  })

  const handlers = {
    onMouseEnter: useCallback(() => 
      setState(prev => ({ ...prev, isHovered: true })), []),
    onMouseLeave: useCallback(() => 
      setState(prev => ({ ...prev, isHovered: false })), []),
    onMouseDown: useCallback(() => 
      setState(prev => ({ ...prev, isPressed: true })), []),
    onMouseUp: useCallback(() => 
      setState(prev => ({ ...prev, isPressed: false })), []),
    onFocus: useCallback(() => 
      setState(prev => ({ ...prev, isFocused: true })), []),
    onBlur: useCallback(() => 
      setState(prev => ({ ...prev, isFocused: false })), []),
  }

  const setLoading = useCallback((loading: boolean) => 
    setState(prev => ({ ...prev, isLoading: loading })), [])

  return { state, handlers, setLoading }
}
```

### Componente con Estados

```tsx
// components/InteractiveCard.tsx
import { cn } from '@/lib/utils'
import { useInteractionState } from '@/hooks/useInteractionState'

interface InteractiveCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function InteractiveCard({ 
  children, 
  onClick, 
  className 
}: InteractiveCardProps) {
  const { state, handlers } = useInteractionState()

  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-pointer",
        "hover:scale-102 hover:shadow-2",
        "active:scale-98",
        "focus-visible:ring-2 focus-visible:ring-primary",
        state.isHovered && "shadow-2 scale-102",
        state.isPressed && "scale-98",
        state.isFocused && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
      tabIndex={0}
      {...handlers}
    >
      {children}
    </div>
  )
}
```

### Utilidades CSS

```css
/* Utilidades de estado */
.hover\:scale-102:hover {
  transform: scale(1.02);
}

.active\:scale-98:active {
  transform: scale(0.98);
}

.focus-visible\:ring-primary:focus-visible {
  ring-color: #fc9d04;
}

/* Transiciones optimizadas */
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-fast {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-slow {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 🎯 Criterios de Aceptación

### Performance
- [ ] Animaciones 60fps
- [ ] Transiciones < 300ms
- [ ] Sin layout shifts
- [ ] GPU acceleration cuando sea necesario

### Accesibilidad
- [ ] Respeta prefers-reduced-motion
- [ ] Focus visible en navegación por teclado
- [ ] Estados anunciados a screen readers
- [ ] Contraste suficiente en todos los estados

### UX
- [ ] Feedback inmediato en interacciones
- [ ] Estados claros y diferenciables
- [ ] Transiciones suaves y naturales
- [ ] Consistencia en toda la aplicación

---

*Última actualización: Junio 2025*
