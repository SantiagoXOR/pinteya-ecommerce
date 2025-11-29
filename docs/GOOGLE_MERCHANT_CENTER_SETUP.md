# Configuración de Google Merchant Center

Esta guía te ayudará a configurar el feed XML de productos para Google Merchant Center y conectar tu tienda con Google Shopping.

## 📋 Requisitos Previos

- Cuenta de Google Merchant Center creada
- Sitio web verificado en Google Merchant Center
- Productos activos en tu tienda

## 🔗 URL del Feed XML

El feed XML está disponible en la siguiente URL:

```
https://www.pinteya.com/api/google-merchant/feed.xml
```

O si estás en desarrollo:

```
http://localhost:3000/api/google-merchant/feed.xml
```

## 📝 Campos Incluidos en el Feed

El feed incluye todos los campos requeridos y recomendados por Google Merchant Center:

### Campos Requeridos ✅
- `g:id` - ID único del producto (o variante)
- `g:title` - Nombre del producto
- `g:description` - Descripción del producto (máximo 5000 caracteres)
- `g:link` - URL del producto en tu sitio
- `g:image_link` - URL de la imagen principal
- `g:price` - Precio con moneda (formato: "5000.00 ARS")
- `g:availability` - Disponibilidad ("in stock" o "out of stock")
- `g:condition` - Condición del producto ("new")

### Campos Recomendados ⭐
- `g:brand` - Marca del producto
- `g:google_product_category` - Categoría según taxonomía de Google
- `g:product_type` - Categoría personalizada
- `g:color` - Color (si aplica a la variante)
- `g:mpn` - Número de parte del fabricante (si está disponible)
- `g:additional_image_link` - Imágenes adicionales (hasta 10)

## 🚀 Pasos para Configurar en Google Merchant Center

### Paso 1: Acceder a Google Merchant Center

1. Ve a [https://merchants.google.com/](https://merchants.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu cuenta de Merchant Center

### Paso 2: Crear un Nuevo Feed

1. En el menú lateral, ve a **Productos** → **Feeds**
2. Haz clic en el botón **"+"** o **"Añadir feed"**
3. Selecciona tu país y idioma

### Paso 3: Configurar el Feed

1. **Nombre del feed**: Ingresa un nombre descriptivo (ej: "Pinteya - Feed Principal")
2. **Tipo de entrada**: Selecciona **"Añadir productos desde un archivo"**
3. **Método de carga**: Selecciona **"Introduce un enlace a tu archivo"**
4. **URL del archivo**: Ingresa la URL de tu feed:
   ```
   https://www.pinteya.com/api/google-merchant/feed.xml
   ```
5. **Programación**: Selecciona **"Diariamente"** o **"Cada hora"** según tus necesidades

### Paso 4: Verificar el Feed

1. Haz clic en **"Continuar"**
2. Google procesará el feed y mostrará un resumen
3. Revisa los productos detectados
4. Si hay errores, corrígelos antes de continuar

### Paso 5: Sincronización Automática

Una vez configurado, Google Merchant Center:
- Actualizará automáticamente el feed según la programación seleccionada
- Verificará que los productos cumplan con las políticas de Google
- Mostrará los productos en Google Shopping cuando estén aprobados

## ⚙️ Configuración del Feed

### Variables de Entorno

El feed utiliza las siguientes variables de entorno:

```env
NEXT_PUBLIC_SITE_URL=https://www.pinteya.com
```

### Filtros Aplicados

El feed incluye automáticamente:
- ✅ Solo productos activos (`is_active = true`)
- ✅ Solo productos que NO están excluidos del feed (`exclude_from_meta_feed != true`)
- ✅ Solo variantes activas de productos

### Límites

- Máximo de productos: 10,000
- Máximo de imágenes adicionales por producto: 10
- Longitud máxima de descripción: 5,000 caracteres

## 🔍 Verificación del Feed

### Probar el Feed Localmente

1. Inicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre en tu navegador:
   ```
   http://localhost:3000/api/google-merchant/feed.xml
   ```

3. Verifica que el XML se muestre correctamente

### Validar el Feed con Google

1. En Google Merchant Center, ve a **Productos** → **Feeds**
2. Haz clic en tu feed
3. Revisa la sección **"Diagnósticos"** para ver errores o advertencias
4. Corrige cualquier problema reportado

## 📊 Categorías de Google Product Taxonomy

El feed mapea automáticamente tus categorías a la taxonomía de Google:

- **Pinturas** → `Home & Garden > Decor > Home Decor`
- **Herramientas** → `Hardware > Tools`
- **Accesorios** → `Home & Garden > Decor > Home Decor`
- **Ferretería** → `Hardware`
- **Corralón** → `Home & Garden`

Si necesitas categorías más específicas, puedes actualizar la función `getGoogleProductCategory` en el archivo del feed.

## 🛠️ Solución de Problemas

### El feed no se carga

1. Verifica que la URL sea accesible públicamente
2. Asegúrate de que el servidor esté funcionando
3. Revisa los logs del servidor para errores

### Productos no aparecen

1. Verifica que los productos estén activos
2. Asegúrate de que no estén excluidos del feed
3. Revisa que tengan precio y stock configurados
4. Verifica que las imágenes sean accesibles

### Errores de formato

1. Revisa que todos los campos requeridos estén presentes
2. Verifica que los precios tengan el formato correcto: "5000.00 ARS"
3. Asegúrate de que las URLs sean absolutas y accesibles

## 🔗 Vincular con Google Ads

Una vez que tu feed esté configurado y aprobado:

1. Ve a [Google Ads](https://ads.google.com/)
2. En **Herramientas y configuración** → **Configuración de la cuenta**
3. Busca **"Google Merchant Center"**
4. Haz clic en **"Vincular"**
5. Selecciona tu cuenta de Merchant Center

Ahora podrás crear campañas de Shopping que mostrarán tus productos directamente en Google.

## 📚 Recursos Adicionales

- [Documentación oficial de Google Merchant Center](https://support.google.com/merchants)
- [Especificación del formato de feed](https://support.google.com/merchants/answer/7052112)
- [Taxonomía de productos de Google](https://www.google.com/basepages/producttype/taxonomy.es-ES.txt)

## ✅ Checklist de Configuración

- [ ] Feed XML accesible en la URL correcta
- [ ] Feed configurado en Google Merchant Center
- [ ] Feed procesado sin errores
- [ ] Productos aprobados en Merchant Center
- [ ] Cuenta vinculada con Google Ads (opcional)
- [ ] Campaña de Shopping creada (opcional)

---

**Última actualización**: Noviembre 2025

