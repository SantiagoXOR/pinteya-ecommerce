# Rules - Reglas del Proyecto

Este directorio contiene todas las reglas que guían el comportamiento del agente de Cursor en este proyecto.

## Reglas Disponibles

### 1. [multitenant-rules.md](./multitenant-rules.md)
Reglas para trabajar con el sistema multitenant, incluyendo:
- Detección de tenant
- Aislamiento de datos
- RLS policies
- Assets por tenant

### 2. [security-rules.md](./security-rules.md)
Reglas de seguridad enterprise, incluyendo:
- Autenticación y autorización
- Rate limiting
- Validación de inputs
- Prevención de vulnerabilidades comunes

### 3. [performance-rules.md](./performance-rules.md)
Reglas de optimización de performance:
- Code splitting
- Optimización de imágenes
- Bundle size
- Métricas objetivo

### 4. [typescript-rules.md](./typescript-rules.md)
Estándares de TypeScript:
- Tipado estricto (sin `any`)
- Convenciones de tipos
- Tipos de base de datos
- Tipos de API

### 5. [code-style-rules.md](./code-style-rules.md)
Convenciones de código:
- Nomenclatura
- Estructura de componentes
- Formato
- Organización de archivos

## Cómo Usar

Estas reglas se aplican automáticamente cuando trabajas en el proyecto. El agente de Cursor las consulta para:

- Seguir estándares del proyecto
- Implementar funcionalidades correctamente
- Mantener consistencia en el código
- Aplicar mejores prácticas

## Aplicación de Reglas

Las reglas se pueden aplicar de tres formas:

1. **Always**: Se aplican siempre (por defecto)
2. **By File Path**: Se aplican a archivos específicos
3. **Manually**: Se invocan manualmente cuando es necesario

## Actualización

Para actualizar o agregar nuevas reglas:

1. Crear o editar el archivo `.md` correspondiente
2. Seguir el formato de las reglas existentes
3. Incluir ejemplos de código cuando sea apropiado
4. Documentar casos de uso
