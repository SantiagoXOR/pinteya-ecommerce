# Sistema de Temas

Documentación del sistema de temas personalizado de Pinteya E-commerce.

> **Última actualización**: 15 de Diciembre, 2025 - Eliminado uso de `next-themes`, implementado sistema de temas personalizado.

## 🎯 Características

- **Sistema de temas personalizado** - Implementación propia sin dependencias externas
- **Modos de tema** - Light, Dark y Auto (basado en preferencias del sistema)
- **Contextos de tema** - Default, E-commerce, Admin, Mobile
- **Persistencia** - Guarda preferencias en localStorage
- **Variables CSS dinámicas** - Aplica colores según el tema activo
- **Sin dependencias externas** - No requiere `next-themes` u otras librerías

## 📐 Arquitectura

### Componentes Principales

```
src/components/theme/
└── theme-provider.tsx    # Provider principal y hooks
```

### Sistema de Temas

El sistema define dos temas base:

1. **Pinteya Light** - Tema claro
2. **Pinteya Dark** - Tema oscuro

Cada tema incluye:
- Colores primarios (naranja de marca)
- Colores de fondo (primary, secondary)
- Colores de texto (primary, secondary, tertiary)
- Colores de borde
- Colores específicos de e-commerce (precio, stock, shipping)

## 🚀 Uso

### Provider de Tema

```tsx
import { ThemeProvider } from '@/components/theme/theme-provider'

function Layout({ children }) {
  return (
    <ThemeProvider defaultMode="light" defaultContext="ecommerce">
      {children}
    </ThemeProvider>
  )
}
```

### Hook useTheme

```tsx
import { useTheme } from '@/components/theme/theme-provider'

function MyComponent() {
  const { theme, mode, context, setMode, toggleMode } = useTheme()

  return (
    <div>
      <p>Tema actual: {mode}</p>
      <button onClick={toggleMode}>Alternar tema</button>
    </div>
  )
}
```

## 🎨 Modos de Tema

### Light Mode

```typescript
const lightTheme: Theme = {
  name: 'Pinteya Light',
  colors: {
    primary: { 500: '#ea5a17', 600: '#eb6313' },
    background: { primary: '#ffffff', secondary: '#f9fafb' },
    text: { primary: '#111827', secondary: '#6b7280', tertiary: '#9ca3af' },
    // ...
  }
}
```

### Dark Mode

```typescript
const darkTheme: Theme = {
  name: 'Pinteya Dark',
  colors: {
    primary: { 500: '#ea5a17', 600: '#eb6313' },
    background: { primary: '#1f2937', secondary: '#111827' },
    text: { primary: '#f9fafb', secondary: '#d1d5db', tertiary: '#9ca3af' },
    // ...
  }
}
```

### Auto Mode

El modo "auto" detecta automáticamente la preferencia del sistema:

```tsx
const systemTheme = useSystemTheme() // 'light' | 'dark'
const resolvedTheme = mode === 'auto' ? systemTheme : mode
```

## 🔧 Contextos de Tema

El sistema soporta diferentes contextos para adaptar el tema según la sección:

- **default** - Tema por defecto
- **ecommerce** - Optimizado para e-commerce
- **admin** - Optimizado para panel administrativo
- **mobile** - Optimizado para móviles

```tsx
<ThemeProvider defaultContext="ecommerce">
  {/* Componentes con tema e-commerce */}
</ThemeProvider>
```

## 📋 API del Hook useTheme

```typescript
interface UseThemeReturn {
  theme: Theme                    // Objeto de tema completo
  mode: ThemeMode                 // 'light' | 'dark' | 'auto'
  context: ThemeContextType       // 'default' | 'ecommerce' | 'admin' | 'mobile'
  setMode: (mode: ThemeMode) => void
  setContext: (context: ThemeContextType) => void
  toggleMode: () => void
}
```

## 🔄 Persistencia

Las preferencias de tema se guardan automáticamente en `localStorage`:

```typescript
// Guardar preferencias
saveThemePreference(mode, context)

// Cargar preferencias
const { mode, context } = loadThemePreference()
```

### Clave de Storage

```typescript
const THEME_STORAGE_KEY = 'pinteya-theme-preference'
```

## 🎯 Aplicación de Variables CSS

El sistema aplica variables CSS dinámicamente según el tema:

```typescript
function applyThemeVariables(theme: Theme) {
  const root = document.documentElement
  
  // Aplicar colores primarios
  root.style.setProperty('--color-primary-500', theme.colors.primary[500])
  root.style.setProperty('--color-primary-600', theme.colors.primary[600])
  
  // Aplicar colores de fondo
  root.style.setProperty('--color-bg-primary', theme.colors.background.primary)
  root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary)
  
  // ... más variables
}
```

## 🔄 Migración desde next-themes

### Commit: `8912a511` - "refactor: eliminar uso de next-themes"

**Cambios implementados:**

1. **Removido ThemeProvider de next-themes**
   - Eliminado `import { ThemeProvider as NextThemesProvider } from 'next-themes'`
   - Removido del `providers.tsx`

2. **Implementado sistema personalizado**
   - Creado `ThemeProvider` propio en `src/components/theme/theme-provider.tsx`
   - Funcionalidad equivalente sin dependencias externas

3. **Mantenida compatibilidad**
   - API similar para facilitar migración
   - Mismos modos (light, dark, auto)

### Diferencias con next-themes

| Característica | next-themes | Sistema Personalizado |
|----------------|-------------|----------------------|
| Dependencia externa | ✅ Sí | ❌ No |
| Modos | light, dark, system | light, dark, auto |
| Contextos | ❌ No | ✅ Sí (default, ecommerce, admin, mobile) |
| Persistencia | localStorage | localStorage |
| Variables CSS | Manual | Automática |
| Tamaño bundle | +2KB | 0KB (incluido) |

## 🐛 Troubleshooting

### El tema no se aplica

**Solución**: Verifica que el `ThemeProvider` esté envolviendo la aplicación en el layout principal.

### El tema no persiste

**Solución**: Verifica que `enablePersistence={true}` esté configurado en el `ThemeProvider`.

### Hydration mismatch

**Solución**: El componente maneja esto automáticamente con `mounted` state. Si persiste, verifica que no haya estilos inline que sobrescriban el tema.

### El modo auto no funciona

**Solución**: Verifica que el navegador soporte `prefers-color-scheme`. El sistema usa `window.matchMedia('(prefers-color-scheme: dark)')`.

## 🔗 Archivos Relacionados

- `src/components/theme/theme-provider.tsx` - Implementación del sistema de temas
- `src/lib/theme.tsx` - Utilidades adicionales de tema (si existe)
- `src/app/providers.tsx` - Integración en providers (sin ThemeProvider actualmente)
- `tailwind.config.ts` - Configuración de dark mode

## 📝 Notas de Desarrollo

### Razón de la Eliminación

`next-themes` fue removido para:
- **Reducir dependencias** - Menos paquetes externos
- **Control total** - Implementación personalizada con funcionalidades específicas
- **Mejor performance** - Sin overhead de librería externa
- **Contextos personalizados** - Soporte para contextos específicos (ecommerce, admin)

### Estado Actual

- ✅ Sistema de temas personalizado implementado
- ✅ Funcionalidad completa (light, dark, auto)
- ✅ Persistencia en localStorage
- ⚠️ `next-themes` todavía en `package.json` (puede removerse si no se usa)

### Próximos Pasos

1. Verificar que `next-themes` no se use en ningún lugar
2. Remover `next-themes` de `package.json` si está confirmado
3. Considerar integrar `ThemeProvider` en `providers.tsx` si es necesario

## 🎯 Uso en Componentes

### Acceder al Tema

```tsx
import { useTheme } from '@/components/theme/theme-provider'

function MyComponent() {
  const { theme, mode } = useTheme()
  
  return (
    <div style={{ 
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary 
    }}>
      Tema: {mode}
    </div>
  )
}
```

### Toggle de Tema

```tsx
import { ThemeModeToggle } from '@/components/theme/theme-provider'

function Header() {
  return (
    <header>
      <ThemeModeToggle />
    </header>
  )
}
```

### Panel de Configuración

```tsx
import { ThemeConfigPanel } from '@/components/theme/theme-provider'

function Settings() {
  return (
    <div>
      <h2>Configuración de Tema</h2>
      <ThemeConfigPanel />
    </div>
  )
}
```
