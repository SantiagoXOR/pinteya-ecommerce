# ⚡ Optimización Adicional: Fuentes Web

## 🎯 Problema Específico

El archivo `fdfc616d6303ed3f.css` (1.6 KiB) está bloqueando la renderización por 610 ms solo para cargar las declaraciones `@font-face`.

## ✅ Soluciones Adicionales

### 1. Inline de @font-face en Layout

**Beneficio**: Elimina una solicitud HTTP completa

**Implementación en `src/app/layout.tsx`**:

```jsx
<head>
  {/* ⚡ CRITICAL: Inline @font-face para eliminar request bloqueante */}
  <style dangerouslySetInnerHTML={{__html: `
    @font-face {
      font-family: 'Euclid Circular A';
      src: url('/fonts/EuclidCircularA-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0020-007F, U+00A0-00FF, U+0100-017F;
    }
    
    @font-face {
      font-family: 'Euclid Circular A';
      src: url('/fonts/EuclidCircularA-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0020-007F, U+00A0-00FF, U+0100-017F;
    }
  `}} />
  
  {/* Preload solo las fuentes críticas */}
  <link
    rel="preload"
    href="/fonts/EuclidCircularA-Regular.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
  <link
    rel="preload"
    href="/fonts/EuclidCircularA-Bold.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</head>
```

**Impacto**: -610 ms (elimina el CSS bloqueante de fuentes)

---

### 2. Usar next/font para Optimización Automática

**Mejor opción**: Next.js optimiza fuentes automáticamente

**Archivo**: `src/app/fonts.ts` (nuevo)

```typescript
import localFont from 'next/font/local'

export const euclidCircularA = localFont({
  src: [
    {
      path: '../../public/fonts/EuclidCircularA-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/EuclidCircularA-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/EuclidCircularA-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-euclid',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})
```

**Uso en `layout.tsx`**:

```tsx
import { euclidCircularA } from './fonts'

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={euclidCircularA.variable}>
      <body className="font-euclid">
        {children}
      </body>
    </html>
  )
}
```

**Actualizar `tailwind.config.ts`**:

```typescript
theme: {
  extend: {
    fontFamily: {
      euclid: ['var(--font-euclid)', 'system-ui', 'sans-serif'],
    },
  },
}
```

**Beneficios**:
- ✅ Inline automático de @font-face
- ✅ Preload automático
- ✅ Optimización de subsetting
- ✅ Eliminación de FOUT/FOIT

---

### 3. Font Subsetting para Reducir Tamaño

Si las fuentes son muy grandes, considera:

```bash
# Instalar pyftsubset (fonttools)
pip install fonttools brotli

# Subset solo caracteres latinos
pyftsubset EuclidCircularA-Regular.woff2 \
  --unicodes="U+0020-007F,U+00A0-00FF,U+0100-017F" \
  --output-file="EuclidCircularA-Regular-subset.woff2" \
  --flavor=woff2
```

**Impacto**: Reduce tamaño de fuentes en ~40-60%

---

## 📊 Impacto Esperado

| Optimización | Tiempo Ahorrado |
|--------------|-----------------|
| Inline @font-face | -610 ms |
| next/font | -610 ms + optimizaciones adicionales |
| Font subsetting | -40% tamaño de fuentes |

---

## 🚀 Implementación Recomendada

**Opción 1: Rápida** (5 min)
- Inline @font-face en layout.tsx
- Mantener preload actual

**Opción 2: Óptima** (15 min)
- Migrar a next/font
- Configurar variables CSS
- Actualizar Tailwind

**Opción 3: Máxima** (30 min)
- Opción 2 + font subsetting
- Servir desde CDN
- Configurar cache headers óptimos

