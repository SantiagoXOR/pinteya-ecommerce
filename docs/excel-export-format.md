# Especificación de Exportación Excel hacia Aikon

## Objetivos

1. El archivo debe servir como fuente de verdad para actualizar inventario y pricing en Aikon.
2. Cada variante comercializable debe aparecer explícitamente con su `aikon_id` y stock real.
3. Los productos sin variantes deberán emitirse igualmente (marcando la sección de variante como vacía) para mantener trazabilidad.

## Tablas de origen

| Tabla Supabase | Campos claves |
| --- | --- |
| `products` | `id`, `name`, `slug`, `description`, `category_id`, `brand`, `price`, `discounted_price`, `stock` (valor histórico), `is_active`, `is_featured`, `aikon_id`, `medida`, timestamps |
| `product_variants` | `id`, `product_id`, `aikon_id`, `variant_slug`, `color_name`, `color_hex`, `measure`, `finish`, `price_list`, `price_sale`, `stock`, `is_active`, `is_default`, `image_url` |
| `categories` | `id`, `name`, `slug` |

> Nota: el stock real que usa el front está en `product_variants.stock`. La columna `products.stock` está desactualizada y sólo se usaba históricamente en la exportación.

## Columnas finales alineadas con Aikon

Emitimos una fila por variante (o por producto cuando no existan variantes) pero adaptamos las columnas al layout de la hoja “Datos Exportados” de Aikon. Estamos conservando únicamente las columnas necesarias y en el orden exacto que espera el ERP:

| # | Columna Aikon | Fuente Supabase | Regla / Transformación |
| - | ------------- | --------------- | ---------------------- |
| 1 | `Código` | `product_variants.aikon_id` / `products.aikon_id` | Identificador principal (obligatorio para sincronizar). |
| 2 | `Descripción` | `products.name` + `variant.measure` (opcional) | Nombre legible para la variante. |
| 3 | `Familia` | `products.category_id` | ID numérico de categoría. |
| 4 | `Nombre Familia` | `categories.name` | Nombre de categoría o “Sin categoría”. |
| 5 | `UM` | `variant.measure` / `products.medida` | Unidad corta (ej. `1L`). |
| 6 | `Unidad de Medida` | `variant.measure` / `products.medida` | Texto completo; reutilizamos el mismo valor. |
| 7 | `Marca` | `products.brand` | Valor tal cual en Supabase. |
| 8 | `Nombre Marca` | `products.brand` | Se repite para compatibilidad. |
| 9 | `Costo Neto` | `variant.price_list` / `products.price` | Precio de lista sin descuento. |
|10 | `Descuento` | `price_list - price_sale` | Diferencia absoluta (0 si no hay promo). |
|11 | `Descuento Máximo` | Igual a `Descuento` | Mientras no haya un tope distinto. |
|12 | `Oferta` | Derivado | “Sí” si `price_sale` < `price_list`. |
|13 | `Moneda` | Constante | `ARS`. |
|14 | `Maneja Stock` | Derivado | “Sí” si controlamos stock por variante. |
|15 | `Estado` | `products.is_active` | “Activo” / “Inactivo”. |
|16 | `Condicion de Venta` | Constante | `Contado` (ajustable). |
|17 | `Deposito por Defecto` | Constante | `Deposito Central` (ajustable). |
|18 | `Precio Sugerido` | `variant.price_sale` / `products.discounted_price` | Valor final para la venta. |
|19 | `Venta Mínima` | Constante | `1`. |
|20 | `Rentabilidad Min` | Constante | Vacío hasta definir una regla. |
|21 | `Rentabilidad Max` | Constante | Vacío hasta definir una regla. |
|22 | `Compre Ahora` | `products.is_active` | “Sí” / “No”. |
|23 | `Activo Compre Ahora` | `products.is_active` | “Sí” / “No”. |
|24 | `Cód.Ref 001` | `products.id` | Para trazabilidad interna. |
|25 | `Ref 001` | `products.slug` | Slug del producto. |
|26 | `Cód.Ref 002` | `product_variants.id` | ID interno de la variante. |
|27 | `Ref 002` | `product_variants.variant_slug` | Slug de la variante. |
|28 | `Stock Disponible` | `product_variants.stock` / `products.stock` | Cantidad actual para la variante. |
|29 | `Necesita Sync Aikon` | Derivado | “Sí” cuando `Código` está vacío. |

> Las columnas contables/fiscales (`Imp.Etiq.`, `Imp. Int`, `Cuenta Ventas`, etc.) y campos legacy (`Descrip 2/3/4`, `Reempl Arcor`, etc.) se omiten explícitamente para evitar ruido en el Excel resultante.

## Productos sin variantes

- Se emite una fila única con los campos de producto.
- `Código` se llena con `products.aikon_id` (si existe); si no, queda vacío y se marca `Necesita Sync Aikon = Sí`.
- `Maneja Stock` (flag) se setea en “No” y el stock numérico toma `products.stock`.

## Orden y filtros

1. Orden por `products.created_at DESC` para mantener consistencia con la UI.
2. Los filtros disponibles (`category_id`, `brand`, `status`, `stock_status`, etc.) se aplican sobre los datos planos antes de exportar para garantizar que los totales respondan a las variantes reales.

## Reglas adicionales

- Todas las cifras monetarias se exportan como número para que Excel las reconozca.
- El flag `Necesita Sync Aikon` permite auditar rápidamente qué registros todavía no cuentan con un código válido en el ERP.
- Se mantiene la hoja `Resumen` con métricas (totales, sin categoría, sin `aikon_id`) para control operativo.
