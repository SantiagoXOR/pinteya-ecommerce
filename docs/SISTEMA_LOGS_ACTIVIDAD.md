# 📊 Sistema de Logs de Actividad - Pinteya E-commerce

## 🎯 Descripción General

El sistema de logs de actividad permite registrar y monitorear todas las acciones que realizan los usuarios en la plataforma, proporcionando un historial completo para auditoría, análisis de comportamiento y detección de anomalías.

## 🏗️ Arquitectura del Sistema

### **Componentes Principales**

1. **API de Actividad** (`/api/user/activity`)
   - GET: Obtener historial con filtros y paginación
   - POST: Registrar nueva actividad

2. **Hook useUserActivity** (`src/hooks/useUserActivity.ts`)
   - Gestión de estado para actividades
   - Funciones de filtrado y paginación
   - Logging desde el cliente

3. **Utilidad ActivityLogger** (`src/lib/activity/activityLogger.ts`)
   - Funciones centralizadas para logging
   - Helpers específicos por categoría
   - Logging desde APIs del servidor

4. **Componentes UI**
   - `ActivityPage`: Página principal de actividad
   - `ActivityLog`: Componente de historial con filtros

## 📋 Categorías de Actividad

### **Categorías Disponibles**

| Categoría | Descripción | Ejemplos de Acciones |
|-----------|-------------|---------------------|
| `auth` | Autenticación | login, logout, register, password_reset |
| `profile` | Perfil de usuario | update_profile, upload_avatar, add_address |
| `order` | Órdenes | create_order, payment_completed, order_shipped |
| `security` | Seguridad | enable_2fa, suspicious_activity, password_change |
| `session` | Sesiones | session_start, session_end, trust_device |
| `preference` | Preferencias | update_notifications, update_theme |

## 🔧 Uso del Sistema

### **1. Logging desde APIs del Servidor**

```typescript
import { logProfileActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// En una API route
export async function PUT(request: NextRequest) {
  // ... lógica de la API ...
  
  // Registrar actividad
  const requestInfo = getRequestInfo(request);
  await logProfileActivity(
    userId,
    'update_profile',
    { fields_updated: ['name', 'email'] },
    requestInfo
  );
  
  return NextResponse.json({ success: true });
}
```

### **2. Logging desde el Cliente**

```typescript
import { useUserActivity } from '@/hooks/useUserActivity';

function ProfileComponent() {
  const { logActivity } = useUserActivity();
  
  const handleProfileUpdate = async () => {
    // ... lógica de actualización ...
    
    // Registrar actividad
    await logActivity(
      'update_profile',
      'profile',
      'Usuario actualizó su perfil',
      { fields: ['name', 'email'] }
    );
  };
}
```

### **3. Funciones Específicas por Categoría**

```typescript
// Autenticación
await logAuthActivity(userId, 'login', { method: 'email' }, requestInfo);

// Perfil
await logProfileActivity(userId, 'upload_avatar', { file_size: '2MB' }, requestInfo);

// Seguridad
await logSecurityActivity(userId, 'enable_2fa', { method: 'totp' }, requestInfo);

// Sesiones
await logSessionActivity(userId, 'session_start', { device: 'mobile' }, requestInfo);

// Órdenes
await logOrderActivity(userId, 'create_order', orderId, { total: 150.00 }, requestInfo);

// Preferencias
await logPreferenceActivity(userId, 'update_theme', { theme: 'dark' }, requestInfo);
```

## 📊 Estructura de Datos

### **Esquema de Actividad**

```typescript
interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  category: 'auth' | 'profile' | 'order' | 'security' | 'session' | 'preference';
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
```

### **Metadatos Recomendados**

```typescript
// Ejemplo de metadatos por categoría
const metadata = {
  // Auth
  auth: {
    method: 'email' | 'google' | 'github',
    device_type: 'desktop' | 'mobile' | 'tablet',
    location: 'Buenos Aires, Argentina'
  },
  
  // Profile
  profile: {
    fields_updated: ['name', 'email', 'phone'],
    file_size: '2.5MB',
    previous_value: 'old_value'
  },
  
  // Security
  security: {
    severity: 'low' | 'medium' | 'high' | 'critical',
    method: 'totp' | 'sms',
    risk_score: 0.8
  },
  
  // Order
  order: {
    order_id: 'ORD-123',
    total_amount: 150.00,
    payment_method: 'mercadopago',
    items_count: 3
  }
};
```

## 🔍 Filtros y Búsqueda

### **Filtros Disponibles**

```typescript
interface ActivityFilters {
  category?: string;           // Filtrar por categoría
  action?: string;            // Filtrar por acción específica
  startDate?: string;         // Fecha de inicio (ISO string)
  endDate?: string;           // Fecha de fin (ISO string)
  limit?: number;             // Límite de resultados (default: 50)
  offset?: number;            // Offset para paginación
}
```

### **Ejemplo de Uso con Filtros**

```typescript
const { fetchActivities } = useUserActivity();

// Obtener actividad de seguridad de los últimos 7 días
await fetchActivities({
  category: 'security',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  limit: 20
});
```

## 📈 Estadísticas y Analytics

### **Estadísticas Incluidas**

```typescript
interface ActivityStats {
  byCategory: Record<string, number>;    // Conteo por categoría
  byDay: Record<string, number>;         // Actividad por día (últimos 7 días)
  totalActivities: number;               // Total de actividades
}
```

### **Uso de Estadísticas**

```typescript
const { stats } = useUserActivity();

// Mostrar gráfico de actividad por categoría
const chartData = Object.entries(stats.byCategory).map(([category, count]) => ({
  category,
  count
}));
```

## 🔒 Seguridad y Privacidad

### **Row Level Security (RLS)**

- ✅ Los usuarios solo pueden ver su propia actividad
- ✅ Políticas RLS implementadas en Supabase
- ✅ Validación de autenticación en todas las APIs

### **Retención de Datos**

- 📅 **Actividad general**: 1 año
- 🔒 **Actividad de seguridad**: 2 años
- 🗑️ **Limpieza automática**: Configurada en base de datos

### **Información Sensible**

- ❌ **No se registran**: Contraseñas, tokens, datos de pago
- ✅ **Se registran**: IPs, user agents, metadatos no sensibles
- 🔐 **Encriptación**: Metadatos sensibles encriptados

## 🚀 Mejores Prácticas

### **1. Logging Consistente**

```typescript
// ✅ Bueno: Usar funciones específicas
await logAuthActivity(userId, 'login', metadata, requestInfo);

// ❌ Evitar: Logging manual inconsistente
await logUserActivity(userId, { action: 'user_logged_in', category: 'auth' });
```

### **2. Metadatos Útiles**

```typescript
// ✅ Bueno: Metadatos descriptivos
await logProfileActivity(userId, 'update_profile', {
  fields_updated: ['name', 'email'],
  previous_name: oldName,
  validation_passed: true
}, requestInfo);

// ❌ Evitar: Metadatos vacíos o inútiles
await logProfileActivity(userId, 'update_profile', {}, requestInfo);
```

### **3. Manejo de Errores**

```typescript
// ✅ Bueno: No fallar si el logging falla
const success = await logActivity(...);
if (!success) {
  console.warn('Failed to log activity, but continuing...');
}

// ❌ Evitar: Que el logging rompa la funcionalidad principal
await logActivity(...); // Si falla, puede romper la API
```

## 🔧 Configuración y Mantenimiento

### **Variables de Entorno**

```env
# Configuración de logging
ACTIVITY_LOGGING_ENABLED=true
ACTIVITY_RETENTION_DAYS=365
ACTIVITY_BATCH_SIZE=100
```

### **Limpieza Automática**

```sql
-- Función para limpiar actividad antigua
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity 
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND category != 'security';
  
  DELETE FROM user_activity 
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND category = 'security';
END;
$$ LANGUAGE plpgsql;
```

## 📋 Checklist de Implementación

### **Para Nuevas APIs**

- [ ] Importar `logUserActivity` o función específica
- [ ] Obtener `requestInfo` con `getRequestInfo(request)`
- [ ] Registrar actividad después de operación exitosa
- [ ] Incluir metadatos relevantes
- [ ] Manejar errores de logging sin afectar funcionalidad principal

### **Para Componentes de Cliente**

- [ ] Usar hook `useUserActivity`
- [ ] Llamar `logActivity` en acciones importantes
- [ ] Proporcionar descripción clara
- [ ] Incluir metadatos de contexto

## 🐛 Troubleshooting

### **Problemas Comunes**

1. **Actividad no se registra**
   - Verificar autenticación del usuario
   - Revisar permisos RLS en Supabase
   - Comprobar formato de datos

2. **Performance lenta**
   - Usar paginación apropiada
   - Aplicar filtros de fecha
   - Revisar índices de base de datos

3. **Errores de validación**
   - Verificar categorías válidas
   - Comprobar formato de metadatos
   - Validar tipos de datos

---

## 📚 Referencias

- [API Documentation](/api/user/activity)
- [Hook Documentation](/hooks/useUserActivity)
- [Database Schema](/docs/database/user_activity)
- [Security Guidelines](/docs/security/activity-logging)



