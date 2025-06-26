# 🎨 Design Tokens - Pinteya E-commerce

> Tokens de diseño fundamentales para el sistema Pinteya, optimizados para Tailwind CSS

## 📋 Índice

- [🌈 Colores](#-colores)
- [📝 Tipografía](#-tipografía)
- [📏 Espaciado](#-espaciado)
- [🔲 Bordes y Radios](#-bordes-y-radios)
- [🌫️ Sombras](#️-sombras)
- [⚡ Animaciones](#-animaciones)
- [📱 Breakpoints](#-breakpoints)

---

## 🌈 Colores

### Paleta Principal - Blaze Orange

```css
/* Blaze Orange - Color primario de marca */
--blaze-orange-50: #fef7ee;   /* Fondo muy claro */
--blaze-orange-100: #feeed6;  /* Fondo claro */
--blaze-orange-200: #fcd9ac;  /* Fondo medio */
--blaze-orange-300: #f9be78;  /* Texto claro */
--blaze-orange-400: #f59842;  /* Texto medio */
--blaze-orange-500: #f27a1d;  /* Principal */
--blaze-orange-600: #eb6313;  /* Hover */
--blaze-orange-700: #bd4811;  /* Active/Pressed */
--blaze-orange-800: #963a16;  /* Texto oscuro */
--blaze-orange-900: #793115;  /* Texto muy oscuro */
--blaze-orange-950: #411709;  /* Texto extremo */

/* Fun Green - Color secundario */
--fun-green-50: #ecfff5;      /* Fondo muy claro */
--fun-green-100: #d3ffe8;     /* Fondo claro */
--fun-green-200: #aaffd3;     /* Fondo medio */
--fun-green-300: #69ffb2;     /* Texto claro */
--fun-green-400: #21ff8a;     /* Texto medio */
--fun-green-500: #00f269;     /* Principal */
--fun-green-600: #00ca53;     /* Hover */
--fun-green-700: #009e44;     /* Active/Pressed */
--fun-green-800: #007638;     /* Texto oscuro */
--fun-green-900: #026532;     /* Texto muy oscuro */
--fun-green-950: #003919;     /* Texto extremo */

/* Bright Sun - Color de acento */
--bright-sun-50: #fffbeb;     /* Fondo muy claro */
--bright-sun-100: #fff4c6;    /* Fondo claro */
--bright-sun-200: #ffe788;    /* Fondo medio */
--bright-sun-300: #ffd549;    /* Texto claro */
--bright-sun-400: #ffc220;    /* Texto medio */
--bright-sun-500: #f9a007;    /* Principal */
--bright-sun-600: #dd7802;    /* Hover */
--bright-sun-700: #b75406;    /* Active/Pressed */
--bright-sun-800: #943f0c;    /* Texto oscuro */
--bright-sun-900: #7a350d;    /* Texto muy oscuro */
--bright-sun-950: #461a02;    /* Texto extremo */
```

### Colores Secundarios

```css
/* Neutros */
--white: #ffffff;
--gray-50: #f8f9fa;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #374151;
--gray-900: #1f2937;

/* Azul Petróleo - Secundario */
--teal-600: #2c5f5d;
--teal-700: #1f4a47;

/* Estados Semánticos */
--success: #22ad5c;
--success-light: #c2f3d6;
--error: #f23030;
--error-light: #feebeb;
--warning: #fbbf24;
--warning-light: #fef3c7;
--info: #3b82f6;
--info-light: #dbeafe;
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
colors: {
  'blaze-orange': {
    50: '#fef7ee',
    100: '#feeed6',
    200: '#fcd9ac',
    300: '#f9be78',
    400: '#f59842',
    500: '#f27a1d',  // Principal
    600: '#eb6313',  // Hover
    700: '#bd4811',  // Active
    800: '#963a16',
    900: '#793115',
    950: '#411709',
    DEFAULT: '#f27a1d',
  },
  'fun-green': {
    50: '#ecfff5',
    100: '#d3ffe8',
    200: '#aaffd3',
    300: '#69ffb2',
    400: '#21ff8a',
    500: '#00f269',  // Principal
    600: '#00ca53',  // Hover
    700: '#009e44',  // Active
    800: '#007638',
    900: '#026532',
    950: '#003919',
    DEFAULT: '#00f269',
  },
  'bright-sun': {
    50: '#fffbeb',
    100: '#fff4c6',
    200: '#ffe788',
    300: '#ffd549',
    400: '#ffc220',
    500: '#f9a007',  // Principal
    600: '#dd7802',  // Hover
    700: '#b75406',  // Active
    800: '#943f0c',
    900: '#7a350d',
    950: '#461a02',
    DEFAULT: '#f9a007',
  },
  // Alias para compatibilidad
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
  }
}
```

---

## 📝 Tipografía

### Familia de Fuentes

```css
/* Fuente Principal */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Fuente Secundaria (Actual) */
--font-secondary: 'Euclid Circular A', sans-serif;
```

### Escala Tipográfica

```css
/* Headings */
--text-heading-1: 60px / 72px;  /* H1 - Hero */
--text-heading-2: 48px / 64px;  /* H2 - Sección */
--text-heading-3: 40px / 48px;  /* H3 - Subsección */
--text-heading-4: 30px / 38px;  /* H4 - Card title */
--text-heading-5: 28px / 40px;  /* H5 - Componente */
--text-heading-6: 24px / 30px;  /* H6 - Pequeño */

/* Body Text */
--text-xl: 20px / 24px;         /* Texto grande */
--text-lg: 18px / 24px;         /* Texto destacado */
--text-base: 16px / 24px;       /* Texto normal */
--text-sm: 14px / 22px;         /* Texto pequeño */
--text-xs: 12px / 20px;         /* Texto muy pequeño */
--text-2xs: 10px / 17px;        /* Labels, badges */

/* Custom Sizes */
--text-custom-xl: 20px / 24px;
--text-custom-lg: 18px / 24px;
--text-custom-sm: 14px / 22px;
--text-custom-xs: 12px / 20px;
```

### Pesos de Fuente

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
fontSize: {
  '2xs': ['10px', '17px'],
  'xs': ['12px', '20px'],
  'sm': ['14px', '22px'],
  'base': ['16px', '24px'],
  'lg': ['18px', '24px'],
  'xl': ['20px', '24px'],
  '2xl': ['24px', '34px'],
  '3xl': ['30px', '38px'],
  '4xl': ['36px', '48px'],
  '5xl': ['48px', '64px'],
  '6xl': ['60px', '72px'],
  // Custom sizes
  'heading-1': ['60px', '72px'],
  'heading-2': ['48px', '64px'],
  'heading-3': ['40px', '48px'],
  'heading-4': ['30px', '38px'],
  'heading-5': ['28px', '40px'],
  'heading-6': ['24px', '30px'],
  'custom-xl': ['20px', '24px'],
  'custom-lg': ['18px', '24px'],
  'custom-sm': ['14px', '22px'],
  'custom-xs': ['12px', '20px'],
}
```

---

## 📏 Espaciado

### Escala de Espaciado (Base 4px)

```css
/* Espaciado Base */
--space-0: 0px;
--space-1: 4px;      /* 0.25rem */
--space-2: 8px;      /* 0.5rem */
--space-3: 12px;     /* 0.75rem */
--space-4: 16px;     /* 1rem */
--space-5: 20px;     /* 1.25rem */
--space-6: 24px;     /* 1.5rem */
--space-8: 32px;     /* 2rem */
--space-10: 40px;    /* 2.5rem */
--space-12: 48px;    /* 3rem */
--space-16: 64px;    /* 4rem */
--space-20: 80px;    /* 5rem */
--space-24: 96px;    /* 6rem */

/* Espaciado Específico Pinteya */
--space-2.5: 10px;   /* 0.625rem */
--space-3.5: 14px;   /* 0.875rem */
--space-4.5: 18px;   /* 1.125rem */
--space-5.5: 22px;   /* 1.375rem */
--space-7.5: 30px;   /* 1.875rem */
--space-8.5: 34px;   /* 2.125rem */
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
spacing: {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',
  '4.5': '18px',
  '5': '20px',
  '5.5': '22px',
  '6': '24px',
  '7': '28px',
  '7.5': '30px',
  '8': '32px',
  '8.5': '34px',
  '9': '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',
  '13': '52px',
  '14': '56px',
  '15': '60px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '28': '112px',
  '32': '128px',
}
```

---

## 🔲 Bordes y Radios

### Border Radius

```css
--radius-none: 0px;
--radius-sm: 2px;
--radius-md: 4px;      /* Botones pequeños */
--radius-lg: 8px;      /* Cards, inputs */
--radius-xl: 12px;     /* Modales */
--radius-2xl: 16px;    /* Containers grandes */
--radius-3xl: 24px;    /* Hero sections */
--radius-full: 9999px; /* Badges, avatares */

/* Específicos Pinteya */
--radius-button: 5px;   /* Botones estándar */
--radius-card: 10px;    /* Product cards */
--radius-modal: 12px;   /* Modales */
```

### Border Width

```css
--border-0: 0px;
--border-1: 1px;       /* Estándar */
--border-2: 2px;       /* Focus states */
--border-4: 4px;       /* Destacados */
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
borderRadius: {
  'none': '0px',
  'sm': '2px',
  'md': '4px',
  'lg': '8px',
  'xl': '12px',
  '2xl': '16px',
  '3xl': '24px',
  'full': '9999px',
  // Custom
  'button': '5px',
  'card': '10px',
  'modal': '12px',
}
```

---

## 🌫️ Sombras

### Elevación de Sombras

```css
/* Sombras Base */
--shadow-1: 0px 1px 2px 0px rgba(166, 175, 195, 0.25);
--shadow-2: 0px 6px 24px 0px rgba(235, 238, 251, 0.40), 0px 2px 4px 0px rgba(148, 163, 184, 0.05);
--shadow-3: 0px 2px 16px 0px rgba(13, 10, 44, 0.12);

/* Sombras Específicas */
--shadow-input: inset 0 0 0 2px #fc9d04;
--shadow-testimonial: 0px 0px 4px 0px rgba(148, 163, 184, 0.10), 0px 6px 12px 0px rgba(224, 227, 238, 0.45);
--shadow-breadcrumb: 0px 1px 0px 0px #E5E7EB, 0px -1px 0px 0px #E5E7EB;
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
boxShadow: {
  '1': '0px 1px 2px 0px rgba(166, 175, 195, 0.25)',
  '2': '0px 6px 24px 0px rgba(235, 238, 251, 0.40), 0px 2px 4px 0px rgba(148, 163, 184, 0.05)',
  '3': '0px 2px 16px 0px rgba(13, 10, 44, 0.12)',
  'input': 'inset 0 0 0 2px #fc9d04',
  'testimonial': '0px 0px 4px 0px rgba(148, 163, 184, 0.10), 0px 6px 12px 0px rgba(224, 227, 238, 0.45)',
  'breadcrumb': '0px 1px 0px 0px #E5E7EB, 0px -1px 0px 0px #E5E7EB',
}
```

---

## ⚡ Animaciones

### Duración

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Easing

```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
transitionDuration: {
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
}
```

---

## 📱 Breakpoints

### Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Móviles grandes */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop pequeño */
--breakpoint-xl: 1280px;  /* Desktop grande */
--breakpoint-2xl: 1536px; /* Desktop extra grande */

/* Custom Breakpoints */
--breakpoint-xsm: 375px;  /* Móviles pequeños */
--breakpoint-lsm: 425px;  /* Móviles medianos */
--breakpoint-3xl: 2000px; /* Pantallas muy grandes */
```

### Configuración Tailwind

```typescript
// tailwind.config.ts
screens: {
  'xsm': '375px',
  'lsm': '425px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
  '3xl': '2000px',
}
```

---

*Última actualización: Junio 2025*
