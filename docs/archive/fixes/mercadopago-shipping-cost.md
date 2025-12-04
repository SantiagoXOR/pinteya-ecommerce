Resumen
- Se corregía una duplicación del costo de envío en la preferencia de pago de Mercado Pago: el envío se agregaba como ítem en `items` y además como `shipments.cost`.
- Ahora el envío se cobra únicamente a través de `shipments.cost`. No se agrega un ítem de "Envío" en `items`.

Contexto y síntoma
- Preferencias con totales mayores a lo esperado al incluir el costo de envío dos veces.
- En la UI de Mercado Pago se mostraba "Productos" y "Envío" correctamente, pero el total podía estar duplicado si también se sumaba un ítem extra de envío.

Cambio aplicado
- Archivo: `src/app/api/payments/create-preference/route.ts`.
- Se eliminó la lógica que agregaba un `MercadoPagoItem` para el envío.
- Se mantiene el cálculo de `totalAmount = itemsTotal + shippingCost` para la orden y se pasa el envío por `shipments.cost`.
- La respuesta de la API retorna `init_point` y `preference_id` como antes.

Impacto en pruebas
- Ninguna prueba debe esperar un ítem de envío dentro de `items` de la preferencia.
- Las E2E deben validar que el total sea `subtotal(items) + shippingCost` y que la UI muestre la línea "Envío" (propia de Mercado Pago).

Validación recomendada
- Generar una preferencia con envío > 0 y verificar en la pantalla de Mercado Pago que:
  - Se muestran las líneas "Productos" y "Envío".
  - El total coincide con `subtotal + envío`.
- Confirmar en base de datos que `orders.total` guarda `itemsTotal + shippingCost` y que no existe un ítem "Envío" en `order_items`.

Notas
- El rate limiting, logging y métricas permanecen sin cambios.
- La UI del checkout no se modificó; continúa mostrando el costo de envío una sola vez.

Rollback (si fuera necesario)
- Revertir el cambio en `route.ts` que quitó el ítem de envío.
- No recomendado: reintroducir el ítem de envío puede causar nuevamente duplicación en el total.