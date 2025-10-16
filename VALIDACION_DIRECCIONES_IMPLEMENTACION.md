# Implementación de Validación de Direcciones para Córdoba Capital

## Resumen
Se ha implementado un sistema completo de validación de direcciones que asegura que solo se puedan realizar compras con direcciones en Córdoba Capital, utilizando la API de Google Maps.

## Archivos Creados/Modificados

### 1. Servicio de Validación (`src/lib/services/addressValidation.ts`)
- **Funcionalidad**: Servicio principal para validar direcciones usando Google Maps API
- **Características**:
  - Validación geográfica por coordenadas
  - Validación por componentes de dirección
  - Fallback sin API para validación básica
  - Autocompletado de direcciones
  - Límites geográficos específicos de Córdoba Capital

### 2. Hook Personalizado (`src/hooks/useAddressValidation.ts`)
- **Funcionalidad**: Hook React para manejar la validación en tiempo real
- **Características**:
  - Debounce para optimizar llamadas a la API
  - Estado de validación en tiempo real
  - Manejo de sugerencias
  - Limpieza automática de timeouts

### 3. Componente UI (`src/components/ui/AddressInput.tsx`)
- **Funcionalidad**: Componente de input con validación integrada
- **Características**:
  - Indicadores visuales de estado
  - Sugerencias desplegables
  - Mensajes de error específicos
  - Iconos de estado (cargando, válido, error)
  - Botón para limpiar dirección

### 4. Integración en Checkout (`src/components/Checkout/ExpressForm.tsx`)
- **Modificación**: Reemplazo del input básico por AddressInput
- **Características**:
  - Validación automática al escribir
  - Integración con el sistema de errores existente
  - Mantenimiento de la funcionalidad móvil

### 5. Validación en Hook de Checkout (`src/hooks/useCheckout.ts`)
- **Modificación**: Agregada validación básica para Córdoba Capital
- **Características**:
  - Validación de texto que contenga "Córdoba"
  - Integración con el sistema de validación existente

## Configuración Requerida

### Variables de Entorno
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### APIs de Google Maps Necesarias
1. **Geocoding API** - Para validar direcciones
2. **Places API** - Para autocompletado

## Funcionalidades Implementadas

### ✅ Validación Geográfica
- Verifica coordenadas dentro de los límites de Córdoba Capital
- Límites: Norte -31.25°, Sur -31.55°, Este -64.05°, Oeste -64.35°

### ✅ Validación por Componentes
- Verifica que el componente "locality" contenga "Córdoba"
- Validación redundante para mayor precisión

### ✅ Autocompletado Inteligente
- Sugerencias en tiempo real mientras el usuario escribe
- Filtrado específico para Argentina
- Debounce para optimizar llamadas a la API

### ✅ Indicadores Visuales
- Estado de carga durante validación
- Iconos de éxito/error
- Mensajes de error específicos
- Sugerencias desplegables

### ✅ Fallback sin API
- Validación básica cuando no hay API key
- Verificación de texto que contenga "Córdoba"
- Funciona offline

## Uso en el Código

### Componente Básico
```tsx
<AddressInput
  value={address}
  onChange={setAddress}
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
  showSuggestions={true}
  placeholder="Av. Corrientes 1234, Córdoba"
/>
```

### Hook Personalizado
```tsx
const {
  address,
  setAddress,
  validationResult,
  suggestions,
  validateAddress
} = useAddressValidation({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
})
```

## Testing

### Archivo de Pruebas (`src/lib/services/__tests__/addressValidation.test.ts`)
- Pruebas unitarias para el servicio de validación
- Mock de la API de Google Maps
- Casos de prueba para direcciones válidas e inválidas
- Manejo de errores de API

## Costos Estimados

### Google Maps API
- **Geocoding API**: $5 por 1000 requests
- **Places API Autocomplete**: $2.83 por 1000 requests
- **Estimación mensual**: ~$10-50 dependiendo del volumen

## Monitoreo Recomendado

1. **Google Cloud Console**: Monitorear uso y costos
2. **Logs de aplicación**: Rastrear errores de validación
3. **Métricas de conversión**: Verificar impacto en checkout

## Próximos Pasos

1. **Configurar API Key** en variables de entorno
2. **Probar en desarrollo** con direcciones reales
3. **Configurar monitoreo** de costos y uso
4. **Implementar en otros formularios** si es necesario
5. **Considerar caché** para direcciones frecuentes

## Consideraciones de Seguridad

1. **Restricciones de API Key**: Solo para tu dominio
2. **Cuotas diarias**: Establecer límites apropiados
3. **Validación del lado del servidor**: Implementar validación adicional en el backend
4. **Rate limiting**: Prevenir abuso de la API

## Beneficios

- ✅ **Mejora UX**: Autocompletado y validación en tiempo real
- ✅ **Reduce errores**: Validación precisa de direcciones
- ✅ **Optimiza logística**: Solo direcciones en Córdoba Capital
- ✅ **Escalable**: Fácil de extender a otras ciudades
- ✅ **Robusto**: Fallback sin API y manejo de errores
