# Footer

Componente de pie de página con información de la empresa, métodos de pago, enlaces de navegación y redes sociales.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con diseño moderno, tarjetas de beneficios y enlaces sociales.

## 🎯 Características

- **Tarjetas de beneficios** - 3 tarjetas destacando Mercado Pago, Pago al recibir y Envío gratis
- **Redes sociales** - Enlaces a Google, Facebook e Instagram
- **Navegación** - Enlaces a páginas principales (tienda, contacto, about, help)
- **Información de empresa** - Logo, ubicación y copyright
- **Diseño responsive** - Adaptado para mobile, tablet y desktop
- **Optimización de imágenes** - Uso de SVG para iconos y Next.js Image para logos

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [Mercado Pago] [Pago Recibir] [Envío]│
│                                      │
│        [Google] [FB] [Instagram]     │
│                                      │
│ [Tienda] [Contacto] [About] [Help]  │
│                                      │
│ [Logo] Córdoba, Argentina            │
│        © 2025 Pinteya — XOR          │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import Footer from '@/components/layout/Footer'

<Footer />
```

## 📋 Props e Interfaces

El componente no acepta props. Toda la configuración está hardcodeada:

```typescript
const socials = [
  {
    label: 'Google',
    href: '/api/auth/signin',
    wrapperClass: 'bg-white',
    imageSrc: '/images/icons/Google.svg',
  },
  // ...
]

const navLinks = [
  { label: 'Explorá la tienda', href: '/shop' },
  // ...
]
```

## 🎨 Estilos y Diseño

### Colores

- **Fondo principal**: `bg-[#eb6313]` (Naranja Pinteya)
- **Tarjetas**: `bg-white/10` con `backdrop-blur`
- **Texto**: `text-white` con variaciones de opacidad
- **Bordes**: `border-white/20` y `border-white/15`

### Tarjetas de Beneficios

Cada tarjeta tiene:
- **Fondo**: `bg-white/10` con `backdrop-blur`
- **Sombra**: `shadow-lg shadow-black/10`
- **Padding**: `p-5 sm:p-6`
- **Border radius**: `rounded-2xl`

### Layout Responsive

- **Grid de tarjetas**: `grid-cols-1 md:grid-cols-3`
- **Padding**: `px-4 sm:px-6 py-10 sm:py-14 pb-24`
- **Footer inferior**: `flex-col md:flex-row`

## 🔄 Flujo de Datos

1. **Renderizado estático**: Todo el contenido está hardcodeado
2. **Año dinámico**: `new Date().getFullYear()` para copyright
3. **Enlaces externos**: Target `_blank` y `rel="noopener noreferrer"` para URLs externas
4. **Imágenes**: Next.js Image para logos, `<img>` para SVG pequeños

## 🧪 Testing

### Casos de Prueba

- ✅ Renderizado de todas las secciones
- ✅ Enlaces de navegación funcionan
- ✅ Enlaces de redes sociales abren en nueva pestaña
- ✅ Año del copyright se actualiza correctamente
- ✅ Responsive en diferentes tamaños
- ✅ Imágenes se cargan correctamente
- ✅ Accesibilidad (ARIA labels)

## 📝 Notas de Desarrollo

### Estructura del Componente

El Footer está dividido en secciones:

1. **Tarjetas de beneficios** (Grid de 3)
   - Mercado Pago
   - Pago al recibir
   - Envío gratis

2. **Redes sociales** (Centrado)
   - Google (autenticación)
   - Facebook
   - Instagram

3. **Navegación** (Centrado)
   - Explorá la tienda
   - Chateá con nosotros
   - Conocé nuestra historia
   - Necesitás ayuda?

4. **Información de empresa** (Footer inferior)
   - Logo Pinteya
   - Ubicación (Córdoba, Argentina)
   - Copyright dinámico

### Optimizaciones

1. **SVG para iconos pequeños**: Usa `<img>` en lugar de Next.js Image para SVG (más eficiente)
2. **Priority loading**: Logos principales con `priority={true}`
3. **Lazy loading**: Iconos sociales con `loading="lazy"`
4. **Backdrop blur**: Efecto visual moderno en tarjetas

### Enlaces Configurados

#### Redes Sociales

- **Google**: `/api/auth/signin` (interno, no abre nueva pestaña)
- **Facebook**: `https://facebook.com/pinteya` (externo, nueva pestaña)
- **Instagram**: `https://www.instagram.com/pinteya.app/` (externo, nueva pestaña)

#### Navegación

- **Explorá la tienda**: `/shop`
- **Chateá con nosotros**: `/contact`
- **Conocé nuestra historia**: `/about`
- **Necesitás ayuda?**: `/help`

## 🔗 Archivos Relacionados

- `src/components/layout/Footer.tsx` - Implementación del componente
- `public/images/logo/LOGO POSITIVO.svg` - Logo de Pinteya
- `public/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg` - Logo Mercado Pago
- `public/images/checkout/pagoalrecibir.png` - Imagen "Pago al recibir"
- `public/images/icons/icon-envio.svg` - Icono de envío
- `public/images/icons/Google.svg` - Icono Google
- `public/images/icons/fb.svg` - Icono Facebook
- `public/images/icons/instagram.svg` - Icono Instagram

## 🐛 Troubleshooting

### Los enlaces de redes sociales no funcionan

**Solución**: Verifica que las URLs estén correctas y que los enlaces externos tengan `target="_blank"` y `rel="noopener noreferrer"`.

### Las imágenes no se cargan

**Solución**: Verifica que las rutas de las imágenes sean correctas y que los archivos existan en `public/images/`. Para SVG, asegúrate de usar `<img>` en lugar de Next.js Image.

### El año del copyright no se actualiza

**Solución**: El año se calcula con `new Date().getFullYear()`. Si no se actualiza, verifica que el componente se esté renderizando en el cliente (`'use client'`).

### El diseño no es responsive

**Solución**: Verifica que las clases Tailwind responsive estén aplicadas correctamente (`sm:`, `md:`, `lg:`). El componente usa `grid-cols-1 md:grid-cols-3` para el grid de tarjetas.
