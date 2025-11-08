# 🧩 MercadoPago Wallet: Uso Seguro de Hooks

## Objetivo
Asegurar que el componente `MercadoPagoWallet.tsx` respete las reglas de hooks de React y evite variaciones entre renders.

## Principios
- Declarar todos los hooks (`useEffect`, `useState`, `useRef`, etc.) al nivel superior del componente.
- No condicionar la existencia de hooks por `step`, `initPoint`, `preferenceId` o flags de estado.
- Mover condiciones dentro de los efectos/callbacks;
  - Ejemplo: `useEffect(() => { if (shouldInit) { initSDK() } }, [shouldInit])`.

## Patrón Recomendado
```tsx
// ❌ Evitar
if (isSuccessPage) {
  useEffect(() => cleanup(), [])
}

// ✅ Correcto
useEffect(() => {
  if (isSuccessPage) {
    cleanup()
  }
}, [isSuccessPage])
```

## Inicialización del SDK
- Declarar `useEffect` incondicional para preparar el SDK.
- Dentro del efecto:
  - Verificar páginas donde NO debe inicializarse (success/failure/pending).
  - Chequear `preferenceId` válido antes de crear el Brick.
  - Registrar `handleWalletReady`, `handleWalletError`, `handleWalletSubmit`.

## Redirecciones y Estados
- La redirección directa a `initPoint` se maneja en `CheckoutExpress` cuando `step === 'redirect'`.
- `MercadoPagoWallet` no debe mutar el `step` ni ejecutar hooks condicionales basados en `step`.

## Errores y Reintentos
- Usar `useApiErrorHandler`/`useNetworkErrorHandler` para capturar errores del SDK.
- Implementar reintentos dentro de callbacks con límites y backoff.

## Checklist rápido
- [ ] Todos los hooks están al tope y sin condicionales.
- [ ] Las condiciones viven dentro de efectos/callbacks.
- [ ] `preferenceId` se valida dentro de efectos antes de inicializar.
- [ ] No se altera `step` desde el componente Wallet.
- [ ] Logging y toasts usan el sistema centralizado de errores.