# 📦 Instalación - Design System Pinteya

> Guía completa para instalar y configurar el Design System Pinteya en tu proyecto

## 📋 Índice

- [⚡ Inicio Rápido](#-inicio-rápido)
- [📦 Dependencias](#-dependencias)
- [🔧 Configuración](#-configuración)
- [🎨 Importación de Componentes](#-importación-de-componentes)
- [🧪 Verificación](#-verificación)
- [🔍 Troubleshooting](#-troubleshooting)

---

## ⚡ Inicio Rápido

### 1. Clonar el Proyecto

```bash
git clone https://github.com/SantiagoXOR/pinteya-ecommerce.git
cd pinteya-ecommerce
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
CLERK_SECRET_KEY=tu_clerk_secret_key

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_mercadopago_access_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_mercadopago_public_key
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Visita [http://localhost:3001](http://localhost:3001)

---

## 📦 Dependencias

### Dependencias Principales

```json
{
  "dependencies": {
    "next": "^15.3.3",
    "react": "^19",
    "typescript": "^5.7.3",
    "tailwindcss": "^3.4.1",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0"
  }
}
```

### Dependencias de Desarrollo

```json
{
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "15.3.3",
    "postcss": "^8",
    "autoprefixer": "^10.0.1"
  }
}
```

### Instalación Manual de Dependencias

Si necesitas instalar solo las dependencias del Design System:

```bash
# Dependencias core
npm install class-variance-authority clsx tailwind-merge

# Componentes UI
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Iconos
npm install lucide-react

# TypeScript types
npm install -D @types/node @types/react @types/react-dom
```

---

## 🔧 Configuración

### 1. Tailwind CSS

El archivo `tailwind.config.ts` ya está configurado con todos los tokens del Design System:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'blaze-orange': {
          50: '#fef7ee',
          500: '#f27a1d', // Principal
          600: '#eb6313', // Hover
          700: '#bd4811', // Active
          // ... más colores
        },
        'fun-green': {
          50: '#ecfff5',
          500: '#00f269', // Principal
          600: '#00ca53', // Hover
          700: '#009e44', // Active
          // ... más colores
        },
        'bright-sun': {
          50: '#fffbeb',
          500: '#f9a007', // Principal
          600: '#dd7802', // Hover
          700: '#b75406', // Active
          // ... más colores
        },
        primary: {
          DEFAULT: '#f27a1d',
          hover: '#eb6313',
          active: '#bd4811',
        },
        secondary: {
          DEFAULT: '#00f269',
          hover: '#00ca53',
          active: '#009e44',
        },
        accent: {
          DEFAULT: '#f9a007',
          hover: '#dd7802',
          active: '#b75406',
        },
        // ... más configuraciones
      },
      borderRadius: {
        button: '5px',
        card: '10px',
        modal: '12px',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
```

### 2. CSS Global

El archivo `src/app/css/style.css` incluye las configuraciones base:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply scroll-smooth;
  }

  body {
    @apply font-euclid-circular-a font-normal text-base text-dark-3 relative z-1;
  }
}

@layer components {
  .dropdown {
    @apply flex-col gap-0 min-w-max xl:w-[193px] mt-2 lg:mt-0 bg-white shadow-2 ease-in duration-200 py-2.5 rounded-md border border-gray-3;
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

### 3. Utilidades Helper

Crear `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Más utilidades específicas para Pinteya...
```

### 4. TypeScript Configuration

El `tsconfig.json` debe incluir los paths correctos:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🎨 Importación de Componentes

### Estructura de Componentes

```
src/
├── components/
│   ├── ui/                 # Design System components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── index.ts       # Barrel exports
│   ├── Header/            # Existing components
│   ├── Shop/
│   └── Common/
```

### Barrel Exports

Crear `src/components/ui/index.ts`:

```typescript
// Barrel exports para fácil importación
export { Button, buttonVariants } from './button'
export { Input, inputVariants } from './input'
export { Card, CardHeader, CardTitle, CardContent, CardFooter, ProductCard } from './card'
export { Badge, DiscountBadge, ShippingBadge, StockBadge, NewBadge, OfferBadge } from './badge'
```

### Uso de Componentes

```tsx
// Importación individual
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Importación múltiple
import { Button, Card, Badge } from '@/components/ui'

// Uso en componentes
export function ProductCard() {
  return (
    <Card>
      <h3>Pintura Sherwin Williams</h3>
      <Badge variant='success'>Envío gratis</Badge>
      <Button variant='primary'>Agregar al carrito</Button>
    </Card>
  )
}
```

---

## 🧪 Verificación

### 1. Test de Instalación

Crear `test-installation.tsx`:

```tsx
import { Button, Card, Badge } from '@/components/ui'

export default function TestPage() {
  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-heading-2 text-primary'>Design System Test</h1>

      <Card className='p-6'>
        <h2 className='text-heading-4 mb-4'>Componentes Base</h2>

        <div className='space-y-4'>
          <div className='flex gap-2'>
            <Button variant='primary'>Primary</Button>
            <Button variant='secondary'>Secondary</Button>
            <Button variant='outline'>Outline</Button>
          </div>

          <div className='flex gap-2'>
            <Badge variant='default'>Default</Badge>
            <Badge variant='success'>Success</Badge>
            <Badge variant='destructive'>Error</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

### 2. Verificar Estilos

```bash
# Verificar que Tailwind compile correctamente
npm run build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Verificar que los estilos se aplican
# Inspeccionar elementos en el navegador
```

### 3. Test de Responsividad

```tsx
// Verificar breakpoints
<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
  <Card className='p-4'>Mobile First</Card>
  <Card className='p-4'>Tablet</Card>
  <Card className='p-4'>Desktop</Card>
</div>
```

---

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. Estilos no se aplican

```bash
# Verificar que Tailwind está configurado
npm run dev

# Verificar que los paths están correctos en tailwind.config.ts
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
]
```

#### 2. Componentes no se importan

```typescript
// Verificar paths en tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}

// Verificar que los archivos existen
ls src/components/ui/
```

#### 3. Errores de TypeScript

```bash
# Instalar types faltantes
npm install -D @types/react @types/react-dom

# Verificar versiones compatibles
npm list react react-dom typescript
```

#### 4. Conflictos de CSS

```css
/* Verificar orden de imports en globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Verificar especificidad */
.my-component {
  @apply bg-primary; /* Usar @apply para Tailwind classes */
}
```

### Logs de Debug

```typescript
// Agregar logs para debug
console.log('Design System loaded:', {
  tailwindConfig: require('../tailwind.config.ts'),
  components: require('./src/components/ui'),
})
```

### Verificación de Performance

```bash
# Analizar bundle size
npm run build
npm run analyze

# Verificar que tree-shaking funciona
# Solo los componentes usados deben estar en el bundle
```

---

## 📚 Próximos Pasos

1. **Explorar Componentes**: Revisa la [documentación de componentes](./components/buttons.md)
2. **Ver Ejemplos**: Consulta el [Storybook](http://localhost:6006) (cuando esté configurado)
3. **Implementar**: Sigue el [roadmap de implementación](./roadmap.md)
4. **Contribuir**: Lee la [guía de contribución](../contributing/guide.md)

---

## 🆘 Soporte

¿Problemas con la instalación?

- 📖 **Documentación**: [Design System completo](./README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/SantiagoXOR/pinteya-ecommerce/issues)
- 📧 **Contacto**: santiago@xor.com.ar

---

_Última actualización: Junio 2025_
