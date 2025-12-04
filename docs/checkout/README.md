# 💳 Documentación de Checkout

> Índice y guía rápida del sistema de Checkout (Express y MercadoPago).

## 📌 Enlaces Clave

- 🔧 Fix: Estabilidad de Hooks en Checkout Express → `../fixes/CHECKOUT_EXPRESS_HOOKS_STABILIZATION.md`
- 🧪 Guía de Testing de Checkout → `../testing/checkout.md`
- 📐 Arquitectura del Flujo de Checkout → `../architecture/checkout-flow.md`
- 🧩 Hooks seguros en MercadoPagoWallet → `../guides/MercadoPagoWallet_Hooks_Safe.md`

## 📚 Planes y Mejoras (2025)

- `./CHECKOUT_EXPRESS_PLAN_2025.md`
- `./CHECKOUT_UNIFIED_2025.md`
- `./CHECKOUT_OPTIMIZED_2025.md`
- `./CHECKOUT_IMPROVEMENTS_2025.md`
- `./CHECKOUT_FINAL_OPTIMIZATIONS_2025.md`
- `./TESTING_CONVERSION_PLAN_2025.md`

## ✅ Qué validar

- Orden estable de hooks en `CheckoutExpress.tsx`.
- Redirecciones y manejo de estados de pago (success/failure/pending).
- Integración con `MercadoPago Wallet Brick` y retry logic.
- Tests unitarios, integración y E2E para el flujo completo.

## 🚀 Próximos pasos sugeridos

- Añadir métricas de conversión específicas del checkout.
- Expandir pruebas E2E para escenarios de error del SDK.
- Documentar políticas de retry/timeout en integraciones de pago.