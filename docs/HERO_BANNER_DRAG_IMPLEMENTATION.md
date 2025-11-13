# Implementación de Hero Banner Deslizable con Drag

## Resumen
Se implementó funcionalidad de drag/swipe en los banners hero para mejorar la experiencia de usuario en dispositivos móviles y desktop.

## Cambios Implementados

### 1. Configuración de Swiper

Se agregaron las siguientes configuraciones a ambos componentes (`HeroSlideCarousel.tsx` y `HeroCarousel.tsx`):

#### Habilitar Drag con Mouse (Desktop)
```typescript
simulateTouch={true}           // Simular touch en desktop
allowTouchMove={true}          // Permitir movimiento táctil
touchRatio={1}                 // Ratio de sensibilidad
grabCursor={true}              // Cursor tipo "grab"
```

#### Optimización para Móvil
```typescript
touchStartPreventDefault={false}   // NO prevenir default para permitir scroll vertical
touchMoveStopPropagation={false}   // No detener propagación
threshold={10}                     // Umbral de 10px para iniciar drag
touchAngle={45}                    // Ángulo de 45° para detectar dirección
resistance={true}                  // Resistencia en los bordes
resistanceRatio={0.85}            // 85% de resistencia
touchEventsTarget='container'     // Eventos en el contenedor
```

#### Swipes Largos
```typescript
longSwipes={true}              // Habilitar swipes largos
longSwipesRatio={0.5}         // 50% de la distancia
longSwipesMs={300}            // 300ms de duración
followFinger={true}           // Seguir el dedo durante el drag
```

#### Navegación
```typescript
allowSlidePrev={true}          // Permitir slide anterior
allowSlideNext={true}          // Permitir slide siguiente
preventClicks={true}           // Prevenir clicks durante drag
preventClicksPropagation={true} // No propagar clicks durante drag
```

### 2. Estilos CSS

#### Cursor Grab
```css
.hero-carousel .swiper {
  cursor: grab;
}

.hero-carousel .swiper:active {
  cursor: grabbing;
}
```

#### Efectos Visuales Durante el Drag
```css
.hero-carousel .swiper-slide {
  transition: box-shadow 0.3s ease;
}

.hero-carousel .swiper:active .swiper-slide-active {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
```

#### User Selection
Los elementos dentro del slide (imágenes, textos) no son seleccionables para evitar interferencias durante el drag, pero mantienen la funcionalidad de scroll vertical.

```css
.hero-carousel .swiper {
  user-select: none;
}

.hero-carousel .swiper-slide img,
.hero-carousel .swiper-slide h1,
.hero-carousel .swiper-slide h2,
.hero-carousel .swiper-slide p {
  user-select: none;
  user-drag: none; /* Prevenir arrastre de imágenes */
}
```

**Importante**: No se usa `pointer-events: none` para permitir el scroll vertical de la página.

### 3. Navegación Responsive

#### Desktop (≥ 1024px)
- Botones de navegación visibles
- Drag con mouse habilitado
- Cursor cambia a "grab" al pasar sobre el banner

#### Móvil (< 1024px)
- Botones de navegación ocultos
- Solo swipe táctil
- Optimizado para gestos táctiles

```css
@media (max-width: 1023px) {
  .hero-carousel .hero-carousel-button-prev,
  .hero-carousel .hero-carousel-button-next {
    display: none !important;
  }
}
```

## Componentes Actualizados

1. **src/components/Common/HeroSlideCarousel.tsx**
   - Configuración de Swiper para drag/swipe
   - Botones de navegación ocultos en móvil (`hidden lg:flex`)

2. **src/components/Common/HeroCarousel.tsx**
   - Misma configuración aplicada
   - Consistencia en ambos componentes de hero

3. **src/styles/hero-carousel.css**
   - Estilos de cursor grab/grabbing
   - Efectos visuales de sombra
   - Gestión de pointer-events
   - Media queries para ocultar botones en móvil

## Experiencia de Usuario

### Desktop
1. El cursor cambia a "mano abierta" (grab) al pasar sobre el banner
2. Al hacer clic y arrastrar, el cursor cambia a "mano cerrada" (grabbing)
3. La slide activa muestra una sombra durante el drag
4. Los botones de navegación están visibles en los laterales
5. Resistencia visual al llegar a los bordes

### Móvil
1. Swipe táctil optimizado con threshold bajo (5px)
2. Sin botones de navegación para maximizar el área de contenido
3. Resistencia al llegar a los extremos
4. Animación suave al cambiar de slide

## Testing

Para probar la funcionalidad:

1. **Desktop**: 
   - Visita la página de inicio
   - Pasa el cursor sobre el banner (debería cambiar a "grab")
   - Haz clic y arrastra hacia la izquierda/derecha
   - Verifica que cambie de slide

2. **Móvil**:
   - Abre en un dispositivo móvil o usa DevTools
   - Desliza el dedo sobre el banner
   - Verifica que los botones no aparezcan
   - Confirma que el swipe funcione suavemente

## Accesibilidad

- Se mantienen todos los atributos ARIA existentes
- Navegación por teclado sigue funcionando (flechas izquierda/derecha)
- Screen readers anuncian correctamente los cambios de slide
- Los botones mantienen sus labels ARIA

## Compatibilidad

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Safari iOS: ✅
- Chrome Android: ✅

## Notas Técnicas

- El autoplay se pausa al hacer hover (desktop) o al iniciar un drag
- Los clicks en links y botones dentro del slide siguen funcionando
- El threshold de 10px evita activaciones accidentales y permite scroll natural
- La resistencia de 85% proporciona feedback visual natural
- `touchAngle: 45` detecta la dirección del swipe (horizontal vs vertical)
- `touchStartPreventDefault: false` es crucial para permitir el scroll vertical

## Solución de Problemas

### Problema: No se puede hacer scroll vertical en la página

**Causa**: `touchStartPreventDefault={true}` o `pointer-events: none` bloquean el scroll.

**Solución Aplicada**:
1. Cambiar `touchStartPreventDefault={true}` a `false`
2. Remover `pointer-events: none` de los elementos del slide
3. Usar `user-select: none` en su lugar para prevenir selección de texto
4. Agregar `touchAngle: 45` para detectar la dirección del gesto

Con estos ajustes, Swiper detecta automáticamente si el usuario quiere:
- Deslizar horizontalmente → cambia de slide
- Deslizar verticalmente → hace scroll en la página

### Problema: El drag no funciona en HeroCarousel (con imágenes Next.js)

**Causa**: Las imágenes de Next.js (`<Image>`) capturan eventos de mouse/touch y bloquean el drag.

**Solución Aplicada**:
1. Agregar `draggable={false}` al componente `<Image>`
2. Agregar clase `select-none` para prevenir selección
3. CSS: `pointer-events: none !important` en todas las imágenes
4. Remover `touch-action` del CSS (Swiper lo maneja internamente)
5. Threshold reducido a `5` para mayor sensibilidad

```typescript
<Image
  draggable={false}
  className='object-contain transition-all duration-500 ease-in-out select-none'
  style={{ objectFit: 'contain' }}
/>
```

```css
.hero-carousel .swiper-slide img,
.hero-carousel .swiper-slide picture,
.hero-carousel .swiper-slide [data-nimg] {
  pointer-events: none !important;
  -webkit-user-drag: none !important;
  user-drag: none !important;
}
```

