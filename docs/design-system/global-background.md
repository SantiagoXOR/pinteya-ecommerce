# Fondo Global Degradado Negro/Naranja

Documentación del sistema de fondo global implementado en toda la aplicación.

> **Última actualización**: 15 de Diciembre, 2025 - Cambio a fondo degradado vertical negro/naranja (60/40).

## 🎯 Características

- **Fondo degradado vertical** - De negro (0%) a naranja (100%)
- **Aplicación global** - Se aplica a todas las rutas por defecto
- **Fondo fijo** - `background-attachment: fixed` para efecto parallax
- **Color de texto blanco** - Texto blanco por defecto para contraste
- **Sobrescribe fondos locales** - Elimina fondos individuales de componentes

## 📐 Especificaciones Técnicas

### Gradiente

```css
background: linear-gradient(to bottom, #000000 0%, #000000 60%, #eb6313 100%);
```

**Desglose:**
- **0% - 60%**: Negro puro (`#000000`)
- **60% - 100%**: Transición de negro a naranja (`#eb6313`)
- **100%**: Naranja de marca Pinteya (`#eb6313`)

### Propiedades CSS

```css
background: linear-gradient(to bottom, #000000 0%, #000000 60%, #eb6313 100%) !important;
background-attachment: fixed !important;
background-size: cover !important;
background-position: center !important;
background-repeat: no-repeat !important;
color: #ffffff !important;
```

## 🚀 Implementación

### Ubicación Principal

El fondo se define en `src/app/css/style.css`:

```css
body {
  /* Fondo degradado negro/naranja por defecto en todas las rutas - sobrescribe bg-white */
  background: linear-gradient(to bottom, #000000 0%, #000000 60%, #eb6313 100%) !important;
  background-attachment: fixed !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  color: #ffffff !important;
}
```

### CSS Inline Crítico

También se incluye en el CSS inline crítico del `layout.tsx`:

```css
body {
  background: linear-gradient(to bottom, #000000 0%, #000000 60%, #eb6313 100%);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #ffffff;
  min-height: 100vh;
}
```

## 🎨 Colores Utilizados

| Color | Hex | Uso |
|-------|-----|-----|
| Negro | `#000000` | 60% superior del degradado |
| Naranja Pinteya | `#eb6313` | 40% inferior del degradado |
| Blanco | `#ffffff` | Color de texto por defecto |

## 📱 Responsive

El fondo se adapta automáticamente a todos los tamaños de pantalla:

- **Mobile**: Mismo degradado, optimizado para pantallas pequeñas
- **Tablet**: Mantiene proporciones
- **Desktop**: Efecto parallax más visible con `background-attachment: fixed`

## 🔧 Excepciones

### Páginas de Autenticación

Las páginas de autenticación tienen un fondo diferente:

```css
body:has(.auth-page-container) {
  background: linear-gradient(180deg, #ffd549 0%, #fff4c6 50%, #ffffff 100%) !important;
}
```

### Componentes con Fondo Propio

Algunos componentes pueden sobrescribir el fondo:

- Cards de productos: `bg-white` con texto oscuro
- Modales: Fondo blanco o con overlay
- Formularios: Fondo blanco para legibilidad

## 🎯 Impacto en el Diseño

### Antes del Cambio

- Fondos individuales en cada componente
- Inconsistencia visual entre páginas
- Textos con colores variables según el fondo

### Después del Cambio

- Fondo unificado en toda la aplicación
- Consistencia visual global
- Texto blanco por defecto (con excepciones para contenedores blancos)

## 🔄 Commit: `076dbc1e` - "Cambiar fondo global a degradado vertical negro/naranja (60/40)"

### Cambios Implementados

1. **Fondo degradado unificado**
   - Eliminados fondos locales de componentes
   - Aplicado fondo global en `body`

2. **Proporción 60/40**
   - 60% negro en la parte superior
   - 40% naranja en la parte inferior

3. **Texto blanco por defecto**
   - Cambio de color de texto a blanco
   - Excepciones para contenedores con fondo blanco

4. **Eliminación de fondos locales**
   - Commit `14b8c108`: "Eliminar todos los fondos locales y dejar solo el fondo global negro/naranja"

## 🐛 Troubleshooting

### El fondo no se aplica en alguna página

**Solución**: Verifica que no haya estilos inline o clases que sobrescriban el fondo del `body`. El `!important` debería prevenir esto, pero algunos componentes pueden tener z-index más alto.

### El texto no se lee bien

**Solución**: Para contenedores con fondo blanco, asegúrate de usar las clases de legibilidad:

```tsx
<div className="bg-white text-gray-900">
  {/* Contenido con texto oscuro */}
</div>
```

### El fondo se ve diferente en mobile

**Solución**: El `background-attachment: fixed` puede comportarse diferente en algunos dispositivos móviles. Considera usar media queries si es necesario.

## 📊 Performance

- **Impacto mínimo**: El degradado CSS es muy eficiente
- **Sin imágenes**: No requiere carga de assets
- **GPU accelerated**: Los gradientes se renderizan en GPU
- **Fondo fijo**: Puede causar problemas de performance en dispositivos antiguos (considerar `scroll` en mobile)

## 🔗 Archivos Relacionados

- `src/app/css/style.css` - Estilos principales del fondo
- `src/app/layout.tsx` - CSS inline crítico
- `src/app/auth/auth-page.css` - Excepción para páginas de auth
- `tailwind.config.ts` - Configuración de colores de marca

## 📝 Notas de Desarrollo

### Razón del Cambio

El fondo degradado unificado:
- Crea una identidad visual más fuerte
- Reduce la inconsistencia entre páginas
- Mejora la experiencia de usuario con un diseño más cohesivo
- Refuerza la marca Pinteya con el color naranja

### Consideraciones Futuras

- Evaluar performance en dispositivos móviles antiguos
- Considerar variantes del degradado para diferentes secciones
- Mantener excepciones para componentes que requieren fondo blanco

### Compatibilidad

- ✅ Chrome/Edge (todas las versiones)
- ✅ Firefox (todas las versiones)
- ✅ Safari (todas las versiones)
- ⚠️ `background-attachment: fixed` puede tener problemas en iOS Safari antiguo
