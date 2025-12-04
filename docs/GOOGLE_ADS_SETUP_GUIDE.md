# Guía Completa: Configuración de Google Ads para Pinteya

## 📊 Resumen

Esta guía te llevará paso a paso para configurar Google Ads para Pinteya, aprovechando la infraestructura existente de Google Analytics 4 que ya está implementada en el sitio.

---

## 🎯 Objetivo

Configurar Google Ads con tracking completo de conversiones para medir el ROI de las campañas publicitarias y optimizar el gasto en publicidad.

---

## 📋 Prerrequisitos

- Cuenta de Google (preferiblemente la misma que usa Google Analytics)
- Google Analytics 4 configurado (G-MN070Y406E) ✅ Ya configurado
- Sitio web en producción
- Método de pago (tarjeta de crédito/débito)

---

## Paso 1: Crear Cuenta de Google Ads

### 1.1 Acceder a Google Ads

1. Ve a [https://ads.google.com/](https://ads.google.com/)
2. Inicia sesión con tu cuenta de Google (preferiblemente la misma que usa Google Analytics)
3. Si es tu primera vez, haz clic en **"Empezar"**

### 1.2 Configuración Inicial

Completa el formulario de registro:

- **País:** Argentina
- **Zona horaria:** (GMT-03:00) Buenos Aires
- **Moneda:** ARS (Pesos Argentinos)
- **Objetivo de la campaña:** Selecciona "Obtener más llamadas, visitas o ventas en tu sitio web"

### 1.3 Configurar Método de Pago

1. Agrega tu tarjeta de crédito o débito
2. Configura el límite de gasto diario (recomendado: ARS 5,000-10,000 para empezar)
3. Completa la verificación de pago

---

## Paso 2: Vincular Google Analytics con Google Ads

### 2.1 Acceder a la Configuración

1. En Google Ads, ve a **Herramientas y configuración** (icono de llave inglesa) → **Configuración** → **Configuración de la cuenta**
2. Busca la sección **"Google Analytics"**
3. Haz clic en **"Vincular"**

### 2.2 Seleccionar Propiedad de Analytics

1. Selecciona tu propiedad de Google Analytics: **G-MN070Y406E**
2. Haz clic en **"Vincular"**
3. Activa las siguientes opciones:
   - ✅ **"Importar datos de conversión de Google Analytics"**
   - ✅ **"Habilitar la creación automática de etiquetas"**

### 2.3 Verificar Vinculación

1. Ve a **Herramientas y configuración** → **Conversiones**
2. Deberías ver las conversiones importadas desde GA4 (esto puede tardar hasta 24 horas)

---

## Paso 3: Configurar Conversiones en Google Ads

### 3.1 Importar Conversiones desde GA4

1. En Google Ads, ve a **Herramientas y configuración** → **Conversiones**
2. Haz clic en **"+"** para crear una nueva acción de conversión
3. Selecciona **"Importar"** → **"Google Analytics 4"**
4. Selecciona las siguientes conversiones para importar:

#### Conversión Principal: Purchase (Compra Completada)
- **Evento:** `purchase`
- **Categoría:** Compra
- **Valor:** Sí (usar valor de la conversión)
- **Contar:** Una (cada compra cuenta como 1 conversión)
- **Ventana de atribución:** 30 días
- **Ventana de observación:** 30 días

#### Conversión Secundaria: Add to Cart (Agregar al Carrito)
- **Evento:** `add_to_cart`
- **Categoría:** Compra
- **Valor:** Sí
- **Contar:** Cada (cada vez que se agrega al carrito)
- **Ventana de atribución:** 7 días
- **Ventana de observación:** 7 días

#### Conversión Secundaria: Begin Checkout (Iniciar Checkout)
- **Evento:** `begin_checkout`
- **Categoría:** Compra
- **Valor:** Sí
- **Contar:** Cada
- **Ventana de atribución:** 7 días
- **Ventana de observación:** 7 días

### 3.2 Configurar Google Ads Conversion Tracking (Opcional pero Recomendado)

Para mayor precisión en la atribución, también puedes configurar el tag de Google Ads directamente:

1. En Google Ads, ve a **Herramientas y configuración** → **Conversiones**
2. Haz clic en **"+"** → **"Web"**
3. Configura:
   - **Categoría:** Compra
   - **Valor:** Usar diferentes valores para cada conversión
   - **Contar:** Una
   - **Ventana de atribución:** 30 días
4. Copia el **Conversion ID** y el **Conversion Label**
5. Agrégalos a tu archivo `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=XXXXXXXXX
   ```

> **Nota:** El código ya está preparado para usar estos valores. Solo necesitas configurarlos en Google Ads y agregar las variables de entorno.

---

## Paso 4: Crear tu Primera Campaña

### 4.1 Tipo de Campaña Recomendada: Búsqueda

Para e-commerce, empezamos con una campaña de **Búsqueda** que muestra anuncios cuando los usuarios buscan tus productos.

1. En Google Ads, haz clic en **"+ Nueva campaña"**
2. Selecciona **"Ventas"** como objetivo
3. Selecciona **"Búsqueda"** como tipo de campaña

### 4.2 Configuración Básica

**Nombre de la campaña:** `Pinteya - Búsqueda - Productos`

**Configuración de redes:**
- ✅ **Google Search** (activado)
- ❌ **Search partners** (desactivar inicialmente)
- ❌ **Display Network** (desactivar inicialmente)

**Ubicaciones:**
- Selecciona **Argentina** (o ciudades específicas como Buenos Aires, Córdoba, etc.)
- Opciones de ubicación: **Presencia o interés**

**Idioma:**
- **Español**

**Presupuesto diario:**
- Recomendado inicial: **ARS 5,000 - 10,000**
- Puedes ajustar después según resultados

### 4.3 Audiencias

Agrega audiencias de observación (no restringen, solo observan):

- **Compradores en línea**
- **Compradores de productos para el hogar**
- **Compradores de productos de mejoras para el hogar**

### 4.4 Estrategia de Ofertas

**Para empezar:**
- Selecciona **"Maximizar conversiones"**

**Después de 15-30 conversiones:**
- Cambia a **"Pago por conversión objetivo"**
- Establece un CPA objetivo basado en tus resultados

---

## Paso 5: Crear Grupos de Anuncios y Palabras Clave

### 5.1 Crear Grupo de Anuncios

**Nombre del grupo:** `Productos - Pinturas`

### 5.2 Palabras Clave

Agrega palabras clave en **modo de concordancia amplia** inicialmente:

```
pintura latex
pintura para paredes
comprar pintura online
pintura precio
pintura alba
pintura interior
pintura exterior
pintura blanca
pintura color
pintura económica
pintura calidad
pintura marcas
```

**Tipos de concordancia:**
- **Amplia:** `pintura latex` (más alcance, menos precisión)
- **Frase:** `"pintura latex"` (debe contener la frase exacta)
- **Exacta:** `[pintura latex]` (solo coincidencias exactas)

**Recomendación:** Empieza con **amplia** y ajusta según resultados.

### 5.3 Crear Anuncios de Texto

Crea 3-5 variaciones de anuncios para probar cuál funciona mejor:

**Ejemplo 1:**
```
Título 1: Pinturas de Calidad | Pinteya
Título 2: Envío Gratis en Compras +$10.000
Título 3: Amplio Catálogo de Colores

Descripción 1: Encuentra la pintura perfecta para tu hogar. 
Envío gratis, precios competitivos y asesoramiento profesional.

Descripción 2: Compra pinturas online con envío a todo el país. 
Variedad de marcas y colores. ¡Compra ahora!

URL de destino: https://tudominio.com/products
```

**Ejemplo 2:**
```
Título 1: Pinturas Online | Pinteya
Título 2: Mejores Precios del Mercado
Título 3: Envío Rápido y Seguro

Descripción 1: Tu tienda online de pinturas. Miles de productos 
disponibles. Pago seguro y envío a domicilio.

Descripción 2: Pinturas de las mejores marcas. Asesoramiento 
gratuito. Compra ahora y recibe en 24-48 horas.

URL de destino: https://tudominio.com/products
```

### 5.4 Extensiones de Anuncios

**Extensiones de sitio (recomendado):**
- Enlace 1: "Ver Catálogo" → `https://tudominio.com/products`
- Enlace 2: "Ofertas Especiales" → `https://tudominio.com/products?filter=on-sale`
- Enlace 3: "Contacto" → `https://tudominio.com/contact`
- Enlace 4: "Envíos" → `https://tudominio.com/shipping`

**Extensiones de llamada:**
- Agrega tu número de WhatsApp o teléfono

**Extensiones de precio (si aplica):**
- Destaca ofertas especiales o descuentos

---

## Paso 6: Configurar Campañas de Shopping (Opcional pero Recomendado)

Las campañas de Shopping muestran tus productos directamente en Google con imágenes, precios y reseñas.

### 6.1 Crear Cuenta de Google Merchant Center

1. Ve a [https://merchants.google.com/](https://merchants.google.com/)
2. Crea una cuenta nueva
3. Verifica tu sitio web
4. Completa la información de la tienda

### 6.2 Crear Feed de Productos

1. En Merchant Center, ve a **Productos** → **Feeds**
2. Crea un nuevo feed
3. Sube tu catálogo de productos en formato XML o CSV

**Campos requeridos mínimos:**
- `id` (ID del producto)
- `title` (Nombre del producto)
- `description` (Descripción)
- `link` (URL del producto)
- `image_link` (URL de la imagen)
- `price` (Precio con moneda, ej: "5000 ARS")
- `availability` (in stock / out of stock)

### 6.3 Vincular Merchant Center con Google Ads

1. En Google Ads, ve a **Herramientas y configuración** → **Configuración de la cuenta**
2. Busca **"Google Merchant Center"**
3. Haz clic en **"Vincular"**
4. Selecciona tu cuenta de Merchant Center

### 6.4 Crear Campaña de Shopping

1. En Google Ads, haz clic en **"+ Nueva campaña"**
2. Selecciona **"Ventas"** como objetivo
3. Selecciona **"Shopping"** como tipo
4. Configura:
   - **Presupuesto:** Similar a tu campaña de búsqueda
   - **Estrategia de ofertas:** Empieza con "Pago por clic mejorado" o "Maximizar conversiones"

---

## Paso 7: Configurar Parámetros UTM para Tracking

Los parámetros UTM te permiten identificar qué campañas y anuncios generan más conversiones.

### 7.1 Configuración Automática en Google Ads

1. En la configuración de tu campaña, ve a **"Opciones de seguimiento"**
2. Activa **"Etiquetas de seguimiento"**
3. Google Ads agregará automáticamente parámetros UTM a tus URLs

### 7.2 Formato de URLs con UTM

```
https://tudominio.com/products?utm_source=google&utm_medium=cpc&utm_campaign=pinturas_busqueda&utm_content=anuncio1
```

**Parámetros:**
- `utm_source=google` - Fuente del tráfico
- `utm_medium=cpc` - Medio (costo por clic)
- `utm_campaign=pinturas_busqueda` - Nombre de la campaña
- `utm_content=anuncio1` - Identificador del anuncio

### 7.3 Verificar en Google Analytics

1. Ve a Google Analytics → **Adquisición** → **Campañas**
2. Deberías ver tus campañas de Google Ads listadas
3. Puedes ver qué campañas generan más conversiones

---

## Paso 8: Presupuesto Inicial Recomendado

### 8.1 Presupuesto Diario

**Para empezar:**
- **ARS 5,000 - 10,000 por día**

**Después de 2-4 semanas:**
- Ajusta según resultados
- Si el ROI es positivo, aumenta gradualmente
- Si el ROI es negativo, optimiza antes de aumentar

### 8.2 Presupuesto Mensual Estimado

- **Mínimo inicial:** ARS 150,000
- **Recomendado:** ARS 300,000 - 500,000
- **Objetivo:** 10-20 conversiones en el primer mes para tener datos suficientes para optimizar

### 8.3 Cálculo de ROI

**Fórmula básica:**
```
ROI = (Ingresos - Costo de Publicidad) / Costo de Publicidad × 100
```

**Ejemplo:**
- Gasto en publicidad: ARS 300,000
- Ingresos generados: ARS 1,200,000
- ROI = (1,200,000 - 300,000) / 300,000 × 100 = **300%**

**Objetivo recomendado:** ROI > 200% (3:1 o mejor)

---

## Paso 9: Monitoreo y Optimización

### 9.1 Métricas Clave a Monitorear

#### Click-Through Rate (CTR)
- **Objetivo:** > 3%
- **Qué hacer si está bajo:** Mejora títulos y descripciones de anuncios

#### Costo por Clic (CPC)
- **Monitorear:** Comparar con competencia
- **Qué hacer si es alto:** Refina palabras clave, mejora calidad del anuncio

#### Tasa de Conversión
- **Objetivo:** > 2%
- **Qué hacer si está bajo:** Mejora landing pages, revisa experiencia de usuario

#### Costo por Adquisición (CPA)
- **Calcular:** Presupuesto diario / Conversiones diarias
- **Objetivo:** < 30% del valor promedio de compra

#### ROAS (Retorno sobre Inversión Publicitaria)
- **Objetivo:** > 3:1 (por cada peso invertido, obtener 3 pesos en ventas)
- **Fórmula:** Ingresos / Costo de Publicidad

### 9.2 Revisión Semanal

**Qué revisar cada semana:**

1. **Palabras clave con bajo rendimiento**
   - Pausar palabras clave con CTR < 1% y sin conversiones
   - Aumentar ofertas en palabras clave con conversiones

2. **Anuncios con bajo CTR**
   - Crear nuevas variaciones de anuncios
   - Pausar anuncios con CTR < 2%

3. **Horarios de mayor conversión**
   - Ajustar ofertas por hora del día
   - Aumentar presupuesto en horarios de alta conversión

4. **Dispositivos**
   - Optimizar para móvil (muy importante en Argentina)
   - Ajustar ofertas por dispositivo si hay diferencias significativas

### 9.3 Optimización Continua

**Después de 2 semanas:**
- Analizar qué palabras clave generan conversiones
- Eliminar palabras clave que no generan resultados
- Crear nuevos grupos de anuncios para productos específicos

**Después de 1 mes:**
- Cambiar estrategia de ofertas a "Pago por conversión objetivo"
- Crear campañas de remarketing para visitantes que no compraron
- Probar campañas de Display para aumentar alcance

---

## Paso 10: Configuración Avanzada

### 10.1 Remarketing

Crea audiencias de remarketing para usuarios que visitaron tu sitio pero no compraron:

1. En Google Ads, ve a **Herramientas y configuración** → **Configuración de la cuenta** → **Audiencias**
2. Crea una nueva audiencia:
   - **Tipo:** Visitantes del sitio web
   - **Condición:** Visitantes que no completaron una compra
   - **Duración:** 30 días

3. Crea una campaña de remarketing dirigida a esta audiencia

### 10.2 Audiencias Personalizadas

Crea audiencias basadas en compradores:

1. En Google Analytics, ve a **Administración** → **Audiencias**
2. Crea una audiencia de "Compradores" basada en el evento `purchase`
3. Comparte esta audiencia con Google Ads
4. Crea campañas dirigidas a audiencias similares (Lookalike)

### 10.3 Optimización Automática

**Después de tener suficientes datos (30+ conversiones):**

1. Activa **"Ofertas inteligentes"** en Google Ads
2. Google ajustará automáticamente las ofertas para maximizar conversiones
3. Monitorea los resultados y ajusta según sea necesario

---

## ✅ Checklist de Inicio

Usa este checklist para asegurarte de que todo esté configurado correctamente:

- [ ] Cuenta de Google Ads creada
- [ ] Método de pago configurado
- [ ] Google Analytics vinculado (G-MN070Y406E)
- [ ] Conversiones importadas desde GA4 (purchase, add_to_cart, begin_checkout)
- [ ] Google Ads Conversion Tracking configurado (opcional)
- [ ] Variables de entorno configuradas (NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID)
- [ ] Primera campaña de búsqueda creada
- [ ] 10-15 palabras clave agregadas
- [ ] 3-5 anuncios de texto creados
- [ ] Extensiones de anuncios configuradas
- [ ] Presupuesto diario configurado
- [ ] Campaña activada
- [ ] Parámetros UTM configurados
- [ ] Google Merchant Center configurado (opcional)
- [ ] Campaña de Shopping creada (opcional)

---

## 🐛 Troubleshooting

### Las conversiones no aparecen en Google Ads

1. **Verifica la vinculación:** Asegúrate de que Google Analytics esté vinculado correctamente
2. **Espera 24-48 horas:** Las conversiones importadas desde GA4 pueden tardar en aparecer
3. **Verifica en GA4:** Asegúrate de que los eventos `purchase` se están trackeando correctamente
4. **Revisa la configuración:** Verifica que las conversiones estén marcadas como "Importadas" en Google Ads

### Los anuncios no se muestran

1. **Verifica el presupuesto:** Asegúrate de que el presupuesto diario esté configurado
2. **Revisa las ofertas:** Las ofertas pueden ser muy bajas
3. **Verifica la calidad:** Los anuncios con baja calidad pueden no mostrarse
4. **Revisa las palabras clave:** Pueden ser muy específicas o tener bajo volumen de búsqueda

### El CTR es muy bajo

1. **Mejora los títulos:** Hazlos más atractivos y relevantes
2. **Mejora las descripciones:** Incluye beneficios claros y llamadas a la acción
3. **Revisa las palabras clave:** Asegúrate de que sean relevantes para tus anuncios
4. **Prueba extensiones:** Agrega extensiones de sitio y llamada para aumentar visibilidad

---

## 📚 Recursos Adicionales

- [Google Ads Help Center](https://support.google.com/google-ads)
- [Google Analytics Academy](https://analytics.google.com/analytics/academy/)
- [Google Ads Editor](https://ads.google.com/home/tools/ads-editor/) - Para gestionar campañas offline
- [Google Merchant Center Help](https://support.google.com/merchants)
- [Google Ads Certification](https://skillshop.exceedlms.com/student/path/508763-google-ads-certification) - Curso gratuito

---

## 📧 Soporte

Para preguntas sobre la configuración técnica del tracking, consulta:
- `docs/ANALYTICS_IMPLEMENTATION.md` - Documentación técnica de analytics
- `docs/GOOGLE_ADS_QUICK_START.md` - Guía rápida de inicio

**Fecha de creación:** Enero 2025  
**Versión:** 1.0.0


