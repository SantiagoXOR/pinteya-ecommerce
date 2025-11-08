# 📋 Instrucciones de Verificación Manual - Phase 3

**Panel de Productos**: Sorting, Filtros y Búsqueda  
**Fecha**: 1 de Noviembre 2025  
**URL**: http://localhost:3000/admin/products

---

## ✅ Qué Verificar

Todas las funcionalidades de Phase 3 ya están implementadas. Solo necesitas verificar que se vean y funcionen correctamente en tu navegador.

---

## 🧪 Test 1: Sorting por Precio (2 min)

### Pasos:
1. Ir a http://localhost:3000/admin/products
2. Ubicar el header de la tabla que dice "**Precio**"
3. **Hacer click** en "Precio"

### ✅ Qué debes ver:

**Inmediatamente**:
- Un ícono de flecha (↓) aparece al lado de "Precio"
- Los productos se reordenan de mayor a menor precio

**En DevTools** (F12 → Network → filtrar por "products"):
- Request a `/api/admin/products?...sort_by=price&sort_order=desc`
- Status: 200 OK

**Segundo click**:
- Ícono cambia a flecha arriba (↑)
- Productos se reordenan de menor a mayor precio
- Request con `sort_order=asc`

---

## 🧪 Test 2: Búsqueda Multi-Campo (2 min)

### Pasos:
1. En la página de productos
2. Ubicar el input de búsqueda (arriba, dice "Buscar productos por nombre, descripción, marca...")
3. Escribir: **"látex"** (o cualquier palabra que tengas en tus productos)

### ✅ Qué debes ver:

**Mientras escribes**:
- Después de ~500ms, la tabla se actualiza
- Solo aparecen productos que contienen "látex" en:
  - Nombre
  - Descripción
  - Marca
  - Código SKU

**En DevTools**:
- Request con `search=l%C3%A1tex`
- Response 200 con productos filtrados

**Badge de filtro**:
- Aparece un tag azul arriba con `"látex"`
- Click en X del tag → Limpia la búsqueda

---

## 🧪 Test 3: Filtro de Categoría (2 min)

### Pasos:
1. Click en botón "**Filtros**" (arriba a la izquierda)
2. El panel se expande
3. Ubicar dropdown que dice "**Categoría**"
4. Seleccionar cualquier categoría (ej: "Revestimientos")

### ✅ Qué debes ver:

**Al seleccionar**:
- Tabla se actualiza mostrando solo productos de esa categoría
- Aparece un badge verde con el nombre de la categoría
- DevTools muestra request con `category_id=X`

**Badge de filtro**:
- Tag verde con nombre de categoría
- Click en X → Vuelve a "Todas las categorías"

---

## 🧪 Test 4: Filtro de Marca (2 min)

### Pasos:
1. Panel de filtros expandido
2. Ubicar input "**Filtrar por marca**"
3. Escribir: **"Aikon"** (o marca que tengas)

### ✅ Qué debes ver:

**Al escribir**:
- Después de ~500ms, tabla se actualiza
- Solo productos de marca Aikon
- DevTools: `brand=Aikon`

**Badge de filtro**:
- Tag morado con "Aikon"
- Click en X → Limpia filtro de marca

---

## 🧪 Test 5: Zebra Striping (30 seg)

### Pasos:
1. Observar la tabla de productos

### ✅ Qué debes ver:

**Filas alternadas**:
- Fila 1: Fondo **blanco**
- Fila 2: Fondo **gris claro**
- Fila 3: Fondo **blanco**
- Fila 4: Fondo **gris claro**
- ...continúa alternando

**Hover**:
- Pasar mouse sobre fila → Gradiente azul sutil aparece
- Border se vuelve azul claro

---

## 🧪 Test 6: Otros Sortings (3 min)

### Columnas para testear:

**Nombre** (click en "Producto"):
- Ordena alfabéticamente A→Z o Z→A
- Ícono de flecha aparece

**Stock** (click en "Stock"):
- Ordena de más a menos stock o viceversa
- Ícono visible

**Creado** (click en "Creado"):
- Ordena por fecha (recientes primero o últimos)
- Ícono visible

**Categoría** (click en "Categoría"):
- Ordena alfabéticamente por nombre de categoría
- Ícono visible

---

## 🧪 Test 7: Combinación de Filtros (3 min)

### Pasos:
1. Escribir en búsqueda: "pintura"
2. Seleccionar categoría: "Revestimientos"
3. Filtrar marca: "Aikon"
4. Click en "Precio" para ordenar

### ✅ Qué debes ver:

**Resultados combinados**:
- Solo productos que cumplan TODO:
  - Contienen "pintura" en algún campo
  - Son de categoría "Revestimientos"
  - Son de marca "Aikon"
  - Ordenados por precio

**Badges múltiples**:
- Badge azul: "pintura"
- Badge verde: "Revestimientos"
- Badge morado: "Aikon"
- Badge outline: "Precio (Descendente)"

**DevTools**:
```
/api/admin/products?
  search=pintura
  &category_id=2
  &brand=Aikon
  &sort_by=price
  &sort_order=desc
```

---

## 🧪 Test 8: Export a Excel (1 min)

### Pasos:
1. Click en botón "**Exportar CSV**" (esquina superior derecha)
2. Debería haber opción "Exportar como Excel" o similar
3. Click en export Excel

### ✅ Qué debes ver:

**Descarga inmediata**:
- Archivo `.xlsx` se descarga
- Nombre: `productos_2025-11-01.xlsx` (o similar)
- Tamaño: Varios KB

**Contenido del Excel**:
- Abrir archivo descargado
- Verificar columnas:
  - ID, Nombre, Descripción, Precio, Stock, Categoría, Marca, etc.
- Verificar que hay datos de productos

---

## ⚠️ Si Algo NO Funciona

### Sorting no funciona (click sin efecto)

**Verificar**:
1. ¿Ves el cursor cambiar a "pointer" al pasar sobre headers?
2. Abrir DevTools → Console → ¿Hay errores?
3. Network tab → ¿Se envía request al hacer click?

**Solución**:
- Reload página (Ctrl + R)
- Hard reload (Ctrl + Shift + R)
- Si persiste, revisar consola del servidor

### Búsqueda no filtra

**Verificar**:
1. Network tab → ¿Request se envía después de escribir?
2. ¿URL contiene `search=...`?
3. ¿Response devuelve productos filtrados?

**Solución**:
- Esperar 500ms después de escribir (debounce)
- Verificar que escribiste al menos 1 carácter
- Probar con otra palabra

### Filtros no aplican

**Verificar**:
1. ¿Panel de filtros se expande al click?
2. ¿Dropdowns tienen opciones?
3. Network → ¿Request se envía al seleccionar?

**Solución**:
- Expandir panel manualmente
- Ver si hay categorías disponibles
- Verificar en Network si parámetro llega al API

### Zebra striping no visible

**Verificar**:
1. Inspeccionar elemento de fila
2. ¿Tiene clase `bg-white` o `bg-gray-50/40`?
3. ¿Colores muy similares y no se distinguen?

**Solución**:
- Ajustar opacidad en código
- Aumentar contraste
- Usar `bg-gray-100` en lugar de `bg-gray-50/40`

---

## 🎯 Qué Reportar

Si encuentras que algo NO funciona después de verificar:

### Información a Proveer:

1. **¿Qué funcionalidad?**
   - Ej: "Sorting por precio"

2. **¿Qué esperabas?**
   - Ej: "Que se reordenen los productos"

3. **¿Qué pasó?**
   - Ej: "No pasa nada al hacer click"

4. **DevTools - Network**:
   - ¿Se envía request?
   - ¿Qué URL?
   - ¿Qué status code?

5. **DevTools - Console**:
   - ¿Hay errores?
   - Screenshot del error

---

## 📊 Métricas Esperadas

Si TODO funciona correctamente, deberías ver:

### Tabla de Productos
- ✅ 25 productos por página (default)
- ✅ Filas alternadas blanco/gris
- ✅ Headers con cursor pointer en sorteables
- ✅ Paginación en la parte inferior

### Filtros Activos
- ✅ Panel expandible con chevron animado
- ✅ 4 filtros activos → Badge naranja con "4"
- ✅ Filter tags con colores:
  - Azul: Búsqueda
  - Verde: Categoría
  - Morado: Marca
  - Amarillo: Stock
  - Outline: Ordenamiento

### Performance
- ✅ API responde en < 500ms
- ✅ Tabla se actualiza suavemente
- ✅ Sin errores en consola
- ✅ Hot reload funciona

---

## 🚀 Cómo Debe Verse

### Panel de Filtros Expandido

```
┌─────────────────────────────────────────────┐
│ 🎚️ Filtros                           [🔽]  │
├─────────────────────────────────────────────┤
│ [🔍] Buscar productos por nombre...        │
│                                             │
│ 🏷️ Filtros Activos:                        │
│ [🔵 Búsqueda: "látex" ×]                   │
│ [🟢 Categoría: Revestimientos ×]           │
│ [🟣 Marca: Aikon ×]                        │
│                                             │
│ Categoría:    [▼ Revestimientos      ]     │
│ Estado:       [▼ Todos               ]     │
│ Stock:        [▼ Todos               ]     │
│ Marca:        [  Aikon              ]     │
│ Precio:       [$__] - [$__]                │
│ Ordenar por:  [▼ Precio              ]     │
│ Orden:        [▼ Descendente         ]     │
└─────────────────────────────────────────────┘
```

### Tabla con Zebra Striping

```
┌─────┬───────────┬────────┬─────────┬────────┐
│ IMG │ Producto  │ Precio │  Stock  │ Estado │
├─────┼───────────┼────────┼─────────┼────────┤ ⬅️ Header clickeable
│ 🖼️  │ Látex Pro │  $550  │ 25 ✅   │ Activo │ ⬅️ Fondo BLANCO
│ 🖼️  │ Látex Eco │  $450  │ 15 ⚠️   │ Activo │ ⬅️ Fondo GRIS
│ 🖼️  │ Látex Max │  $380  │ 30 ✅   │ Activo │ ⬅️ Fondo BLANCO
│ 🖼️  │ Látex Std │  $280  │  5 🔴   │ Activo │ ⬅️ Fondo GRIS
└─────┴───────────┴────────┴─────────┴────────┘
      ↑            ↑ (con ícono ↓ si está ordenado)
```

---

## 🎬 Flujo de Trabajo Típico

### Escenario: Buscar producto para ajustar precio

1. **Buscar** → Escribir "pintura" en buscador
2. **Filtrar** → Seleccionar categoría "Revestimientos"
3. **Ordenar** → Click en "Precio" para ver más caros primero
4. **Expandir** → Click en "4 var." para ver variantes
5. **Editar** → Click en "Editar" en variante específica
6. **Actualizar** → Cambiar precio y guardar

### Escenario: Exportar catálogo por marca

1. **Filtrar** → Marca "Aikon"
2. **Ordenar** → Por nombre (A-Z)
3. **Exportar** → Click en "Exportar" → "Excel"
4. **Descargar** → Archivo .xlsx con solo productos Aikon

---

## 🎯 Funcionalidades Clave a Probar

### MUST TEST (Crítico)

- [ ] **Click en "Precio"** → Se reordena + ícono visible
- [ ] **Buscar "látex"** → Filtra correctamente
- [ ] **Filtro categoría** → Solo productos de esa categoría
- [ ] **Zebra striping** → Filas alternadas visibles

### SHOULD TEST (Importante)

- [ ] Click en "Nombre" → Ordena alfabéticamente
- [ ] Click en "Stock" → Ordena por cantidad
- [ ] Filtro de marca → Búsqueda parcial funciona
- [ ] Filtro stock "Bajo" → Solo 0-10 unidades

### NICE TO TEST (Opcional)

- [ ] Combinar búsqueda + filtros + sorting
- [ ] Export Excel descarga correctamente
- [ ] Limpiar filtros (botón rojo) → Resetea todo
- [ ] Badges de filtros tienen colores correctos

---

## 🐛 Problemas Conocidos (NO Bloqueantes)

### React.Fragment Warnings en Consola

**Qué verás**:
```
Warning: Invalid prop `ref` supplied to `React.Fragment`
```

**Impacto**: ❌ NINGUNO
- Son warnings, no errores
- No bloquean funcionalidad
- No afectan performance significativamente
- Ya están corregidos en código (cambié motion.tr a tr)

**Solución**: Ignorar, o reload la página

---

## ✅ Qué Confirmar

Al final de tus tests manuales, deberías poder confirmar:

- ✅ El sorting por precio funciona (ícono visible, productos se reordenan)
- ✅ La búsqueda encuentra productos en múltiples campos
- ✅ Los filtros de categoría y marca funcionan
- ✅ El zebra striping es visible (filas alternadas)
- ✅ Los íconos de sorting aparecen al hacer click
- ✅ Los badges de filtros activos se muestran correctamente
- ✅ El panel de filtros se expande/colapsa suavemente
- ✅ La tabla se ve moderna y bien espaciada

---

## 📸 Screenshots de Referencia

Captura pantallas de:

1. **Sorting activo** → Header con ícono de flecha
2. **Búsqueda aplicada** → Badge azul con término buscado
3. **Filtros múltiples** → 3-4 badges de colores
4. **Zebra striping** → Vista de 5-6 filas alternadas
5. **DevTools Network** → Request con parámetros de sorting/filtros

---

## 🚑 Solución Rápida si Nada Funciona

### Hard Reset:

```bash
# 1. Detener servidor
Ctrl + C (en terminal donde corre npm run dev)

# 2. Borrar caché
rm -rf .next

# 3. Reinstalar (solo si es necesario)
npm install

# 4. Reiniciar
npm run dev

# 5. Esperar mensaje "Ready in Xms"

# 6. Ir a http://localhost:3000/admin/products

# 7. Hard reload en navegador
Ctrl + Shift + R
```

---

## 📞 Reporte de Resultados

Después de verificar, reporta:

### ✅ Si TODO funciona:

"Todo funciona correctamente:
- ✅ Sorting por precio: OK
- ✅ Búsqueda multi-campo: OK
- ✅ Filtros de categoría y marca: OK
- ✅ Zebra striping visible: OK"

### ⚠️ Si ALGO no funciona:

"Problemas encontrados:
- ❌ [Funcionalidad X] no funciona
- [Screenshot del problema]
- [Qué esperaba vs qué pasó]
- [Errores en DevTools]"

---

## 🎉 Resultado Esperado

### 100% Funcional

Si sigues estos pasos de verificación, deberías confirmar que **TODAS** las funcionalidades de Phase 3 están operativas:

1. ✅ Sorting dinámico por cualquier columna
2. ✅ Búsqueda inteligente en 4 campos
3. ✅ Filtros de categoría, marca, stock, precio
4. ✅ Zebra striping visual
5. ✅ Íconos de sorting
6. ✅ Badges de filtros activos
7. ✅ Export a Excel

**El panel de productos es ahora una herramienta profesional enterprise-grade** para gestión de catálogos.

---

**📋 Tiempo estimado de verificación**: 15-20 minutos  
**✅ Dificultad**: Baja (solo observar y click)  
**🎯 Objetivo**: Confirmar que todo lo implementado funciona correctamente

---

_Guía creada el 1 de Noviembre 2025_

