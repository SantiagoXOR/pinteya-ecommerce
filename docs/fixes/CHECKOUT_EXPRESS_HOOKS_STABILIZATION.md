# ✅ Estabilización de Hooks en CheckoutExpress

## Resumen
- Se corrigió un error de React relacionado con el orden de ejecución de hooks en `CheckoutExpress`.
- La causa probable era el uso de un hook personalizado (`useMobileCheckoutNavigation`) cuyo comportamiento variaba entre renders.
- Se reemplazó por refs/estado locales para garantizar un orden de hooks estable e invariable.

## Cambios implementados
- Archivo actualizado: `src/components/Checkout/CheckoutExpress.tsx`
  - Eliminada la importación y uso de `useMobileCheckoutNavigation`.
  - Agregados `useRef`, `useState` y `useEffect` locales:
    - `containerRef` para referenciar el contenedor del checkout.
    - `isMobile` con detección simple (user agent + ancho de ventana).
    - `isInteracting` para efectos táctiles mínimos.
    - `goBack` y `triggerHapticFeedback` seguros (con `navigator.vibrate?`).
  - Justificación: mantener el orden de hooks 100% constante entre renders.

## Motivación técnica
- Los hooks de React deben ejecutarse siempre en el mismo orden. Si un hook personalizado cambia los hooks internos en función de props/entorno, puede provocar errores de “Rendered fewer hooks than expected”.
- Al inyectar sólo hooks básicos (sin condicionales) directamente en el componente, eliminamos variaciones de orden.

## Resultados y verificación
- Se ejecutó un build de producción (`npm run build`).
  - Tras limpiar `.next`, el build finalizó correctamente.
  - Esto indica que el árbol de render es estable y compila sin violaciones de reglas de hooks.

## Impacto funcional
- No se cambiaron comportamientos visibles, sólo la estructura de hooks.
- La navegación móvil conserva funcionalidad básica (`goBack`, vibración ligera). Gestos avanzados quedan fuera de este componente por ahora.

## Pendiente de documentación
1. Documentar el razonamiento para remover `useMobileCheckoutNavigation` y criterios para reintroducirlo de forma segura (sin variar hooks internos).
2. Documentar el ciclo de vida de `MercadoPagoWallet.tsx` y garantizar que sus hooks se ejecuten incondicionalmente; mover lógica condicional dentro de efectos/callbacks.
3. Guía de testing del checkout:
   - Casos de `step`: `form`, `processing`, `redirect`, `success`.
   - Validación de estabilidad de hooks bajo diferentes `errors` y `preferenceId`.
   - Pruebas E2E de redirección a MercadoPago y flujo de contraentrega.
4. Actualizar documentación Mobile-First para reflejar la detección de `isMobile` simplificada y sus limitaciones.
5. Añadir diagrama de flujo del checkout (incluyendo condiciones de redirección, manejo de `initPoint`, y estados de `cashOrderData`).
6. Registrar este cambio en `CHANGELOG.md` (sección “Fixes: Hooks stability en checkout express”).

## Recomendaciones
- Si se necesita navegación móvil avanzada, encapsularla en un componente hijo controlado por props, evitando hooks condicionales en el nivel del contenedor.
- Revisar `MercadoPagoWallet.tsx` para eliminar cualquier uso condicional de hooks y centralizar validaciones en `useEffect` y guard clauses internas.

## Referencias
- `src/components/Checkout/CheckoutExpress.tsx`
- `src/components/Checkout/MercadoPagoWallet.tsx`
- Documentos previos: `docs/guides/HOOKS_ERROR_FINAL_SOLUTION.md`, `docs/guides/CHECKOUT_MOBILE_FIRST_IMPROVEMENTS.md`