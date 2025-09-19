# Pinteya E-commerce - Library Structure

## Arquitectura Modular Enterprise-Ready

La biblioteca `/src/lib` ha sido reorganizada siguiendo principios de arquitectura enterprise con separación clara de responsabilidades y módulos especializados.

## Estructura de Módulos

### 📁 `/core` - Funcionalidades Básicas
Punto de entrada principal para utilidades básicas y configuración.
```typescript
import { formatCurrency, validateEmail } from '@/lib/core';
```

### 🔐 `/auth` - Autenticación y Autorización
Módulo especializado en NextAuth.js, Supabase y gestión de usuarios.
```typescript
import { auth, signIn, signOut } from '@/lib/auth';
```

### 🔌 `/integrations` - Servicios Externos
Integraciones con MercadoPago, Analytics, Supabase, Redis.
```typescript
import { createPayment, trackEvent } from '@/lib/integrations';
```

### 🏢 `/enterprise` - Funcionalidades Enterprise
Security, monitoring, performance, logging, rate limiting.
```typescript
import { rateLimiter, securityLogger } from '@/lib/enterprise';
```

### 💼 `/business` - Lógica de Negocio
Órdenes, productos, logística, analytics de negocio.
```typescript
import { orderStateMachine, calculateShipping } from '@/lib/business';
```

## Principios de Organización

### 1. **Separación de Responsabilidades**
- Cada módulo tiene una responsabilidad específica
- No hay dependencias circulares
- Interfaces claras entre módulos

### 2. **Escalabilidad**
- Estructura preparada para crecimiento
- Fácil adición de nuevas funcionalidades
- Mantenimiento simplificado

### 3. **Reutilización**
- Componentes modulares reutilizables
- Exports centralizados por módulo
- Documentación clara de APIs

### 4. **Enterprise-Ready**
- Logging estructurado
- Monitoring y métricas
- Security y rate limiting
- Testing comprehensivo

## Migración desde Estructura Anterior

Los archivos han sido reorganizados manteniendo compatibilidad:

```typescript
// ❌ Antes (archivos sueltos)
import { formatDate } from '@/lib/utils/format';
import { auth } from '@/lib/auth-adapter';

// ✅ Ahora (módulos organizados)
import { formatDate } from '@/lib/core';
import { auth } from '@/lib/auth';
```

## Patrones de Uso Recomendados

### Importaciones Específicas
```typescript
// Preferido: importaciones específicas
import { formatCurrency, validateEmail } from '@/lib/core';
import { auth, signIn } from '@/lib/auth';
```

### Importaciones de Módulo Completo
```typescript
// Para casos específicos
import * as Auth from '@/lib/auth';
import * as Enterprise from '@/lib/enterprise';
```

## Testing

Cada módulo incluye sus propios tests y mocks:
- Tests unitarios por funcionalidad
- Mocks centralizados por módulo
- Configuración Jest optimizada

## Documentación Adicional

- [Authentication Module](./auth/README.md)
- [Enterprise Features](./enterprise/README.md)
- [Business Logic](./business/README.md)
- [Integrations](./integrations/README.md)


