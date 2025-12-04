# Workflow Completo de Imágenes - Pinteya E-commerce

## 🎯 Resumen del Proceso

Este documento describe el workflow completo para descargar, editar profesionalmente y subir imágenes de productos a Pinteya E-commerce usando Photoshop y Supabase Storage.

---

## 📋 Prerrequisitos

### **Software Necesario**

- Node.js (v16 o superior)
- Adobe Photoshop (2020 o superior)
- Git (para control de versiones)

### **Configuración del Proyecto**

```bash
# Instalar dependencias
npm install

# Verificar variables de entorno
# Asegúrate de que .env.local contenga:
# NEXT_PUBLIC_SUPABASE_URL=tu_url
# SUPABASE_SERVICE_ROLE_KEY=tu_key
```

---

## 🚀 Proceso Paso a Paso

### **Paso 1: Configurar Almacenamiento**

```bash
# Configurar Supabase Storage
node scripts/setup-storage.js
```

**¿Qué hace este script?**

- ✅ Crea bucket público 'product-images'
- ✅ Configura estructura de carpetas por marca
- ✅ Establece políticas de acceso
- ✅ Genera URLs de ejemplo

**Resultado esperado:**

```
✅ Bucket creado: product-images
✅ Carpetas creadas: plavicon/, petrilac/, poxipol/, sinteplast/, galgo/, genericos/
✅ Políticas configuradas
```

---

### **Paso 2: Descargar Imágenes Originales**

```bash
# Descargar todas las imágenes actuales
node scripts/download-product-images.js
```

**¿Qué hace este script?**

- 📥 Descarga imágenes desde URLs actuales
- 📁 Organiza por marca en `/downloaded-images/organized/`
- 📊 Genera log detallado de descarga
- ⏱️ Incluye pausas respetuosas entre descargas

**Estructura generada:**

```
/downloaded-images/
├── /organized/
│   ├── /plavicon/          # Productos PLAVICON
│   ├── /petrilac/          # Productos PETRILAC
│   ├── /poxipol/           # Productos POXIPOL
│   ├── /sinteplast/        # Productos SINTEPLAST
│   ├── /galgo/             # Productos GALGO
│   └── /genericos/         # Productos genéricos
└── download-log.json       # Log detallado
```

---

### **Paso 3: Edición Profesional en Photoshop**

**📖 Consultar:** `docs/image-editing-standards.md`

#### **Configuración de Photoshop**

1. **Nuevo Documento**: 800x800px, 72 DPI, sRGB
2. **Capas Organizadas**: Fondo, Producto, Sombra, Branding
3. **Espacio de Trabajo**: Optimizado para web

#### **Proceso de Edición**

```
1. 🖼️ PREPARACIÓN
   - Abrir imagen original
   - Crear documento 800x800px
   - Configurar capas base

2. ✂️ RECORTE Y COMPOSICIÓN
   - Recortar producto con precisión
   - Centrar con márgenes uniformes
   - Fondo blanco puro (#FFFFFF)

3. 🎨 CORRECCIÓN DE COLOR
   - Ajustar niveles y curvas
   - Saturación natural (+5 a +15)
   - Balance de color correcto

4. ⚡ OPTIMIZACIÓN
   - Nitidez: Máscara de enfoque
   - Reducción de ruido si necesario
   - Sombra sutil (opcional)

5. 🏷️ BRANDING (Opcional)
   - Watermark Pinteya (30-40% opacidad)
   - Badge de calidad
   - Elementos de marca
```

#### **Exportación**

```
FORMATO PRINCIPAL: WebP
- Calidad: 80-85%
- Método: Lossy
- Esfuerzo: 6

FORMATO FALLBACK: JPEG
- Calidad: 85-90%
- Progresivo: Sí
- Espacio: sRGB
```

#### **Organización de Archivos Editados**

```
/edited-images/
├── /plavicon/
│   ├── plavipint-techos-poliuretanico-20l-plavicon.webp
│   ├── plavipint-techos-poliuretanico-20l-plavicon.jpg
│   └── ...
├── /petrilac/
├── /poxipol/
├── /sinteplast/
├── /galgo/
└── /genericos/
```

---

### **Paso 4: Optimizar Imágenes (NUEVO)**

```bash
# Optimizar imágenes PNG a WebP/JPEG
npm run images:optimize
```

**¿Qué hace este script?**

- 🔄 Convierte PNG a WebP (85% calidad) y JPEG (90% calidad)
- 📐 Redimensiona a 800x800px exactos
- ⚡ Optimiza para web con Sharp
- 📁 Organiza en `/optimized-images/` por marca
- 📊 Genera log de optimización

**Beneficios de la optimización:**

- **WebP**: 60-70% menor tamaño que PNG
- **JPEG**: Fallback universal para navegadores antiguos
- **Performance**: Carga ultra-rápida
- **Calidad**: Sin pérdida visual perceptible

**Resultado esperado:**

```
✅ 38 imágenes optimizadas
📦 WebP: 1.43 MB total
📦 JPEG: 2.51 MB total
📁 Organizadas en /optimized-images/
```

---

### **Paso 5: Subir Imágenes Optimizadas**

```bash
# Subir imágenes optimizadas y actualizar base de datos
npm run images:upload
```

**¿Qué hace este script?**

- 🎯 **Prioriza** imágenes de `/optimized-images/` sobre `/edited-images/`
- 📤 Sube archivos WebP y JPEG a Supabase Storage
- 🔄 Actualiza URLs en base de datos (WebP como principal)
- 📊 Genera log de subida
- ✅ Verifica integridad del proceso

**Nota importante:** El script automáticamente usa las imágenes optimizadas si están disponibles, garantizando la mejor performance.

**Resultado esperado:**

```
✅ 42 productos actualizados
📤 Imágenes subidas a Storage
🔄 URLs actualizadas en BD
🌐 Nuevas imágenes activas en e-commerce
```

---

## 📊 Verificación y Control de Calidad

### **Checklist Post-Upload**

```
□ Todas las imágenes se cargan correctamente
□ Tamaños optimizados (< 150KB)
□ Formato WebP con fallback JPEG
□ Consistencia visual entre productos
□ Branding aplicado correctamente
□ URLs públicas funcionando
□ Performance no degradada
```

### **Testing en Frontend**

```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar en:
# - Página principal (/)
# - Tienda (/shop-with-sidebar)
# - Detalles de producto (/shop-details)
```

---

## 🔧 Scripts Disponibles

| Script              | Comando                                   | Descripción                  |
| ------------------- | ----------------------------------------- | ---------------------------- |
| **Setup Storage**   | `node scripts/setup-storage.js`           | Configura Supabase Storage   |
| **Download Images** | `node scripts/download-product-images.js` | Descarga imágenes originales |
| **Upload Images**   | `node scripts/upload-edited-images.js`    | Sube imágenes editadas       |

---

## 📁 Estructura de Archivos

```
pinteya-ecommerce/
├── /scripts/
│   ├── setup-storage.js           # Configuración Storage
│   ├── download-product-images.js # Descarga imágenes
│   └── upload-edited-images.js    # Subida imágenes
├── /docs/
│   ├── image-editing-standards.md # Estándares Photoshop
│   └── image-workflow-complete.md # Este documento
├── /downloaded-images/             # Imágenes originales
│   └── /organized/                 # Por marca
├── /edited-images/                 # Imágenes editadas
│   ├── /plavicon/
│   ├── /petrilac/
│   └── .../
├── download-log.json              # Log de descarga
└── upload-log.json                # Log de subida
```

---

## 🚨 Solución de Problemas

### **Error: Bucket no encontrado**

```bash
# Ejecutar setup nuevamente
node scripts/setup-storage.js
```

### **Error: Variables de entorno**

```bash
# Verificar .env.local
cat .env.local | grep SUPABASE
```

### **Error: Permisos de Storage**

1. Ir a Supabase Dashboard
2. Storage > Policies
3. Verificar políticas públicas

### **Imágenes no se cargan**

1. Verificar URLs en base de datos
2. Comprobar políticas de CORS
3. Validar formato de archivos

---

## 📈 Métricas de Éxito

### **Performance**

- ⚡ Tiempo de carga < 2 segundos
- 📦 Tamaño promedio < 100KB
- 🎯 Core Web Vitals optimizados

### **Calidad**

- 🎨 Consistencia visual 100%
- 📱 Responsive en todos los dispositivos
- ♿ Accesibilidad mantenida

### **SEO**

- 🏷️ Alt tags descriptivos
- 📊 Structured data actualizado
- 🔍 Imágenes indexables

---

## 🔄 Mantenimiento Futuro

### **Agregar Nuevos Productos**

1. Descargar imagen del producto
2. Editar según estándares
3. Subir usando script de upload
4. Verificar en frontend

### **Actualizar Imágenes Existentes**

1. Editar imagen mejorada
2. Mantener mismo nombre de archivo
3. Re-subir (sobrescribirá automáticamente)
4. Verificar cache del navegador

### **Backup de Imágenes**

- 💾 Storage automático en Supabase
- 📁 Mantener archivos editados localmente
- ☁️ Backup adicional recomendado

---

## 🎉 Resultado Final

Al completar este workflow tendrás:

✅ **Imágenes Profesionales**: Editadas según estándares enterprise
✅ **Performance Optimizada**: Formatos WebP + JPEG, tamaños optimizados  
✅ **Almacenamiento Propio**: Control total sobre las imágenes
✅ **Escalabilidad**: Proceso repetible para futuros productos
✅ **Branding Consistente**: Identidad visual unificada
✅ **SEO Optimizado**: Imágenes indexables y accesibles

**¡Tu e-commerce ahora tiene imágenes de nivel profesional!** 🚀

---

_Última actualización: Junio 2025_
_Versión: 1.0_
