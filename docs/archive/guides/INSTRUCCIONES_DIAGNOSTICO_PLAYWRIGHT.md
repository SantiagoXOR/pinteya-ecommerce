# 🔍 INSTRUCCIONES: DIAGNÓSTICO CON PLAYWRIGHT

## Objetivo

Ejecutar tests automatizados con Playwright para diagnosticar qué está fallando exactamente en el panel de productos admin.

---

## Opción 1: Script Node.js Simple (RECOMENDADO)

### 1. Ejecutar el Script

```bash
node test-panel-productos-diagnostic.js
```

### 2. Qué Hace el Script

- Navega a `http://localhost:3000/admin/products`
- Toma screenshots de cada estado
- Cuenta productos en cada vista
- Testea filtros y paginación
- Captura logs de consola
- Genera reporte markdown

### 3. Archivos Generados

Después de ejecutar, verás:
- `panel-productos-inicial.png` - Estado inicial
- `panel-productos-pagina-2.png` - Después de cambiar página
- `panel-productos-stock-bajo.png` - Filtro stock bajo
- `PLAYWRIGHT_DIAGNOSTICO_PANEL_PRODUCTOS.md` - Reporte completo

---

## Opción 2: Playwright Test Suite

### 1. Ejecutar Test Completo

```bash
npx playwright test tests/playwright/admin-productos-diagnostic.spec.ts --headed
```

### 2. Ver Logs Detallados

```bash
npx playwright test tests/playwright/admin-productos-diagnostic.spec.ts --headed --reporter=line
```

### 3. Ejecutar Test Específico

```bash
# Solo estado inicial
npx playwright test tests/playwright/admin-productos-diagnostic.spec.ts -g "Estado Inicial"

# Solo paginación
npx playwright test tests/playwright/admin-productos-diagnostic.spec.ts -g "Paginación"

# Solo filtros
npx playwright test tests/playwright/admin-productos-diagnostic.spec.ts -g "Stock Bajo"
```

---

## Qué Buscar en el Reporte

### ✅ Funcionando Correctamente

- Stats cards muestran números > 0
- Tabla tiene 20+ filas
- Imágenes se cargan (count > 0)
- Footer muestra "Mostrando X de Y productos"
- Al cambiar página, los productos cambian
- Al filtrar por "Stock Bajo", la cantidad cambia

### ❌ Problemas Comunes

1. **Stats en 0**: API de stats no retorna datos
2. **Tabla vacía (0 filas)**: API de productos no retorna datos
3. **Sin imágenes**: Campo `image_url` no se mapea correctamente
4. **Footer "0 de 0"**: Paginación no lee `total` del API
5. **Mismos productos en página 2**: Cache de React Query
6. **Filtros no funcionan**: `onValueChange` no actualiza filtros

---

## Próximos Pasos

1. **Ejecuta el script**: `node test-panel-productos-diagnostic.js`
2. **Revisa screenshots**: Ver visualmente qué se muestra
3. **Lee el reporte**: `PLAYWRIGHT_DIAGNOSTICO_PANEL_PRODUCTOS.md`
4. **Comparte hallazgos**: Pega el contenido del reporte en el chat

---

## Notas

- El servidor debe estar corriendo en `http://localhost:3000`
- El navegador se abrirá en modo visible (`headless: false`)
- Los logs de consola se mostrarán en tiempo real
- Los screenshots te mostrarán exactamente qué ve el usuario

---

**Ejecuta ahora**: `node test-panel-productos-diagnostic.js`


