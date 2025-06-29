# 🎨 Pinteya Design System

## Visión General

El **Pinteya Design System** es un sistema de diseño específicamente creado para e-commerce de pinturería, ferretería y corralón. Optimizado para conversión, accesibilidad y experiencia de usuario en el sector de materiales de construcción.

## 🎯 Principios de Diseño

### 1. **Confianza y Profesionalismo**
- Colores que transmiten calidad y confianza
- Tipografía clara y legible
- Componentes que inspiran seguridad en la compra

### 2. **Optimización para Conversión**
- CTAs prominentes y claros
- Flujos de compra simplificados
- Información de producto destacada

### 3. **Accesibilidad Universal**
- Contraste WCAG 2.1 AA
- Navegación por teclado
- Lectores de pantalla compatibles

### 4. **Mobile-First**
- Diseño responsive desde mobile
- Touch-friendly interactions
- Performance optimizada

## 🎨 Paleta de Colores

### Colores Primarios
- **Blaze Orange**: `#EF7D00` - CTAs principales, precios, ofertas
- **Fun Green**: `#00A651` - Éxito, disponibilidad, envío gratis
- **Bright Sun**: `#FFD700` - Destacados, badges, promociones

### Colores Neutros
- **Warm Beige**: `#FFF7EB` - Fondos de cards, secciones suaves
- **Deep Brown**: `#712F00` - Textos principales, títulos
- **Light Gray**: `#F5F5F5` - Fondos generales
- **Dark Gray**: `#333333` - Textos secundarios

## 📐 Sistema de Espaciado

Basado en múltiplos de 4px para consistencia:
- **xs**: 4px
- **sm**: 8px  
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

## 📱 Breakpoints

```css
xs: 0px      /* Mobile portrait */
sm: 576px    /* Mobile landscape */
md: 768px    /* Tablet */
lg: 992px    /* Desktop */
xl: 1200px   /* Large desktop */
xxl: 1600px  /* Extra large */
```

## 🔤 Tipografía

### Jerarquía
- **H1**: 32px/40px - Títulos principales
- **H2**: 24px/32px - Títulos de sección
- **H3**: 20px/28px - Títulos de producto
- **H4**: 18px/24px - Subtítulos
- **Body**: 16px/24px - Texto principal
- **Small**: 14px/20px - Texto secundario
- **Caption**: 12px/16px - Metadatos

## 🧩 Arquitectura de Componentes

### Atoms (Átomos)
- Button
- Badge
- Input
- Icon
- Price

### Molecules (Moléculas)
- ProductCard
- SearchBar
- Filter
- PriceRange
- Rating

### Organisms (Organismos)
- ProductGrid
- Header
- Navigation
- Checkout
- Footer

### Templates (Plantillas)
- ProductPage
- CategoryPage
- CheckoutPage
- HomePage

## 📚 Documentación

- **Storybook**: Componentes interactivos
- **Tokens**: Variables de diseño
- **Guidelines**: Guías de uso
- **Examples**: Implementaciones reales

## 🚀 Instalación

```bash
npm install @pinteya/design-system
```

## 📖 Uso Básico

```jsx
import { Button, ProductCard, PinteyaProvider } from '@pinteya/design-system';

function App() {
  return (
    <PinteyaProvider>
      <ProductCard 
        product={product}
        onAddToCart={handleAddToCart}
      />
      <Button variant="primary">
        Comprar Ahora
      </Button>
    </PinteyaProvider>
  );
}
```

## 🔄 Versionado

Seguimos [Semantic Versioning](https://semver.org/):
- **Major**: Cambios breaking
- **Minor**: Nuevas funcionalidades
- **Patch**: Bug fixes

## 🤝 Contribución

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guías de contribución.

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para detalles.
