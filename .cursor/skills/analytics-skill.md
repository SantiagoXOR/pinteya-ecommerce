# Skill: Analytics y Tracking

## Descripción

Habilidad especializada para implementar y mantener el sistema de analytics del proyecto, incluyendo tracking de eventos, métricas e-commerce, integración con GA4 y dashboard administrativo.

## Cuándo Usar

- Implementar tracking de nuevos eventos
- Crear métricas personalizadas
- Integrar con servicios de analytics externos
- Debuggear problemas de tracking
- Optimizar performance de analytics

## Archivos Clave

- `src/lib/integrations/analytics/` - Integración de analytics
- `src/components/Analytics/` - Componentes de analytics
- `src/app/api/track/` - API de tracking
- `src/hooks/useAnalytics.ts` - Hook de analytics

## Comandos Útiles

```bash
# Ver eventos de tracking en desarrollo
# Abrir DevTools → Network → Filtrar por /api/track

# Verificar configuración GA4
# Settings → Analytics → Verificar IDs configurados
```

## Ejemplos de Uso

### Trackear Evento de E-commerce

```typescript
import { trackEvent } from '@/lib/integrations/analytics';

// Trackear vista de producto
await trackEvent({
  event: 'view_item',
  properties: {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    currency: 'ARS',
    category: product.category.name,
  },
});
```

### Trackear Conversión

```typescript
// En checkout completado
await trackEvent({
  event: 'purchase',
  properties: {
    transaction_id: order.id,
    value: order.total,
    currency: 'ARS',
    items: order.items.map(item => ({
      item_id: item.product_id,
      item_name: item.product.name,
      price: item.price,
      quantity: item.quantity,
    })),
  },
});
```

### Usar Hook de Analytics

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function ProductCard({ product }: ProductCardProps) {
  const { track } = useAnalytics();
  
  const handleClick = () => {
    track('product_click', {
      product_id: product.id,
      product_name: product.name,
    });
  };
  
  return <div onClick={handleClick}>...</div>;
}
```

## Tipos de Eventos Comunes

- `page_view` - Vista de página
- `product_view` - Vista de producto
- `add_to_cart` - Agregar al carrito
- `remove_from_cart` - Remover del carrito
- `begin_checkout` - Iniciar checkout
- `purchase` - Compra completada
- `search` - Búsqueda de productos

## Checklist de Implementación

- [ ] Definir evento y propiedades
- [ ] Implementar tracking en el componente/API
- [ ] Verificar en DevTools que se envía
- [ ] Verificar en GA4/Supabase que se recibe
- [ ] Documentar el evento si es nuevo
