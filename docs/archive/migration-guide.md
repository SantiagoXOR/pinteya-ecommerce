# 🔄 Guía de Migración - Nueva Identidad Visual

> Guía completa para migrar de la paleta Tahiti Gold a la nueva identidad visual Blaze Orange

## 📋 Resumen de Cambios

### Paleta Anterior vs Nueva

| Anterior (Tahiti Gold)      | Nueva (Blaze Orange)         | Uso              |
| --------------------------- | ---------------------------- | ---------------- |
| `tahiti-gold-500` (#fc9d04) | `blaze-orange-500` (#f27a1d) | Color primario   |
| `tahiti-gold-600` (#ef7d00) | `blaze-orange-600` (#eb6313) | Hover primario   |
| `tahiti-gold-700` (#b95004) | `blaze-orange-700` (#bd4811) | Active primario  |
| N/A                         | `fun-green-500` (#00f269)    | Color secundario |
| N/A                         | `bright-sun-500` (#f9a007)   | Color de acento  |

## 🎨 Nuevos Colores Disponibles

### Blaze Orange (Primario)

```css
--blaze-orange-50: #fef7ee;
--blaze-orange-100: #feeed6;
--blaze-orange-200: #fcd9ac;
--blaze-orange-300: #f9be78;
--blaze-orange-400: #f59842;
--blaze-orange-500: #f27a1d; /* Principal */
--blaze-orange-600: #eb6313; /* Hover */
--blaze-orange-700: #bd4811; /* Active */
--blaze-orange-800: #963a16;
--blaze-orange-900: #793115;
--blaze-orange-950: #411709;
```

### Fun Green (Secundario)

```css
--fun-green-50: #ecfff5;
--fun-green-100: #d3ffe8;
--fun-green-200: #aaffd3;
--fun-green-300: #69ffb2;
--fun-green-400: #21ff8a;
--fun-green-500: #00f269; /* Principal */
--fun-green-600: #00ca53; /* Hover */
--fun-green-700: #009e44; /* Active */
--fun-green-800: #007638;
--fun-green-900: #026532;
--fun-green-950: #003919;
```

### Bright Sun (Acento)

```css
--bright-sun-50: #fffbeb;
--bright-sun-100: #fff4c6;
--bright-sun-200: #ffe788;
--bright-sun-300: #ffd549;
--bright-sun-400: #ffc220;
--bright-sun-500: #f9a007; /* Principal */
--bright-sun-600: #dd7802; /* Hover */
--bright-sun-700: #b75406; /* Active */
--bright-sun-800: #943f0c;
--bright-sun-900: #7a350d;
--bright-sun-950: #461a02;
```

## 🔄 Mapeo de Clases CSS

### Clases Tailwind a Actualizar

```typescript
// ANTES
'bg-tahiti-gold-500'     → 'bg-blaze-orange-500'
'text-tahiti-gold-600'   → 'text-blaze-orange-600'
'border-tahiti-gold-500' → 'border-blaze-orange-500'
'hover:bg-tahiti-gold-600' → 'hover:bg-blaze-orange-600'
'focus:ring-tahiti-gold-500' → 'focus:ring-blaze-orange-500'

// NUEVAS OPCIONES DISPONIBLES
'bg-fun-green-500'       // Para botones secundarios
'bg-bright-sun-500'      // Para elementos de acento
'text-fun-green-700'     // Para texto de éxito
'border-bright-sun-600'  // Para bordes de advertencia
```

### Variables CSS Personalizadas

```css
/* ANTES */
:root {
  --color-primary: #fc9d04;
  --color-primary-hover: #ef7d00;
  --color-primary-active: #b95004;
}

/* DESPUÉS */
:root {
  --color-primary: #f27a1d;
  --color-primary-hover: #eb6313;
  --color-primary-active: #bd4811;
  --color-secondary: #00f269;
  --color-secondary-hover: #00ca53;
  --color-secondary-active: #009e44;
  --color-accent: #f9a007;
  --color-accent-hover: #dd7802;
  --color-accent-active: #b75406;
}
```

## 🧩 Actualización de Componentes

### Botones

```typescript
// ANTES
const Button = ({ variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-tahiti-gold-500 hover:bg-tahiti-gold-600 text-white',
    secondary: 'border border-tahiti-gold-500 text-tahiti-gold-600',
  }
  // ...
}

// DESPUÉS
const Button = ({ variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-blaze-orange-500 hover:bg-blaze-orange-600 text-white',
    secondary: 'bg-fun-green-500 hover:bg-fun-green-600 text-gray-800',
    accent: 'bg-bright-sun-500 hover:bg-bright-sun-600 text-gray-800',
  }
  // ...
}
```

### Formularios

```css
/* ANTES */
.form-input:focus {
  border-color: #fc9d04;
  box-shadow: 0 0 0 3px rgba(252, 157, 4, 0.1);
}

/* DESPUÉS */
.form-input:focus {
  border-color: #f27a1d;
  box-shadow: 0 0 0 3px rgba(242, 122, 29, 0.1);
}
```

### Estados y Alertas

```typescript
// ANTES
const alertVariants = {
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
}

// DESPUÉS
const alertVariants = {
  success: 'bg-fun-green-50 text-fun-green-900 border-fun-green-200',
  warning: 'bg-bright-sun-50 text-bright-sun-900 border-bright-sun-200',
  error: 'bg-blaze-orange-50 text-blaze-orange-900 border-blaze-orange-200',
}
```

## 🔧 Configuración Actualizada

### Tailwind Config

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Nueva paleta principal
        'blaze-orange': {
          /* ... */
        },
        'fun-green': {
          /* ... */
        },
        'bright-sun': {
          /* ... */
        },

        // Alias semánticos
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
      },
    },
  },
}
```

### Clerk Configuration

```typescript
// ANTES
appearance: {
  variables: {
    colorPrimary: '#d97706', // tahiti-gold-600
    colorBackground: '#fffbea', // tahiti-gold-50
  }
}

// DESPUÉS
appearance: {
  variables: {
    colorPrimary: '#eb6313', // blaze-orange-600
    colorBackground: '#fef7ee', // blaze-orange-50
  }
}
```

## 📝 Checklist de Migración

### ✅ Archivos Actualizados

- [x] `tailwind.config.ts` - Nueva paleta de colores
- [x] `src/app/css/style.css` - Clases CSS personalizadas
- [x] `src/components/providers/ClerkProviderSSG.tsx` - Configuración Clerk
- [x] `src/components/Header/index.tsx` - Logo actualizado
- [x] `src/__tests__/components/Header.test.tsx` - Tests actualizados
- [x] `docs/design-system/` - Documentación actualizada

### 🔍 Verificaciones Necesarias

- [x] Contraste de accesibilidad WCAG 2.1 AA
- [x] Compatibilidad con modo oscuro
- [x] Consistencia en todos los componentes
- [x] Tests actualizados y pasando

### 📱 Testing Recomendado

1. **Navegadores**: Chrome, Firefox, Safari, Edge
2. **Dispositivos**: Desktop, tablet, móvil
3. **Modos**: Claro y oscuro
4. **Accesibilidad**: Screen readers, navegación por teclado

## 🚀 Próximos Pasos

1. **Ejecutar tests**: `npm test`
2. **Verificar build**: `npm run build`
3. **Testing visual**: Revisar componentes en Storybook
4. **Deploy staging**: Verificar en entorno de pruebas
5. **Feedback**: Recopilar comentarios del equipo

---

**📅 Migración completada**: Junio 2025  
**🎨 Nueva identidad**: Blaze Orange + Fun Green + Bright Sun  
**✅ Estado**: Lista para producción
