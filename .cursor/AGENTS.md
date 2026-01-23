# Configuración de Agentes - Pinteya E-commerce

Este documento describe la configuración completa de Rules, Skills y Subagents para el proyecto.

## 📋 Resumen

Este proyecto tiene configurado un sistema completo de guías para el agente de Cursor:

- **5 Rules**: Reglas que guían el comportamiento del agente
- **4 Skills**: Habilidades especializadas para tareas específicas
- **4 Subagents**: Agentes especializados para tareas complejas

## 📚 Rules (Reglas)

Las reglas se aplican automáticamente y guían cómo el agente debe trabajar en el proyecto.

### Ubicación
`.cursor/rules/`

### Reglas Disponibles

1. **multitenant-rules.md** - Sistema multitenant
2. **security-rules.md** - Seguridad enterprise
3. **performance-rules.md** - Optimización de performance
4. **typescript-rules.md** - Estándares TypeScript
5. **code-style-rules.md** - Convenciones de código

### Aplicación

Las reglas se aplican:
- **Always**: Por defecto, siempre activas
- **By File Path**: Para archivos específicos (configurable)
- **Manually**: Invocación manual cuando sea necesario

## 🎯 Skills (Habilidades)

Los skills son capacidades especializadas que el agente puede usar cuando son relevantes.

### Ubicación
`.cursor/skills/`

### Skills Disponibles

1. **multitenant-skill.md** - Desarrollo multitenant
2. **analytics-skill.md** - Analytics y tracking
3. **checkout-skill.md** - Checkout y pagos
4. **testing-skill.md** - Testing y QA

### Uso

Los skills se invocan:
- **Automáticamente**: Cuando el agente detecta que son relevantes
- **Manualmente**: Usando `/` en el chat:
  ```
  /use multitenant-skill
  /use analytics-skill
  ```

## 🤖 Subagents (Subagentes)

Los subagentes son agentes especializados que pueden trabajar en paralelo en tareas complejas.

### Ubicación
`.cursor/subagents/`

### Subagents Disponibles

1. **performance-optimizer.md** - Optimización de performance
2. **security-auditor.md** - Auditoría de seguridad
3. **test-generator.md** - Generación de tests
4. **api-developer.md** - Desarrollo de APIs

### Invocación

Los subagentes se invocan:
- **Automáticamente**: Por el agente principal cuando detecta necesidad
- **Manualmente**: Especificando en la solicitud:
  ```
  Usa el subagente performance-optimizer para analizar el bundle
  Invoca security-auditor para revisar esta API
  ```

## 🔄 Flujo de Trabajo

### Ejemplo 1: Implementar Nueva Funcionalidad Multitenant

1. **Rules aplicadas**: multitenant-rules, typescript-rules, code-style-rules
2. **Skill invocado**: multitenant-skill
3. **Proceso**:
   - Verificar detección de tenant
   - Implementar con aislamiento de datos
   - Incluir tenant_id en queries
   - Verificar RLS policies

### Ejemplo 2: Optimizar Performance

1. **Rules aplicadas**: performance-rules
2. **Subagent invocado**: performance-optimizer
3. **Proceso**:
   - Analizar bundle size
   - Identificar oportunidades
   - Implementar optimizaciones
   - Verificar mejoras

### Ejemplo 3: Crear Nueva API

1. **Rules aplicadas**: security-rules, typescript-rules, code-style-rules
2. **Subagents invocados**: api-developer, security-auditor, test-generator
3. **Proceso**:
   - Diseñar endpoint (api-developer)
   - Implementar con seguridad (security-auditor)
   - Generar tests (test-generator)
   - Verificar todo funciona

## 📝 Mantenimiento

### Agregar Nueva Rule

1. Crear archivo `.md` en `.cursor/rules/`
2. Seguir formato de reglas existentes
3. Incluir ejemplos de código
4. Documentar casos de uso

### Agregar Nuevo Skill

1. Crear archivo `.md` en `.cursor/skills/`
2. Seguir estructura de skills existentes
3. Incluir ejemplos prácticos
4. Documentar cuándo usar

### Agregar Nuevo Subagent

1. Crear archivo `.md` en `.cursor/subagents/`
2. Definir responsabilidades claras
3. Documentar proceso de trabajo
4. Incluir output esperado

## 🎓 Mejores Prácticas

1. **Específico sobre Genérico**: Rules y skills específicos son más útiles
2. **Ejemplos Prácticos**: Incluir ejemplos de código reales
3. **Casos de Uso Claros**: Documentar cuándo usar cada skill/subagent
4. **Mantenimiento Regular**: Actualizar cuando cambien estándares del proyecto

## 📖 Documentación Relacionada

- [Rules README](./rules/README.md)
- [Skills README](./skills/README.md)
- [Subagents README](./subagents/README.md)
- [Project Rules](../.trae/rules/project_rules.md)
- [User Rules](../.trae/rules/user_rules.md)

---

**Última actualización**: 23 de enero de 2026  
**Versión**: 1.0.0
