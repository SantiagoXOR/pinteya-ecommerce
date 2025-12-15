# ScrollingBanner

Componente de banner con animación de scroll infinito que muestra mensajes promocionales en el header de la aplicación.

> **Última actualización**: 15 de Diciembre, 2025 - Optimizado con altura reducida y tamaño tipográfico ajustado.

## 🎯 Características

- **Animación infinita suave** - Scroll continuo sin cortes
- **Altura optimizada** - 22px de altura total (reducida desde versión anterior)
- **Tipografía ajustada** - Texto de 10px con tracking amplio para legibilidad
- **Colores de marca** - Fondo naranja (#EA5A17) con badges verde y amarillo
- **Pausa en hover** - La animación se pausa al pasar el mouse
- **Gradientes laterales** - Efecto de fade en los bordes para transición suave
- **Performance optimizada** - Usa `will-change` y `backface-visibility` para animaciones fluidas

## 📐 Estructura Visual

```
┌─────────────────────────────────────────────────────────┐
│ [🚚 ENVÍO GRATIS...] | [⭐ TIENDA #1...] | [🚚 ENVÍO...] │
└─────────────────────────────────────────────────────────┘
```

### Dimensiones

- **Altura total**: 22px
- **Altura de badges**: 16px
- **Tamaño de texto**: 10px
- **Tracking**: `tracking-widest` (0.1em)

## 🚀 Uso

El componente se integra automáticamente en el Header:

```tsx
import ScrollingBanner from '@/components/Header/ScrollingBanner'

function Header() {
  return (
    <header>
      <ScrollingBanner />
      {/* Resto del header */}
    </header>
  )
}
```

## 🎨 Contenido del Banner

El banner muestra dos mensajes principales:

1. **Envío Gratis** (Badge verde)
   - Texto: "ENVÍO GRATIS EN 24HS EN CÓRDOBA"
   - Color: `bg-green-600`
   - Ícono: Truck

2. **Tienda #1** (Badge amarillo)
   - Texto: "TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA"
   - Color: `bg-bright-sun-300` (amarillo claro)
   - Ícono: Star
   - Texto: Negro para mejor contraste

## ⚙️ Configuración de Animación

### Parámetros de Animación

- **Duración**: 30 segundos por ciclo completo
- **Tipo**: `linear` (velocidad constante)
- **Repetición**: `infinite` (loop infinito)
- **Transformación**: `translateX(-50%)` (mueve la mitad del contenido)

### Optimizaciones de Performance

```css
.animate-scroll-banner-infinite {
  animation: scroll-banner-infinite 30s linear infinite;
  will-change: transform;                    /* Optimización GPU */
  backface-visibility: hidden;               /* Evita flickering */
  -webkit-backface-visibility: hidden;      /* Safari compatibility */
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Pausa en Hover

La animación se pausa automáticamente cuando el usuario pasa el mouse sobre el banner:

```css
.animate-scroll-banner-infinite:hover {
  animation-play-state: paused;
}
```

## 🔄 Optimizaciones Recientes

### Commit: `5005d51c` - "refactor: optimizar ScrollingBanner"

**Cambios implementados:**

1. **Altura reducida**
   - Antes: ~28-30px
   - Después: 22px
   - Beneficio: Menos espacio vertical, más contenido visible

2. **Tamaño tipográfico ajustado**
   - Antes: text-xs (12px)
   - Después: text-[10px] (10px)
   - Beneficio: Mejor proporción con la altura reducida

3. **Colores actualizados**
   - Fondo: `bg-blaze-orange-600` (naranja de marca)
   - Badge envío: `bg-green-600` (verde)
   - Badge tienda: `bg-bright-sun-300` (amarillo claro con texto negro)

4. **Mejoras de legibilidad**
   - Texto negro en badge amarillo para mejor contraste
   - Separadores con opacidad (`bg-white/40`)

## 🎨 Paleta de Colores

| Elemento | Color | Clase Tailwind | Hex |
|----------|-------|----------------|-----|
| Fondo | Naranja | `bg-blaze-orange-600` | #EA5A17 |
| Badge Envío | Verde | `bg-green-600` | #16A34A |
| Badge Tienda | Amarillo | `bg-bright-sun-300` | #FCD34D |
| Texto Badge Verde | Blanco | `text-white` | #FFFFFF |
| Texto Badge Amarillo | Negro | `text-black` | #000000 |
| Separador | Blanco/40 | `bg-white/40` | rgba(255,255,255,0.4) |

## 🔧 Personalización

### Cambiar el Contenido

Para modificar los mensajes, edita las constantes en `ScrollingBanner.tsx`:

```tsx
const envioText = 'TU MENSAJE PERSONALIZADO'
const tiendaText = 'OTRO MENSAJE PERSONALIZADO'
```

### Ajustar la Velocidad

Modifica la duración de la animación en el CSS:

```css
.animate-scroll-banner-infinite {
  animation: scroll-banner-infinite 30s linear infinite;
  /* Cambiar 30s a otro valor (ej: 20s para más rápido, 40s para más lento) */
}
```

### Cambiar Colores

Actualiza las clases de Tailwind en el JSX:

```tsx
// Cambiar color de fondo
<div className='w-full bg-otro-color-600 ...'>

// Cambiar color de badges
<div className='... bg-otro-verde-600 ...'>
<div className='... bg-otro-amarillo-300 ...'>
```

## 📱 Responsive

El componente es completamente responsive:

- **Mobile**: Se adapta al ancho completo
- **Tablet**: Mantiene proporciones
- **Desktop**: Mismo comportamiento, con mejor visibilidad

## ♿ Accesibilidad

- **Contraste**: Cumple WCAG AA con texto negro sobre amarillo y blanco sobre verde
- **Legibilidad**: Tracking amplio (`tracking-widest`) mejora la lectura
- **No intrusivo**: La animación se pausa en hover, permitiendo lectura

## 🐛 Troubleshooting

### La animación se ve entrecortada

**Solución**: Verifica que el contenido se repita al menos 4 veces (ya implementado) y que la duración sea suficiente.

### El texto no se lee bien

**Solución**: Asegúrate de que los colores tengan suficiente contraste. El componente ya usa texto negro sobre amarillo y blanco sobre verde.

### La animación no se pausa en hover

**Solución**: Verifica que el CSS `:hover` esté aplicado correctamente. El componente ya incluye esta funcionalidad.

## 📊 Performance

- **GPU Accelerated**: Usa `transform` en lugar de `left/top` para mejor performance
- **Will-change**: Indica al navegador que optimice la animación
- **Backface-visibility**: Evita flickering en algunos navegadores
- **Impacto**: Mínimo, la animación no afecta el rendimiento general

## 🔗 Archivos Relacionados

- `src/components/Header/ScrollingBanner.tsx` - Implementación del componente
- `src/components/Header/index.tsx` - Integración en el header
- `src/app/layout.tsx` - Layout principal donde se renderiza

## 📝 Notas de Desarrollo

- El contenido se repite 4 veces para crear un efecto de loop infinito sin cortes
- Los gradientes laterales crean un efecto de fade que oculta las transiciones
- La animación mueve el contenido -50% (la mitad) porque el contenido está duplicado 4 veces, creando 2 ciclos completos
