# 🎨 Design System Pinteya E-commerce

> Sistema de diseño enterprise-ready mobile-first especializado en productos de pinturería en Argentina

[![Fase 3](https://img.shields.io/badge/Fase%203-Completada-success)](./phase-3-completion-report.md)
[![Tests](https://img.shields.io/badge/Tests-480%20passing-brightgreen)](../testing/README.md)
[![Visual Testing](https://img.shields.io/badge/Visual%20Testing-Chromatic-purple)](../testing/visual-regression.md)
[![Performance](https://img.shields.io/badge/Performance-Optimized-green)](./performance-optimizations.md)

## 📋 Índice

### 🎯 **Fundamentos**
- [🎨 Tokens de Diseño](./tokens.md)
- [🌈 Paleta de Colores](./colors.md)
- [📝 Tipografía](./typography.md)
- [📏 Espaciado](./spacing.md)
- [🔲 Bordes y Sombras](./borders-shadows.md)

### 🧩 **Componentes**
- [🔘 Botones](./components/buttons.md)
- [📝 Formularios](./components/forms.md)
- [🃏 Cards](./components/cards.md)
- [🏷️ Badges](./components/badges.md)
- [🔔 Modales](./components/modals.md)
- [🧭 Navegación](./components/navigation.md)

### 🎭 **Estados e Interacciones**
- [⚡ Estados de Componentes](./states.md)
- [🎬 Animaciones](./animations.md)
- [📱 Responsive Design](./responsive.md)

### 🎯 **Especialización Pinturería**
- [🎨 Iconografía 3D](./icons.md)
- [🛍️ Componentes de E-commerce](./ecommerce.md)
- [🛒 Componentes E-commerce (NUEVOS)](./ecommerce-components.md)
- [🇦🇷 Localización Argentina](./localization.md)

### 🚀 **Implementación**
- [📦 Instalación](./installation.md)
- [🔧 Configuración](./configuration.md)
- [📋 Roadmap](./roadmap.md)

### 🧪 **Testing & Calidad (Fase 3)**
- [🎭 Testing Visual Regression](../testing/visual-regression.md)
- [♿ Testing de Accesibilidad](./accessibility-verification.md)
- [⚡ Optimizaciones de Performance](./performance-optimizations.md)
- [📊 Reporte Fase 3](./phase-3-completion-report.md)

---

## 🎯 Visión General

El Design System Pinteya está diseñado específicamente para el mercado argentino de pinturería, ferretería y corralón, siguiendo las mejores prácticas de UX/UI inspiradas en:

- **Mercado Libre Argentina**: Navegación inferior fija, badges animados, destacados de "Envío gratis"
- **Airbnb**: Iconografía 3D isométrica, colores vibrantes, estilo friendly
- **Mobile-first**: Optimizado para dispositivos móviles con experiencia desktop mejorada

## 🎨 Principios de Diseño

### 1. **Mobile-First**
- Diseño prioritario para dispositivos móviles
- Navegación táctil optimizada
- Componentes adaptables

### 2. **Especialización Pinturería**
- Paleta de colores Tahiti Gold (#fc9d04)
- Iconografía específica del rubro
- Terminología argentina

### 3. **Accesibilidad**
- WCAG 2.1 AA compliance
- Contraste optimizado
- Navegación por teclado

### 4. **Performance**
- Componentes optimizados
- Lazy loading
- Core Web Vitals

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS 3.4+
- **Componentes**: shadcn/ui + Radix UI
- **Iconos**: Lucide React
- **Fuentes**: Inter (Google Fonts)

## 🎨 Paleta Principal

```css
/* Blaze Orange - Color Principal */
--blaze-orange-50: #fef7ee;
--blaze-orange-500: #f27a1d;  /* Principal */
--blaze-orange-600: #eb6313;  /* Hover */
--blaze-orange-700: #bd4811;  /* Active */

/* Fun Green - Color Secundario */
--fun-green-500: #00f269;     /* Principal */
--fun-green-600: #00ca53;     /* Hover */
--fun-green-700: #009e44;     /* Active */

/* Bright Sun - Color de Acento */
--bright-sun-500: #f9a007;    /* Principal */
--bright-sun-600: #dd7802;    /* Hover */
--bright-sun-700: #b75406;    /* Active */

/* Colores Neutros */
--white: #ffffff;
--gray-50: #f8f9fa;
--teal-600: #2c5f5d;  /* Azul petróleo */
```

## 🧩 Componentes Principales

### Botones
- **Primary**: Blaze Orange con hover effects
- **Secondary**: Fun Green con outline
- **Ghost**: Transparente con hover sutil

### Cards de Producto
- **Imagen**: Aspect ratio 1:1 optimizado
- **Badges**: "OFERTA", "Envío gratis"
- **Precios**: Destacados con descuentos

### Navegación
- **Header**: Logo + Buscador + Carrito
- **Bottom Navigation**: Home, Ofertas, Pedidos, Perfil
- **Breadcrumbs**: Navegación contextual

## 📱 Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Móviles grandes */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop pequeño */
xl: 1280px  /* Desktop grande */
2xl: 1536px /* Desktop extra grande */
```

## 🎯 Propuesta de Valor

**"Envío gratis en el día en Córdoba Capital"**

- Destacar beneficios de envío
- Badges promocionales visibles
- CTAs claros y directos

---

## 🚀 Inicio Rápido

1. **Instalar dependencias**:
```bash
npm install
```

2. **Explorar Storybook**:
```bash
npm run storybook
# Abre http://localhost:6006
```

3. **Usar componentes**:
```tsx
import { Button } from "@/components/ui/button"

<Button variant="primary">
  Agregar al carrito
</Button>
```

## 📚 Storybook - Documentación Interactiva

**🔗 [Ver Storybook en vivo](https://santiagoXOR.github.io/pinteya-ecommerce/storybook/)**

### Características de Storybook

- **📖 Documentación interactiva**: Todos los componentes con ejemplos
- **🎛️ Controles en tiempo real**: Experimenta con props y estados
- **♿ Testing de accesibilidad**: Addon A11y integrado
- **📱 Responsive testing**: Viewports móvil, tablet, desktop
- **🎨 Design tokens**: Visualización de colores, tipografía, espaciado

### Comandos Storybook

```bash
# Desarrollo local
npm run storybook

# Build para producción
npm run build-storybook

# Deploy automático (GitHub Actions)
# Se ejecuta en cada push a main
```

## 📊 Estado Actual del Design System (Enero 2025)

### ✅ Fase 1: Componentes E-commerce Base (COMPLETADA)
- **PriceDisplay**: Componente para mostrar precios con descuentos y cuotas
- **StockIndicator**: Indicador de stock con alertas de bajo inventario
- **ShippingInfo**: Información de envío con calculadora y garantías
- **EnhancedProductCard**: ProductCard inteligente con configuración automática

**Métricas Fase 1:**
- ✅ 4/4 componentes implementados
- ✅ 14/14 tests pasando (100%)
- ✅ Documentación completa con Storybook
- ✅ Integración en producción activada

### ✅ Fase 2: Componentes Avanzados E-commerce (COMPLETADA)
- **CartSummary**: Resumen de carrito con integración completa DS (3 variantes)
- **CheckoutFlow**: Flujo de checkout paso a paso con navegación inteligente
- **ProductComparison**: Comparación de productos lado a lado (hasta 4 productos)
- **WishlistCard**: Card de wishlist con seguimiento de precios e historial

**Métricas Fase 2:**
- ✅ 4/4 componentes avanzados implementados
- ✅ 31/31 tests pasando (100%) - CartSummary: 13, CheckoutFlow: 18
- ✅ Integración 100% con componentes base del Design System
- ✅ Exports centralizados en `src/components/ui/index.ts`
- ✅ TypeScript types exportados para todos los componentes

### 🔄 Fase 3: Testing Visual & Performance (EN PROGRESO)
- **Testing Visual Regression**: Configuración Chromatic + Storybook
- **Tests de Accesibilidad**: Automatización con addon A11y
- **Performance Testing**: Lighthouse + bundle size optimization
- **Tree-shaking**: Optimización de componentes no utilizados

**Progreso Fase 3:**
- 🔄 Testing visual regression: Pendiente
- 🔄 Optimización performance: Pendiente
- 🔄 Lazy loading componentes: Pendiente

### 📈 Métricas Generales del Design System

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Componentes Totales** | 8 | ✅ |
| **Tests Unitarios** | 31/31 | ✅ 100% |
| **Cobertura de Código** | 85%+ | ✅ |
| **Documentación Storybook** | 8/8 | ✅ 100% |
| **Integración Producción** | Activa | ✅ |
| **TypeScript Support** | Completo | ✅ |

## 📚 Documentación Detallada

Cada sección del Design System incluye:
- ✅ Especificaciones técnicas
- ✅ Ejemplos de código
- ✅ Casos de uso
- ✅ Mejores prácticas
- ✅ Criterios de aceptación

---

*Última actualización: Enero 2025*



