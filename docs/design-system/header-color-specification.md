# 🎨 Especificación de Colores del Header - Pinteya E-commerce

## 📋 **COLORES OFICIALES EXACTOS**

### 🔥 **Blaze Orange (Naranja Principal)**

```css
/* DEFAULT - Color principal */
--blaze-orange: #f27a1d;
/* HOVER - Estado hover */
--blaze-orange-hover: #eb6313;
/* ACTIVE - Estado activo/pressed */
--blaze-orange-active: #bd4811;
```

**Uso en Tailwind:**

- `bg-blaze-orange` - Fondo principal
- `hover:bg-blaze-orange-600` - Hover state
- `active:bg-blaze-orange-700` - Active state

### ☀️ **Bright Sun (Amarillo Acento)**

```css
/* DEFAULT - Color principal */
--bright-sun: #f9a007;
/* HOVER - Estado hover */
--bright-sun-hover: #dd7802;
/* ACTIVE - Estado activo/pressed */
--bright-sun-active: #b75406;
```

**Uso en Tailwind:**

- `bg-bright-sun` - Fondo principal
- `hover:bg-bright-sun-600` - Hover state
- `active:bg-bright-sun-700` - Active state

### 🟢 **Fun Green (Verde Secundario)**

```css
/* DEFAULT - Color principal */
--fun-green: #00f269;
/* HOVER - Estado hover */
--fun-green-hover: #00ca53;
/* ACTIVE - Estado activo/pressed */
--fun-green-active: #009e44;
```

**Uso en Tailwind:**

- `bg-fun-green` - Fondo principal
- `hover:bg-fun-green-600` - Hover state
- `active:bg-fun-green-700` - Active state

## 🏗️ **APLICACIÓN EN COMPONENTES DEL HEADER**

### **TopBar**

```tsx
// CORRECTO ✅
className = 'bg-blaze-orange text-white border-b border-blaze-orange-600'

// INCORRECTO ❌
className = 'bg-blaze-orange-600 text-white border-b border-blaze-orange-700'
```

### **NewHeader (Actualizado Enero 2025)**

```tsx
// CORRECTO ✅ - Fondo naranja de marca
className = 'bg-blaze-orange-600 border-b border-blaze-orange-700'

// ANTES ❌ - Fondo blanco genérico
className = 'bg-white border-b border-gray-200'
```

### **Header Principal**

```tsx
// CORRECTO ✅
className = 'bg-blaze-orange header-sticky-transition'

// INCORRECTO ❌
className = 'bg-blaze-orange-500 header-sticky-transition'
```

### **Botones de Acción (Carrito, Usuario)**

```tsx
// CORRECTO ✅ - Hover amarillo
className = 'text-white hover:text-black hover:bg-bright-sun transition-all duration-200'

// INCORRECTO ❌ - Hover naranja
className = 'text-white hover:text-white hover:bg-blaze-orange-600'
```

### **Botón de Búsqueda**

```tsx
// CORRECTO ✅
className = 'bg-bright-sun hover:bg-bright-sun-600 text-black'

// INCORRECTO ❌
className = 'bg-bright-sun-500 hover:bg-bright-sun-600 text-black'
```

## 🎯 **REGLAS DE CONSISTENCIA**

### **1. Jerarquía de Colores:**

- **Primario**: Blaze Orange (#f27a1d) - Fondos principales
- **Acento**: Bright Sun (#f9a007) - Botones de acción, hovers
- **Secundario**: Fun Green (#00f269) - Estados, indicadores

### **2. Estados Interactivos:**

- **Normal**: Color DEFAULT
- **Hover**: Color -600 variant
- **Active/Pressed**: Color -700 variant
- **Disabled**: Color -300 variant + opacity-50

### **3. Transiciones:**

```css
/* Siempre usar transiciones suaves */
transition-all duration-200
```

## 🔧 **IMPLEMENTACIONES ESPECÍFICAS**

### **Efectos Hover Amarillos:**

```tsx
// Carrito
hover:bg-bright-sun hover:text-black

// Avatar Usuario
hover:bg-bright-sun hover:text-black hover:ring-bright-sun

// Botones de Autenticación
hover:bg-bright-sun hover:text-black hover:border-bright-sun
```

### **Indicadores de Estado:**

```tsx
// Ubicación detectada
text-fun-green-400

// Asesoramiento en vivo
bg-fun-green-400 animate-pulse

// Estados disponibles
text-fun-green-600
```

## ✅ **CHECKLIST DE VERIFICACIÓN**

- [ ] TopBar usa `bg-blaze-orange` (no -600)
- [ ] Header principal usa `bg-blaze-orange` (no -500)
- [ ] Botones de carrito tienen hover amarillo (`hover:bg-bright-sun`)
- [ ] Avatar de usuario tiene hover amarillo con ring
- [ ] Botón de búsqueda usa `bg-bright-sun` (no -500)
- [ ] Todas las transiciones usan `duration-200`
- [ ] Indicadores verdes usan `fun-green-400`
- [ ] No hay colores hardcodeados (hex) en componentes

## 🚫 **COLORES PROHIBIDOS EN HEADER**

- ❌ `bg-orange-*` (usar `bg-blaze-orange`)
- ❌ `bg-yellow-*` (usar `bg-bright-sun`)
- ❌ `bg-green-*` (usar `bg-fun-green`)
- ❌ Cualquier hex hardcodeado (#f27a1d, etc.)
- ❌ Colores de accent-\* antiguos
- ❌ Variantes -500 para colores principales

## 📝 **NOTAS DE MIGRACIÓN**

Si encuentras colores incorrectos:

1. Reemplazar `blaze-orange-600` → `blaze-orange`
2. Reemplazar `blaze-orange-500` → `blaze-orange`
3. Reemplazar hovers naranjas → hovers amarillos (`bright-sun`)
4. Agregar `transition-all duration-200` a elementos interactivos
5. Verificar que los tests sigan pasando después de cambios
