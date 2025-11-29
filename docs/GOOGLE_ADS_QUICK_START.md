# Guía Rápida: Google Ads para Pinteya

## 🚀 Checklist de 10 Pasos Esenciales

Sigue estos pasos en orden para configurar Google Ads rápidamente.

---

### ✅ Paso 1: Crear Cuenta de Google Ads

1. Ve a [https://ads.google.com/](https://ads.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Completa el registro:
   - País: **Argentina**
   - Zona horaria: **(GMT-03:00) Buenos Aires**
   - Moneda: **ARS**
4. Configura método de pago

**⏱️ Tiempo estimado:** 10 minutos

---

### ✅ Paso 2: Vincular Google Analytics

1. En Google Ads: **Herramientas y configuración** → **Configuración** → **Configuración de la cuenta**
2. Busca **"Google Analytics"** → Haz clic en **"Vincular"**
3. Selecciona tu propiedad: **G-MN070Y406E**
4. Activa:
   - ✅ Importar datos de conversión de Google Analytics
   - ✅ Habilitar la creación automática de etiquetas

**⏱️ Tiempo estimado:** 5 minutos

---

### ✅ Paso 3: Importar Conversiones desde GA4

1. En Google Ads: **Herramientas y configuración** → **Conversiones**
2. Haz clic en **"+"** → **"Importar"** → **"Google Analytics 4"**
3. Importa estos eventos:
   - ✅ `purchase` (Principal - Una conversión)
   - ✅ `add_to_cart` (Secundaria - Cada conversión)
   - ✅ `begin_checkout` (Secundaria - Cada conversión)

**⏱️ Tiempo estimado:** 5 minutos

---

### ✅ Paso 4: Configurar Google Ads Conversion Tracking (Opcional)

1. En Google Ads: **Herramientas y configuración** → **Conversiones**
2. **"+"** → **"Web"** → Configura conversión de compra
3. Copia el **Conversion ID** y **Conversion Label**
4. Agrega a `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=XXXXXXXXX
   ```

**⏱️ Tiempo estimado:** 10 minutos

---

### ✅ Paso 5: Crear Primera Campaña de Búsqueda

1. En Google Ads: **"+ Nueva campaña"**
2. Objetivo: **"Ventas"**
3. Tipo: **"Búsqueda"**
4. Configuración:
   - Nombre: `Pinteya - Búsqueda - Productos`
   - Redes: Solo **Google Search**
   - Ubicaciones: **Argentina**
   - Idioma: **Español**
   - Presupuesto diario: **ARS 5,000 - 10,000**

**⏱️ Tiempo estimado:** 10 minutos

---

### ✅ Paso 6: Agregar Palabras Clave

En el grupo de anuncios, agrega estas palabras clave (modo amplio):

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
```

**⏱️ Tiempo estimado:** 5 minutos

---

### ✅ Paso 7: Crear Anuncios de Texto

Crea al menos 3 variaciones de anuncios:

**Ejemplo:**
```
Título 1: Pinturas de Calidad | Pinteya
Título 2: Envío Gratis en Compras +$10.000
Título 3: Amplio Catálogo de Colores

Descripción 1: Encuentra la pintura perfecta para tu hogar. 
Envío gratis, precios competitivos y asesoramiento profesional.

Descripción 2: Compra pinturas online con envío a todo el país. 
Variedad de marcas y colores. ¡Compra ahora!

URL: https://tudominio.com/products
```

**⏱️ Tiempo estimado:** 15 minutos

---

### ✅ Paso 8: Configurar Extensiones

1. **Extensiones de sitio:**
   - "Ver Catálogo" → `/products`
   - "Ofertas Especiales" → `/products?filter=on-sale`
   - "Contacto" → `/contact`

2. **Extensiones de llamada:**
   - Agrega tu número de WhatsApp

**⏱️ Tiempo estimado:** 10 minutos

---

### ✅ Paso 9: Activar Campaña

1. Revisa toda la configuración
2. Haz clic en **"Guardar y continuar"**
3. Activa la campaña
4. Verifica que el presupuesto esté configurado

**⏱️ Tiempo estimado:** 5 minutos

---

### ✅ Paso 10: Configurar Parámetros UTM

1. En la configuración de la campaña: **"Opciones de seguimiento"**
2. Activa **"Etiquetas de seguimiento"**
3. Google Ads agregará automáticamente parámetros UTM

**⏱️ Tiempo estimado:** 2 minutos

---

## 📊 Verificación Rápida

Después de 24-48 horas, verifica:

- [ ] Los anuncios se están mostrando
- [ ] Hay clics en los anuncios
- [ ] Las conversiones aparecen en Google Ads
- [ ] Los datos se ven en Google Analytics

---

## 🎯 Próximos Pasos (Después de 2 Semanas)

1. **Analizar resultados:**
   - Revisa qué palabras clave generan conversiones
   - Identifica anuncios con mejor rendimiento
   - Elimina palabras clave sin resultados

2. **Optimizar:**
   - Ajusta ofertas en palabras clave exitosas
   - Crea nuevos anuncios basados en los mejores
   - Pausa palabras clave con bajo rendimiento

3. **Expandir:**
   - Crea campañas de remarketing
   - Prueba campañas de Shopping (Google Merchant Center)
   - Crea grupos de anuncios para productos específicos

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **[Guía Completa](GOOGLE_ADS_SETUP_GUIDE.md)** - Documentación detallada paso a paso
- **[Analytics Implementation](ANALYTICS_IMPLEMENTATION.md)** - Configuración técnica de tracking

---

## ⚡ Resumen de Tiempo Total

- **Configuración inicial:** ~90 minutos
- **Primera campaña activa:** ~2 horas (incluyendo revisión)
- **Primeros resultados:** 24-48 horas

---

## 🆘 ¿Necesitas Ayuda?

- **Configuración técnica:** Revisa `docs/ANALYTICS_IMPLEMENTATION.md`
- **Problemas con conversiones:** Verifica que GA4 esté trackeando eventos correctamente
- **Anuncios no se muestran:** Revisa presupuesto y ofertas

---

**¡Listo para empezar!** 🚀

Sigue los pasos en orden y tendrás tu primera campaña de Google Ads funcionando en menos de 2 horas.


