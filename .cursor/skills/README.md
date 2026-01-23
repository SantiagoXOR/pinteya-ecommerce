# Skills - Habilidades Especializadas

Este directorio contiene habilidades especializadas que el agente puede usar para tareas específicas del proyecto.

## Skills Disponibles

### 1. [multitenant-skill.md](./multitenant-skill.md)
Habilidad para trabajar con el sistema multitenant:
- Detección y manejo de tenants
- Aislamiento de datos
- Configuración por tenant
- RLS policies

**Cuándo usar**: Al implementar funcionalidades multitenant o trabajar con datos por tenant.

### 2. [analytics-skill.md](./analytics-skill.md)
Habilidad para analytics y tracking:
- Implementar tracking de eventos
- Integración con GA4
- Métricas e-commerce
- Dashboard administrativo

**Cuándo usar**: Al implementar tracking, métricas o integraciones de analytics.

### 3. [checkout-skill.md](./checkout-skill.md)
Habilidad para checkout y pagos:
- Flujo de checkout
- Integración con MercadoPago
- Manejo de órdenes
- Validación de direcciones

**Cuándo usar**: Al trabajar en checkout, pagos o procesamiento de órdenes.

### 4. [testing-skill.md](./testing-skill.md)
Habilidad para testing:
- Tests unitarios
- Tests de integración
- Tests E2E con Playwright
- Tests de accesibilidad

**Cuándo usar**: Al escribir o mantener tests, mejorar cobertura o debuggear tests.

## Cómo Usar Skills

Los skills se invocan automáticamente cuando el agente detecta que son relevantes para la tarea, o puedes invocarlos manualmente usando `/` en el chat:

```
/use multitenant-skill
/use analytics-skill
/use checkout-skill
/use testing-skill
```

## Estructura de un Skill

Cada skill incluye:

- **Descripción**: Qué hace el skill
- **Cuándo Usar**: Cuándo es apropiado invocarlo
- **Archivos Clave**: Archivos relevantes del proyecto
- **Comandos Útiles**: Comandos relacionados
- **Ejemplos de Uso**: Ejemplos prácticos de código
- **Checklist**: Lista de verificación para implementación

## Crear Nuevos Skills

Para crear un nuevo skill:

1. Crear archivo `.md` en este directorio
2. Seguir la estructura de los skills existentes
3. Incluir ejemplos prácticos
4. Documentar casos de uso claros
