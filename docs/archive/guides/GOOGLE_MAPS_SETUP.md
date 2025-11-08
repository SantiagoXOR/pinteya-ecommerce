# Configuración de Google Maps API para Validación de Direcciones

## Descripción
Este proyecto utiliza la API de Google Maps para validar que las direcciones ingresadas en el checkout estén dentro de Córdoba Capital.

## Configuración Requerida

### 1. Obtener API Key de Google Maps
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Geocoding API**
   - **Places API** (para autocompletado)
4. Crea credenciales (API Key)
5. Configura restricciones de la API Key (recomendado)

### 2. Configurar Variables de Entorno
Agrega la siguiente variable a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 3. Restricciones de Seguridad (Recomendado)
Para mayor seguridad, configura restricciones en tu API Key:

1. **Restricciones de aplicación**: Solo para tu dominio
2. **Restricciones de API**: Solo Geocoding API y Places API
3. **Cuotas**: Establece límites diarios apropiados

## Funcionalidades Implementadas

### Validación de Direcciones
- ✅ Verifica que la dirección esté en Córdoba Capital
- ✅ Validación geográfica usando coordenadas
- ✅ Validación por componentes de dirección
- ✅ Fallback sin API para validación básica

### Autocompletado
- ✅ Sugerencias de direcciones en tiempo real
- ✅ Filtrado específico para Argentina
- ✅ Debounce para optimizar llamadas a la API

### Indicadores Visuales
- ✅ Estado de validación en tiempo real
- ✅ Mensajes de error específicos
- ✅ Iconos de estado (cargando, válido, error)
- ✅ Sugerencias desplegables

## Uso en el Código

### Componente AddressInput
```tsx
import { AddressInput } from '@/components/ui/AddressInput'

<AddressInput
  value={address}
  onChange={setAddress}
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
  showSuggestions={true}
  placeholder="Av. Corrientes 1234, Córdoba"
/>
```

### Hook useAddressValidation
```tsx
import { useAddressValidation } from '@/hooks/useAddressValidation'

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

## Límites de Córdoba Capital
El sistema valida direcciones dentro de estos límites geográficos:
- **Norte**: -31.25° (latitud)
- **Sur**: -31.55° (latitud)  
- **Este**: -64.05° (longitud)
- **Oeste**: -64.35° (longitud)

## Costos de la API
- **Geocoding API**: $5 por 1000 requests
- **Places API Autocomplete**: $2.83 por 1000 requests
- **Places API Details**: $17 por 1000 requests

## Monitoreo
Recomendamos monitorear el uso de la API en Google Cloud Console para:
- Controlar costos
- Detectar picos de uso
- Configurar alertas de cuota

## Fallback sin API
Si no se configura la API Key, el sistema usa validación básica que:
- Verifica que la dirección contenga "Córdoba" o "Cordoba"
- No requiere llamadas externas
- Funciona offline
