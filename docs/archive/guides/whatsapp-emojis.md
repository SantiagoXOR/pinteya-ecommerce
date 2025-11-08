# Guía Reutilizable: Emojis en mensajes de WhatsApp

Objetivo: asegurar que los emojis se rendericen y lleguen bien cuando construyes mensajes multi‑línea y los envías por WhatsApp desde web o apps.

## Patrón General

- Asigna emojis de forma dinámica y usa un set “seguro”.
- Construye el mensaje como array de líneas y `join("\n")` para saltos.
- Sanitiza el texto para WhatsApp eliminando caracteres problemáticos.
- Codifica la URL con `encodeURIComponent`.
- Usa número en formato `E.164` y endpoint correcto.

## Utilidades Reusables

```ts
// Evita combinaciones que pueden romperse al codificar URL o en clientes antiguos
export function sanitizeForWhatsApp(input: string) {
  return input
    .replace(/\uFE0F/g, "")  // Variation Selector-16 (emoji presentation)
    .replace(/\u200D/g, ""); // Zero Width Joiner (ZWJ)
}

// Genera URL de WhatsApp con o sin mensaje (API móvil/desktop)
export const WHATSAPP_NUMBER_E164 = "5493704069592"; // Ajusta a tu proyecto

export function getWhatsAppUrl(message?: string) {
  if (message && message.trim().length > 0) {
    const text = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER_E164}&text=${text}`;
  }
  // Link simple para abrir chat sin texto
  return `https://wa.me/${WHATSAPP_NUMBER_E164}`;
}

// Opcional: set de emojis "seguros" (sin ZWJ y con mínima dependencia de VS16)
export const EMOJIS = {
  moto: "🏍️", // si se sanitiza quedará "🏍" (sigue siendo válido)
  auto: "🚗",
  telefono: "📞",
  dinero: "💸",
  ubicacion: "📍",
  reloj: "⏱️", // se degrada a "⏱" si se sanitiza
  check: "✅",
  nota: "📝",
  email: "✉️", // ¡OJO! tras sanitizar puede quedar como "✉" (dingbat)
};
```

## Construcción del Mensaje

```ts
function buildCreditMessage({
  tipoVehiculo, // 'moto' | 'auto'
  nombre,
  apellido,
  dni,
  telefono,
  email,
  ingresos,
  zonaTexto,
  marcaTexto,
  modelo,
  cuotas,
  comentarios,
}: {
  tipoVehiculo: "moto" | "auto";
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  ingresos: number;
  zonaTexto: string;
  marcaTexto: string;
  modelo: string;
  cuotas: number;
  comentarios?: string;
}) {
  const vehiculoEmoji = tipoVehiculo === "moto" ? EMOJIS.moto : EMOJIS.auto;
  const tipoVehiculoTexto = tipoVehiculo === "moto" ? "Moto" : "Auto";

  const lines = [
    `✨ *Solicitud de Crédito – ${tipoVehiculoTexto}* ${vehiculoEmoji}`,
    "",
    `*👤 Datos Personales:*`,
    `• Nombre: ${nombre} ${apellido}`,
    `• DNI/CUIT: ${dni}`,
    `• Teléfono: ${EMOJIS.telefono} ${telefono}`,
    `• Email: ${EMOJIS.email} ${email}`,
    `• Ingresos: ${EMOJIS.dinero} $${ingresos.toLocaleString("es-AR")}`,
    `• Zona: ${EMOJIS.ubicacion} ${zonaTexto}`,
    "",
    `*${vehiculoEmoji} ${tipoVehiculoTexto} de Interés:*`,
    `• Marca: ${marcaTexto}`,
    `• Modelo: ${modelo}`,
    `• Cuotas: ${EMOJIS.reloj} ${cuotas} meses`,
    "",
    ...(comentarios ? [`*${EMOJIS.nota} Comentarios:*`, `${comentarios}`, ""] : []),
    `${EMOJIS.check} Gracias por tu interés. 📲 Nuestro equipo te contactará en las próximas horas.`,
  ];

  // Limpieza para compatibilidad amplia
  return sanitizeForWhatsApp(lines.join("\n"));
}
```

## Envío por WhatsApp

```ts
export function sendCreditWhatsApp(payload: Parameters<typeof buildCreditMessage>[0]) {
  const msg = buildCreditMessage(payload);
  const url = getWhatsAppUrl(msg);
  window.open(url, "_blank");
}
```

## Buenas Prácticas

- Usa emojis “simples”: evita familia/parejas/género/tonos de piel (requieren ZWJ y VS16).
- Acepta la degradación: al quitar `\uFE0F`/`\u200D`, algunos emojis pasan a texto (ej. `✉️` → `✉`). Si te molesta, reemplázalo por alternativas como `📧`/`📩`.
- Siempre `encodeURIComponent` del texto completo; no codifiques línea por línea.
- Genera mensajes multi‑línea con `\n`; WhatsApp respeta saltos en móvil y desktop.
- Usa número `E.164` (ej. `549XXXXXXXXXX`) para máxima compatibilidad.
- `api.whatsapp.com/send?...` cuando incluyes texto; `wa.me/<number>` para abrir chat sin texto.

## Checklist de Compatibilidad

- ¿El mensaje final pasa por `sanitizeForWhatsApp`?
- ¿El texto está codificado con `encodeURIComponent` antes de construir la URL?
- ¿El número está en `E.164` correcto?
- ¿Probaste en Android/iOS y en desktop (WhatsApp Web)?
- ¿Evitaste ZWJ (👩‍💻, 👨‍👩‍👧‍👦) y combinaciones complejas?

## Problemas Frecuentes y Fix

- “Se ve un cuadrado/□”: el sistema/versión no tiene ese emoji. Cambia a otro más compatible (ej. `✉️` → `📧`).
- “El texto se corta o no llega”: revisa `encodeURIComponent`, que no falte `&text=` y que no exceda el límite de caracteres de WhatsApp.
- “Emoji no se ve en desktop”: valida en WhatsApp Web; si falla, reemplázalo por un icono alternativo.
- “Sale como texto y no emoji”: por quitar VS16 (`\uFE0F`). Decide si prefieres compatibilidad (texto) o presentación emoji; si quieres mantener emoji, no sanitices ese carácter específico para ese ícono.

## Ejemplo Completo de Uso

```ts
// Ejemplo de payload (adaptar a tu app)
sendCreditWhatsApp({
  tipoVehiculo: "moto",
  nombre: "Ana",
  apellido: "Pérez",
  dni: "12.345.678",
  telefono: "+54 9 370 4069592",
  email: "ana@example.com",
  ingresos: 350000,
  zonaTexto: "Resistencia (Chaco)",
  marcaTexto: "Yamaha",
  modelo: "FZ-S",
  cuotas: 12,
  comentarios: "Quisiera conocer tasas y fecha de entrega.",
});
```

## Notas al Portar a Otro Proyecto

- Centraliza `sanitizeForWhatsApp` y `getWhatsAppUrl` en `lib/utils.ts`.
- Define `EMOJIS` en un módulo compartido para controlar compatibilidad.
- Si tu marca requiere iconografía consistente, considera reemplazar emojis problemáticos por texto simple o emojis alternativos.
- Prueba con usuarios reales en las plataformas objetivo (Android/iOS/desktop).

---

Este documento está pensado para copiar y pegar; adapta nombres y rutas a tu arquitectura.