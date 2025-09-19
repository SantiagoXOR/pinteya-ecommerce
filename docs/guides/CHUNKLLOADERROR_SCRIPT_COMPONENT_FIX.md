# ChunkLoadError y Script Component Fix - Pinteya E-commerce

## 🚨 Problema Identificado

### Error Principal: ChunkLoadError
- **Descripción**: Runtime ChunkLoadError - Loading chunk app/layout failed with timeout
- **URL Afectada**: http://localhost:3000/_next/static/chunks/app/layout.js
- **Impacto**: La aplicación no podía cargar el layout principal

### Error Secundario: Script Component Issue
- **Archivo**: `src/components/SEO/StructuredData.tsx`
- **Línea**: 13, columna 9
- **Descripción**: Uso incorrecto del componente `Script` de Next.js para JSON-LD
- **Causa Raíz**: El componente `Script` de Next.js no debe usarse con `dangerouslySetInnerHTML` para JSON-LD

---

## 🔧 Solución Implementada

### 1. Corrección del Componente StructuredData

#### **Antes (Problemático):**
```tsx
import Script from 'next/script';

export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLd.map((item, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
```

#### **Después (Corregido):**
```tsx
export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
```

### 2. Cambios Realizados

#### **Archivo Modificado:**
- ✅ `src/components/SEO/StructuredData.tsx`

#### **Cambios Específicos:**
1. **Eliminada importación**: `import Script from 'next/script';`
2. **Reemplazado componente**: `<Script>` → `<script>`
3. **Mantenidas propiedades**: `key`, `id`, `type`, `dangerouslySetInnerHTML`

---

## ✅ Verificación de la Corrección

### 1. Carga de la Aplicación
- ✅ **Layout carga correctamente** en http://localhost:3000
- ✅ **Sin ChunkLoadError** en la consola
- ✅ **Página principal renderiza** completamente

### 2. Structured Data SEO
- ✅ **3 scripts JSON-LD** renderizados correctamente:
  - `structured-data-0`: Organization
  - `structured-data-1`: WebSite  
  - `structured-data-2`: Store
- ✅ **JSON válido** en todos los scripts
- ✅ **SEO functionality** mantenida

### 3. Consola del Navegador
- ✅ **Sin errores críticos** relacionados con Script component
- ✅ **Fast Refresh funcionando** correctamente
- ⚠️ **Warnings menores** (Google Analytics, imágenes) - no críticos

---

## 📋 Explicación Técnica

### ¿Por qué falló el componente Script?

1. **Propósito del Script de Next.js**: 
   - Diseñado para cargar scripts externos (archivos .js)
   - Optimiza la carga y ejecución de scripts de terceros
   - No está pensado para contenido inline como JSON-LD

2. **JSON-LD Structured Data**:
   - Requiere elementos `<script>` HTML nativos
   - El contenido debe ser inline en el HTML
   - No necesita optimizaciones de carga externa

3. **Conflicto**:
   - Next.js Script + dangerouslySetInnerHTML = Error de renderizado
   - Causaba fallos en el chunk loading del layout

### ¿Por qué la solución funciona?

1. **Elemento script nativo**: Renderiza directamente en el HTML
2. **JSON-LD válido**: Los motores de búsqueda pueden leer el structured data
3. **Sin conflictos**: No interfiere con el sistema de chunks de Next.js
4. **SEO mantenido**: Funcionalidad de structured data preservada

---

## 🎯 Resultado Final

### **✅ PROBLEMA RESUELTO AL 100%**

#### **Antes:**
- ❌ ChunkLoadError impidiendo carga de layout
- ❌ Script component causando errores de renderizado
- ❌ Aplicación no funcional

#### **Después:**
- ✅ Layout carga sin errores
- ✅ Structured data SEO funcionando
- ✅ Aplicación completamente funcional
- ✅ 3 scripts JSON-LD válidos renderizados
- ✅ Performance y SEO mantenidos

### **Archivos Afectados:**
- `src/components/SEO/StructuredData.tsx` - Corregido

### **Testing Verificado:**
- ✅ Navegación a http://localhost:3000 exitosa
- ✅ Layout renderiza completamente
- ✅ Structured data presente en HTML
- ✅ JSON-LD válido para SEO
- ✅ Sin errores críticos en consola

---

## 📚 Lecciones Aprendidas

### **Buenas Prácticas:**

1. **Para JSON-LD**: Usar elementos `<script>` HTML nativos
2. **Para scripts externos**: Usar componente `Script` de Next.js
3. **Para contenido inline**: Evitar el componente `Script` de Next.js

### **Prevención Futura:**

1. **Revisar documentación** de Next.js Script component
2. **Testing local** antes de deploy
3. **Monitoreo de errores** en desarrollo

**🚀 La aplicación Pinteya E-commerce está ahora completamente funcional en localhost:3000**
