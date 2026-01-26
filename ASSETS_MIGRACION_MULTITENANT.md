# Assets multitenant – Migración y verificación

Documentación generada tras la migración de assets y textos por tenant (plan adjunto).
Todos los componentes usan `getTenantAssetPath` / `getTenantPromoAssetWithFallback` con fallback a `/images/...` o Supabase cuando el asset del tenant no existe.

## Estructura esperada por tenant

```
public/tenants/
├── pinteya/
│   ├── hero/           # Hero carousel (Hero, SimpleHeroCarousel)
│   │   ├── hero1.webp
│   │   ├── hero2.webp
│   │   └── ...
│   ├── icons/
│   │   └── icon-envio.svg
│   ├── combos/         # Carrusel Combopromo (CombosSection, CombosOptimized)
│   │   ├── combo1.webp
│   │   ├── combo2.webp
│   │   └── combo3.webp
│   ├── promo/          # Cards Bestsellers (Help, Calculator, Promo)
│   │   ├── help.webp
│   │   ├── calculator.webp
│   │   └── 30-off.webp
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── favicon.svg
└── pintemas/
    └── (misma estructura)
```

## Estado actual (verificado)

| Asset | pinteya | pintemas | Fallback |
|-------|---------|----------|----------|
| `logo.svg` | ✅ | ✅ | — |
| `logo-dark.svg` | ✅ | ✅ | — |
| `favicon.svg` | ✅ | ✅ | — |
| `icons/` (carpeta) | ✅ Creada | ✅ Existe | — |
| `icons/icon-envio.svg` | ✅ Migrado desde pintemas | ✅ | `/images/icons/icon-envio.svg` |
| `hero/` (carpeta) | ✅ Existe | ✅ Existe | — |
| `hero/hero*.webp` | ❌ (carpeta vacía) | ❌ (carpeta vacía) | Hero usa rutas tenant; components legacy usan `/images/hero/hero2/` |
| `combos/` (carpeta) | ✅ Creada | ✅ Creada | — |
| `combos/combo1.webp`, `combo2.webp`, `combo3.webp` | ✅ Migrados (hero4/5/6) | ✅ Migrados (hero4/5/6) | `/images/hero/hero2/hero4.webp` … `hero6.webp` |
| `promo/` (carpeta) | ✅ Creada | ✅ Creada | — |
| `promo/help.webp` | ✅ Descargado desde Supabase | ✅ Descargado desde Supabase | Supabase Storage (product-images/promo/help.webp) |
| `promo/calculator.webp` | ✅ Descargado desde Supabase | ✅ Descargado desde Supabase | Supabase Storage (product-images/promo/calculator.webp) |
| `promo/30-off.webp` | ✅ Descargado desde Supabase | ✅ Descargado desde Supabase | Supabase Storage (product-images/promo/30-off.webp) |

## Acciones recomendadas

1. **Pinteya – `icons/icon-envio.svg`**  
   Copiar desde `public/images/icons/icon-envio.svg` o desde `pintemas/icons/icon-envio.svg` si se quiere el mismo diseño.

2. **Ambos tenants – `hero/`**  
   Añadir `hero1.webp`, `hero2.webp`, etc. según lo use el Hero por tenant. Mientras no existan, se siguen usando rutas genéricas o de legacy.

3. **Ambos tenants – `combos/`**  
   Crear `combo1.webp`, `combo2.webp`, `combo3.webp` o reutilizar las de `/images/hero/hero2/` (hero4, hero5, hero6) como base.

4. **Ambos tenants – `promo/`**  
   Añadir `help.webp`, `calculator.webp`, `30-off.webp`. Los componentes hacen fallback a Supabase si faltan.

## Componentes migrados

- **Icono envíos:** `shipping-progress-bar`, `Footer`, `card` (ProductCard) → `getTenantAssetPath(…, 'icons/icon-envio.svg', fallback)`.
- **Combopromo:** `CombosSection`, `CombosOptimized` → `getTenantAssetPaths` / `getTenantAssetPath` para combos; fallback a hero4/5/6.
- **Promo cards:** `HelpCard`, `CalculatorCard`, `PromoCard` → `getTenantPromoAssetWithFallback` + `onError` a Supabase.
- **Testimonios:** `useTenantTestimonials` + `CompactSlider`; barrios por tenant (pinteya vs pintemas).
- **Textos "Córdoba":** Footer, HeaderNextAuth, TrustSection, Contact, Hero usan `tenant?.contactCity` (o equivalente) con fallback.

## Helpers

- `src/lib/tenant/tenant-assets.ts`:  
  `getTenantAssetPath`, `getTenantAssetPaths`, `getTenantPromoAsset`, `getTenantPromoAssetWithFallback`.
