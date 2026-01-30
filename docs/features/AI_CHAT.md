# Chat con IA (asistente Luis)

Documentación del chatbot de asesoría de pinturería integrado en el e-commerce. El asistente ayuda a elegir productos según lo que el usuario quiere pintar (interior, exterior, madera, aerosol, complementos, etc.) y muestra recomendaciones en el mismo chat.

---

## Resumen

- **Nombre del asistente (Pintemas):** Luis. Se presenta como "Luis" o "te ayudo desde Pintemas". **Nunca** debe decir "Luis de Pintemas" ni "Como Luis de Pintemas".
- **UI:** Pestaña flotante que abre un panel (Sheet) con la conversación, carrusel de productos y enlace a WhatsApp.
- **Backend:** API que usa Gemini para generar la respuesta y los términos de búsqueda (`suggestedSearch` / `suggestedCategory`). El frontend usa esos términos para llamar a `/api/products` y mostrar productos.
- **Productos:** La tienda ofrece látex, esmaltes, barnices, impregnantes y **aerosoles**. No se debe indicar que "no trabajamos con aerosoles".

---

## Arquitectura

```
Usuario escribe en AIChatPopup
       ↓
POST /api/ai-chat/respond (messages)
       ↓
Prompt = systemPrompt + knowledge-base + catálogo (XML) + conversación
       ↓
Gemini devuelve JSON: { reply, suggestedCategory?, suggestedSearch? }
       ↓
Frontend: si hay suggestedSearch/suggestedCategory → GET /api/products?search=...&category=...
       ↓
Filtrado (excluir reparadores/masillas; priorizar aerosoles si el usuario pidió aerosol)
       ↓
Se muestran mensaje + carrusel de productos; ítems agregables al carrito
```

---

## Archivos principales

| Ruta | Descripción |
|------|-------------|
| `src/app/api/ai-chat/respond/route.ts` | API que construye el prompt, llama a Gemini y devuelve `reply`, `suggestedCategory`, `suggestedSearch`. |
| `src/app/api/ai-chat/models/route.ts` | Lista modelos Gemini disponibles (opcional). |
| `src/components/Common/AIChatPopup/index.tsx` | Panel del chat: mensajes, input, carrusel de productos, carrito, WhatsApp. |
| `src/components/Common/AIChatTab/index.tsx` | Pestaña flotante "Luis \| Pintemas" (o "Asistente \| {tenant}"). |
| `src/app/context/AIChatPopupContext.tsx` | Contexto para abrir/cerrar el chat. |
| `src/lib/ai-chat/knowledge-base.ts` | Base de conocimiento (asesor pinturería + pintor): tipos de pintura, acabados, herramientas. |
| `src/lib/ai-chat/get-product-catalog-summary.ts` | Resumen del catálogo del tenant (nombre, marca, categoría) en texto/XML para el prompt. |
| `src/lib/ai-chat/search-intent-config.ts` | Config centralizada: reglas de fallback (intención → búsqueda), exclusión de productos, chips, límites. |
| `src/lib/ai-chat/ai-chat-logs.ts` | Logs en memoria (últimas 100 solicitudes) para el panel de admin. |
| `src/app/admin/ai-chat/page.tsx` | Página de admin: debug, testing y logs del AI Chat. |
| `src/components/admin/AIChatDebugPanel.tsx` | Componente del panel: test de envío, modelos Gemini, tabla de logs. |
| `src/app/api/admin/ai-chat/logs/route.ts` | API GET (admin): devuelve los últimos logs del AI Chat. |

---

## Panel de admin (debug y logs)

En **Admin → AI Chat Debug** (`/admin/ai-chat`) podés:

- **Test de envío:** enviar un mensaje de prueba al AI Chat y ver `reply`, `suggestedSearch`, `suggestedCategory` y tiempo de respuesta.
- **Modelos Gemini:** listar los modelos disponibles con la clave configurada (GET `/api/ai-chat/models`).
- **Logs recientes:** tabla con las últimas solicitudes al AI Chat (hora, mensaje, reply, suggestedSearch, suggestedCategory, estado, ms, modelo usado). Se actualiza cada 10 s y con "Actualizar".

Los logs se guardan en memoria (últimas 100 entradas) en `lib/ai-chat/ai-chat-logs.ts`; cada llamada a `/api/ai-chat/respond` registra una entrada (éxito o error). La API de logs (`GET /api/admin/ai-chat/logs`) requiere autenticación de administrador.

---

## Identidad del asistente

- Para el tenant **Pintemas**, el asistente se llama **Luis**. En el prompt se indica:
  - Presentarse siempre como "Luis" (nunca "Luis de Pintemas" ni "Como Luis de Pintemas").
  - Decir "soy Luis" o "te ayudo desde Pintemas"; la tienda es Pintemas.
- En otros tenants se usa `asistente de {nombreDelTenant}`.
- En la UI (header del chat y pestaña) se muestra **"Luis | Pintemas"** (nombre del asistente | nombre de la tienda).

---

## Reglas de productos y búsqueda

La API devuelve un JSON con:

- **reply:** texto amigable para el usuario.
- **suggestedCategory:** slug de categoría (opcional).
- **suggestedSearch:** término de búsqueda para `/api/products` (opcional).

Reglas que sigue el prompt para `suggestedSearch`:

| Intención del usuario | suggestedSearch |
|-----------------------|-----------------|
| Aerosol, spray, maceta/maseta con aerosol | `aerosol` o `spray` |
| Interior, paredes interiores | `látex interior` |
| Exterior, frente, fachada | `látex exterior` |
| Madera, muebles, mesa exterior | `pintura madera`, `barniz` o `impregnante` |
| Metal | `esmalte metal` |
| Techos | `pintura techo` |
| Rodillos, pinceles, brochas, cintas, bandejas | `rodillo`, `pincel`, `brocha`, etc. |

No se usan: `reparador`, `reparador de paredes`, `masilla`, `enduido`.

**Aerosoles:** La tienda **sí** trabaja con aerosoles. Si el usuario pide aerosol, spray o pintar maceta con aerosol, el bot debe confirmar que tienen y usar `suggestedSearch` "aerosol" o "spray".

---

## Base de conocimiento y catálogo

- **knowledge-base.ts:** Texto fijo con tipos de pintura (látex interior/exterior, esmalte, madera, metal, techos), acabados, herramientas y consejos. Se inyecta en el system prompt.
- **get-product-catalog-summary.ts:** Obtiene del tenant un resumen de productos (nombre, marca, categoría) y lo formatea en XML para que la IA pueda nombrar productos reales del catálogo.

---

## Frontend: fallback y filtrado

- **Fallback de búsqueda:** Si la API no devuelve `suggestedSearch` o `suggestedCategory`, el frontend deriva la intención del mensaje actual y del contexto (últimos mensajes). Por ejemplo:
  - Si el usuario dice "aerosol", "spray" o "maceta con aerosol", se fuerza `suggestedSearch = 'aerosol'`.
  - Se normalizan términos (ej. "interior" → "látex interior", "madera" → "pintura madera").
- **Prioridad de aerosoles:** Si el usuario pide explícitamente aerosol/spray (por mensaje o contexto), se fuerza búsqueda "aerosol" y en los resultados se **priorizan** productos tipo aerosol/spray.
- **Filtrado:** Se excluyen productos cuyo nombre/slug contenga "reparador", "enduido", "masilla", "sellador". Para búsquedas de látex interior/exterior (sin pedido de aerosol) se priorizan productos no aerosol; cuando el usuario pidió aerosol, se priorizan los aerosoles.

---

## Carrito y WhatsApp

- En el header del chat hay un icono de carrito con la cantidad de ítems del carrito global; al hacer clic se abre el modal lateral del carrito.
- Los productos mostrados en el carrusel se pueden agregar al carrito (mismo flujo que en el resto de la tienda).
- Botón "Ir a WhatsApp" con el número configurado para el tenant.

---

## Variables de entorno

- **GEMINI_API_KEY:** Clave de API de Google AI (Gemini). Sin ella, la API de chat responde con error de servicio no disponible.

---

## Rate limiting

La ruta `/api/ai-chat/respond` usa el límite configurado en `RATE_LIMIT_CONFIGS.aiChat` (ver `lib/rate-limiting`).

---

## Modelos Gemini

Se prueban en orden hasta que uno responda correctamente:

1. `gemini-2.5-flash`
2. `gemini-2.0-flash`
3. `gemini-flash-latest`
4. `gemini-pro-latest`
5. `gemini-2.5-pro`

La respuesta esperada de Gemini es un único objeto JSON con `reply`, `suggestedCategory` y `suggestedSearch` (sin markdown ni texto extra).

---

## Structured Output (respuesta determinista)

La API usa **Structured Outputs** de Gemini para que la respuesta sea siempre JSON válido y predecible:

- **`responseMimeType: "application/json"`** y **`responseJsonSchema`** en `generationConfig`: el modelo devuelve solo JSON que cumple el schema (sin markdown ni texto extra).
- **Temperatura 0.3**: respuestas más deterministas y coherentes.
- **Schema**: `{ reply: string, suggestedCategory?: string | null, suggestedSearch?: string | null }`.

Si el modelo no soporta structured output (p. ej. fallback a un modelo antiguo), se sigue usando `parseGeminiJson` para extraer el JSON del texto (regex de respaldo).

Documentación oficial: [Structured outputs | Gemini API](https://ai.google.dev/gemini-api/docs/structured-output).

---

## Configuración centralizada (intención → búsqueda)

Las reglas de fallback cuando la IA no devuelve categoría/búsqueda están en **`src/lib/ai-chat/search-intent-config.ts`**:

- **Exclusión de productos**: `EXCLUDE_PRODUCT_KEYWORDS` (reparador, enduido, masilla, sellador).
- **Aerosol**: `isAerosolContext(contextText)` para forzar `suggestedSearch = 'aerosol'`.
- **Normalización**: `normalizeSuggestedSearch(suggestedSearch)` para términos canónicos (látex interior, pintura madera, etc.).
- **Fallback de intención**: `getFallbackSuggestedSearch(contextText, currentLower)` aplica `FALLBACK_INTENT_RULES` en orden.
- **Chips de aplicación**: `APPLICATIONS` (Interior, Exterior, Madera, etc.) y constantes de límites (`PRODUCTS_LIMIT`, `PRODUCTS_CAROUSEL_MAX`).

Así se evita duplicar regex y reglas entre backend (prompt) y frontend (fallback); el frontend usa una sola fuente de verdad para el fallback.
