# 🚀 Guía de Implementación - Pinteya Design System

## 📋 Resumen Ejecutivo

El **Pinteya Design System** ha sido creado específicamente para optimizar la experiencia de usuario en e-commerce de pinturería, ferretería y corralón. Esta guía detalla cómo implementarlo gradualmente en el proyecto existente.

## 🎯 Objetivos del Design System

### ✅ Beneficios Inmediatos

- **Consistencia Visual**: Unificación de componentes y estilos
- **Velocidad de Desarrollo**: Componentes reutilizables y documentados
- **Mantenibilidad**: Tokens centralizados y versionado semántico
- **Accesibilidad**: Cumplimiento WCAG 2.1 AA desde el diseño
- **Performance**: Optimización específica para e-commerce

### 🎨 Características Únicas

- **Paleta Optimizada**: Colores específicos para pinturería
- **Componentes E-commerce**: ProductCard, AddToCartButton, etc.
- **Mobile-First**: Diseño responsive desde mobile
- **Tokens Semánticos**: Variables de diseño con significado

## 📁 Estructura del Proyecto

```
design-system/
├── 🎨 tokens/              # Variables de diseño
│   ├── colors.ts           # Paleta de colores
│   ├── typography.ts       # Sistema tipográfico
│   ├── spacing.ts          # Espaciado y layout
│   └── index.ts           # Exportaciones
├── 🧩 components/          # Componentes UI
│   ├── atoms/             # Componentes básicos
│   │   ├── Button/        # Botones y variantes
│   │   ├── Badge/         # Etiquetas y estados
│   │   └── Input/         # Campos de entrada
│   ├── molecules/         # Componentes compuestos
│   │   ├── ProductCard/   # Card de producto
│   │   ├── SearchBar/     # Barra de búsqueda
│   │   └── Filter/        # Filtros de categoría
│   └── organisms/         # Componentes complejos
│       ├── Header/        # Cabecera del sitio
│       ├── Navigation/    # Navegación principal
│       └── ProductGrid/   # Grilla de productos
├── 📚 docs/               # Documentación
│   ├── storybook/         # Historias interactivas
│   ├── guidelines/        # Guías de uso
│   └── examples/          # Ejemplos de implementación
└── 🔧 config/             # Configuración
    ├── .storybook/        # Config Storybook
    ├── rollup.config.js   # Build configuration
    └── package.json       # Dependencias
```

## 🚀 Plan de Implementación

### Fase 1: Setup Inicial (Semana 1)

```bash
# 1. Instalar dependencias del design system
cd design-system
npm install

# 2. Iniciar Storybook para desarrollo
npm run dev

# 3. Ejecutar tests
npm test
```

### Fase 2: Integración Gradual (Semanas 2-3)

#### 2.1 Importar Tokens

```typescript
// En tu proyecto principal
import { colors, spacing, typography } from '@pinteya/design-system/tokens'

// Usar en Tailwind config
module.exports = {
  theme: {
    extend: {
      colors: colors,
      spacing: spacing,
      fontFamily: typography.fontFamilies,
    },
  },
}
```

#### 2.2 Adoptar Componentes Básicos

```jsx
// Reemplazar botones existentes gradualmente
import { Button, AddToCartButton } from '@pinteya/design-system'

// En ProductCard existente
;<AddToCartButton onClick={handleAddToCart} loading={isLoading}>
  Agregar al carrito
</AddToCartButton>
```

#### 2.3 Mantener Compatibilidad

```jsx
// Wrapper para transición gradual
const LegacyButton = ({ children, ...props }) => {
  return (
    <Button variant='primary' className='legacy-button-styles' {...props}>
      {children}
    </Button>
  )
}
```

### Fase 3: Componentes Avanzados (Semanas 4-5)

#### 3.1 ProductCard Mejorado

```jsx
import { ProductCard } from '@pinteya/design-system'

;<ProductCard
  product={product}
  variant='ecommerce'
  showBadges={true}
  onAddToCart={handleAddToCart}
  onWishlist={handleWishlist}
/>
```

#### 3.2 Navigation System

```jsx
import { Navigation, Header } from '@pinteya/design-system'

;<Header>
  <Navigation
    items={navigationItems}
    variant='ecommerce'
    showCart={true}
    cartCount={cartItems.length}
  />
</Header>
```

### Fase 4: Optimización (Semana 6)

#### 4.1 Performance

- Tree-shaking de componentes no utilizados
- Lazy loading de componentes pesados
- Optimización de bundle size

#### 4.2 Testing

```bash
# Tests de componentes
npm run test

# Tests de accesibilidad
npm run test:a11y

# Tests visuales
npm run chromatic
```

## 🎨 Uso de Tokens

### Colores

```typescript
import { colors } from '@pinteya/design-system/tokens';

// En CSS-in-JS
const styles = {
  primary: colors.primary[500],    // #EF7D00
  background: colors.neutral[50],  // #FFF7EB
  text: colors.text.primary,       // #712F00
};

// En Tailwind classes
<div className="bg-[#FFF7EB] text-[#712F00]">
  <button className="bg-[#EF7D00] hover:bg-[#D16A00]">
    Comprar
  </button>
</div>
```

### Espaciado

```typescript
import { spacing } from '@pinteya/design-system/tokens'

// Espaciado responsive
const cardStyles = {
  padding: spacing.cardPadding, // 16px
  margin: spacing.componentMargin, // 16px
  gap: spacing.gridGap, // 16px
}
```

### Tipografía

```typescript
import { typography } from '@pinteya/design-system/tokens'

// Estilos tipográficos
const textStyles = {
  heading: typography.h3,
  body: typography.body,
  price: typography.ecommerce.priceMain,
}
```

## 🧪 Testing y Calidad

### Tests Automatizados

```bash
# Tests unitarios
npm run test

# Tests de accesibilidad
npm run test:a11y

# Coverage
npm run test:coverage
```

### Validación Visual

```bash
# Storybook para desarrollo
npm run dev

# Build para producción
npm run build-storybook

# Tests visuales con Chromatic
npm run chromatic
```

## 📚 Documentación

### Storybook

- **URL Local**: http://localhost:6006
- **Componentes**: Documentación interactiva
- **Tokens**: Paletas y escalas visuales
- **Guidelines**: Guías de uso

### Ejemplos de Uso

```jsx
// Ejemplo completo de ProductCard
import { ProductCard, Button, Badge } from '@pinteya/design-system'

const ExampleProduct = () => (
  <ProductCard
    image='/product-image.jpg'
    title='Pintura Latex Interior 4L'
    brand='Sherwin Williams'
    price={15250}
    originalPrice={18000}
    discount={15}
    badges={[
      <Badge variant='success'>Envío gratis</Badge>,
      <Badge variant='warning'>Últimas unidades</Badge>,
    ]}
    onAddToCart={() => console.log('Added to cart')}
    onWishlist={() => console.log('Added to wishlist')}
  />
)
```

## 🔄 Versionado y Releases

### Semantic Versioning

- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: Nuevas funcionalidades
- **Patch (1.0.1)**: Bug fixes

### Proceso de Release

```bash
# 1. Actualizar versión
npm version patch|minor|major

# 2. Build del paquete
npm run build

# 3. Publicar (si es paquete npm)
npm publish

# 4. Tag en git
git tag v1.0.0
git push origin v1.0.0
```

## 🤝 Contribución

### Workflow de Desarrollo

1. **Fork** del repositorio
2. **Branch** para nueva funcionalidad
3. **Desarrollo** con tests
4. **Storybook** para documentación
5. **Pull Request** con review
6. **Merge** después de aprobación

### Estándares de Código

- **TypeScript**: Tipado estricto
- **ESLint**: Linting automático
- **Prettier**: Formateo consistente
- **Tests**: Cobertura mínima 80%

## 📞 Soporte

### Recursos

- **Storybook**: Documentación interactiva
- **GitHub Issues**: Reportar bugs
- **Slack/Discord**: Comunicación del equipo
- **Wiki**: Documentación extendida

### Contacto

- **Email**: dev@pinteya.com
- **GitHub**: @SantiagoXOR
- **Proyecto**: https://pinteya-ecommerce.vercel.app
