# 🎁 PinteyaRaffle - Componente de Sorteo

## 📋 Descripción

El componente `PinteyaRaffle` es una refactorización completa del componente `Countdown` original, transformándolo en un sorteo temático de productos de pinturería con la identidad visual de Pinteya.

## ✨ Características Principales

### 🎨 Diseño Visual
- **Paleta de colores Pinteya**: Blaze Orange, Fun Green, Bright Sun
- **Gradientes modernos**: Fondo con degradado suave
- **Animaciones fluidas**: Efectos hover, pulse y bounce
- **Responsive design**: Optimizado para mobile, tablet y desktop

### ⏰ Contador Regresivo
- **Tiempo real**: Actualización cada segundo
- **15 días de duración**: Configurado automáticamente
- **Formato elegante**: Días, horas, minutos y segundos
- **Animación en segundos**: Efecto pulse para mayor dinamismo

### 🏆 Información del Sorteo
- **Premio valorado**: $150.000 en productos
- **Marcas incluidas**: Plavicon, Petrilac, Sinteplast, etc.
- **Kit completo**: Látex, esmaltes, herramientas y accesorios
- **Participación gratuita**: Solo seguir en redes sociales

### 🖼️ Elementos Visuales
- **Imágenes reales**: Productos de la base de datos
- **Productos flotantes**: Pincel y rodillo decorativos
- **Efectos decorativos**: Círculos animados
- **Badge de valor**: Destacado en verde

## 🛠️ Tecnologías Utilizadas

- **React 18** con hooks (useState, useEffect)
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **shadcn/ui** para componentes base
- **Next.js Image** para optimización de imágenes

## 📦 Componentes del Design System

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
```

## 🎯 Uso

```tsx
import PinteyaRaffle from "@/components/Home/PinteyaRaffle";

function HomePage() {
  return (
    <main>
      <PinteyaRaffle />
    </main>
  );
}
```

## 🧪 Testing

El componente incluye 11 tests completos que verifican:

- ✅ Renderizado correcto
- ✅ Información del premio
- ✅ Productos incluidos
- ✅ Contador regresivo
- ✅ Botón de participación
- ✅ Instrucciones de participación
- ✅ Imágenes de productos
- ✅ Actualización del contador
- ✅ Iconos correctos
- ✅ Estilos de Pinteya
- ✅ Disclaimer

```bash
npm test -- --testPathPattern=PinteyaRaffle
```

## 📖 Storybook

El componente incluye múltiples historias en Storybook:

- **Default**: Versión estándar
- **Dark Background**: Con fondo oscuro
- **Compact**: Versión compacta
- **Mobile/Tablet**: Vistas responsive
- **In Page Context**: Integrado en página
- **Accessibility Test**: Testing de accesibilidad

```bash
npm run storybook
```

## 🎨 Paleta de Colores

```css
/* Colores principales */
.bg-blaze-orange-50    /* Fondo suave */
.bg-blaze-orange-500   /* Badges principales */
.bg-blaze-orange-600   /* Texto destacado */
.bg-blaze-orange-800   /* Títulos */

.bg-fun-green-500      /* Badge gratis */
.bg-bright-sun-400     /* Botón principal */
```

## 📱 Responsive Design

### Mobile (320px - 768px)
- 2 columnas en grid de productos
- Contador compacto (80px)
- Texto responsive (text-sm/base)

### Tablet (768px - 1024px)
- 4 columnas en grid de productos
- Contador intermedio (90px)
- Texto intermedio (text-base/lg)

### Desktop (1024px+)
- Layout completo lado a lado
- Contador grande (100px)
- Texto grande (text-lg/xl)

## 🔧 Configuración

### Fecha del Sorteo
```tsx
// Automático: 15 días desde hoy
const deadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toDateString();

// Manual: Fecha específica
const deadline = "January 15, 2025";
```

### Imágenes de Productos
```tsx
// Imagen principal
src="/images/products/latex-interior-4l-plavicon.jpg"

// Productos flotantes
src="/images/products/pincel-persianero-n15-galgo.jpg"
src="/images/products/rodillo-22cm-lanar-elefante-galgo.jpg"
```

## 🚀 Integración

El componente reemplaza al `CounDown` original en:

```tsx
// src/components/Home/index.tsx
import PinteyaRaffle from "./PinteyaRaffle";

const Home = () => {
  return (
    <main>
      {/* ... otros componentes ... */}
      <PinteyaRaffle />
      {/* ... otros componentes ... */}
    </main>
  );
};
```

## 📈 Performance

- **Lazy loading**: Imágenes optimizadas con Next.js
- **Memoización**: Cálculos de tiempo optimizados
- **Tree shaking**: Solo importa iconos necesarios
- **Bundle size**: Componente ligero (~15KB)

## 🎯 Accesibilidad

- **Contraste**: Cumple WCAG 2.1 AA
- **Keyboard navigation**: Botón accesible
- **Screen readers**: Alt texts descriptivos
- **Focus management**: Estados de foco visibles

## 🔄 Migración desde CounDown

1. **Reemplazar import**:
   ```tsx
   // Antes
   import CounDown from "./Countdown";
   
   // Después
   import PinteyaRaffle from "./PinteyaRaffle";
   ```

2. **Actualizar uso**:
   ```tsx
   // Antes
   <CounDown />
   
   // Después
   <PinteyaRaffle />
   ```

3. **Verificar tests**:
   ```bash
   npm test -- --testPathPattern=PinteyaRaffle
   ```

## 📝 Notas de Desarrollo

- **Fecha dinámica**: Se calcula automáticamente
- **Imágenes reales**: Usa productos de la base de datos
- **Colores consistentes**: Sigue el design system de Pinteya
- **Animaciones suaves**: Mejora la experiencia de usuario
- **Código limpio**: TypeScript y ESLint compliant



