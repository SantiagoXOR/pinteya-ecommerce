# 🎨 TEMPLATE FIGMA: Performance-Optimized Design System - Pinteya

**Versión**: 1.0  
**Fecha**: Noviembre 3, 2025  
**Propósito**: Design System optimizado para máximo performance web

---

## 📋 ÍNDICE DEL TEMPLATE

```
Pinteya - Performance Design System
├── 📄 00 - COVER & GUIDE
├── 📄 01 - FOUNDATIONS
│   ├── Color System
│   ├── Typography System
│   ├── Spacing System
│   ├── Shadow System
│   └── Grid System
├── 📄 02 - COMPONENTS
│   ├── Buttons
│   ├── Cards
│   ├── Forms
│   ├── Icons
│   └── Skeletons
├── 📄 03 - PATTERNS
│   ├── Hero Sections
│   ├── Product Sections
│   └── Trust Signals
├── 📄 04 - MOBILE PAGES
├── 📄 05 - DESKTOP PAGES
└── 📄 06 - PERFORMANCE SPECS
```

---

## 📄 PÁGINA 00: COVER & GUIDE

### Crear Frame: 1920 × 1080px

**Contenido:**

```
┌────────────────────────────────────────────────┐
│                                                │
│         PINTEYA E-COMMERCE                     │
│    PERFORMANCE-OPTIMIZED DESIGN SYSTEM         │
│                                                │
│  🎯 Objetivo: FCP < 1.5s, Score > 90          │
│                                                │
│  📊 Versión: 1.0                              │
│  📅 Actualizado: Nov 2025                     │
│                                                │
│  ⚡ PERFORMANCE BUDGET:                        │
│  • Hero Image: < 100KB WebP                   │
│  • Product Image: < 40KB WebP                 │
│  • Icons: < 5KB SVG                           │
│  • Total Fonts: 3 weights only               │
│  • Colors: 10 máximo                          │
│                                                │
│  📚 QUICK LINKS:                              │
│  → 01 - Foundations                           │
│  → 02 - Components                            │
│  → 03 - Patterns                              │
│  → 04 - Mobile Pages                          │
│  → 05 - Desktop Pages                         │
│  → 06 - Performance Specs                     │
│                                                │
└────────────────────────────────────────────────┘
```

**Elementos:**
- Background: White
- Title: Bold, 72px, Orange (#f97316)
- Descripción: Regular, 24px, Dark Gray
- Links: SemiBold, 18px, Clickable

---

## 📄 PÁGINA 01: FOUNDATIONS

### 🎨 1.1 COLOR SYSTEM

**Crear Frame: 1920 × 2000px**

#### PRIMARY COLORS (2)
```
┌────────────┐  ┌────────────┐
│            │  │            │
│  #F97316   │  │  #EA580C   │
│  Orange    │  │  Orange    │
│  Primary   │  │  Dark      │
│            │  │            │
└────────────┘  └────────────┘
   500            600
```

**Crear como Variables:**
- Name: `color/primary/500`
- Value: `#F97316`
- Scopes: All fills, strokes, effects

#### SECONDARY & ACCENT (2)
```
┌────────────┐  ┌────────────┐
│  #10B981   │  │  #FBBF24   │
│  Green     │  │  Yellow    │
│  CTA       │  │  Accent    │
└────────────┘  └────────────┘
```

#### NEUTRALS (3)
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  #1F2937   │  │  #6B7280   │  │  #FFFFFF   │
│  Text      │  │  Text      │  │  Background│
│  Primary   │  │  Secondary │  │            │
└────────────┘  └────────────┘  └────────────┘
```

#### FUNCTIONAL (3)
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  #10B981   │  │  #EF4444   │  │  #F59E0B   │
│  Success   │  │  Error     │  │  Warning   │
└────────────┘  └────────────┘  └────────────┘
```

**Total: 10 colores** ✅

**Specs para export:**
```json
{
  "colors": {
    "primary": {
      "500": "#F97316",
      "600": "#EA580C"
    },
    "secondary": "#10B981",
    "accent": "#FBBF24",
    "neutral": {
      "900": "#1F2937",
      "500": "#6B7280",
      "50": "#FFFFFF"
    },
    "functional": {
      "success": "#10B981",
      "error": "#EF4444",
      "warning": "#F59E0B"
    }
  }
}
```

---

### ✍️ 1.2 TYPOGRAPHY SYSTEM

**Frame: 1920 × 1500px**

#### FAMILY
```
Primary: Euclid Circular A
Fallback: -apple-system, BlinkMacSystemFont, sans-serif
```

#### WEIGHTS (Solo 3) ⚡
```
┌─────────────────────────────────────┐
│ Regular (400) - Body text           │
│ The quick brown fox jumps...        │
│ 70% del contenido usa este weight   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SemiBold (600) - Subtítulos         │
│ The quick brown fox jumps...        │
│ 20% del contenido usa este weight   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Bold (700) - Títulos y CTAs         │
│ The quick brown fox jumps...        │
│ 10% del contenido usa este weight   │
└─────────────────────────────────────┘
```

#### SCALE (Modular 1.25 ratio)
```
Display:  48px / 3rem    (Bold)     - Hero titles
H1:       36px / 2.25rem (Bold)     - Page titles
H2:       28px / 1.75rem (SemiBold) - Section titles
H3:       22px / 1.375rem(SemiBold) - Subsections
Body:     16px / 1rem    (Regular)  - Paragraph
Small:    14px / 0.875rem(Regular)  - Labels
```

**Crear Text Styles:**
```
Text Styles:
├── Display/Bold (48px, Bold, #1F2937)
├── Heading/H1 (36px, Bold, #1F2937)
├── Heading/H2 (28px, SemiBold, #1F2937)
├── Heading/H3 (22px, SemiBold, #1F2937)
├── Body/Large (18px, Regular, #1F2937)
├── Body/Regular (16px, Regular, #1F2937)
├── Body/Small (14px, Regular, #6B7280)
└── Label/SemiBold (14px, SemiBold, #1F2937)
```

**⚠️ NO CREAR text styles para:**
- Light (300) - Eliminar
- Medium (500) - Usar SemiBold
- Italic variants - Caso por caso

---

### 📏 1.3 SPACING SYSTEM (4px/8px base)

**Frame: 1920 × 800px**

```
┌──┐  space-1:  4px   ⚡ Micro spacing
│  │
└──┘

┌────┐  space-2:  8px   ⚡ Base unit
│    │
└────┘

┌──────┐  space-3:  12px  ⚡ Small gaps
│      │
└──────┘

┌────────┐  space-4:  16px  ⚡ Standard gaps
│        │
└────────┘

┌────────────┐  space-6:  24px  ⚡ Medium gaps
│            │
└────────────┘

┌────────────────┐  space-8:  32px  ⚡ Large gaps
│                │
└────────────────┘

┌────────────────────────┐  space-12: 48px  ⚡ Section gaps
│                        │
└────────────────────────┘

┌────────────────────────────────┐  space-16: 64px  ⚡ Page gaps
│                                │
└────────────────────────────────┘
```

**Crear como Variables:**
- Collection: "Spacing"
- Type: Number
- Values: 4, 8, 12, 16, 24, 32, 48, 64

---

### 🌑 1.4 SHADOW SYSTEM (Solo 3 niveles)

**Frame: 1920 × 600px**

```
┌──────────────────┐
│                  │  Shadow SM
│   Elevation 1    │  X: 0, Y: 1, Blur: 2
│                  │  Color: #000000 5%
└──────────────────┘

┌──────────────────┐
│                  │  Shadow MD  
│   Elevation 2    │  X: 0, Y: 4, Blur: 6
│                  │  Color: #000000 10%
└──────────────────┘

┌──────────────────┐
│                  │  Shadow LG
│   Elevation 3    │  X: 0, Y: 10, Blur: 15
│                  │  Color: #000000 10%
└──────────────────┘
```

**Crear como Effect Styles:**
- Name: `shadow/sm`, `shadow/md`, `shadow/lg`
- Usar en: Cards (sm), Modals (md), Floating elements (lg)

**⚠️ NO CREAR:**
- Shadows con blur > 20px
- Multiple shadows en mismo elemento
- Shadows con spread > 5px

---

### 📐 1.5 GRID SYSTEM

**Frame: 1920 × 1080px (Desktop)**

```
Desktop Grid (1440px container):
├── Columns: 12
├── Gutter: 24px
├── Margin: 80px
└── Row height: 8px

Tablet Grid (768px):
├── Columns: 8
├── Gutter: 16px
├── Margin: 32px
└── Row height: 8px

Mobile Grid (375px):
├── Columns: 4
├── Gutter: 16px
├── Margin: 16px
└── Row height: 8px
```

**Crear Layout Grids:**
- Desktop: 12 columns, 24px gutter
- Tablet: 8 columns, 16px gutter
- Mobile: 4 columns, 16px gutter

---

## 📄 PÁGINA 02: COMPONENTS

### 🔘 2.1 BUTTONS

**Frame: 1920 × 1200px**

#### Component Set: Button

**Properties:**
```
variant: primary | secondary | ghost | danger
size: small | medium | large
state: default | hover | active | disabled | loading
icon: none | left | right
```

#### Variant: PRIMARY

**Default:**
```
┌────────────────────────┐
│  Ver Todos Productos   │
│  Background: #F97316   │
│  Text: White, SemiBold │
│  Padding: 12px 24px    │
│  Border-radius: 8px    │
└────────────────────────┘
```

**Hover:**
```
┌────────────────────────┐
│  Ver Todos Productos   │
│  Background: #EA580C   │  ← Darker
│  Scale: 1.05           │  ← Transform
│  Shadow: shadow/md     │  ← Elevation
└────────────────────────┘
```

**Loading:**
```
┌────────────────────────┐
│  ⟳ Cargando...         │
│  Background: #EA580C   │
│  Spinner animation     │
│  Pointer: not-allowed  │
└────────────────────────┘
```

**Specs para dev:**
```css
.btn-primary {
  background: #F97316;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #EA580C;
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

**⚡ Performance Note:** CSS puro, NO exportar como imagen

---

### 🃏 2.2 PRODUCT CARD

**Component Set: Product Card**

**Properties:**
```
content: real | skeleton
size: small | medium | large
badge: none | sale | new | featured
```

#### Variant: REAL (Default)

```
┌─────────────────────────────┐
│                             │
│   [Product Image]           │ ← WebP, 300x300, quality 85%
│   300 × 300px               │
│                             │
├─────────────────────────────┤
│ 🏷️ OFERTA                  │ ← Badge (optional)
│                             │
│ Pintura Látex Interior      │ ← H3, SemiBold
│ Sherwin Williams ProMar     │ ← Small, Regular
│                             │
│ ⭐⭐⭐⭐⭐ (124)             │ ← Rating
│                             │
│ $15.999                     │ ← Large, Bold, Orange
│ Antes: $22.999              │ ← Small, line-through
│                             │
│ [Agregar al Carrito]        │ ← Button Primary
└─────────────────────────────┘
```

**Constraints:**
- Width: 300px (mobile), 350px (desktop)
- Height: Auto (Auto Layout)
- Padding: 16px
- Gap: 12px

#### Variant: SKELETON

```
┌─────────────────────────────┐
│                             │
│   [Gray rectangle]          │ ← Shimmer effect
│   300 × 300px               │ ← Placeholder
│   #E5E7EB                   │
│                             │
├─────────────────────────────┤
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬              │ ← Line 85% width
│ ▬▬▬▬▬▬▬                    │ ← Line 60% width
│                             │
│ ▬▬▬▬▬                      │ ← Line 40% width
│                             │
│ ▬▬▬▬▬▬                     │ ← Line 50% width
│ ▬▬▬▬                       │ ← Line 30% width
│                             │
│ [▬▬▬▬▬▬▬▬▬▬▬]              │ ← Button skeleton
└─────────────────────────────┘
```

**Specs para skeleton:**
```css
.product-card-skeleton {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
```

---

### 🎯 2.3 INPUT FIELDS

**Component Set: Input**

**Properties:**
```
state: default | focus | error | success | disabled
type: text | email | password | search
size: small | medium | large
```

**Default:**
```
┌──────────────────────────────────────┐
│ Buscar productos...                  │ 🔍
│ Border: #E5E7EB                      │
│ Padding: 12px 16px                   │
│ Border-radius: 24px (full)           │
└──────────────────────────────────────┘
```

**Focus:**
```
┌──────────────────────────────────────┐
│ Pintura látex|                       │ 🔍
│ Border: #F97316 (2px)                │
│ Ring: #F97316 20% (4px)              │
└──────────────────────────────────────┘
```

**Specs:**
```css
.input {
  border: 1px solid #E5E7EB;
  border-radius: 24px;
  padding: 12px 16px;
  transition: all 0.2s;
}

.input:focus {
  border-color: #F97316;
  outline: none;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
}
```

---

### 🎨 2.4 SKELETONS (Component Library)

**Frame: 1920 × 1500px**

Crear components de skeleton para CADA componente:

```
Product Card Skeleton     → ProductCardSkeleton
Hero Section Skeleton     → HeroSkeleton
Testimonial Skeleton      → TestimonialSkeleton
Newsletter Skeleton       → NewsletterSkeleton
Product List Skeleton     → ProductListSkeleton
```

**Template de skeleton:**
1. Copiar componente real
2. Reemplazar textos con rectangles grises (#E5E7EB)
3. Reemplazar imágenes con rectangles grises
4. Width de líneas: 80%, 60%, 40% alternado
5. Agregar annotation: "Shimmer effect - See CSS specs"

---

## 📄 PÁGINA 03: PATTERNS

### 🦸 3.1 HERO SECTION - Mobile First

**Frame: 375 × 667px (iPhone SE)**

#### HERO MOBILE - Variant A (Recomendado)

```
┌───────────────────────────────┐
│                               │
│  Encontrá la pintura          │ ← H1, Bold, 36px
│  perfecta para tu proyecto    │
│  "perfecta" en Yellow         │
│                               │
│  Miles de productos con       │ ← Body, Regular, 16px
│  envío gratis...              │
│                               │
│  [Ver Productos] →            │ ← Button Primary
│                               │
│  ┌─────────────────────┐     │
│  │                     │     │
│  │  [Ilustración]      │     │ ← SVG 30KB o
│  │  Vectorial simple   │     │   WebP 80KB max
│  │                     │     │
│  └─────────────────────┘     │
│                               │
│  🚚 Envío gratis +$50.000    │ ← Trust signals
│  🛡️ Pago 100% seguro         │   (SVG icons)
│  💳 12 cuotas sin interés    │
│                               │
└───────────────────────────────┘
```

**Measurements:**
- Container: 375px width
- Padding: 16px
- Gap entre elementos: 16px
- Título: 36px line-height 1.2
- Imagen: 343px × 200px (aspect-ratio 16:9)

**Performance Budget:**
- Texto: 0 KB (HTML)
- Botón: 0 KB (CSS)
- Imagen: < 80KB (WebP o SVG)
- Icons: < 15KB total (SVG)
- **Total: < 95KB** ✅

---

#### HERO DESKTOP - Variant B

**Frame: 1440 × 600px**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│ [Texto lado izquierdo]      [Carousel lado derecho]    │
│                                                         │
│ 🟢 10,000 clientes          ┌──────────────┐           │
│                             │              │           │
│ Encontrá la pintura         │  [Imagen 1]  │           │
│ perfecta para tu proyecto   │              │           │
│ "perfecta" en Yellow        │              │           │
│                             └──────────────┘           │
│ Miles de productos...          ← → ○●○                 │
│                                                         │
│ [Ver Productos →]                                       │
│ [Ofertas 30% OFF]                                       │
│                                                         │
│ 🚚 Envío  🛡️ Pago  💳 12 cuotas                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Grid: 2 columnas**
- Columna 1 (Texto): 7 columns
- Columna 2 (Visual): 5 columns
- Gap: 48px

---

### 📦 3.2 PRODUCT GRID PATTERN

**Frame: 1440 × 2000px**

```
Grid de productos:
├── Mobile: 1 column
├── Tablet: 2 columns
└── Desktop: 3-4 columns

Gap: 24px
Padding: 16px (mobile), 32px (desktop)
```

**Con Progressive Loading:**

```
Above the fold (primeros 3):
┌─────┐ ┌─────┐ ┌─────┐
│ [1] │ │ [2] │ │ [3] │  ← Render inmediato
└─────┘ └─────┘ └─────┘

Below the fold (resto):
┌─────┐ ┌─────┐ ┌─────┐
│ [-] │ │ [-] │ │ [-] │  ← Skeleton inicial
└─────┘ └─────┘ └─────┘  → Load al scroll
```

**Annotation en Figma:**
```
⚡ PERFORMANCE:
• Above-fold: Render inmediato (3 productos)
• Below-fold: Progressive loading con skeleton
• Implementar: useProgressiveLoading hook
```

---

### 💬 3.3 TESTIMONIALS PATTERN

**Component Set: Testimonial**

**Properties:**
```
content: real | skeleton
layout: card | inline
image: person | illustration
```

#### Real Content:
```
┌────────────────────────────────────┐
│  ┌──┐                              │
│  │👤│  Juan Pérez                  │ ← Avatar 48px
│  └──┘  ⭐⭐⭐⭐⭐                    │   (Circular)
│                                    │
│  "Excelente servicio, llegó       │ ← Body Regular
│   rápido y la pintura es de       │   16px, 3-4 líneas
│   excelente calidad."              │
│                                    │
│  Cliente desde 2023                │ ← Small, light
└────────────────────────────────────┘
```

#### Skeleton:
```
┌────────────────────────────────────┐
│  ┌──┐                              │
│  │░░│  ▬▬▬▬▬▬▬                     │ ← Circle + line
│  └──┘  ▬▬▬▬                        │
│                                    │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬          │ ← Text lines
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬            │   80%, 60%
│  ▬▬▬▬▬▬▬▬▬▬▬▬                     │   40%
│                                    │
│  ▬▬▬▬▬▬                           │ ← Small line
└────────────────────────────────────┘
```

**Performance specs:**
```
Avatar: 
• Si foto real: WebP 48x48, 10KB max
• Mejor: Ilustración SVG o iniciales con CSS

Text: 
• HTML text (0 KB), no imagen

Card:
• Background: CSS color
• Shadow: CSS shadow/sm
• Border-radius: CSS 12px
```

---

## 📄 PÁGINA 04: MOBILE PAGES

### 📱 4.1 HOMEPAGE MOBILE - Performance Optimized

**Frame: 375 × 2500px (scrollable)**

#### Above the Fold (0-667px) ⚡ CRÍTICO

```
┌───────────────────────────────┐  ← 0px
│ [Header - Orange]             │
│ Logo | Buscar 🔍              │
├───────────────────────────────┤  ← 60px
│                               │
│  Encontrá la pintura          │  ← Hero text only
│  perfecta                     │
│                               │
│  [Ver Productos →]            │  ← CTA principal
│                               │
├───────────────────────────────┤  ← 320px
│ 🏷️ 30% OFF | FLASH DAYS     │  ← Banner simple
├───────────────────────────────┤  ← 400px
│ Categorías rápidas:           │
│ ○ Paredes ○ Metales ○ Techos │  ← Icons row
├───────────────────────────────┤  ← 500px
│                               │
│ [Productos destacados - 3]    │  ← Above fold
│ [Card 1] [Card 2] [Card 3]    │
│                               │
└───────────────────────────────┘  ← 667px (FOLD LINE)
```

**⚡ Performance Budget Above-the-Fold:**
```
Header: ~0 KB (CSS)
Hero text: ~0 KB (HTML)
Banner: ~0 KB (CSS + text)
Category icons: ~15 KB (SVG)
Product cards (3): ~120 KB (3 × 40KB WebP)
────────────────────────────────
TOTAL: ~135 KB ✅ Excelente
```

#### Below the Fold (667px+) - Progressive Loading

```
├───────────────────────────────┤  ← 667px
│                               │
│ [Skeleton]                    │  ← Mostrar primero
│ [Skeleton]                    │
│ ▼ Scroll para cargar ▼        │
│                               │
├───────────────────────────────┤  ← Al hacer scroll
│                               │
│ [Productos - Load al scroll]  │  ← Progressive
│                               │
├───────────────────────────────┤
│ [Testimonials - Skeleton]     │  ← Content Visibility
│                               │
├───────────────────────────────┤
│ [Newsletter - Skeleton]       │
│                               │
└───────────────────────────────┘
```

**Annotation:**
```
⚡ IMPLEMENTATION:
• Above-fold: Render inmediato
• Below-fold: useProgressiveLoading({ rootMargin: '300px' })
• Skeletons: AdvancedSkeleton component
• Content-visibility: auto en CSS
```

---

### 🖼️ 4.2 HERO SECTION - 3 Variantes Optimizadas

#### VARIANT A: Text + Ilustración (Más ligero)

```
┌───────────────────────────────┐
│ Background: Orange gradient   │
│                               │
│  Encontrá la pintura          │
│  perfecta                     │
│                               │
│  [Ilustración SVG]            │ ← 20-30KB SVG
│  Simple, 2-3 colores          │
│                               │
│  [Ver Productos]              │
└───────────────────────────────┘

Budget: ~30 KB total ✅
```

#### VARIANT B: Text + Imagen Optimizada

```
┌───────────────────────────────┐
│ Background: Orange gradient   │
│                               │
│  Encontrá la pintura          │
│  perfecta                     │
│                               │
│  [Imagen WebP]                │ ← 80KB WebP quality 85%
│  375 × 240px                  │
│                               │
│  [Ver Productos]              │
└───────────────────────────────┘

Budget: ~80 KB total ✅
```

#### VARIANT C: Text Only (Ultra ligero)

```
┌───────────────────────────────┐
│ Background: Orange gradient   │
│ + decorative shapes (CSS)     │
│                               │
│  Encontrá la pintura          │
│  perfecta para tu proyecto    │
│                               │
│  Miles de productos con       │
│  envío gratis...              │
│                               │
│  [Ver Productos] [Ofertas]    │
│                               │
│  🚚 🛡️ 💳 Trust signals      │
└───────────────────────────────┘

Budget: ~15 KB (solo icons) ✅
```

**Recomendación:** VARIANT C para máximo performance

---

## 📄 PÁGINA 05: DESKTOP PAGES

### 💻 5.1 HOMEPAGE DESKTOP

**Frame: 1440 × 3000px**

#### Layout Optimizado:

```
┌─────────────────────────────────────────────────────┐
│ [Header] - Sticky, optimizado                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [HERO] - 1440 × 600px                              │
│ • Texto izquierda (60%)                            │
│ • Visual derecha (40%)                             │
│ • Budget: < 150KB total                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [CATEGORIES BAR] - Quick navigation                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [PRODUCTS GRID] - 3-4 columns                      │
│ • Above fold: 4 productos                          │
│ • Below fold: Progressive loading                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [TESTIMONIALS] - Content Visibility                 │
├─────────────────────────────────────────────────────┤
│ [NEWSLETTER] - Content Visibility                   │
└─────────────────────────────────────────────────────┘
```

**Fold line:** 900px (Above this = critical)

---

## 📄 PÁGINA 06: PERFORMANCE SPECS

### 📊 6.1 IMAGE BUDGET MATRIX

**Crear tabla en Figma:**

```
┌──────────────────┬──────────┬───────────┬────────────┐
│ Component        │ Size     │ Format    │ Max Weight │
├──────────────────┼──────────┼───────────┼────────────┤
│ Hero Mobile      │ 375×240  │ WebP 85%  │ 80 KB      │
│ Hero Desktop     │ 800×500  │ WebP 85%  │ 150 KB     │
│ Product Card     │ 300×300  │ WebP 85%  │ 40 KB      │
│ Product Thumb    │ 150×150  │ WebP 75%  │ 15 KB      │
│ Category Icon    │ 64×64    │ SVG       │ 3 KB       │
│ Logo             │ 200×100  │ SVG       │ 8 KB       │
│ Trust Icons      │ 24×24    │ SVG       │ 2 KB       │
│ Avatar           │ 48×48    │ WebP 75%  │ 5 KB       │
└──────────────────┴──────────┴───────────┴────────────┘

TOTAL ABOVE-FOLD: < 200 KB ✅
```

---

### ⚡ 6.2 COMPONENT WEIGHT BUDGET

```
┌────────────────────┬─────────────┬─────────┐
│ Component          │ Weight      │ Status  │
├────────────────────┼─────────────┼─────────┤
│ Header             │ CSS only    │ ✅      │
│ Hero (text)        │ 0 KB        │ ✅      │
│ Hero (image)       │ < 100 KB    │ ⚠️      │
│ Product Card       │ < 40 KB     │ ✅      │
│ Carousel (Swiper)  │ Lazy 60 KB  │ ✅      │
│ Testimonial        │ < 20 KB     │ ✅      │
│ Newsletter         │ CSS only    │ ✅      │
│ Footer             │ CSS only    │ ✅      │
└────────────────────┴─────────────┴─────────┘
```

---

### 🎯 6.3 CRITICAL RENDERING PATH

**Diagrama en Figma:**

```
CRITICAL PATH (Above-the-fold):
┌──────┐
│ HTML │ → 0-100ms
└──────┘
    ↓
┌──────┐
│ CSS  │ → 100-200ms (Critical inline)
└──────┘
    ↓
┌──────┐
│ Font │ → 200-400ms (2 weights preload)
└──────┘
    ↓
┌──────┐
│ Hero │ → 400-800ms (WebP priority: high)
└──────┘
    ↓
┌──────┐
│ FCP  │ ← 800ms-1.2s ✅ TARGET
└──────┘

NON-CRITICAL (Below-the-fold):
• Swiper: Lazy load (no bloquea FCP)
• Productos: Progressive load
• Testimonials: Content visibility
• Newsletter: Content visibility
```

---

## 🛠️ PASO A PASO: CREAR EL TEMPLATE EN FIGMA

### PASO 1: Setup Inicial (15 min)

1. **Crear nuevo archivo:** "Pinteya - Performance Design System"

2. **Instalar plugins:**
   ```
   - Design Lint
   - TinyImage Compressor
   - SVGO Compressor
   - Skeleton
   - Design Tokens
   - Lucide Icons
   ```

3. **Crear páginas:**
   ```
   - 00 - Cover
   - 01 - Foundations
   - 02 - Components
   - 03 - Patterns
   - 04 - Mobile Pages
   - 05 - Desktop Pages
   - 06 - Performance Specs
   ```

---

### PASO 2: Foundations (30 min)

1. **Color Variables:**
   - Variables → New collection → "Colors"
   - Crear 10 colores según sistema
   - Aplicar en todos los elementos

2. **Typography:**
   - Importar Euclid Circular A (Regular, SemiBold, Bold)
   - Crear 8 Text Styles
   - Eliminar weights innecesarios

3. **Spacing:**
   - Variables → New collection → "Spacing"
   - Valores: 4, 8, 12, 16, 24, 32, 48, 64

4. **Shadows:**
   - Effect Styles → 3 shadows
   - Specs: sm, md, lg

---

### PASO 3: Components (1 hora)

1. **Button Component:**
   - Component Set con variants
   - 4 variantes × 3 sizes × 5 states = 60 variants
   - Auto Layout para responsive

2. **Product Card:**
   - Real variant
   - Skeleton variant
   - Auto Layout
   - Constraints: Width 300px

3. **Input Field:**
   - 4 states (default, focus, error, success)
   - Auto Layout
   - Icon support (left/right)

4. **Skeleton Library:**
   - ProductCardSkeleton
   - HeroSkeleton
   - TestimonialSkeleton
   - Usar rectangles con #E5E7EB

---

### PASO 4: Patterns (1 hora)

1. **Hero Section:**
   - 3 variantes (A, B, C)
   - Mobile + Desktop
   - Con performance annotations

2. **Product Grid:**
   - Con progressive loading markers
   - Above/below fold claramente marcado

3. **Testimonials:**
   - Real + skeleton
   - Layout options

---

### PASO 5: Pages (1 hora)

1. **Homepage Mobile:**
   - 375px width
   - Usar components creados
   - Marcar fold line (667px)
   - Annotations de performance

2. **Homepage Desktop:**
   - 1440px width
   - Usar components
   - Marcar critical content

---

### PASO 6: Documentation (30 min)

1. **Performance Specs page:**
   - Image budget table
   - Component weight table
   - Critical rendering path diagram

2. **Cover page:**
   - Índice con links
   - Quick start guide
   - Performance targets

---

## 📐 MEASUREMENTS EXACTAS - Copy & Paste

### HEADER MOBILE
```
Height: 92px (incluye banner)
├── Top Banner: 28px
│   ├── Text: 11px, Regular
│   ├── Background: #064E3B (dark green)
│   └── Padding: 6px 16px
└── Main Header: 64px
    ├── Logo width: 100px
    ├── Search bar: Fill width - 120px
    └── Padding: 12px 16px
```

### HERO MOBILE
```
Height: 320px minimum
├── Padding: 16px
├── Title: 36px, Bold, line-height 1.2
├── Subtitle: 16px, Regular, line-height 1.5
├── CTA: 48px height, 100% width
├── Image: 343px × 200px (aspect 16:9)
└── Gap between elements: 16px
```

### PRODUCT CARD
```
Width: 300px (mobile), 350px (desktop)
Height: Auto (Auto Layout)
├── Image: 300×300px (square)
├── Padding: 16px
├── Gap: 12px
├── Title: 18px, SemiBold, 2 lines max
├── Price: 24px, Bold, Orange
└── Button: 40px height, 100% width
```

---

## 🎨 COLOR PALETTE - Exacta con Hex Codes

### PRIMARY
```
Orange 500: #F97316  ← Principal (botones, links)
Orange 600: #EA580C  ← Dark (hover states)
Orange 400: #FB923C  ← Light (backgrounds)
```

### SECONDARY
```
Green 500: #10B981  ← CTAs secundarios, success
Green 600: #059669  ← Green dark (hover)
```

### ACCENT
```
Yellow 400: #FBBF24  ← Highlights, badges
```

### NEUTRALS
```
Gray 900: #1F2937  ← Text principal
Gray 500: #6B7280  ← Text secundario
Gray 200: #E5E7EB  ← Borders, skeletons
White:    #FFFFFF  ← Background
```

### FUNCTIONAL
```
Success: #10B981  (Green)
Error:   #EF4444  (Red)
Warning: #F59E0B  (Amber)
```

---

## ✅ CHECKLIST FINAL - Pre-Handoff

### Design Quality
- [ ] Solo 10 colores usados
- [ ] Solo 3 font weights usados
- [ ] Spacing usa sistema 4px/8px
- [ ] Shadows máximo 3 niveles
- [ ] Components tienen variants (real + skeleton)
- [ ] Auto Layout en todos los components
- [ ] Naming conventions consistentes

### Performance
- [ ] Image budget documentado
- [ ] Hero image < 100KB (WebP)
- [ ] Product images < 40KB (WebP)
- [ ] Icons son SVG < 5KB
- [ ] Above-the-fold < 200KB total
- [ ] Skeleton states diseñados
- [ ] Progressive loading anotado
- [ ] Critical path documented

### Documentation
- [ ] Performance specs page completa
- [ ] Component annotations
- [ ] CSS specs para animations
- [ ] Export settings documentados
- [ ] Fold lines marcadas
- [ ] Dev notes agregadas

---

## 📤 EXPORT CHECKLIST

### Antes de exportar:

1. **Optimizar imágenes:**
   - Run: TinyImage Compressor plugin
   - Verificar tamaño < budget

2. **Optimizar SVGs:**
   - Run: SVGO Compressor plugin
   - Remove unnecessary groups

3. **Verificar design:**
   - Run: Design Lint plugin
   - Fix warnings

4. **Export settings:**
   ```
   PNG → Convertir a WebP después
   SVG → Outline strokes, Simplify
   Format: 2x for retina displays
   ```

---

## 🎯 RESULTADO FINAL ESPERADO

Un Design System en Figma que:

✅ **Es performance-first**
- Todo diseñado pensando en web performance
- Budgets de peso documentados
- Skeleton states incluidos

✅ **Es developer-friendly**
- Specs claras y auto-documentadas
- Variables exportables
- Code snippets incluidos

✅ **Es escalable**
- Component library completa
- Variants bien organizadas
- Fácil de mantener

✅ **Es consistente**
- Sistema de colores limitado
- Typography system claro
- Spacing predecible

---

## 📚 RECURSOS ADICIONALES

### Plugins Figma Esenciales:
1. **Design Lint** - Verificar consistencia
2. **Stark** - Accessibility checking
3. **TinyImage** - Comprimir exports
4. **Design Tokens** - Exportar variables
5. **Figma to Code** - Generar React code

### Referencias:
- Material Design - Sistema de spacing
- Tailwind CSS - Color system
- Ant Design - Component patterns
- Shadcn/ui - Component variants

---

## 🚀 PRÓXIMOS PASOS

1. **Crear template en Figma** (3-4 horas)
2. **Poblar con componentes de Pinteya** (2 horas)
3. **Documentar performance specs** (1 hora)
4. **Review con developers** (1 hora)
5. **Export y handoff** (30 min)

**Total: ~7 horas** para template completo

---

## 💡 TIPS FINALES

### DO's ✅
1. Diseñar mobile-first siempre
2. Crear skeleton para cada component
3. Documentar budgets de peso
4. Usar Auto Layout everywhere
5. Limitar colores y fonts
6. Exportar en múltiples resoluciones

### DON'Ts ❌
1. NO usar demasiados colores (>12)
2. NO usar muchos font weights (>4)
3. NO exportar botones como imágenes
4. NO olvidar annotations de performance
5. NO diseñar sin considerar fold line
6. NO usar fotos sin optimizar

---

**¿Necesitas que detalle alguna sección específica o quieres que exporte specs concretas para algún componente?** 🎨
















