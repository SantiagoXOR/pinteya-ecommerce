# Footer Component - Pinteya E-commerce

## Descripción

El componente Footer es un footer completo y profesional diseñado específicamente para Pinteya E-commerce. Incluye toda la información corporativa, enlaces útiles, métodos de pago y redes sociales de la empresa.

## Ubicación

```
src/components/layout/Footer.tsx
```

## Características

### 🎨 Diseño Profesional

- **Layout responsive**: Se adapta perfectamente a mobile, tablet y desktop
- **Paleta de colores Pinteya**: Utiliza el color primario #ea5a17 (Blaze Orange)
- **Tipografía consistente**: Mantiene la coherencia con el resto del sitio
- **Espaciado optimizado**: Diseño limpio y bien estructurado

### 📋 Secciones Incluidas

#### 1. **Información de la Empresa**

- Logo principal de Pinteya (LOGO NEGATIVO.svg) en color naranja
- Dirección física: Córdoba Capital, Argentina
- Teléfono de contacto: +54 351 341 1796
- Email corporativo: info@pinteya.com.ar

#### 2. **Enlaces Útiles**

- **Diseño mobile**: Grid de 2 columnas con fondo gris claro y bordes redondeados
- **Diseño desktop**: Lista vertical tradicional sin fondo
- Enlaces: Sobre Nosotros (`/about`), Contacto (`/contact`), Centro de Ayuda (`/help`), Envíos y Devoluciones (`/shipping`), Política de Privacidad (`/privacy`), Términos y Condiciones (`/terms`)

#### 3. **Categorías de Productos**

- **Diseño mobile**: Grid de 2 columnas con fondo gris claro y bordes redondeados
- **Diseño desktop**: Lista vertical tradicional sin fondo
- Categorías: Pinturas (`/shop?category=pinturas`), Esmaltes (`/shop?category=esmaltes`), Barnices (`/shop?category=barnices`), Impermeabilizantes (`/shop?category=impermeabilizantes`), Accesorios (`/shop?category=accesorios`)
- "Ver Todo" (`/shop`) destacado con font-medium

#### 4. **Métodos de Pago**

- Logo oficial de MercadoPago
- Descripción de métodos aceptados
- Badges de métodos de pago (Tarjetas, Efectivo, Transferencia)

#### 5. **Redes Sociales**

- Facebook: https://www.facebook.com/pinteya
- Instagram: https://www.instagram.com/pinteya
- WhatsApp: https://wa.me/5493513411796

### 🔧 Implementación Técnica

#### Dependencias

```typescript
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
```

#### Estructura del Componente

```typescript
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Sección principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* 4 columnas de contenido */}
        </div>
      </div>

      {/* Sección inferior */}
      <div className="bg-gray-50 border-t border-gray-200">
        {/* Copyright y métodos de pago */}
      </div>
    </footer>
  );
};
```

### 📱 Responsive Design Mobile-First

#### Mobile (320px - 768px) - Versión Compacta

- **Layout**: Diseño completamente diferente y compacto
- **Espaciado**: `py-6` (muy reducido)
- **Logo Pinteya**: `h-8` (32px) más pequeño
- **Contacto**: Solo botones de llamada (naranja) y WhatsApp (verde)
- **Enlaces**: Solo 4 enlaces principales como tags pequeños
- **Métodos de pago**: Logo MercadoPago mini (`h-5`) + "y más"
- **Sin secciones extensas**: Eliminadas listas largas y redes sociales
- **Información mínima**: Solo ubicación "Córdoba, Argentina"

#### Tablet (768px - 1024px)

- **Layout**: 2 columnas balanceadas
- **Espaciado**: `gap-8` entre secciones
- **Elementos**: Tamaños intermedios
- **Tipografía**: Transición a tamaños desktop

#### Desktop (1024px+)

- **Layout**: 4 columnas completas
- **Espaciado**: `py-16`, `gap-12` generoso
- **Logo Pinteya**: `h-14` (56px)
- **Logo MercadoPago**: `h-10` (40px)
- **Iconos redes sociales**: `w-10 h-10`
- **Tipografía**: Títulos `text-lg`, copyright `text-sm`
- **Badges**: Texto completo

### 🎯 Integración

El footer está integrado en el layout principal a través de `src/app/providers.tsx`:

```typescript
import Footer from "../components/layout/Footer";

// Dentro del componente AppContent
<Footer />
```

### 🖼️ Recursos Utilizados

#### Logos

- **Logo Principal**: `/images/logo/LOGO NEGATIVO.svg` (color naranja #eb6313)
- **MercadoPago**: `/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg` (tamaño aumentado)
- **Logo XOR**: `/images/logo/xor.svg` (créditos de desarrollo)

#### Iconos

- Iconos SVG inline para ubicación, teléfono y email
- Iconos de redes sociales (Facebook, Instagram, WhatsApp)
- Emojis para métodos de pago (💳, 💰, 🏦)

### 🎨 Estilos y Clases

#### Colores Principales

- **Primario**: `text-[#ea5a17]` (Blaze Orange)
- **Texto**: `text-gray-600`, `text-gray-900`
- **Fondo**: `bg-white`, `bg-gray-50`
- **Hover**: `hover:text-[#ea5a17]`, `hover:bg-[#ea5a17]`

#### Efectos de Interacción

- Transiciones suaves: `transition-colors`
- Hover states en enlaces y botones
- Estados activos en redes sociales

### 📄 Copyright y Créditos

```
© 2025 Pinteya. Todos los derechos reservados.
Desarrollado por XOR
```

### 🔗 Enlaces Relacionados

- [Design System](../design-system/README.md)
- [Paleta de Colores](../design-system/colors.md)
- [Componentes Layout](../components/layout.md)
- [Guía de Responsive Design](../guides/responsive.md)

### 📝 Notas de Desarrollo

1. **Accesibilidad**: Todos los enlaces tienen `aria-label` apropiados
2. **SEO**: Enlaces internos optimizados para navegación
3. **Performance**: Imágenes optimizadas con Next.js Image
4. **Mantenibilidad**: Código modular y bien documentado
5. **Escalabilidad**: Fácil agregar nuevas secciones o enlaces

### 🚀 Próximas Mejoras

- [ ] Agregar newsletter signup
- [ ] Implementar mapa interactivo
- [ ] Agregar certificaciones de seguridad
- [ ] Integrar chat en vivo
- [ ] Agregar testimonios destacados
