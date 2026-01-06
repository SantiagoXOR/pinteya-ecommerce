---
name: Optimización CRO y UI Fixes
overview: Implementación de mejoras críticas de conversión (CRO) y correcciones de UI/UX basadas en el diagnóstico detallado del e-commerce Pinte Ya!. Incluye estandarización de formato de precios, optimización del flujo de checkout, mejoras de microcopy y ajustes de UX. Plan actualizado con análisis exhaustivo de huecos y mejoras identificadas.
todos:
  - id: fix-currency-format-core
    content: Estandarizar formato de moneda en funciones core (consolidated-utils.ts, helpers.ts, price-display.tsx)
    status: pending
  - id: fix-currency-format-card
    content: Corregir formato de precios en card.tsx (líneas 305, 325, 333)
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: fix-currency-format-product-card
    content: Corregir formato de precios en ProductCardContent.tsx (líneas 64, 78)
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: fix-currency-format-cart-sidebar
    content: Corregir formato de precios en CartSidebarModal/index.tsx (líneas 243, 255, 266)
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: verify-checkout-price-formats
    content: Verificar y corregir formato de precios en CartSummaryFooter.tsx y ProductAddedScreen.tsx
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: hide-header-footer-checkout
    content: Ocultar Header, Footer y BottomNav en checkout (providers.tsx líneas 247, 263, 172)
    status: pending
  - id: fix-checkout-button-position
    content: Mover botón 'Comprar ahora' después del resumen de totales en MetaCheckoutWizard.tsx
    status: pending
  - id: create-sticky-add-to-cart
    content: Crear componente StickyAddToCart con consideraciones de z-index, padding y accesibilidad
    status: pending
  - id: verify-use-media-query
    content: Verificar o crear hook useMediaQuery.ts para detección de móvil en StickyAddToCart
    status: pending
  - id: hide-checkout-testimonials
    content: Eliminar completamente testimonios en todos los pasos del checkout
    status: pending
  - id: update-contact-microcopy
    content: Actualizar texto del paso de contacto en MetaCheckoutWizard.tsx (línea 561)
    status: pending
  - id: update-shipping-microcopy
    content: Actualizar texto del paso de envío y placeholder en MetaCheckoutWizard.tsx (líneas 705, 740)
    status: pending
  - id: update-mercadopago-description
    content: Actualizar descripción de Mercado Pago en PaymentMethodSelector.tsx (línea 99)
    status: pending
  - id: update-confirmation-microcopy
    content: Actualizar textos de confirmación y botón final en MetaCheckoutWizard.tsx (líneas 832-836, 480)
    status: pending
  - id: consolidate-format-functions
    content: Decidir estrategia de consolidación de funciones formatCurrency (consolidated-utils.ts vs formatters.ts vs format.ts)
    status: pending
  - id: verify-edge-cases-prices
    content: "Verificar manejo de casos edge: precios null, 0, muy grandes, decimales terminados en 0"
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: verify-checkout-express
    content: Verificar formato de precios y microcopy en CheckoutExpress.tsx y SimplifiedCheckout.tsx
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: create-checkout-texts-constants
    content: Crear archivo constants/checkout-texts.ts para centralizar textos de checkout
    status: pending
  - id: add-price-format-tests
    content: Agregar tests unitarios para formatCurrency con casos edge (0, null, muy grandes, decimales)
    status: pending
    dependencies:
      - fix-currency-format-core
  - id: add-sticky-button-tests
    content: Agregar tests para StickyAddToCart (móvil/desktop, z-index, padding, funcionalidad)
    status: pending
    dependencies:
      - create-sticky-add-to-cart
---

# Plan de Optimización CRO y UI Fixes - Pinte Ya! (Actualizado)

Este plan ha sido actualizado con un análisis exhaustivo que identificó múltiples huecos críticos en la implementación original. Ver sección "Análisis de Huecos y Mejoras Identificadas" para detalles completos.

## Resumen de Hallazgos Críticos

1. **5 archivos adicionales** con formato de precios inconsistente no identificados inicialmente
2. **Header/Footer/BottomNav** NO están ocultos en checkout (solo admin/auth)
3. **StickyAddToCart** necesita consideraciones de z-index, padding y accesibilidad
4. **Múltiples funciones de formateo** duplicadas que requieren consolidación
5. **Casos edge** no considerados (precios null, muy grandes, decimales)