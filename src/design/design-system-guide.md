# Guía de Estilo y Design System - E-commerce

## Introducción

Este design system ha sido diseñado específicamente para crear una experiencia de e-commerce moderna, accesible y altamente funcional. Se enfoca en la estética, usabilidad y experiencia del usuario, proporcionando una base sólida para el desarrollo de interfaces coherentes y profesionales.

## Principios de Diseño

### 1. **Claridad y Simplicidad**

- Interfaces limpias que no distraigan del objetivo principal: la compra
- Jerarquía visual clara que guíe al usuario naturalmente
- Eliminación de elementos innecesarios que puedan generar fricción

### 2. **Accesibilidad Universal**

- Contraste mínimo WCAG AA (4.5:1) en todos los elementos
- Navegación por teclado completa
- Textos alternativos y etiquetas semánticas
- Soporte para lectores de pantalla

### 3. **Responsive First**

- Diseño mobile-first que escala elegantemente
- Breakpoints estratégicos para diferentes dispositivos
- Componentes flexibles que se adaptan al contenido

### 4. **Performance y Velocidad**

- Carga rápida de componentes críticos
- Lazy loading para elementos no esenciales
- Optimización de imágenes y recursos

## Sistema de Colores

### Paleta Principal

```typescript
// Colores primarios - Azul profesional y confiable
primary: {
  50: '#eff6ff',   // Fondos muy sutiles
  100: '#dbeafe',  // Fondos sutiles
  200: '#bfdbfe',  // Bordes suaves
  300: '#93c5fd',  // Estados hover
  400: '#60a5fa',  // Elementos secundarios
  500: '#3b82f6',  // Color principal
  600: '#2563eb',  // Estados activos
  700: '#1d4ed8',  // Textos importantes
  800: '#1e40af',  // Textos de alta jerarquía
  900: '#1e3a8a'   // Textos críticos
}
```

### Colores Secundarios

```typescript
// Verde - Éxito, disponibilidad, confirmaciones
secondary: {
  500: '#10b981',  // Botones de éxito
  600: '#059669',  // Estados hover
  700: '#047857'   // Estados activos
}

// Naranja - Llamadas a la acción, ofertas
accent: {
  500: '#f59e0b',  // Descuentos, ofertas
  600: '#d97706',  // Estados hover
  700: '#b45309'   // Estados activos
}
```

### Colores de Estado

```typescript
status: {
  success: '#10b981',  // Compras exitosas, stock disponible
  warning: '#f59e0b',  // Stock bajo, advertencias
  error: '#ef4444',    // Errores, productos agotados
  info: '#3b82f6'      // Información general
}
```

### Modo Oscuro

El sistema incluye soporte completo para modo oscuro con paletas optimizadas para reducir la fatiga visual y mejorar la legibilidad en condiciones de poca luz.

## Sistema Tipográfico

### Familias de Fuentes

```typescript
fontFamilies: {
  sans: ['Inter', 'system-ui', 'sans-serif'],     // Textos generales
  display: ['Poppins', 'Inter', 'sans-serif'],   // Títulos y destacados
  mono: ['JetBrains Mono', 'monospace']          // Códigos y datos técnicos
}
```

### Escala Tipográfica

Basada en una progresión modular (1.25) que garantiza armonía visual:

- **H1**: 48px - Títulos principales de página
- **H2**: 36px - Títulos de sección
- **H3**: 28px - Subtítulos importantes
- **H4**: 24px - Títulos de componentes
- **H5**: 20px - Títulos menores
- **H6**: 18px - Títulos de cards
- **Body Large**: 18px - Textos destacados
- **Body**: 16px - Texto principal
- **Body Small**: 14px - Textos secundarios
- **Caption**: 12px - Metadatos y etiquetas

### Jerarquía Responsive

Los tamaños se ajustan automáticamente según el dispositivo:

```typescript
// Ejemplo H1
responsive: {
  base: '32px',    // Mobile
  md: '40px',      // Tablet
  lg: '48px'       // Desktop
}
```

## Sistema de Espaciado y Grid

### Escala Base

Basada en múltiplos de 4px para consistencia perfecta:

```typescript
base: {
  1: '4px',    // Espacios mínimos
  2: '8px',    // Espacios pequeños
  3: '12px',   // Espacios medianos
  4: '16px',   // Espacios estándar
  6: '24px',   // Espacios grandes
  8: '32px',   // Espacios extra grandes
  12: '48px',  // Secciones
  16: '64px',  // Separadores principales
  20: '80px'   // Espacios hero
}
```

### Grid System

```typescript
grid: {
  columns: 12,           // Sistema de 12 columnas
  maxWidth: '1200px',    // Ancho máximo del contenedor
  gutters: {
    sm: '16px',          // Mobile
    md: '24px',          // Tablet
    lg: '32px'           // Desktop
  }
}
```

### Breakpoints

```typescript
breakpoints: {
  sm: '640px',   // Móviles grandes
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Pantallas grandes
}
```

## Componentes UI

### Botones

#### Primario

- **Uso**: Acciones principales (Añadir al carrito, Comprar ahora)
- **Estilo**: Gradiente azul con sombra sutil
- **Estados**: Hover (elevación), Active (compresión), Disabled (opacidad)

#### Secundario

- **Uso**: Acciones secundarias (Ver detalles, Comparar)
- **Estilo**: Borde azul con fondo transparente
- **Estados**: Hover (fondo azul claro)

#### Ghost

- **Uso**: Acciones terciarias (Wishlist, Compartir)
- **Estilo**: Sin borde, fondo transparente
- **Estados**: Hover (fondo gris claro)

### Cards de Producto

#### Estructura

1. **Imagen**: Aspect ratio 1:1, overlay para acciones rápidas
2. **Badge**: Descuentos o etiquetas especiales
3. **Contenido**: Categoría, título, precio, rating
4. **Acciones**: Botón principal + wishlist

#### Estados

- **Default**: Sombra sutil, bordes suaves
- **Hover**: Elevación, borde azul claro
- **Loading**: Skeleton con animación pulse

### Formularios

#### Campos de Entrada

- **Padding**: 12px horizontal, 16px vertical
- **Border**: 1px sólido, radius 8px
- **Focus**: Borde azul + sombra azul translúcida
- **Error**: Borde rojo + mensaje de error

#### Selectores de Variante

- **Tallas**: Botones cuadrados con bordes
- **Colores**: Círculos con el color real + borde de selección
- **Cantidad**: Input numérico con botones +/-

### Navegación

#### Breadcrumb

- **Separador**: Chevron derecho
- **Estados**: Link (azul) + Current (negro)
- **Responsive**: Colapsa en mobile

#### Filtros

- **Sidebar**: Sticky en desktop, drawer en mobile
- **Grupos**: Títulos claros + opciones organizadas
- **Precio**: Slider dual + inputs numéricos

## Iconografía

### Librería

- **Primaria**: Heroicons (outline y solid)
- **Complementaria**: Lucide React
- **Tamaños**: 16px, 20px, 24px, 32px, 48px

### Categorías

- **Navegación**: home, menu, search, filter, arrow-\*
- **Comercio**: shopping-cart, heart, star, credit-card
- **Usuario**: user, login, settings, bell
- **Producto**: eye, share, bookmark, tag
- **Estado**: check, x, alert-triangle, info

### Estados

- **Default**: Gris neutro
- **Hover**: Azul primario + escala 1.05
- **Active**: Azul oscuro + escala 0.95
- **Disabled**: Gris claro + opacidad 50%

## Sistema de Imágenes

### Aspect Ratios

- **Productos**: 1:1 (cuadrado)
- **Categorías**: 4:3 (landscape)
- **Banners**: 16:9 (wide)
- **Hero**: 21:9 (ultrawide)

### Optimización

- **Formatos**: WebP con fallback a JPG
- **Lazy Loading**: Intersection Observer
- **Responsive**: Múltiples tamaños según viewport
- **Placeholders**: Skeleton con color de marca

## Animaciones y Transiciones

### Duraciones

- **Rápida**: 150ms - Micro-interacciones
- **Normal**: 200ms - Hover states
- **Lenta**: 300ms - Transiciones de página
- **Bounce**: 300ms cubic-bezier - Elementos especiales

### Efectos

- **Fade In**: Opacidad 0 → 1
- **Slide Up**: Transform translateY(20px) → 0
- **Scale In**: Transform scale(0.9) → 1
- **Hover Lift**: Transform translateY(-2px)

## Patrones de E-commerce

### Precios

- **Actual**: Texto grande, negro, bold
- **Original**: Texto pequeño, gris, tachado
- **Descuento**: Badge naranja con porcentaje

### Stock

- **Disponible**: Verde + ícono check
- **Poco stock**: Naranja + ícono warning
- **Agotado**: Rojo + ícono x

### Ratings

- **Estrellas**: Amarillo/naranja para llenas, gris para vacías
- **Número**: Texto pequeño gris al lado
- **Tamaño**: 16px para cards, 20px para detalles

## Implementación

### Estructura de Archivos

```
src/design/
├── color-system.ts          # Sistema de colores
├── typography-system.ts     # Sistema tipográfico
├── spacing-grid-system.ts   # Espaciado y grid
├── layout-navigation-system.ts # Layouts y navegación
├── visual-elements-system.ts   # Iconos, imágenes, animaciones
├── ui-components-system.ts     # Componentes específicos
└── design-system-guide.md      # Esta documentación
```

### Uso en Componentes

```typescript
import { colorSystem } from '@/design/color-system'
import { typographySystem } from '@/design/typography-system'
import { uiComponentsSystem } from '@/design/ui-components-system'

// Ejemplo de uso
const ProductCard = styled.div`
  ${uiComponentsSystem.product.productCard.container}

  .title {
    ${uiComponentsSystem.product.productCard.content.title}
  }

  .price {
    color: ${colorSystem.primary[600]};
    ${typographySystem.typography.bodyLarge}
  }
`
```

### Configuración Tailwind

Todos los sistemas están configurados para integrarse perfectamente con Tailwind CSS:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: colorSystem.tailwind.colors,
      fontFamily: typographySystem.tailwind.fontFamily,
      fontSize: typographySystem.tailwind.fontSize,
      spacing: spacingGridSystem.tailwind.spacing,
      // ... más configuraciones
    },
  },
}
```

## Mejores Prácticas

### Desarrollo

1. **Consistencia**: Usar siempre los tokens del design system
2. **Accesibilidad**: Verificar contraste y navegación por teclado
3. **Performance**: Lazy loading y optimización de imágenes
4. **Testing**: Probar en diferentes dispositivos y navegadores

### Diseño

1. **Jerarquía**: Establecer clara jerarquía visual
2. **Espaciado**: Usar la escala de espaciado consistentemente
3. **Colores**: Respetar la paleta y sus usos semánticos
4. **Tipografía**: Mantener la escala y jerarquía tipográfica

### UX

1. **Flujo**: Minimizar pasos para completar compras
2. **Feedback**: Proporcionar feedback claro en todas las acciones
3. **Estados**: Manejar todos los estados (loading, error, vacío)
4. **Mobile**: Priorizar la experiencia móvil

## Casos de Uso Específicos

### Página Shop with Sidebar

- **Layout**: Grid con sidebar sticky
- **Filtros**: Grupos colapsables con clear all
- **Productos**: Grid responsivo con hover effects
- **Paginación**: Números + prev/next

### Página Product Details

- **Galería**: Thumbnails + imagen principal
- **Información**: Jerarquía clara de contenido
- **Variantes**: Selectores visuales intuitivos
- **Acciones**: CTAs prominentes y claros

### Carrito de Compras

- **Items**: Layout horizontal con imagen + detalles
- **Cantidad**: Selector numérico con validación
- **Resumen**: Sticky sidebar con totales
- **Checkout**: Botón prominente y claro

## Mantenimiento

### Versionado

- **Major**: Cambios que rompen compatibilidad
- **Minor**: Nuevos componentes o funcionalidades
- **Patch**: Correcciones y mejoras menores

### Documentación

- Mantener esta guía actualizada
- Documentar nuevos componentes
- Incluir ejemplos de uso
- Registrar decisiones de diseño

### Testing

- Tests de accesibilidad automáticos
- Tests visuales de regresión
- Tests de performance
- Tests en dispositivos reales

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Mantenido por**: Equipo de Design System

Este design system es un documento vivo que evoluciona con las necesidades del producto y los usuarios. Para sugerencias o mejoras, por favor contacta al equipo de design system.
