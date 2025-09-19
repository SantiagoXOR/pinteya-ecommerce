# 📦 Fase 1: Implementación Completa del Panel de Productos

**Duración:** 2 semanas  
**Prioridad:** 🔥 Crítica  
**Dependencias:** Ninguna  
**Estado:** 🔄 Pendiente  

---

## 🎯 **OBJETIVOS DE LA FASE**

Completar el sistema CRUD de productos con todas las funcionalidades enterprise necesarias para gestión completa del catálogo.

### **Entregables Principales**
- ✅ APIs CRUD completas para productos individuales
- ✅ ProductForm component para edición avanzada
- ✅ Sistema de gestión de imágenes robusto
- ✅ Validaciones y error handling enterprise
- ✅ Testing completo del módulo

---

## 🏗️ **ARQUITECTURA TÉCNICA**

### **APIs a Implementar**

#### **1. API Individual de Producto**
```typescript
// src/app/api/admin/products/[id]/route.ts

// GET /api/admin/products/[id] - Obtener producto específico
interface GetProductResponse {
  data: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    discounted_price?: number;
    stock: number;
    low_stock_threshold: number;
    category_id: number;
    category_name: string;
    brand: string;
    images: ProductImage[];
    variants?: ProductVariant[];
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
  };
  success: boolean;
}

// PUT /api/admin/products/[id] - Actualizar producto
interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  discounted_price?: number;
  stock?: number;
  low_stock_threshold?: number;
  category_id?: number;
  brand?: string;
  images?: ProductImage[];
  is_active?: boolean;
  is_featured?: boolean;
}

// DELETE /api/admin/products/[id] - Eliminar producto
interface DeleteProductResponse {
  success: boolean;
  message: string;
}
```

#### **2. API de Gestión de Imágenes**
```typescript
// src/app/api/admin/products/[id]/images/route.ts

// POST /api/admin/products/[id]/images - Subir imagen
interface UploadImageRequest {
  file: File;
  alt_text?: string;
  is_primary?: boolean;
}

// DELETE /api/admin/products/[id]/images/[imageId] - Eliminar imagen
// PUT /api/admin/products/[id]/images/[imageId] - Actualizar imagen
```

### **Componentes a Desarrollar**

#### **1. ProductForm Component**
```typescript
// src/components/admin/products/ProductForm.tsx

interface ProductFormProps {
  product?: Product;
  mode: 'create' | 'edit';
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Características:
// - Formulario multi-step con validación Zod
// - Gestión de imágenes drag & drop
// - Preview en tiempo real
// - Auto-save cada 30 segundos
// - Validación de slug único
// - Gestión de categorías dinámicas
```

#### **2. ProductImageManager Component**
```typescript
// src/components/admin/products/ProductImageManager.tsx

interface ProductImageManagerProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  allowedFormats?: string[];
}

// Características:
// - Upload múltiple con drag & drop
// - Reordenamiento por drag & drop
// - Crop y resize automático
// - Optimización de imágenes
// - Preview con zoom
// - Gestión de imagen principal
```

#### **3. ProductEditPage**
```typescript
// src/app/admin/products/[id]/edit/page.tsx

// Página completa de edición con:
// - Breadcrumbs dinámicos
// - Tabs para diferentes secciones
// - Auto-save y confirmación de cambios
// - Historial de cambios
// - Preview del producto
```

---

## 📋 **PLAN DE IMPLEMENTACIÓN DETALLADO**

### **Semana 1: APIs y Backend**

#### **Día 1-2: API Individual de Producto**
```bash
# Tareas específicas:
1. Implementar GET /api/admin/products/[id]
   - Validación de parámetros
   - Joins optimizados con categorías
   - Manejo de errores 404
   - Logging de accesos

2. Implementar PUT /api/admin/products/[id]
   - Validación con Zod schema
   - Actualización parcial
   - Audit logging
   - Invalidación de cache

3. Implementar DELETE /api/admin/products/[id]
   - Soft delete vs hard delete
   - Verificación de dependencias
   - Cleanup de imágenes
   - Logging de eliminaciones
```

#### **Día 3-4: API de Gestión de Imágenes**
```bash
# Tareas específicas:
1. Configurar upload de archivos
   - Integración con Supabase Storage
   - Validación de tipos de archivo
   - Límites de tamaño
   - Generación de thumbnails

2. Implementar CRUD de imágenes
   - Upload múltiple
   - Reordenamiento
   - Eliminación segura
   - Optimización automática
```

#### **Día 5: Testing de APIs**
```bash
# Tareas específicas:
1. Tests unitarios de APIs
2. Tests de integración
3. Tests de validación
4. Tests de performance
```

### **Semana 2: Frontend y Componentes**

#### **Día 6-7: ProductForm Component**
```bash
# Tareas específicas:
1. Estructura base del formulario
   - Layout responsive
   - Validación en tiempo real
   - Estados de loading
   - Error handling

2. Integración con APIs
   - Submit optimizado
   - Auto-save
   - Manejo de errores
   - Feedback visual
```

#### **Día 8-9: ProductImageManager**
```bash
# Tareas específicas:
1. Upload component
   - Drag & drop
   - Progress indicators
   - Error handling
   - Preview

2. Gestión de imágenes
   - Reordenamiento
   - Crop básico
   - Eliminación
   - Optimización
```

#### **Día 10: Integración y Testing**
```bash
# Tareas específicas:
1. ProductEditPage completa
2. Testing de componentes
3. Testing E2E
4. Optimización de performance
```

---

## 🧪 **ESTRATEGIA DE TESTING**

### **Unit Tests (Jest + RTL)**
```typescript
// Ejemplos de tests críticos:

describe('ProductForm', () => {
  it('should validate required fields', () => {});
  it('should handle image upload', () => {});
  it('should auto-save changes', () => {});
  it('should handle API errors gracefully', () => {});
});

describe('ProductImageManager', () => {
  it('should upload multiple images', () => {});
  it('should reorder images by drag & drop', () => {});
  it('should delete images safely', () => {});
});
```

### **Integration Tests**
```typescript
describe('Product CRUD APIs', () => {
  it('should create product with images', () => {});
  it('should update product partially', () => {});
  it('should delete product and cleanup', () => {});
});
```

### **E2E Tests (Playwright)**
```typescript
test('Admin can edit product completely', async ({ page }) => {
  // Test flujo completo de edición
});
```

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Funcionales**
- ✅ 100% CRUD operations funcionando
- ✅ Upload de imágenes < 5 segundos
- ✅ Formulario responsive en todos los breakpoints
- ✅ Auto-save funcionando sin pérdida de datos

### **Performance**
- ✅ APIs < 300ms response time
- ✅ Componentes < 100ms render time
- ✅ Imágenes optimizadas < 500KB
- ✅ Bundle size impact < 50KB

### **Testing**
- ✅ 90%+ code coverage
- ✅ 0 errores críticos
- ✅ 100% casos de uso cubiertos
- ✅ E2E tests pasando

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### **Dependencias Nuevas**
```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",
    "react-image-crop": "^11.0.4",
    "sharp": "^0.33.0",
    "@supabase/storage-js": "^2.5.5"
  },
  "devDependencies": {
    "@testing-library/user-event": "^14.5.1",
    "msw": "^2.0.11"
  }
}
```

### **Variables de Entorno**
```env
# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=
SUPABASE_STORAGE_BUCKET=product-images

# Upload limits
MAX_FILE_SIZE=5242880  # 5MB
MAX_FILES_PER_PRODUCT=10
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,webp
```

---

## 🚀 **SIGUIENTE FASE**

Una vez completada esta fase, proceder con:
- [Fase 1: Panel de Órdenes Básico](./ORDERS_BASIC_IMPLEMENTATION.md)

---

**Estado:** 🔄 Listo para implementación  
**Próxima revisión:** Al completar Semana 1



