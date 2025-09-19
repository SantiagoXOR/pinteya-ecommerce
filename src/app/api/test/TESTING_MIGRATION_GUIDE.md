# Guía de Migración - API Unificada de Testing

## 📋 Resumen

Esta guía explica cómo migrar de las múltiples rutas de testing dispersas a la nueva **API Unificada de Testing** (`/api/test/unified`).

## 🔄 Rutas Consolidadas

### Rutas Antiguas → Nueva Ruta Unificada

| Ruta Antigua | Funcionalidad | Nueva Implementación |
|--------------|---------------|----------------------|
| `/api/test/route.ts` | Test de conexión Supabase | `GET /api/test/unified?module=connection` |
| `/api/test-simple-user/route.ts` | Test de perfil de usuario | `GET /api/test/unified?module=user-profile` |
| `/api/admin/test-screenshots/route.ts` | Gestión de screenshots | `POST /api/test/unified` con `module=screenshots` |
| `/api/admin/test-execution/route.ts` | Ejecución de test suites | `POST /api/test/unified` con `module=execution` |
| `/api/admin/test-flows/route.ts` | Flujos de testing | `GET /api/test/unified?module=flows` |
| `/api/test-screenshots/route.ts` | Generación de screenshots | `POST /api/test/unified` con `module=screenshots` |
| `/api/test-reports/route.ts` | Gestión de reportes | `GET /api/test/unified?module=reports` |
| `/api/email/test/route.ts` | Testing de emails | `POST /api/test/unified` con `module=email` |
| `/api/test-admin-middleware/route.ts` | Test de middleware | `GET /api/test/unified?module=middleware` |

## 🚀 Uso de la Nueva API

### Endpoints Disponibles

#### GET `/api/test/unified`

**Parámetros de consulta:**
- `module`: Módulo a testear (requerido)
- `detailed`: Información detallada (opcional, default: false)
- `user_id`: ID de usuario específico (opcional)
- `include_sensitive`: Incluir información sensible (opcional, default: false)

**Módulos disponibles:**
- `connection` - Test de conexiones básicas
- `auth` - Test de autenticación
- `middleware` - Test de middleware
- `reports` - Gestión de reportes
- `user-profile` - Test de perfiles de usuario
- `flows` - Flujos de testing
- `all` - Ejecutar todos los módulos

#### POST `/api/test/unified`

**Body JSON:**
```json
{
  "module": "screenshots|execution|flows|email|auth|connection",
  "config": {
    // Configuración específica del módulo
  }
}
```

### Ejemplos de Migración

#### 1. Test de Conexión Básica

**Antes:**
```javascript
// GET /api/test
const response = await fetch('/api/test');
```

**Después:**
```javascript
// GET /api/test/unified?module=connection
const response = await fetch('/api/test/unified?module=connection');
```

#### 2. Test de Screenshots

**Antes:**
```javascript
// POST /api/test-screenshots
const response = await fetch('/api/test-screenshots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    stepName: 'homepage'
  })
});
```

**Después:**
```javascript
// POST /api/test/unified
const response = await fetch('/api/test/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    module: 'screenshots',
    config: {
      url: 'https://example.com',
      stepName: 'homepage',
      fullPage: false,
      width: 1280,
      height: 720
    }
  })
});
```

#### 3. Ejecución de Test Suites

**Antes:**
```javascript
// POST /api/admin/test-execution
const response = await fetch('/api/admin/test-execution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suites: ['unit', 'components']
  })
});
```

**Después:**
```javascript
// POST /api/test/unified
const response = await fetch('/api/test/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    module: 'execution',
    config: {
      suites: ['unit', 'components'],
      timeout: 90000,
      generateReport: true
    }
  })
});
```

#### 4. Test de Emails

**Antes:**
```javascript
// POST /api/email/test
const response = await fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    userName: 'Test User',
    type: 'welcome'
  })
});
```

**Después:**
```javascript
// POST /api/test/unified
const response = await fetch('/api/test/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    module: 'email',
    config: {
      email: 'test@example.com',
      userName: 'Test User',
      emailType: 'welcome'
    }
  })
});
```

#### 5. Test Completo (Todos los Módulos)

**Nuevo:**
```javascript
// GET /api/test/unified?module=all&detailed=true
const response = await fetch('/api/test/unified?module=all&detailed=true');
const result = await response.json();

// Resultado incluye todos los módulos:
// - connection
// - auth  
// - middleware
// - reports
```

## 📊 Formato de Respuesta Unificado

### Respuesta Exitosa
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "module": "connection",
  "status": "success|partial|failed",
  "data": {
    // Datos específicos del módulo
  },
  "error": null,
  "meta": {
    "api_version": "1.0.0",
    "unified": true,
    "parameters": {
      "module": "connection",
      "detailed": false
    }
  }
}
```

### Respuesta con Error
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "module": "connection",
  "status": "failed",
  "data": null,
  "error": "Mensaje de error descriptivo",
  "meta": {
    "api_version": "1.0.0",
    "unified": true
  }
}
```

## 🔧 Configuraciones Específicas por Módulo

### Screenshots
```json
{
  "module": "screenshots",
  "config": {
    "url": "https://example.com",
    "stepName": "homepage",
    "selector": ".main-content", // Opcional
    "fullPage": false,
    "width": 1280,
    "height": 720
  }
}
```

### Test Execution
```json
{
  "module": "execution",
  "config": {
    "suites": ["unit", "components", "e2e", "performance", "api"],
    "timeout": 60000,
    "generateReport": true
  }
}
```

### Email Testing
```json
{
  "module": "email",
  "config": {
    "email": "test@example.com",
    "userName": "Test User",
    "emailType": "welcome|order|reset"
  }
}
```

### Test Flows
```json
{
  "module": "flows",
  "config": {
    "flowId": "flow-123", // Opcional
    "executionId": "exec-456" // Opcional
  }
}
```

## 📈 Beneficios de la Migración

### ✅ Ventajas

1. **Consistencia**: Una sola API con formato de respuesta unificado
2. **Mantenibilidad**: Código centralizado y más fácil de mantener
3. **Escalabilidad**: Fácil agregar nuevos módulos de testing
4. **Documentación**: Una sola fuente de verdad para testing
5. **Validación**: Schemas de validación consistentes
6. **Logging**: Sistema de logging unificado
7. **Error Handling**: Manejo de errores estandarizado

### 🔄 Compatibilidad

- **Backward Compatible**: Las rutas antiguas siguen funcionando
- **Gradual Migration**: Puedes migrar módulo por módulo
- **Same Functionality**: Toda la funcionalidad existente está disponible

## 🚦 Plan de Migración

### Fase 1: Implementación (✅ Completada)
- [x] Crear API unificada
- [x] Implementar todos los módulos
- [x] Validación y schemas
- [x] Documentación

### Fase 2: Testing y Validación
- [ ] Probar todos los módulos
- [ ] Validar compatibilidad
- [ ] Performance testing
- [ ] Documentar diferencias

### Fase 3: Migración Gradual
- [ ] Actualizar frontend para usar nueva API
- [ ] Migrar tests automatizados
- [ ] Actualizar documentación de desarrollo
- [ ] Entrenar al equipo

### Fase 4: Deprecación (Futuro)
- [ ] Marcar rutas antiguas como deprecated
- [ ] Período de gracia (3-6 meses)
- [ ] Remover rutas antiguas
- [ ] Cleanup del código

## 🧪 Testing de la Nueva API

### Test Básico
```bash
# Test de conexión
curl "http://localhost:3000/api/test/unified?module=connection"

# Test detallado
curl "http://localhost:3000/api/test/unified?module=connection&detailed=true"

# Test de todos los módulos
curl "http://localhost:3000/api/test/unified?module=all"
```

### Test POST
```bash
# Test de screenshots
curl -X POST "http://localhost:3000/api/test/unified" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "screenshots",
    "config": {
      "url": "http://localhost:3000",
      "stepName": "homepage"
    }
  }'
```

## ⚠️ Consideraciones Importantes

### Seguridad
- La API mantiene los mismos controles de autenticación
- Información sensible solo se muestra con `include_sensitive=true`
- Logs de seguridad para todas las operaciones

### Performance
- Módulos optimizados para ejecución rápida
- Timeouts configurables por módulo
- Ejecución paralela cuando es posible

### Monitoreo
- Logs estructurados para mejor debugging
- Métricas de performance por módulo
- Alertas automáticas en caso de fallos

## 📞 Soporte

Para preguntas sobre la migración:
1. Revisar esta documentación
2. Probar en entorno de desarrollo
3. Consultar logs de la aplicación
4. Contactar al equipo de desarrollo

---

**Nota**: Esta migración mejora significativamente la arquitectura de testing. Se recomienda migrar gradualmente y probar exhaustivamente antes de deprecar las rutas antiguas.


