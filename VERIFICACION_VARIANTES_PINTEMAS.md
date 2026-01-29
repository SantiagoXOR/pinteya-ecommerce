# Verificación: variantes y selector de medida (tenant Pintemas)

Pasos para comprobar en **producción** (tenant pintemas) que la API devuelve variantes y que el selector de medida puede mostrarse.

---

## Resultado de verificación (2026-01-29, entorno local con tenant pintemas)

- **API por slug:** `GET /api/products/slug/recuplast-frentes` → **200 OK**
- **API por ID:** `GET /api/products/39` → **200 OK**
- **`data.variants`:** array con **12 variantes**, todas con `measure` (1L, 4L, 10L, 20L).
- **`data.default_variant`:** presente, `measure: "1L"`.
- **Conclusión:** La API devuelve variantes correctamente; el selector de medida debe mostrarse en el shopdetail para Recuplast Frentes cuando el front consuma esta respuesta (tenant pintemas).

---

## 1. Obtener ID o slug del producto

- Desde el listado en pintemas, abre "Recuplast Frentes" o cualquier producto que deba mostrar medida.
- En la URL verás algo como `/products/recuplast-frentes` (slug) o `/products/123` (ID). Anota el slug o el ID.

## 2. Llamar a la API desde el origen de Pintemas

Usa la misma base URL que el sitio en producción (ej. `https://pintemas.com` o la que uses).

**Por slug:**

```bash
curl -s "https://[TU-DOMINIO-PINTEMAS]/api/products/slug/recuplast-frentes" | jq .
```

**Por ID:**

```bash
curl -s "https://[TU-DOMINIO-PINTEMAS]/api/products/123" | jq .
```

(Sustituye `123` por el ID real del producto.)

Desde el navegador (consola) en el mismo dominio:

```javascript
// Por slug
const res = await fetch('/api/products/slug/recuplast-frentes')
const json = await res.json()
console.log('variants:', json?.data?.variants)
console.log('default_variant:', json?.data?.default_variant)
```

## 3. Qué revisar en la respuesta JSON

- **`data.variants`**: debe ser un **array**. Si es `[]`, el selector de medida no se mostrará.
- Cada elemento de `data.variants` debe tener **`measure`** (ej. `"10 L"`, `"4 L"`, `"1 L"`).
- **`data.default_variant`**: opcional; si existe, debe tener `measure` y sirve como variante por defecto.

Si `variants` está vacío, el problema está en datos o en tenant: o no hay filas en `product_variants` para ese producto, o la API por slug no estaba filtrando por tenant (ya corregido en este plan).

## 4. Si `variants` está vacío: revisar en Supabase

En el proyecto de Supabase usado por Pintemas:

1. Obtén el `product_id` del producto (p. ej. desde `products` por nombre o slug).
2. Ejecuta:

```sql
SELECT id, product_id, measure, color_name, is_active
FROM product_variants
WHERE product_id = :product_id
ORDER BY is_default DESC, measure;
```

Si no hay filas, hay que cargar variantes para ese producto. Ver el archivo [sql/verificar_o_insertar_variantes_producto.sql](sql/verificar_o_insertar_variantes_producto.sql) para consultas de verificación y ejemplos de INSERT por producto (p. ej. medidas 1 L, 4 L, 10 L, 20 L).
