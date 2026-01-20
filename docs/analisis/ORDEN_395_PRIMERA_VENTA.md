# Análisis Completo: Orden #395 - Primera Venta

**Fecha de Análisis**: 19 de Enero de 2026  
**Analista**: Sistema de Analytics Pinteya  
**Tipo**: Primera venta registrada en el sistema

---

## Resumen Ejecutivo

La orden #395 representa la primera venta completada en el e-commerce de Pinteya. El cliente realizó una compra rápida (menos de 5 minutos) desde un dispositivo móvil, encontrando el producto a través de la búsqueda y eligiendo pago en efectivo (cash on delivery).

---

## 1. Datos de la Orden

| Campo | Valor |
|-------|-------|
| **ID de Orden** | 395 |
| **Número de Orden** | 395 |
| **Total** | $69.001,80 ARS |
| **Estado** | `processing` |
| **Estado de Pago** | `cash_on_delivery` |
| **Método de Pago** | Efectivo (cash) |
| **Fecha de Creación** | 2026-01-19 15:54:02 UTC |
| **Última Actualización** | 2026-01-19 17:12:58 UTC |
| **Fulfillment Status** | `unfulfilled` |
| **Tracking Number** | No asignado |
| **Carrier** | No asignado |

---

## 2. Datos del Cliente

### Perfil de Usuario

| Campo | Valor |
|-------|-------|
| **ID de Usuario** | `10867c19-c1b1-4ace-a7d2-913c156ccccb` |
| **Nombre** | Liz |
| **Apellido** | Pomodoro |
| **Email** | `335950@temp.metacheckout.local` (temporal) |
| **Teléfono** | 3515335950 |
| **Rol** | Cliente (sin rol asignado) |
| **Estado** | Activo |
| **Tipo de Usuario** | Temporal |
| **Fuente de Creación** | `cash_order` vía API |
| **Fecha de Registro** | 2026-01-19 15:54:01 UTC |

### Metadatos del Usuario

```json
{
  "source": "cash_order",
  "temporary": true,
  "created_via": "api/orders/create-cash-order"
}
```

### Estadísticas del Cliente

| Métrica | Valor |
|---------|-------|
| **Total de Órdenes** | 1 |
| **Es Primera Compra** | Sí |
| **Direcciones Guardadas** | 0 |
| **Items en Carrito** | 0 (vacío post-compra) |

---

## 3. Dirección de Envío

| Campo | Valor |
|-------|-------|
| **Calle** | Juan Nepper 6376, X5021 Córdoba, Argentina |
| **Número** | (incluido en calle) |
| **Depto/Piso** | casa/portón con número |
| **Ciudad** | Córdoba |
| **Provincia** | Córdoba |
| **Código Postal** | 5000 |
| **País** | Argentina (implícito) |

---

## 4. Producto Comprado

### Item de Orden

| Campo | Valor |
|-------|-------|
| **ID Item** | 307 |
| **Product ID** | 108 |
| **Nombre** | Látex Impulso Profesional |
| **Marca** | Impulso |
| **Categoría** | Paredes (ID: 38) |
| **Color** | BLANCO |
| **Color Hex** | #FFFFFF |
| **Medida** | 20L |
| **Cantidad** | 2 unidades |
| **Precio Unitario** | $34.500,90 |
| **Total Línea** | $69.001,80 |
| **Variant ID** | null (compra directa) |

### Snapshot del Producto (al momento de compra)

```json
{
  "name": "Látex Impulso Profesional",
  "brand": "Impulso",
  "color": "BLANCO",
  "image": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/latex-impulso-generico.webp",
  "price": 34500.9,
  "medida": "20L",
  "color_hex": "#FFFFFF"
}
```

### Datos de la Variante (Referencia)

| Campo | Valor |
|-------|-------|
| **Variant ID** | 252 |
| **Variant Slug** | `latex-impulso-20l-blanco` |
| **Precio Lista** | $49.287,00 |
| **Precio Venta** | $34.500,90 |
| **Descuento** | 30% aprox |
| **Stock** | 15 unidades |
| **AIKON ID** | 4391 |
| **Es Default** | Sí |

---

## 5. Customer Journey (Analytics)

### Información de Sesión

| Campo | Valor |
|-------|-------|
| **Session Hash** | 381438529 |
| **Dispositivo** | Mobile |
| **Navegador** | Chrome Mobile (ID: 5) |
| **Visitor Hash** | null (no implementado) |
| **User ID en Analytics** | null (no vinculado) |

### Timeline de Eventos

| Hora (UTC) | Evento | Página | Detalle |
|------------|--------|--------|---------|
| 15:49:17 | `page_view` | `/` (Home) | Ingreso al sitio desde móvil |
| 15:49:40 | `page_view` | `/search` | Navegación a página de búsqueda |
| **15:51:48** | **`add_to_cart`** | `/search` | Agregó "Látex Impulso Profesional" ($34.500,90 x 1) |
| 15:52:17 | `page_view` | `/checkout/meta` | Ingreso al checkout de Meta Commerce |
| **15:52:17** | **`begin_checkout`** | `/checkout/meta` | Inicio del proceso ($69.001,80 - 2 unidades) |
| **15:54:05** | **`purchase`** | `/checkout/cash-success` | Compra completada - Orden #395 |
| 15:54:10 | `begin_checkout` | `/checkout/cash-success` | Evento duplicado post-compra |
| 15:54:17 | `page_view` | `/` (Home) | Regreso a home después de compra |

### Diagrama del Funnel

```
Home (15:49:17)
    │
    ▼
Search (15:49:40)
    │
    ▼
Add to Cart (15:51:48) ◄── Producto encontrado vía búsqueda
    │
    ▼
Checkout Meta (15:52:17)
    │
    ▼
Begin Checkout (15:52:17)
    │
    ▼
Purchase (15:54:05) ◄── Orden #395 creada
    │
    ▼
Cash Success Page
    │
    ▼
Home (15:54:17)
```

### Métricas del Journey

| Métrica | Valor |
|---------|-------|
| **Duración Total** | 4 min 48 seg |
| **Tiempo hasta Add to Cart** | 2 min 31 seg |
| **Tiempo en Checkout** | 1 min 48 seg |
| **Páginas Visitadas** | 4 (Home, Search, Checkout, Success) |
| **Eventos de Conversión** | 3 (add_to_cart, begin_checkout, purchase) |

---

## 6. Comunicación con Cliente

### WhatsApp Notification

El sistema generó automáticamente un link y mensaje de WhatsApp para coordinación de entrega:

**Número de Contacto**: +54 9 351 341-1796 (negocio)

**Mensaje Generado**:
```
✨ *¡Gracias por tu compra en Pinteya!* 🛍
🤝 Te compartimos el detalle para coordinar la entrega:

*Detalle de Orden:*
• Orden: 395
• Subtotal: $69.001,80
• Envío: $0,00
• Total: $69.001,80

*Datos Personales:*
• Nombre: Liz Pomodoro
• Teléfono: 📞 3515335950

*Productos:*
• Látex Impulso Profesional (Marca: Impulso) x2 - $69.001,80

*Datos de Envío:*
• Dirección: 📍 Juan Nepper 6376, X5021 Córdoba, Argentina 
• Piso/Depto: casa/portón con número 
• Ciudad: Córdoba, Córdoba
• CP: 5000

💳 *Método de pago:* Pago al recibir

✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.
```

**WhatsApp Generated At**: 2026-01-19 15:54:02 UTC

---

## 7. Estado del Sistema

### Order Status History

| Estado | Observación |
|--------|-------------|
| No hay registros | El trigger de historial no capturó cambios |

### Order Notes

| Notas | Observación |
|-------|-------------|
| Sin notas | No hay notas administrativas registradas |

---

## 8. Observaciones y Hallazgos

### Aspectos Positivos

1. **Conversión Rápida**: El cliente completó la compra en menos de 5 minutos
2. **Mobile-First**: Experiencia móvil funcionó correctamente
3. **Búsqueda Efectiva**: El cliente encontró el producto vía search
4. **WhatsApp Integrado**: Mensaje de coordinación generado automáticamente

### Áreas de Mejora Identificadas

1. **Sin tracking de búsqueda**: No se capturó qué término buscó el cliente
2. **Sin product_view**: El cliente no visitó la página del producto
3. **Eventos duplicados**: Múltiples page_views en el mismo segundo
4. **User_id no vinculado**: Los eventos de analytics no tienen el user_id del cliente
5. **Sin historial de estados**: El trigger de order_status_history no funcionó

---

## 9. Datos Técnicos Completos

### Payload de la Orden (JSON)

```json
{
  "id": 395,
  "user_id": "10867c19-c1b1-4ace-a7d2-913c156ccccb",
  "total": "69001.80",
  "status": "processing",
  "payment_id": null,
  "shipping_address": {
    "zip_code": "5000",
    "apartment": "casa/portón con número",
    "city_name": "Córdoba",
    "state_name": "Córdoba",
    "street_name": "Juan Nepper 6376, X5021 Córdoba, Argentina",
    "street_number": ""
  },
  "created_at": "2026-01-19 15:54:02.34662+00",
  "updated_at": "2026-01-19 17:12:58.687312+00",
  "external_reference": "395",
  "payer_info": {
    "name": "Liz",
    "email": "335950@temp.metacheckout.local",
    "phone": "3515335950",
    "surname": "Pomodoro",
    "order_number": "395",
    "payment_method": "cash"
  },
  "payment_status": "cash_on_delivery",
  "order_number": "395",
  "payment_method": "cash",
  "fulfillment_status": "unfulfilled"
}
```

### Evento de Purchase (Analytics)

```json
{
  "id": 27400,
  "event_type": 8,
  "event_name": "purchase",
  "session_hash": 1401164511,
  "page_id": 41,
  "page_path": "/checkout/cash-success",
  "browser_id": 5,
  "device_type": "mobile",
  "created_at": 1768838496,
  "label": "395",
  "value": "69001.80",
  "product_id": 395,
  "metadata": {
    "items": [
      {
        "price": 34500.9,
        "item_id": "108",
        "quantity": 2,
        "item_name": "Látex Impulso Profesional",
        "item_category": "Producto"
      }
    ],
    "value": 69001.8,
    "currency": "ARS",
    "shipping": 0,
    "timestamp": 1768838495424,
    "transaction_id": "395"
  }
}
```

---

## 10. Recomendaciones

1. **Contactar al cliente** vía WhatsApp para coordinar entrega
2. **Verificar stock** del producto (15 unidades disponibles, 2 vendidas)
3. **Actualizar estado** a `shipped` cuando se despache
4. **Revisar triggers** de order_status_history para futuras órdenes
5. **Implementar tracking de búsqueda** para entender comportamiento

---

*Documento generado automáticamente por el sistema de análisis de Pinteya E-commerce*
