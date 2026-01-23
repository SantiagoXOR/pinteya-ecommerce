# 🎯 Guía de Optimización de Tokens en Cursor

## 📊 Problema Identificado

Según el dashboard de uso de Cursor, se están consumiendo **2M+ tokens** en algunas solicitudes, lo que está llevando el gasto acumulado a **US$ 14,49 / US$ 20** del límite mensual.

### Análisis del Consumo

- **Modelo principal**: `default` (mayor consumo)
- **Solicitudes grandes**: 2M tokens, 1.9M tokens, 821k tokens
- **Tendencia**: Consumo creciente desde el 18 de enero

## ✅ Soluciones Implementadas

### 1. Archivo `.cursorignore` Creado

Se ha creado un archivo `.cursorignore` en la raíz del proyecto que excluye del contexto:

- ✅ **892 archivos de documentación** (`docs/`)
- ✅ **287 archivos de scripts** (`scripts/`)
- ✅ **Archivos de tests** (tests, e2e, __tests__)
- ✅ **Archivos de build** (.next, out, dist, build)
- ✅ **Archivos de logs y reportes** (lighthouse, reports, etc.)
- ✅ **Archivos SQL y base de datos** (database/, sql/)
- ✅ **Imágenes grandes** (public/images/)
- ✅ **Archivos de configuración** (configs, vercel.json, etc.)
- ✅ **Planes antiguos de Cursor** (.cursor/plans/)

**Impacto esperado**: Reducción del **60-80%** en el tamaño del contexto por defecto.

### 2. Estrategias Adicionales Recomendadas

#### A. Usar Búsqueda Específica

En lugar de incluir todo el proyecto en el contexto:

```
❌ "Revisa el código de autenticación"
✅ "@auth.ts revisa el código de autenticación"
```

#### B. Limitar el Alcance de las Solicitudes

- **Específico**: "Modifica la función `calculateTotal` en `src/lib/cart.ts`"
- **No genérico**: "Revisa todo el sistema de carrito"

#### C. Usar Comandos de Terminal

Para archivos excluidos, usa comandos de terminal en lugar de incluirlos en el contexto:

```bash
# Ver contenido de un archivo SQL
cat database/migrations/001_initial.sql

# Buscar en documentación
grep -r "multitenant" docs/
```

#### D. Trabajar con Archivos Individuales

Cuando trabajes con archivos grandes:

1. Abre el archivo específico en el editor
2. Usa `@filename` para referenciarlo
3. No incluyas todo el directorio

#### E. Configurar Modelos Más Eficientes

En Cursor Settings → Features → Model Context Protocol:

- Considera usar modelos más pequeños para tareas simples
- Usa `gpt-5.1-codex-mini` para tareas menores
- Reserva `default` para tareas complejas

## 📈 Métricas de Reducción Esperadas

### Antes de la Optimización

- **Archivos en contexto**: ~2,600+ archivos
- **Tokens promedio por request**: 500k - 2M tokens
- **Costo por request grande**: US$ 0.78 - US$ 2.56

### Después de la Optimización

- **Archivos en contexto**: ~400-600 archivos (solo código fuente)
- **Tokens promedio por request**: 100k - 400k tokens (reducción 60-80%)
- **Costo por request**: US$ 0.15 - US$ 0.60 (reducción 60-80%)

## 🔧 Configuración Adicional

### 1. Ajustar Límites de Contexto en Cursor

Si tienes acceso a configuración avanzada:

```json
{
  "cursor.context.maxFiles": 500,
  "cursor.context.maxTokens": 200000,
  "cursor.context.excludePatterns": [
    "**/docs/**",
    "**/scripts/**",
    "**/tests/**"
  ]
}
```

### 2. Usar Archivos de Trabajo Específicos

Crea archivos `.cursor/workspace.json` para diferentes contextos:

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "**/node_modules/**",
    "**/docs/**",
    "**/scripts/**"
  ]
}
```

## 📝 Mejores Prácticas

### ✅ Hacer

1. **Sé específico en tus solicitudes**
   ```
   ✅ "Modifica la función getUser en src/lib/auth.ts"
   ❌ "Revisa todo el sistema de autenticación"
   ```

2. **Usa @filename para archivos específicos**
   ```
   ✅ "@middleware.ts agrega validación de tenant"
   ❌ "agrega validación de tenant"
   ```

3. **Trabaja con archivos abiertos**
   - Abre el archivo en el editor antes de hacer solicitudes
   - Cursor incluirá automáticamente el archivo abierto

4. **Divide tareas grandes en pequeñas**
   ```
   ✅ "Agrega validación de email en el formulario de registro"
   ❌ "Revisa y mejora todo el sistema de formularios"
   ```

### ❌ Evitar

1. **No incluyas todo el proyecto**
   ```
   ❌ "Revisa todo el código"
   ❌ "Analiza el proyecto completo"
   ```

2. **No pidas análisis masivos**
   ```
   ❌ "Analiza todos los componentes de React"
   ✅ "Analiza el componente ProductCard en src/components/Product/"
   ```

3. **No incluyas archivos de documentación**
   ```
   ❌ "Lee la documentación en docs/ y haz cambios"
   ✅ "Basándote en MULTITENANCY.md, implementa X"
   ```

## 🎯 Casos de Uso Específicos

### Trabajar con Documentación

Si necesitas trabajar con documentación:

```bash
# Usa grep para buscar
grep -r "multitenant" docs/

# O abre el archivo específico
# Luego usa: "@docs/MULTITENANCY.md explica cómo funciona..."
```

### Trabajar con Scripts

Si necesitas modificar un script:

```bash
# Abre el script específico
# Luego usa: "@scripts/development/setup-mcp-limits.js modifica..."
```

### Trabajar con Tests

Si necesitas crear tests:

```bash
# Crea el archivo de test primero
# Luego usa: "@src/components/Product/ProductCard.test.tsx crea tests para..."
```

## 📊 Monitoreo del Consumo

### Verificar Reducción

1. **Revisa el dashboard de Cursor** después de implementar estos cambios
2. **Compara tokens por request** antes y después
3. **Ajusta `.cursorignore`** según tus necesidades específicas

### Ajustar Exclusiones

Si necesitas trabajar con archivos excluidos:

1. Abre `.cursorignore`
2. Comenta temporalmente la línea correspondiente:
   ```
   # docs/  # Temporalmente habilitado para trabajar con docs
   ```
3. Vuelve a comentar después de terminar

## 🔄 Mantenimiento

### Revisar Periódicamente

- **Semanalmente**: Revisa el consumo en el dashboard
- **Mensualmente**: Ajusta `.cursorignore` según patrones de uso
- **Cuando cambies de tarea**: Ajusta exclusiones según el contexto

### Actualizar Exclusiones

Agrega nuevos patrones a `.cursorignore` cuando:

- Se agreguen nuevos directorios grandes
- Se generen nuevos tipos de reportes
- Se creen nuevos archivos de configuración

## 📚 Referencias

- [Documentación de Cursor sobre Context](https://cursor.sh/docs)
- [Guía de .cursorignore](https://cursor.sh/docs/context#cursorignore)
- Dashboard de uso: Settings → Usage & Billing

## ✅ Checklist de Implementación

- [x] Crear archivo `.cursorignore`
- [x] Excluir documentación extensa
- [x] Excluir scripts y utilidades
- [x] Excluir tests y archivos de prueba
- [x] Excluir archivos de build y cache
- [x] Excluir imágenes y assets grandes
- [x] Documentar mejores prácticas
- [ ] Monitorear consumo después de 1 semana
- [ ] Ajustar exclusiones según uso real

---

**Última actualización**: 23 de enero de 2026  
**Impacto esperado**: Reducción del 60-80% en consumo de tokens
