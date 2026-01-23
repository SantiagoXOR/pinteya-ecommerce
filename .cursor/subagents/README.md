# Subagents - Agentes Especializados

Este directorio contiene subagentes especializados para tareas complejas que requieren enfoque y expertise específico.

## Subagents Disponibles

### 1. [performance-optimizer.md](./performance-optimizer.md)
Subagente especializado en optimización de performance:
- Análisis de bundle size
- Optimización de imágenes
- Mejora de métricas de Lighthouse
- Code splitting y lazy loading

**Cuándo invocar**: Cuando hay problemas de performance, bundle size excesivo, o métricas de Lighthouse bajas.

### 2. [security-auditor.md](./security-auditor.md)
Subagente especializado en auditoría de seguridad:
- Identificación de vulnerabilidades
- Verificación de autenticación/autorización
- Revisión de rate limiting
- Análisis de dependencias

**Cuándo invocar**: Antes de releases, cuando se implementan nuevas APIs, o en respuesta a reportes de seguridad.

### 3. [test-generator.md](./test-generator.md)
Subagente especializado en generación de tests:
- Tests unitarios
- Tests de integración
- Tests E2E
- Mejora de cobertura

**Cuándo invocar**: Al implementar nuevas funcionalidades, cuando la cobertura baja, o para flujos críticos.

### 4. [api-developer.md](./api-developer.md)
Subagente especializado en desarrollo de APIs:
- Creación de endpoints
- Validación con Zod
- Manejo de errores
- Optimización de performance

**Cuándo invocar**: Al crear nuevos endpoints, mejorar APIs existentes, o resolver problemas de performance en APIs.

## Cómo Usar Subagents

Los subagentes se invocan automáticamente por el agente principal cuando detecta que una tarea requiere expertise especializado, o puedes invocarlos manualmente:

```
Usa el subagente performance-optimizer para analizar el bundle size
Invoca security-auditor para revisar la seguridad de esta API
Genera tests usando test-generator para este componente
```

## Trabajo en Paralelo

Los subagentes pueden trabajar en paralelo para tareas complejas:

- **Performance + Security**: Optimizar y auditar simultáneamente
- **API Developer + Test Generator**: Crear API y tests juntos
- **Security Auditor + Test Generator**: Auditar y crear tests de seguridad

## Estructura de un Subagent

Cada subagent incluye:

- **Descripción**: Qué hace el subagent
- **Responsabilidades**: Tareas específicas
- **Cuándo Invocar**: Cuándo es apropiado usarlo
- **Herramientas y Comandos**: Comandos relacionados
- **Proceso de Trabajo**: Pasos que sigue
- **Output Esperado**: Qué debe entregar

## Crear Nuevos Subagents

Para crear un nuevo subagent:

1. Crear archivo `.md` en este directorio
2. Seguir la estructura de los subagents existentes
3. Definir responsabilidades claras
4. Documentar proceso de trabajo
5. Incluir ejemplos de output esperado
