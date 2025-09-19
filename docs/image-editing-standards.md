# Estándares de Edición de Imágenes - Pinteya E-commerce

## 📋 Guía Completa para Edición en Photoshop

### 🎯 Objetivos de la Edición

1. **Consistencia Visual**: Todas las imágenes deben tener el mismo estilo y calidad
2. **Optimización Web**: Tamaños y formatos optimizados para carga rápida
3. **Branding**: Incorporar elementos de marca de Pinteya
4. **Profesionalismo**: Apariencia premium y confiable

---

## 📐 Especificaciones Técnicas

### **Dimensiones Estándar**
- **Imagen Principal**: 800x800px (1:1 ratio)
- **Thumbnail**: 400x400px (1:1 ratio)
- **Galería**: 800x800px (1:1 ratio)
- **Resolución**: 72 DPI (web optimized)

### **Formatos de Archivo**
- **Formato Principal**: WebP (mejor compresión)
- **Formato Fallback**: JPEG (compatibilidad)
- **Calidad JPEG**: 85-90%
- **Calidad WebP**: 80-85%

### **Tamaños de Archivo**
- **Imagen Principal**: Máximo 150KB
- **Thumbnail**: Máximo 50KB
- **Galería**: Máximo 150KB

---

## 🎨 Estándares de Diseño

### **Fondo y Composición**
```
✅ HACER:
- Fondo blanco puro (#FFFFFF) o transparente
- Producto centrado en el canvas
- Margen mínimo de 50px en todos los lados
- Sombra sutil y realista (opcional)
- Iluminación uniforme y profesional

❌ EVITAR:
- Fondos con texturas o patrones
- Productos cortados o fuera de encuadre
- Sombras duras o artificiales
- Iluminación desigual
- Elementos distractores
```

### **Colores y Saturación**
```
✅ HACER:
- Colores reales y precisos del producto
- Saturación natural (no oversaturated)
- Contraste adecuado para legibilidad
- Consistencia de temperatura de color

❌ EVITAR:
- Colores irreales o exagerados
- Imágenes desaturadas o apagadas
- Contrastes extremos
- Inconsistencias de color entre productos
```

### **Branding Pinteya**
```
ELEMENTOS OPCIONALES A AGREGAR:
- Watermark sutil de Pinteya (esquina inferior derecha)
- Badge de calidad o certificación
- Indicador de marca original
- Sello de "Producto Auténtico"

PALETA DE COLORES PINTEYA:
- Primario: #D4AF37 (Tahiti Gold)
- Secundario: #1F2937 (Gray 800)
- Acento: #F59E0B (Amber 500)
- Neutro: #F9FAFB (Gray 50)
```

---

## 🔧 Workflow de Edición en Photoshop

### **Paso 1: Preparación**
1. Abrir imagen original
2. Crear nuevo documento 800x800px, 72 DPI
3. Configurar espacio de color sRGB
4. Crear capas organizadas:
   - Fondo
   - Producto
   - Sombra (opcional)
   - Branding (opcional)

### **Paso 2: Recorte y Composición**
1. Usar herramienta de selección (Pluma/Varita mágica)
2. Recortar producto con precisión
3. Centrar en el canvas con márgenes uniformes
4. Ajustar tamaño manteniendo proporciones

### **Paso 3: Corrección de Color**
1. **Niveles**: Ajustar puntos negro, gris y blanco
2. **Curvas**: Refinar contraste y tonos medios
3. **Saturación**: Ajustar naturalmente (+5 a +15)
4. **Balance de Color**: Corregir dominantes de color

### **Paso 4: Mejoras de Calidad**
1. **Nitidez**: Filtro > Enfocar > Máscara de enfoque
   - Cantidad: 80-120%
   - Radio: 1-1.5px
   - Umbral: 2-4
2. **Reducción de Ruido**: Si es necesario
3. **Corrección de Imperfecciones**: Herramienta Tampón/Parche

### **Paso 5: Efectos Opcionales**
1. **Sombra Proyectada**:
   - Opacidad: 15-25%
   - Distancia: 10-15px
   - Desenfoque: 15-20px
   - Color: #000000
2. **Reflejo Sutil** (para productos brillantes)
3. **Viñeta Suave** (muy sutil, 5-10% opacidad)

### **Paso 6: Branding (Opcional)**
1. **Watermark Pinteya**:
   - Posición: Esquina inferior derecha
   - Opacidad: 30-40%
   - Tamaño: 80-100px
2. **Badge de Calidad**:
   - "Producto Original"
   - "Calidad Garantizada"
   - Usar colores de marca

---

## 📁 Organización de Archivos

### **Estructura de Carpetas**
```
/edited-images/
├── /plavicon/
│   ├── /originals/     # PSD files
│   ├── /webp/         # WebP optimized
│   └── /jpeg/         # JPEG fallback
├── /petrilac/
├── /poxipol/
├── /sinteplast/
├── /galgo/
└── /genericos/
```

### **Nomenclatura de Archivos**
```
Formato: [slug-producto].[formato]

Ejemplos:
- plavipint-techos-poliuretanico-20l-plavicon.webp
- barniz-campbell-1l-petrilac.webp
- poximix-interior-5kg-poxipol.webp
```

---

## ⚡ Optimización para Web

### **Exportación WebP**
```
Configuración Photoshop:
- Archivo > Exportar > Exportar como
- Formato: WebP
- Calidad: 80-85
- Método: Lossy
- Esfuerzo: 6 (máxima compresión)
```

### **Exportación JPEG (Fallback)**
```
Configuración Photoshop:
- Archivo > Exportar > Exportar como
- Formato: JPEG
- Calidad: 85-90
- Formato: Progresivo
- Espacio de color: sRGB
```

### **Verificación de Calidad**
```
✅ CHECKLIST FINAL:
□ Tamaño exacto: 800x800px
□ Peso del archivo < 150KB
□ Fondo blanco puro o transparente
□ Producto centrado y completo
□ Colores naturales y precisos
□ Nitidez adecuada sin artefactos
□ Nomenclatura correcta
□ Formatos WebP + JPEG generados
```

---

## 🎯 Casos Especiales por Categoría

### **Pinturas (Latas/Baldes)**
- Mostrar etiqueta frontal claramente
- Incluir tapa si es relevante
- Ángulo ligeramente frontal (15-30°)
- Resaltar textura del envase

### **Herramientas (Pinceles/Rodillos)**
- Posición diagonal elegante
- Mostrar cerdas/textura claramente
- Incluir mango completo
- Destacar detalles de calidad

### **Adhesivos/Selladores**
- Envase frontal centrado
- Etiqueta legible
- Mostrar aplicador si lo tiene
- Resaltar características del producto

---

## 📊 Control de Calidad

### **Revisión Pre-Upload**
1. **Técnica**: Dimensiones, peso, formato
2. **Visual**: Composición, colores, nitidez
3. **Consistencia**: Estilo uniforme entre productos
4. **Branding**: Elementos de marca aplicados correctamente

### **Testing**
1. Visualizar en diferentes dispositivos
2. Verificar tiempo de carga
3. Comprobar fallbacks JPEG
4. Validar en navegadores principales

---

## 🚀 Próximos Pasos

1. **Descargar imágenes**: `npm run download-images`
2. **Editar en Photoshop** siguiendo esta guía
3. **Organizar archivos** según estructura definida
4. **Subir a Supabase Storage**: `npm run upload-images`
5. **Actualizar base de datos** con nuevas URLs

---

*Última actualización: Junio 2025*
*Versión: 1.0*



