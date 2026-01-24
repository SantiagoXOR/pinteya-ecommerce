# Correcciones Scrolling Banner - Multitenant

**Fecha:** 24 de Enero, 2026  
**Tipo:** Fix - Corrección de colores y textos del scrolling banner por tenant

## Resumen

Se corrigieron múltiples problemas relacionados con el scrolling banner del sistema multitenant, incluyendo textos incorrectos, colores de fallback incorrectos, y tipografía sin formato adecuado.

## Problemas Corregidos

### 1. Scrolling Banner de Pinteya mostraba textos de Pintemas
- **Problema:** El banner de Pinteya mostraba "ESPAÑA 375 - ALTA GRACIA" y "ENVIO GRATIS EN 24HS ALTA GRACIA Y ALREDEDORES" (textos de Pintemas)
- **Causa:** Valores `null` en la base de datos y fallbacks hardcodeados con valores de Pintemas
- **Solución:** 
  - Actualizados textos en BD para Pinteya: "TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA" y "ENVIO GRATIS EN 24HS EN CÓRDOBA"
  - Implementados fallbacks específicos por tenant en el código

### 2. Colores incorrectos en scrolling banner
- **Problema:** 
  - Color amarillo de Pinteya era `#ffe200` (de Pintemas) en lugar de `#ffd549`
  - Color verde de Pinteya era `#00f269` en lugar de `#007638`
  - Colores de texto no usaban `primaryDark` del tenant
- **Solución:**
  - Actualizado `accent_color` de Pinteya a `#ffd549` en BD y código
  - Actualizado `secondary_color` de Pinteya a `#007638` en BD y código
  - Implementado uso de `primaryDark` para textos:
    - Pinteya: `#bd4811` (naranja oscuro) en banner amarillo
    - Pintemas: `#6a0f54` (morado oscuro) en ambos banners (blanco y amarillo)

### 3. Tipografía sin formato adecuado
- **Problema:** Textos en mayúsculas sin capitalize y sin diferenciación de pesos en palabras clave
- **Solución:**
  - Implementada función `formatBannerText` que:
    - Convierte texto a minúsculas y aplica capitalize
    - Detecta palabras clave por tenant
    - Aplica `font-bold` a palabras clave y `font-normal` al resto
  - Palabras clave configuradas:
    - **Pinteya:** `'n°1'`, `'online'`, `'gratis'`, `'24hs'`, `'córdoba'`
    - **Pintemas:** `'gratis'`, `'24hs'`, `'alta gracia'`, `'alrededores'`

## Cambios en Base de Datos

### Pinteya
```sql
UPDATE tenants SET
  accent_color = '#ffd549',
  secondary_color = '#007638',
  scrolling_banner_location_text = 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA',
  scrolling_banner_shipping_text = 'ENVIO GRATIS EN 24HS EN CÓRDOBA',
  scrolling_banner_location_bg_color = '#ffd549',
  scrolling_banner_shipping_bg_color = '#007638',
  header_bg_color = '#ea5a17',
  updated_at = NOW()
WHERE slug = 'pinteya';
```

### Pintemas
- Sin cambios en BD (valores ya correctos)
- Cambios solo en código para usar `primaryDark` en textos

## Cambios en Código

### Archivos Modificados

1. **`src/components/Header/ScrollingBanner.tsx`**
   - Función `formatBannerText` para tipografía con capitalize y pesos diferentes
   - Fallbacks específicos por tenant para textos y colores
   - Lógica de colores de texto usando `primaryDark` del tenant
   - Iconos actualizados (Star para Pinteya, MapPin para Pintemas)

2. **`src/lib/tenant/tenant-service.ts`**
   - Actualizado `DEFAULT_COLORS.accentColor` a `#ffd549`
   - Actualizado `DEFAULT_COLORS.secondaryColor` a `#007638`

## Resultado Final

### Pinteya
- **Banner Amarillo (`#ffd549`):** 
  - Texto: "Tienda De Pinturas **Online** N°1 En **Córdoba**" 
  - Color texto: `#bd4811` (primaryDark - naranja oscuro)
  - Icono: Star (Tabler) en naranja oscuro

- **Banner Verde (`#007638`):**
  - Texto: "Envio **Gratis** En **24hs** En **Córdoba**"
  - Color texto: Blanco (`#ffffff`)
  - Icono: Truck (Tabler) en blanco

### Pintemas
- **Banner Blanco (`#ffffff`):**
  - Texto: "España 375 - Alta Gracia"
  - Color texto: `#6a0f54` (primaryDark - morado oscuro)
  - Icono: MapPin (Tabler) en morado oscuro

- **Banner Amarillo (`#ffe200`):**
  - Texto: "Envio **Gratis** En **24hs** Alta Gracia Y **Alrededores**"
  - Color texto: `#6a0f54` (primaryDark - morado oscuro)
  - Icono: Truck (Tabler) en morado oscuro

## Impacto

- ✅ Corrección de textos incorrectos por tenant
- ✅ Consistencia de colores con la paleta de cada tenant
- ✅ Mejora en legibilidad con tipografía capitalize y pesos diferenciados
- ✅ Mejor contraste visual con uso de `primaryDark` en textos

## Notas Técnicas

- Los fallbacks están configurados específicamente por tenant para evitar que un tenant use valores de otro
- La función `formatBannerText` es extensible para agregar más palabras clave o tenants
- Los colores se obtienen primero de la BD, luego del tenant context, y finalmente de fallbacks hardcodeados
