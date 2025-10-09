# 🔄 Arquitectura del Flujo de Checkout

## Visión General
El flujo de `CheckoutExpress` se compone de estados bien definidos y transiciones controladas para garantizar estabilidad de hooks y una experiencia predecible.

## Estados Principales
- `form`: Captura de datos de contacto, envío y facturación.
- `processing`: Validaciones y preparación de pago.
- `redirect`: Redirección a pasarela (MercadoPago) o confirmación de contraentrega.
- `success`: Confirmación de pedido.

## Diagrama Simplificado
```
Carrito --> CheckoutExpress
             |
             v
           form
             |
     validar / preparar
             v
        processing
             |
   +---------+----------+
   |                    |
   v                    v
 redirect (initPoint)   redirect (cash)
   |                    |
 [MercadoPago]   ->  cashSuccessParams
   |                    |
   v                    v
 success           success
```

## Puntos Clave
- `initPoint`: URL de redirección a MercadoPago. Cuando existe, el `step` avanza a `redirect`.
- `preferenceId`: Identificador de preferencia para Wallet Brick; no debe condicionar hooks.
- `cashOrderData` / `cashSuccessParams`: Persistencia mínima en `localStorage` para contraentrega.

## Reglas de Hooks
- `CheckoutExpress.tsx`:
  - Declarar todos los hooks al tope, sin condicionales basados en `step` o props.
  - Usar `useRef`, `useState`, `useEffect` locales para navegación móvil básica.
- `MercadoPagoWallet.tsx`:
  - Declarar `useEffect` y otros hooks de forma incondicional.
  - La lógica condicional vive dentro de efectos/callbacks.

## Integración con Error Handling
- Usar `useApiErrorHandler` y `useNetworkErrorHandler` para capturar y suprimir errores no críticos.
- Reportar eventos críticos a la `centralized-error-handler`.

## Persistencia y Redirección
- MercadoPago: redirección por `initPoint`; mantener carrito hasta `success`.
- Contraentrega: persistir parámetros mínimos; limpiar en páginas de confirmación.

## Próximos Pasos
- Añadir pruebas de transición de estados.
- Revisar performance del `processing` y tiempos de redirección.
- Documentar políticas de reintento en errores de red.