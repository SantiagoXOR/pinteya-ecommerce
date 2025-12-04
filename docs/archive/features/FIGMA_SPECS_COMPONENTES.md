# 📐 SPECS EXACTAS DE COMPONENTES - Copy/Paste para Figma

Esta guía contiene las medidas exactas para crear cada componente en Figma.

---

## 🔘 BUTTON - Primary

### Desktop (Medium Size)

**Frame Properties:**
```
Width: Hug (Auto Layout)
Height: 48px
Min Width: 120px
Max Width: 400px
```

**Auto Layout:**
```
Horizontal padding: 24px
Vertical padding: 12px
Gap between items: 8px
Alignment: Center, Middle
```

**Fill:**
```
Type: Solid
Color: #F97316 (Orange 500)
```

**Text:**
```
Content: "Ver Todos los Productos"
Font: Euclid Circular A
Weight: SemiBold (600)
Size: 16px
Line height: 24px (150%)
Color: #FFFFFF (White)
Letter spacing: 0px
```

**Border Radius:**
```
All corners: 8px
```

**Effects:**
```
Drop Shadow (hover only):
X: 0, Y: 4, Blur: 6, Spread: 0
Color: #000000 10% opacity
```

**States:**

1. **Default**: Fill #F97316
2. **Hover**: Fill #EA580C, Shadow sm, Scale 105%
3. **Active**: Fill #BD4811, Scale 98%
4. **Disabled**: Fill #E5E7EB, Text #9CA3AF
5. **Loading**: Fill #EA580C, Spinner icon

---

### Mobile (Medium Size)

**Frame Properties:**
```
Width: Fill container (100%)
Height: 48px
```

**Rest**: Igual que desktop

---

## 🃏 PRODUCT CARD - Real Content

### Mobile Version (300px)

**Frame:**
```
Width: 300px (Fixed)
Height: Auto (Hug content)
```

**Auto Layout (Vertical):**
```
Padding: 16px all sides
Gap: 12px
Alignment: Top Left
```

**Layers:**

1. **Image Container:**
   ```
   Width: 268px (300 - 32px padding)
   Height: 268px (Square)
   Border radius: 12px
   Overflow: Hidden
   
   Inside:
   ├── [Image]: Fill container, Aspect ratio 1:1
   ├── Badge (optional): Top right, 8px margin
   └── Heart icon: Top left, 8px margin
   ```

2. **Content Area:**
   ```
   Auto Layout (Vertical)
   Gap: 8px
   
   ├── Title
   │   Font: Euclid Circular A SemiBold
   │   Size: 18px
   │   Line height: 24px (133%)
   │   Color: #1F2937
   │   Max lines: 2
   │   Width: Fill
   │
   ├── Brand
   │   Font: Regular
   │   Size: 14px
   │   Line height: 20px
   │   Color: #6B7280
   │
   ├── Rating
   │   Auto Layout (Horizontal)
   │   Gap: 4px
   │   ├── Stars: ⭐⭐⭐⭐⭐ (SVG or Unicode)
   │   └── Count: (124) Regular 14px
   │
   └── Price Area
       Auto Layout (Vertical)
       Gap: 4px
       ├── Current Price
       │   Font: Bold
       │   Size: 24px
       │   Color: #F97316 (Orange)
       │
       └── Old Price (if sale)
           Font: Regular
           Size: 16px
           Color: #9CA3AF
           Decoration: Line through
   ```

3. **CTA Button:**
   ```
   Use: Button/Primary/Medium component
   Width: Fill (100%)
   Text: "Agregar al Carrito"
   ```

**Total Height:** ~480px (auto)

---

## 🃏 PRODUCT CARD - Skeleton

### Copy from Real, Then:

1. **Replace Image:**
   ```
   Delete image
   Add: Rectangle 268×268
   Fill: #E5E7EB
   Add annotation: "Shimmer effect (see CSS)"
   ```

2. **Replace Title:**
   ```
   Delete text
   Add: Rectangle
   Width: 215px (80%)
   Height: 20px
   Fill: #E5E7EB
   Border radius: 4px
   ```

3. **Replace Brand:**
   ```
   Rectangle
   Width: 160px (60%)
   Height: 16px
   Fill: #E5E7EB
   Border radius: 4px
   ```

4. **Replace Rating:**
   ```
   Rectangle
   Width: 120px
   Height: 16px
   Fill: #E5E7EB
   Border radius: 4px
   ```

5. **Replace Price:**
   ```
   Rectangle
   Width: 100px (40%)
   Height: 24px
   Fill: #E5E7EB
   Border radius: 4px
   ```

6. **Replace Button:**
   ```
   Rectangle
   Width: Fill
   Height: 40px
   Fill: #E5E7EB
   Border radius: 8px
   ```

---

## 🦸 HERO SECTION - Mobile (Optimized Version)

### Frame: 375 × 600px

**Background:**
```
Fill: Linear Gradient
└── Start: #F97316 (Orange 500)
└── End: #EA580C (Orange 600)
└── Angle: 135 degrees
```

**Auto Layout (Vertical):**
```
Padding: 24px all sides
Gap: 20px
Alignment: Center
```

**Layers:**

1. **Trust Badge (Top):**
   ```
   Auto Layout (Horizontal)
   Padding: 8px 16px
   Gap: 8px
   Background: rgba(255,255,255,0.2)
   Border radius: 24px (Pill)
   
   ├── Dot indicator
   │   Width: 8px
   │   Height: 8px
   │   Fill: #10B981 (Green)
   │   Border radius: 4px (circle)
   │
   └── Text: "Más de 10,000 clientes satisfechos"
       Font: Regular, 14px
       Color: White
   ```

2. **Main Title:**
   ```
   Text: "Encontrá la pintura\nperfecta para tu\nproyecto"
   Font: Euclid Circular A Bold
   Size: 36px
   Line height: 43px (120%)
   Color: White
   Alignment: Center
   Max width: 327px
   
   "perfecta" → Color: #FBBF24 (Yellow)
   ```

3. **Subtitle:**
   ```
   Text: "Miles de productos con envío gratis y asesoramiento experto"
   Font: Regular
   Size: 16px
   Line height: 24px (150%)
   Color: rgba(255,255,255,0.9)
   Alignment: Center
   Max width: 300px
   ```

4. **CTA Button:**
   ```
   Use: Button/Primary component
   Override fill: #EB6313 (darker orange)
   Text: "Ver Todos los Productos"
   Width: Fill container
   Add: Arrow Right icon (right side)
   ```

5. **Trust Signals Row:**
   ```
   Auto Layout (Horizontal)
   Gap: 16px
   Alignment: Center
   Wrap: Yes
   
   Each signal:
   ├── Auto Layout (Horizontal)
   │   Gap: 8px
   │   ├── Icon container
   │   │   Width: 32px, Height: 32px
   │   │   Background: rgba(255,255,255,0.2)
   │   │   Border radius: 16px (circle)
   │   │   Icon: Lucide (Truck, Shield, CreditCard)
   │   │   Icon size: 18px, Color: White
   │   │
   │   └── Text
   │       Font: Regular 14px
   │       Color: rgba(255,255,255,0.9)
   ```

**Total Height:** ~520px

**Performance Budget:**
```
Gradient: CSS (0 KB)
Text: HTML (0 KB)
Icons: SVG (12 KB for 3 icons)
Button: CSS (0 KB)
────────────────
TOTAL: ~12 KB ✅ EXCELENTE
```

---

## 🎨 HERO SECTION - Desktop (Two Column)

### Frame: 1440 × 600px

**Grid:**
```
Columns: 12
Left column: 7 cols (text)
Right column: 5 cols (visual)
Gutter: 24px
```

**Layout:**

### Left Column (Text Content):

```
Auto Layout (Vertical)
Padding: 48px
Gap: 24px
Alignment: Left, Middle

├── Trust Badge
│   Same as mobile version
│
├── Title
│   Font: Bold 48px (larger)
│   Line height: 58px (120%)
│   Max width: 500px
│
├── Subtitle
│   Font: Regular 20px (larger)
│   Line height: 30px (150%)
│   Max width: 450px
│
├── CTA Row
│   Auto Layout (Horizontal)
│   Gap: 16px
│   ├── Primary CTA (Ver Productos)
│   └── Secondary CTA (Ofertas)
│
└── Trust Signals
    Auto Layout (Horizontal)
    Gap: 24px
    Layout same as mobile
```

### Right Column (Visual):

```
┌──────────────────┐
│                  │
│  [Carousel]      │ ← 500×400px
│  or              │   WebP < 120KB
│  [Illustration]  │   or SVG < 40KB
│                  │
└──────────────────┘
    ← → ○●○○
```

**Measurements:**
```
Container: 550px × 500px
Image: Fill container
Border radius: 16px
Shadow: shadow/lg
```

---

## 📱 INPUT FIELD - Search Bar

### Header Search (Mobile)

**Frame:**
```
Width: Fill container
Height: 40px
```

**Auto Layout (Horizontal):**
```
Padding: 8px 16px
Gap: 8px
Background: rgba(255,255,255,0.95)
Border: 1px solid rgba(255,255,255,0.2)
Border radius: 20px (pill)
```

**Layers:**
```
├── Search Icon
│   Size: 20×20
│   Color: #F97316 (Orange)
│   Icon: Lucide Search
│
└── Input Text (Placeholder)
    Text: "Buscar productos..."
    Font: Regular 14px
    Color: #F97316 50% opacity
    Width: Fill
```

**Focus State:**
```
Border: 2px solid #FFFFFF
Ring: 0 0 0 4px rgba(255,255,255,0.3)
Background: #FFFFFF
```

---

## 🏷️ BADGE COMPONENT

### Sale Badge

**Frame:**
```
Width: Hug
Height: 24px
```

**Auto Layout:**
```
Padding: 4px 12px
Gap: 4px
Border radius: 12px
```

**Variants:**

1. **Sale:**
   ```
   Background: #EF4444 (Red)
   Text: "30% OFF"
   Font: Bold 12px
   Color: White
   ```

2. **New:**
   ```
   Background: #10B981 (Green)
   Text: "NUEVO"
   Font: Bold 12px
   Color: White
   ```

3. **Featured:**
   ```
   Background: #FBBF24 (Yellow)
   Text: "DESTACADO"
   Font: Bold 12px
   Color: #1F2937 (Dark)
   ```

---

## 📦 COMPONENT INSTANCE EXAMPLES

### Product Card - Instancia Real

**Copy this structure:**

```
Product Card Component
├── Image
│   ├── Fill: [product-01.png]
│   ├── Size: 268×268
│   └── Object fit: Cover
├── Badge: "30% OFF" (Sale variant)
├── Title: "Pintura Látex Interior Premium"
├── Brand: "Sherwin Williams ProMar 200"
├── Rating: ⭐⭐⭐⭐⭐ (124)
├── Price Container
│   ├── Current: "$15.999"
│   └── Old: "$22.999"
└── Button: "Agregar al Carrito"
```

### Product Card - Instancia Skeleton

```
Product Card/Skeleton Component
├── Image Placeholder: Gray #E5E7EB
├── Title Line: 80% width, Gray
├── Brand Line: 60% width, Gray
├── Rating Line: 40% width, Gray
├── Price Line: 50% width, Gray
└── Button Placeholder: 100% width, Gray
```

---

## 🎨 DESIGN TOKENS - Variables en Figma

### Crear Variables → Collections

#### Collection: "Color Tokens"

```
Mode: Light

Primitives:
├── orange/500 → #F97316
├── orange/600 → #EA580C
├── green/500 → #10B981
├── yellow/400 → #FBBF24
├── gray/900 → #1F2937
├── gray/500 → #6B7280
├── gray/200 → #E5E7EB
└── white → #FFFFFF

Semantic:
├── color/primary → {orange/500}
├── color/primary-dark → {orange/600}
├── color/secondary → {green/500}
├── color/accent → {yellow/400}
├── color/text → {gray/900}
├── color/text-light → {gray/500}
├── color/border → {gray/200}
└── color/background → {white}
```

#### Collection: "Spacing Tokens"

```
space/1 → 4
space/2 → 8
space/3 → 12
space/4 → 16
space/6 → 24
space/8 → 32
space/12 → 48
space/16 → 64
```

#### Collection: "Typography Tokens"

```
font/size/xs → 12
font/size/sm → 14
font/size/base → 16
font/size/lg → 18
font/size/xl → 20
font/size/2xl → 24
font/size/3xl → 28
font/size/4xl → 36
font/size/5xl → 48
```

---

## 📏 RESPONSIVE BREAKPOINTS - Frames

### Crear estos Frames:

```
Mobile Small (iPhone SE):
├── Width: 375px
├── Height: 667px
└── Name: "📱 Mobile - 375"

Mobile Large (iPhone 14):
├── Width: 390px
├── Height: 844px
└── Name: "📱 Mobile - 390"

Tablet (iPad):
├── Width: 768px
├── Height: 1024px
└── Name: "📱 Tablet - 768"

Desktop Standard:
├── Width: 1440px
├── Height: 900px
└── Name: "💻 Desktop - 1440"

Desktop Large:
├── Width: 1920px
├── Height: 1080px
└── Name: "💻 Desktop - 1920"
```

---

## 🎭 ANIMATIONS - CSS Specs

### Hover Animations

```
Component: Button
Property: transform, background
Duration: 200ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)

From: scale(1), background #F97316
To: scale(1.05), background #EA580C
```

### Shimmer Animation (Skeleton)

```
Component: Skeleton
Property: background-position
Duration: 1500ms
Easing: linear
Loop: infinite

Background:
linear-gradient(110deg, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%)
Background-size: 200% 100%

From: background-position 100% 0
To: background-position -100% 0
```

### Slide In Animation (Content appear)

```
Component: Product Card (on scroll)
Property: opacity, transform
Duration: 400ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)

From: opacity 0, translateY(20px)
To: opacity 1, translateY(0)
```

**Annotation en Figma:**
```
⚡ ANIMATION SPECS:
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

&:hover {
  transform: scale(1.05);
}
```

---

## 🖼️ IMAGE EXPORT SETTINGS

### Hero Image (Mobile)

```
Selection: Hero image frame
Export:
├── Format: PNG
├── Size: 2x (@2x for retina)
├── Suffix: @2x
└── Name: hero-main-mobile@2x.png

Post-export:
└── Convert to WebP 85% → hero-main-mobile.webp
```

**Target:**
```
Original PNG: ~500KB
Compressed PNG: ~200KB
WebP 85%: ~80KB ✅
```

### Product Image

```
Selection: Product image (300×300)
Export:
├── Format: PNG
├── Size: 2x (600×600 output)
└── Name: product-[slug]@2x.png

Post-export:
└── Convert to WebP 85% → product-[slug].webp
```

**Target:**
```
Original: ~150KB
WebP 85%: ~40KB ✅
```

### Icons (SVG)

```
Selection: Icon
Export:
├── Format: SVG
├── Settings:
│   ├── Outline strokes: Yes
│   ├── Simplify: Yes
│   └── Include: "id" attribute
└── Name: icon-[name].svg

Post-export:
└── Run SVGO: npx svgo icon-[name].svg
```

**Target:**
```
Raw SVG: ~8KB
Optimized: ~2KB ✅
```

---

## 📊 PERFORMANCE ANNOTATION TEMPLATE

### Para cada component:

**Crear Text Box con:**

```
⚡ PERFORMANCE SPECS

Component: Product Card
Weight Budget: < 50 KB total
└── Image: < 40 KB (WebP 85%)
└── Text: 0 KB (HTML)
└── Button: 0 KB (CSS)

Implementation:
• Use <Image> from next/image
• Priority: false (lazy load)
• Sizes: "(max-width: 768px) 100vw, 350px"
• Quality: 85

Loading State:
• Skeleton: ProductCardSkeleton
• Progressive: useProgressiveLoading
• Content-visibility: auto

Code reference:
→ src/components/Product/ProductCard.tsx
→ src/components/ui/advanced-skeleton.tsx
```

---

## 🎯 TEMPLATES LISTOS PARA COPIAR

### Homepage Mobile - Section Structure

```
[Header]                    ← 0-92px (Fixed)
────────────────────────────
[Hero - Text Only]          ← 92-412px (Above fold)
• Title
• Subtitle  
• CTA
• Trust signals
────────────────────────────
[Flash Banner]              ← 412-472px
────────────────────────────
[Categories Pills]          ← 472-552px
────────────────────────────
[Products - 3 cards]        ← 552-667px (FOLD)
════════════════════════════  ← FOLD LINE
[Products - Progressive]    ← 667px+ (Below fold)
[Testimonials - Skeleton]
[Newsletter - Skeleton]
```

### Homepage Desktop - Grid Layout

```
┌─────────────────────────────────────────────────┐
│ [Header - 105px]                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Hero - 600px]                                  │
│ Grid: 7 cols text | 5 cols visual              │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Categories - 80px]                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Products Grid - 4 cols]                        │
│ Above fold: 4 products                          │
│                                                 │
├─────────────────────────────────────────────────┤  ← 900px FOLD
│ [Progressive Content]                           │
│ • More products                                 │
│ • Testimonials                                  │
│ • Newsletter                                    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 PLUGINS A USAR (Step by Step)

### 1. Design Lint
```
Run before handoff:
├── Check color consistency
├── Check text styles
├── Check spacing issues
└── Fix all warnings
```

### 2. Design Tokens
```
Export → Design Tokens
├── Format: JSON
├── Output: design-tokens.json
└── Import to: Tailwind config
```

### 3. TinyImage Compressor
```
Select all images
├── Run compression
├── Target: 80% quality
└── Save optimized versions
```

### 4. SVGO Compressor
```
Select all SVG icons
├── Run optimization
├── Remove unnecessary data
└── Output: Optimized SVG
```

---

## ✅ FINAL CHECKLIST

### Before Handoff to Developers:

**Structure:**
- [ ] All components use Auto Layout
- [ ] All spacing uses 4px/8px system
- [ ] All colors are from Variable collection
- [ ] All text uses Text Styles
- [ ] Component names follow convention

**Performance:**
- [ ] Image budgets documented
- [ ] Skeleton states designed
- [ ] Above/below fold marked
- [ ] Progressive loading annotated
- [ ] Export settings documented

**Quality:**
- [ ] Run Design Lint (0 errors)
- [ ] Run Accessibility check
- [ ] All annotations complete
- [ ] Dev Mode ready

---

## 📦 EXPORT PACKAGE

### What to deliver:

```
Deliverables/
├── design-tokens.json          ← Variables export
├── components/
│   ├── buttons.png             ← All button variants
│   ├── cards.png               ← All card variants
│   └── skeletons.png           ← All skeleton variants
├── assets/
│   ├── images/
│   │   ├── hero-mobile.webp    ← Optimized
│   │   ├── hero-desktop.webp
│   │   └── products/*.webp
│   └── icons/
│       └── *.svg               ← Optimized
├── specs/
│   ├── colors.css              ← CSS variables
│   ├── typography.css
│   └── spacing.css
└── FIGMA_HANDOFF_NOTES.md      ← This guide
```

---

**¡TEMPLATE COMPLETO LISTO PARA IMPLEMENTAR EN FIGMA!** 🎨

**Tiempo estimado de creación:** 6-8 horas  
**Resultado:** Design System performance-optimized completo

¿Necesitas que detalle alguna sección específica o quieres specs de otro componente? 🚀

