# Análisis de Base de Datos - Estado Actual de aikon_id

**Fecha**: 2025-01-29  
**Herramienta**: MCP Supabase

## Resumen Ejecutivo

### Estado Actual de la Base de Datos

#### Tabla `products`
- **Tipo de dato actual**: `character varying` (VARCHAR(50)) ⚠️ **DEBE CAMBIAR A INTEGER**
- **Nullable**: `YES` (puede ser NULL) ⚠️ **DEBE SER NOT NULL CON VALIDACIÓN CONDICIONAL**
- **Total de productos**: 180
- **Con aikon_id**: 17 (9.4%)
- **Sin aikon_id (NULL)**: 163 (90.6%)
- **Valores numéricos válidos**: 17 (todos los que tienen valor)
- **Valores que exceden 6 dígitos**: 0
- **Valores no numéricos**: 0
- **Longitudes**: 3-4 caracteres (todos válidos)

#### Tabla `product_variants`
- **Tipo de dato actual**: `character varying` (VARCHAR(50)) ⚠️ **DEBE CAMBIAR A INTEGER**
- **Nullable**: `NO` (ya es NOT NULL) ✅
- **Total de variantes**: 642
- **Con aikon_id**: 642 (100%) ✅
- **Sin aikon_id**: 0
- **Valores numéricos válidos**: 631 (98.3%)
- **Valores no numéricos**: 15 (2.3%) ⚠️ **REQUIEREN LIMPIEZA**
- **Valores que exceden 6 dígitos**: 0
- **Longitudes**: 1-14 caracteres
  - 1-6 caracteres: 632 variantes (válidas)
  - 7-14 caracteres: 10 variantes (algunas con ceros a la izquierda, necesitan limpieza)

## Análisis Detallado

### ⚠️ PROBLEMA: Valores No Numéricos en Variantes

Hay **15 variantes** con valores no numéricos en `aikon_id`. Estos valores tienen formato mixto pero **se pueden corregir automáticamente** extrayendo solo los números:

**Valores identificados**:
1. "4488-ROJO-TEJA" → 4488 ✅
2. "4487-ROJO-TEJA" → 4487 ✅
3. "3386-GRIS" → 3386 ✅
4. "2751-VERDE-CEMENTO" → 2751 ✅
5. "2750-VERDE-CEMENTO" → 2750 ✅
6. "2771-GRIS" → 2771 ✅
7. "2771-VERDE-CEMENTO" → 2771 ✅
8. "LIJA-87" → 87 ✅
9. "TEMP-317" → 317 ✅
10. "TEMP-327" → 327 ✅
11. "TEMP-335" → 335 ✅
12. "9-20kg" → 9 ✅

**Solución**: La migración extraerá automáticamente solo los números de estos valores.

### ⚠️ PROBLEMA: Valores con Ceros a la Izquierda

Algunos valores tienen ceros a la izquierda (ej: "01606", "01235", "04666"). Estos se convertirán correctamente a números durante la migración, pero es importante notar que:
- "01606" → 1606 (correcto)
- "01235" → 1235 (correcto)
- "04666" → 4666 (correcto)

### ⚠️ PROBLEMA CRÍTICO: Productos Sin Variantes y Sin aikon_id

Hay **47 productos** que no tienen variantes y tampoco tienen `aikon_id`. Estos productos **requieren intervención manual** antes de aplicar la migración.

**Productos afectados** (ejemplos):
- ID 384: "Sellador silicona nuetra S-500"
- ID 351: "Mini aplicador plano"
- ID 346: "Aplicador angular"
- ID 370: "Kit restaurador de opticas"
- ID 394: "Cepillo alambre rectangular 6 x 19"
- ID 396: "Llana metalica lisa 130 x 300mm"
- ID 350: "Brocha Redonda Nº40"
- ... y 40 más

**Acción requerida**: Asignar códigos aikon_id a estos 47 productos antes de ejecutar la migración, o la migración fallará al intentar aplicar el constraint NOT NULL.

### Productos Con Variantes Pero Sin aikon_id en products (OK)

Muchos productos tienen variantes pero no tienen `aikon_id` en la tabla `products`. Esto está bien según la lógica del sistema, ya que:
- Las variantes tienen sus propios `aikon_id`
- El `aikon_id` de `products` se puede copiar de la variante predeterminada durante la migración

Ejemplos:
- ID 312: "Recufloor Hidrolaca Laca Poliuretanica" (4 variantes, default: "1892")
- ID 187: "Cubierta Piso Deportivo" (20 variantes, default: "119")
- ID 215: "Hidrolaca Poliuretanica Pisos" (2 variantes, default: "1993")
- ID 199: "Latex Premium Interior" (4 variantes, default: "51")
- ID 35: "Impregnante Danzke" (24 variantes, default: "1201")

## Distribución de Longitudes

### products.aikon_id (17 valores)
- 3 caracteres: 3 valores
- 4 caracteres: 14 valores

### product_variants.aikon_id (642 valores)
- 1 carácter: 8 valores
- 2 caracteres: 58 valores
- 3 caracteres: 73 valores
- 4 caracteres: 277 valores
- 5 caracteres: 215 valores
- 6 caracteres: 1 valor
- 7-14 caracteres: 10 valores (algunos con ceros a la izquierda)

## Recomendaciones

### Antes de Ejecutar la Migración

1. **Limpiar valores no numéricos**: Identificar y corregir los 15 valores no numéricos en `product_variants.aikon_id`

2. **Asignar aikon_id a productos sin variantes**: Los productos sin variantes necesitan códigos aikon_id manualmente.

3. **Verificar valores con ceros a la izquierda**: Aunque se convertirán correctamente, verificar que los valores largos (7-14 caracteres) no excedan 999999 cuando se conviertan a número.

4. **Backup de la base de datos**: Hacer backup completo antes de ejecutar la migración.

### Durante la Migración

1. La migración convertirá automáticamente los valores string a integer
2. Limpiará caracteres no numéricos de los valores problemáticos
3. Copiará `aikon_id` de variantes predeterminadas a productos que no lo tengan
4. Aplicará constraints de validación

### Después de la Migración

1. Verificar que todos los productos tengan `aikon_id` o variantes
2. Verificar que todos los valores estén en el rango 0-999999
3. Verificar que el formateo funcione correctamente en la UI
4. Verificar que los 15 valores problemáticos se hayan limpiado correctamente

## Próximos Pasos

1. ✅ Script de análisis creado
2. ✅ Migración SQL creada
3. ⏳ **PENDIENTE**: Identificar y corregir los 15 valores no numéricos en variantes
4. ⏳ **PENDIENTE**: Asignar aikon_id a productos sin variantes
5. ⏳ **PENDIENTE**: Ejecutar migración en entorno de desarrollo primero
6. ⏳ **PENDIENTE**: Verificar resultados antes de aplicar en producción
