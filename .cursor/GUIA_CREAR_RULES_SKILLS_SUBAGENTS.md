# Guía: Cómo Crear Rules, Skills y Subagents en Cursor

## ⚠️ Importante

Cursor **NO detecta automáticamente** los archivos `.md` en las carpetas `.cursor/rules/`, `.cursor/skills/` y `.cursor/subagents/`. Estos elementos deben crearse **a través de la interfaz de Cursor**.

## ✅ Solución Implementada

He creado un archivo **`.cursorrules`** en la raíz del proyecto que **SÍ es detectado automáticamente** por Cursor. Este archivo contiene las reglas principales del proyecto.

## 📝 Cómo Crear Rules, Skills y Subagents Manualmente

### 1. Crear Rules (Reglas)

1. Abre Cursor Settings → **Rules, Skills, Subagents**
2. En la sección **Rules**, haz clic en **"+ New"**
3. Pega el contenido del archivo correspondiente de `.cursor/rules/`:
   - `multitenant-rules.md`
   - `security-rules.md`
   - `performance-rules.md`
   - `typescript-rules.md`
   - `code-style-rules.md`
4. Configura la aplicación:
   - **Always applied**: Para reglas que siempre deben aplicarse
   - **By file path**: Para reglas específicas de archivos
5. Haz clic en **"Save"**

### 2. Crear Skills (Habilidades)

1. En la sección **Skills**, haz clic en **"+ New"** o **"New Skill"**
2. Pega el contenido del archivo correspondiente de `.cursor/skills/`:
   - `multitenant-skill.md`
   - `analytics-skill.md`
   - `checkout-skill.md`
   - `testing-skill.md`
3. Configura el skill:
   - **Name**: Nombre descriptivo (ej: "Multitenant Development")
   - **Description**: Breve descripción
   - **Content**: El contenido completo del archivo `.md`
4. Haz clic en **"Save"**

### 3. Crear Subagents (Subagentes)

1. En la sección **Subagents**, haz clic en **"+ New"** o **"New Subagent"**
2. Pega el contenido del archivo correspondiente de `.cursor/subagents/`:
   - `performance-optimizer.md`
   - `security-auditor.md`
   - `test-generator.md`
   - `api-developer.md`
3. Configura el subagent:
   - **Name**: Nombre descriptivo (ej: "Performance Optimizer")
   - **Description**: Breve descripción
   - **Content**: El contenido completo del archivo `.md`
4. Haz clic en **"Save"**

## 🚀 Método Rápido: Script de Ayuda

Puedes usar los archivos `.md` que creé como referencia. Cada archivo contiene:

- **Descripción clara** de qué hace
- **Cuándo usar** el skill/subagent
- **Ejemplos de código** prácticos
- **Checklist** de implementación

## 📋 Checklist de Creación

### Rules a Crear:
- [ ] Multitenant Rules
- [ ] Security Rules
- [ ] Performance Rules
- [ ] TypeScript Rules
- [ ] Code Style Rules

### Skills a Crear:
- [ ] Multitenant Skill
- [ ] Analytics Skill
- [ ] Checkout Skill
- [ ] Testing Skill

### Subagents a Crear:
- [ ] Performance Optimizer
- [ ] Security Auditor
- [ ] Test Generator
- [ ] API Developer

## 💡 Consejos

1. **Empieza con Rules**: Las rules son las más importantes y se aplican automáticamente
2. **Usa el archivo `.cursorrules`**: Ya está creado y funcionando
3. **Crea Skills/Subagents según necesidad**: No necesitas crear todos de una vez
4. **Actualiza cuando cambien estándares**: Mantén las rules actualizadas

## 🔍 Verificar que Funciona

Después de crear una Rule/Skill/Subagent:

1. Reinicia Cursor
2. Ve a Settings → Rules, Skills, Subagents
3. Deberías ver los elementos creados en la lista
4. Prueba invocando un skill con `/use [skill-name]` en el chat

## 📚 Archivos de Referencia

Todos los archivos están en:
- Rules: `.cursor/rules/*.md`
- Skills: `.cursor/skills/*.md`
- Subagents: `.cursor/subagents/*.md`

Copia el contenido de estos archivos cuando crees los elementos en la interfaz de Cursor.
