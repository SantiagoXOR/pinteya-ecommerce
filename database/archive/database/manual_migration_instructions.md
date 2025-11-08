# Instrucciones para Migración Manual de Productos

## Pasos para ejecutar la migración en Supabase

### 1. Acceder al Panel de Supabase

- Ve a [supabase.com](https://supabase.com)
- Accede a tu proyecto
- Ve a la sección "SQL Editor"

### 2. Ejecutar el Script de Migración

Copia y pega el contenido completo del archivo `migrate_products_from_csv.sql` en el SQL Editor y ejecuta.

### 3. Verificar la Migración

Después de ejecutar el script, verifica que:

- Se agregaron las columnas `aikon_id`, `color`, y `medida`
- Se insertaron todos los 94 productos
- Los datos coinciden con el CSV original

### 4. Comandos de Verificación

Ejecuta estos comandos para verificar:

```sql
-- Verificar total de productos
SELECT COUNT(*) as total_productos FROM products;

-- Verificar estructura de columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('aikon_id', 'color', 'medida');

-- Verificar algunos productos específicos
SELECT id, name, brand, category_id, price, stock, aikon_id, color, medida
FROM products
WHERE id IN (1, 25, 50, 75, 94)
ORDER BY id;
```

### 5. Resultado Esperado

- **Total productos**: 94
- **Nuevas columnas**: aikon_id (VARCHAR), color (VARCHAR), medida (VARCHAR)
- **Datos**: Todos los productos del CSV con información completa

## Notas Importantes

- El script limpia todos los datos existentes antes de insertar los nuevos
- Se mantiene la estructura de la tabla pero se agregan las nuevas columnas
- Los IDs se resetean para coincidir exactamente con el CSV
- Todos los productos incluyen el campo `aikon_id` como clave del sistema interno
