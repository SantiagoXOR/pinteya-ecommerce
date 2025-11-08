# 🧪 Guía de Testing para Checkout Express

## Alcance
- Cobertura de los estados del checkout: `form`, `processing`, `redirect`, `success`.
- Estabilidad de hooks en `CheckoutExpress` y componentes asociados.
- Flujos E2E: redirección a MercadoPago y contraentrega (cash-on-delivery).

## Pruebas Unitarias
- Montaje básico de `CheckoutExpress` con mocks de `useCheckout`:
  - Validar render por `step`: `form`, `processing`, `redirect`, `success`.
  - Afirmar que no hay errores de orden de hooks entre renders.
- `MercadoPagoWallet`:
  - Verificar inicialización del SDK con `preferenceId` válido.
  - Asegurar que hooks se ejecutan de forma incondicional y la lógica condicional vive dentro de `useEffect`/callbacks.

## Pruebas de Integración
- `processExpressCheckout`:
  - Simular datos de formulario válidos e inválidos; verificar validaciones y transición a `processing`.
- Redirección MercadoPago:
  - Mocks de `initPoint`; validar que el componente pasa a `redirect` y dispara la navegación.
- Contraentrega:
  - Simular `processCashOnDelivery`; verificar persistencia en `localStorage` y estados `cashSuccessParams`/`cashOrderData`.

## Pruebas E2E
- Flujo MercadoPago:
  - Agregar al carrito → completar `form` → `processing` → `redirect` a `initPoint`.
  - Validar persistencia del carrito hasta pago confirmado.
- Flujo Contraentrega:
  - Agregar al carrito → completar `form` → confirmar contraentrega → `success`.
  - Verificar limpieza/control de estado en páginas de `success`/`failure`.

## Estabilidad de Hooks
- `CheckoutExpress.tsx`:
  - Confirmar que no hay hooks condicionados por `step` o props.
  - Validar reemplazo de `useMobileCheckoutNavigation` por hooks locales (`useRef`, `useState`, `useEffect`).
- `MercadoPagoWallet.tsx`:
  - Auditar que todos los hooks se declaran al tope y sin condicionales.
  - La lógica condicional se maneja dentro de efectos/callbacks.

## Monitoreo y Logging
- Registrar transiciones de `step` y eventos de Wallet (`handleWalletReady`, `handleWalletError`, `handleWalletSubmit`).
- Asegurar que errores usan el sistema centralizado (`useApiErrorHandler`/`useNetworkErrorHandler`).

## Herramientas
- `jest`, `react-testing-library`, `playwright`/`cypress` para E2E.
- Mocks de `next/navigation`, `redux` y APIs de pago.