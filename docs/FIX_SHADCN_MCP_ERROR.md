# 🔧 Solución al Error del Servidor MCP de shadcn-ui

## 📋 Problema Identificado

El error muestra que Cursor está intentando ejecutar:
```
npx shadcn@latest mcp
```

Este comando causa el siguiente error debido a una caché corrupta de npx:
```
Error: Cannot find module 'C:\Users\marti\AppData\Local\npm-cache\_npx\d66c5096c7023bfb\node_modules\shadcn\dist\index.js'
```

## ✅ Solución

Según la [documentación oficial de shadcn/ui](https://ui.shadcn.com/docs/mcp), el servidor MCP oficial está integrado en el CLI de shadcn y se ejecuta con `npx shadcn@latest mcp`.

### 1. Configuración en Cursor (Recomendado)

Según la [documentación oficial](https://ui.shadcn.com/docs/mcp), para Cursor debes crear el archivo `.cursor/mcp.json` en la raíz del proyecto:

**Archivo creado:** `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Después de crear este archivo:
1. **Habilita el servidor MCP de shadcn** en Cursor Settings → Features → Model Context Protocol
2. Deberías ver un punto verde junto al servidor "shadcn" en la lista de servidores MCP
3. Reinicia Cursor si es necesario

### 2. Configuración Alternativa en el Proyecto

También se ha actualizado el archivo `.mcp-config.json` del proyecto con la configuración correcta:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": [
        "-y",
        "shadcn@latest",
        "mcp"
      ],
      "maxInstances": 1,
      "restartPolicy": "on-failure",
      "timeout": 30000
    }
  }
}
```

### 3. Limpieza de Caché (Ya Ejecutado)

El problema se debía a una caché corrupta de npx. Se han ejecutado los siguientes comandos:

1. **Caché de npm limpiada:**
   ```powershell
   npm cache clean --force
   ```

2. **Caché de npx limpiada:**
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_npx"
   ```

3. **Verificación del comando:**
   ```powershell
   npx -y shadcn@latest mcp --help
   ```
   ✅ El comando funciona correctamente después de limpiar la caché

### 4. Verificación

Para verificar que el servidor MCP funciona correctamente:

1. Abre Cursor
2. Ve a Settings → Features → Model Context Protocol
3. Verifica que el servidor "shadcn-ui" aparezca con un punto verde (activo)
4. Prueba con un prompt como: "Muéstrame todos los componentes disponibles en el registro de shadcn"

## 📚 Información Adicional

### Características del Servidor MCP de shadcn-ui:

Según la [documentación oficial](https://ui.shadcn.com/docs/mcp), el servidor MCP de shadcn permite:

- **Navegar Componentes** - Listar todos los componentes, bloques y plantillas disponibles de cualquier registro configurado
- **Buscar en Registros** - Encontrar componentes específicos por nombre o funcionalidad en múltiples fuentes
- **Instalar con Lenguaje Natural** - Agregar componentes usando prompts conversacionales simples como "agrega un formulario de login"
- **Soporte para Múltiples Registros** - Acceder a registros públicos, bibliotecas privadas de empresas y fuentes de terceros

### Configuración de Registros:

El servidor MCP funciona con cualquier registro compatible con shadcn configurado en tu `components.json`:

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

### Inicialización Automática:

Puedes usar el comando de inicialización automática:

```bash
npx shadcn@latest mcp init --client cursor
```

Este comando configurará automáticamente el servidor MCP para Cursor.

## 🔗 Referencias

- [Documentación oficial del servidor MCP de shadcn-ui](https://ui.shadcn.com/docs/mcp)
- [Documentación de Registros de shadcn](https://ui.shadcn.com/docs/registry)

## ✅ Estado

- [x] Caché de npm y npx limpiada
- [x] Comando `npx shadcn@latest mcp` verificado y funcionando
- [x] Archivo `.cursor/mcp.json` creado con la configuración correcta
- [x] Configuración actualizada en `.mcp-config.json`
- [ ] **Pendiente:** Habilitar el servidor MCP en Cursor Settings → Features → Model Context Protocol
- [ ] **Pendiente:** Reiniciar Cursor para aplicar los cambios

## 🎯 Próximos Pasos

1. **Abre Cursor Settings** → Features → Model Context Protocol
2. **Habilita el servidor "shadcn"** en la lista de servidores MCP
3. **Verifica** que aparezca con un punto verde (activo)
4. **Reinicia Cursor** si es necesario
5. **Prueba** con prompts como:
   - "Muéstrame todos los componentes disponibles en el registro de shadcn"
   - "Agrega los componentes button, dialog y card a mi proyecto"
   - "Crea un formulario de contacto usando componentes del registro de shadcn"







