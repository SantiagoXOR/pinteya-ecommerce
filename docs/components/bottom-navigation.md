# Bottom Navigation

Componente de navegación inferior estilo MercadoLibre para dispositivos móviles, proporcionando acceso rápido a las funciones principales de la aplicación.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado estilo MercadoLibre con colores de marca Pinteya.

## 🎯 Características

- **Diseño estilo MercadoLibre** - Inspirado en la UX de MercadoLibre para familiaridad
- **5 botones principales** - Volver, Buscar, Carrito, Inicio, WhatsApp
- **Badge de carrito** - Muestra cantidad de items con badge naranja de marca
- **Estados visuales** - Feedback visual en interacciones (hover, active, pressed)
- **Integración con carrito** - Abre modal del carrito al hacer clic
- **Safe area support** - Compatible con dispositivos con notch
- **Accesibilidad** - ARIA labels y navegación por teclado

## 📐 Estructura Visual

```
┌─────────────────────────────────────────┐
│  ←    🔍    🛒(3)   🏠    💬          │
│ Volver Buscar Carrito Inicio WhatsApp   │
└─────────────────────────────────────────┘
```

### Dimensiones

- **Altura**: 64px (h-16)
- **Ancho máximo**: max-w-md (centrado en pantallas grandes)
- **Z-index**: `z-bottom-nav` (configurado en Tailwind)

## 🚀 Uso

### Versión MercadoLibre (Recomendada)

```tsx
import { MercadoLibreBottomNav } from '@/components/ui/bottom-navigation-mercadolibre'

function Layout({ children }) {
  return (
    <>
      {children}
      <MercadoLibreBottomNav />
    </>
  )
}
```

### Versión Base (Con Variantes)

```tsx
import { BottomNavigation } from '@/components/ui/bottom-navigation'

function Layout({ children }) {
  return (
    <>
      {children}
      <BottomNavigation 
        variant="warm" 
        items={customItems}
      />
    </>
  )
}
```

## 🎨 Items de Navegación

### Orden y Funcionalidad

1. **Volver** (←)
   - Función: Navega hacia atrás en el historial
   - Tipo: Botón con `router.back()`
   - Fallback: Si no hay historial, redirige a `/`

2. **Buscar** (🔍)
   - Función: Hace focus en el searchbar del header
   - Tipo: Botón con scroll suave al top
   - Comportamiento: Busca el input del header y le hace focus

3. **Carrito** (🛒)
   - Función: Abre el modal del carrito
   - Tipo: Botón que abre `CartSidebarModal`
   - Badge: Muestra cantidad de items (máximo 99+)
   - Estado visual: Cambia de color cuando tiene items

4. **Inicio** (🏠)
   - Función: Navega a la página principal
   - Tipo: Link a `/`
   - Estado activo: Se resalta cuando estás en la home

5. **WhatsApp** (💬)
   - Función: Abre WhatsApp en nueva pestaña
   - Tipo: Botón que abre `https://wa.me/5493513411796`
   - Comportamiento: Nueva ventana con `noopener,noreferrer`

## 🎨 Paleta de Colores

### Estados del Carrito

| Estado | Fondo | Borde | Ícono | Badge |
|--------|-------|-------|-------|-------|
| Vacío | `bg-gray-50` | `border-gray-200` | `text-gray-600` | - |
| Con items | `bg-blaze-orange-50` | `border-blaze-orange-200` | `text-blaze-orange-600` | `bg-blaze-orange-600` |
| Presionado | `bg-blaze-orange-600` | `border-blaze-orange-700` | `text-white` | `bg-blaze-orange-600` |

### Estados de Items Activos

- **Línea superior**: `bg-blaze-orange-600` (línea de 12px de ancho)
- **Ícono activo**: `text-blaze-orange-600 fill-blaze-orange-600`
- **Texto activo**: `text-blaze-orange-600 font-semibold`

## ⚙️ Funcionalidades Específicas

### Integración con Carrito

El componente se integra con Redux para obtener el estado del carrito:

```tsx
const cartItems = useAppSelector(state => state.cartReducer.items)
const cartItemCount = cartItems.length
```

Y con el contexto del modal del carrito:

```tsx
const { openCartModal } = useCartModalContext()
```

### Detección de Ruta Activa

El componente detecta automáticamente la ruta actual:

```tsx
const isActive = (href: string) => {
  if (href === '/') return pathname === '/'
  if (href === '/menu') return pathname === '/menu'
  if (href === '/search') return pathname === '/search'
  return pathname.startsWith(href)
}
```

### Focus en Searchbar

Cuando se hace clic en "Buscar", el componente:

1. Hace scroll suave al top de la página
2. Busca el input del searchbar en el header
3. Le hace focus y click después de 300ms
4. Si no encuentra el input, dispara evento `focus-searchbar`

## 🔧 Personalización

### Cambiar Items de Navegación

Para la versión base, puedes pasar items personalizados:

```tsx
const customItems: BottomNavigationItem[] = [
  {
    id: 'custom',
    label: 'Personalizado',
    href: '/custom',
    icon: <CustomIcon />,
    badge: 5
  }
]

<BottomNavigation items={customItems} />
```

### Cambiar Variante de Color

La versión base soporta 4 variantes:

```tsx
<BottomNavigation variant="default" />  // Blanco
<BottomNavigation variant="warm" />    // Naranja claro (default)
<BottomNavigation variant="dark" />     // Oscuro
<BottomNavigation variant="primary" />  // Color primario
```

### Modificar Número de WhatsApp

Edita la constante en `bottom-navigation-mercadolibre.tsx`:

```tsx
const whatsappNumber = '5493513411796' // Cambiar por tu número
```

## 📱 Responsive

- **Mobile**: Siempre visible en la parte inferior
- **Tablet**: Mantiene posición fija
- **Desktop**: Se oculta automáticamente (puede configurarse)

### Safe Area Support

El componente incluye la clase `safe-area-bottom` para dispositivos con notch:

```tsx
className={cn(
  'fixed bottom-0 ...',
  'safe-area-bottom' // Ajusta padding en dispositivos con notch
)}
```

## ♿ Accesibilidad

- **ARIA labels**: Cada botón tiene `aria-label` descriptivo
- **Focus visible**: Anillo de focus naranja (`focus:ring-blaze-orange-500`)
- **Navegación por teclado**: Todos los botones son accesibles con Tab
- **Estados visuales**: Feedback claro en todas las interacciones

## 🐛 Troubleshooting

### El carrito no se abre al hacer clic

**Solución**: Verifica que el `CartSidebarModalContext` esté configurado en el layout principal.

### El badge no se actualiza

**Solución**: Asegúrate de que Redux esté configurado correctamente y que el estado del carrito se actualice.

### El botón "Buscar" no funciona

**Solución**: Verifica que el header tenga un input con `role="searchbox"` o que escuche el evento `focus-searchbar`.

### Z-index conflictos con modales

**Solución**: El componente usa `z-bottom-nav` que debe estar configurado en `tailwind.config.ts`. Verifica que los modales tengan un z-index mayor.

## 📊 Performance

- **Renderizado optimizado**: Solo se re-renderiza cuando cambia el carrito o la ruta
- **Event handlers memoizados**: Los handlers están optimizados para evitar re-renders innecesarios
- **Lazy loading**: El componente se carga solo en dispositivos móviles (puede configurarse)

## 🔗 Archivos Relacionados

- `src/components/ui/bottom-navigation-mercadolibre.tsx` - Versión MercadoLibre (recomendada)
- `src/components/ui/bottom-navigation.tsx` - Versión base con variantes
- `src/app/context/CartSidebarModalContext.tsx` - Contexto del modal del carrito
- `src/redux/features/cart-slice.ts` - Estado del carrito en Redux

## 📝 Notas de Desarrollo

### Commit: `bdcd19fc` - "feat: implementar bottom navigation estilo MercadoLibre"

**Cambios implementados:**

1. **Diseño inspirado en MercadoLibre**
   - 5 botones principales
   - Badge de carrito destacado
   - Línea naranja en items activos

2. **Integración con carrito**
   - Badge dinámico con cantidad
   - Estados visuales según contenido
   - Apertura de modal al hacer clic

3. **Funcionalidades específicas**
   - Botón "Volver" con historial
   - Botón "Buscar" con focus en header
   - Botón "WhatsApp" con enlace directo

4. **Colores de marca Pinteya**
   - Naranja (`blaze-orange-600`) para estados activos
   - Badge naranja para carrito
   - Transiciones suaves

### Diferencias entre Versiones

| Característica | Versión Base | Versión MercadoLibre |
|----------------|--------------|----------------------|
| Items configurables | ✅ Sí | ❌ No (fijos) |
| Variantes de color | ✅ 4 variantes | ❌ Solo blanco |
| Integración carrito | ⚠️ Básica | ✅ Completa |
| Botón WhatsApp | ❌ No | ✅ Sí |
| Botón Volver | ❌ No | ✅ Sí |
| Focus searchbar | ❌ No | ✅ Sí |

## 🎯 Mejores Prácticas

1. **Usar versión MercadoLibre** para mejor UX en móviles
2. **Mantener badge actualizado** para confianza del usuario
3. **Probar en dispositivos reales** para verificar safe area
4. **Verificar z-index** cuando hay modales o overlays
