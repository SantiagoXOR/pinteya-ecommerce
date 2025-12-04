# ✅ Checklist de Estabilidad de Hooks

> Usa este checklist antes de abrir un PR para cualquier cambio que involucre componentes o hooks de React (especialmente en checkout y pagos).

## Principios Clave

- No condicionar invocaciones de hooks por props/estado (`isMobile`, `enabled`, `hasSDK`).
- Mantener el orden de hooks idéntico en todos los renders.
- Derivar comportamiento con guardas internas dentro de efectos/callbacks.
- Inicializar SDKs y listeners dentro de `useEffect` con dependencias estables.

## Checklist

### Orden y Uso
- [ ] No hay `useEffect`/`useCallback`/`useMemo` dentro de condicionales.
- [ ] Hooks siempre se llaman en el tope del componente/hook.
- [ ] Dependencias de efectos/callbacks son estables y correctas.
- [ ] No se crean hooks dentro de bucles, returns tempranos o funciones.

### Dependencias y Estado
- [ ] `useRef` usado para valores transitorios en lugar de estado cuando aplica.
- [ ] `useState` no se usa para flags que cambian orden de hooks.
- [ ] Guardas internas (`if (!enabled) return`) están dentro del efecto/callback, no fuera.

### Integraciones (SDK/DOM)
- [ ] Listeners DOM añadidos/quitados en un único `useEffect` con cleanup.
- [ ] SDKs inicializados una sola vez con `useEffect` y `ref` para instancia.
- [ ] Redirecciones (checkout/pagos) se realizan desde callbacks/efectos, no durante render.

### Testing
- [ ] Tests que renderizan el componente con diferentes props no rompen el orden de hooks.
- [ ] Mocks de SDK/DOM no causan ejecución condicional de hooks.
- [ ] Hay pruebas de cleanup y re-creación de listeners al cambiar deps.

## Antipatrones Comunes

- `if (isMobile) useEffect(...)` → Mover la guarda dentro del efecto.
- `enabled ? useRef() : null` → Nunca condicionar `useRef`.
- Inicializar SDK durante render → Hazlo en `useEffect` con `ref`.
- Cambiar estructura de hooks entre renders por props.

## Referencias

- `docs/fixes/CHECKOUT_EXPRESS_HOOKS_STABILIZATION.md`
- `docs/guides/MercadoPagoWallet_Hooks_Safe.md`
- `docs/testing/checkout.md`
- `docs/architecture/checkout-flow.md`