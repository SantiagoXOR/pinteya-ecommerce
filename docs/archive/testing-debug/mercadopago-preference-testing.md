Objetivo
- Definir cómo probar la preferencia de pago de Mercado Pago tras el cambio: el costo de envío solo se pasa por `shipments.cost` y no existe un ítem "Envío" en `items`.

Puntos de verificación
- UI Checkout: `data-testid="shipping-cost"` visible y con valor > $0 cuando corresponde.
- Mercado Pago: pantalla de pago muestra líneas "Productos" y "Envío" y el total coincide con `subtotal + envío`.
- API `create-preference`: responde 200 y retorna `init_point` y `preference_id`.
- Base de datos: `orders.total = itemsTotal + shippingCost`; `order_items` no contiene un item de envío.

Ejemplo Playwright (creación de preferencia)
```ts
const response = await page.request.post(`${BASE_URL}/api/payments/create-preference`, {
  data: {
    items: [
      { id: '1', quantity: 1 },
      { id: '2', quantity: 2 }
    ],
    payer: {
      name: 'Juan',
      surname: 'Pérez',
      email: 'juan@example.com'
    },
    shipping: {
      cost: 10000,
      address: {
        street_name: 'Av. Córdoba',
        street_number: '1234',
        zip_code: '5000',
        city_name: 'Córdoba',
        state_name: 'Córdoba'
      }
    }
  }
})

expect(response.status()).toBe(200)
const data = await response.json()
expect(data.success).toBe(true)
expect(data.data).toHaveProperty('init_point')
expect(data.data).toHaveProperty('preference_id')
```

Checklist de pruebas
- Preferencia con envío > 0: total correcto y línea "Envío" visible en Mercado Pago.
- Preferencia con envío = 0: total igual al subtotal, sin cobro de envío.
- Múltiples ítems con descuentos: `itemsTotal` calcula con `getFinalPrice` por producto.
- Errores: manejo de 400 en datos inválidos y 429 en rate limit.

No hacer
- No verificar ni agregar un ítem "Envío" dentro de `items`.