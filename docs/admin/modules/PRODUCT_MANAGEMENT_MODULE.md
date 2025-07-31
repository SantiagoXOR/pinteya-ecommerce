# 📦 Módulo de Gestión de Productos - Pinteya E-commerce

**Basado en:** Vendure Product Management + WooCommerce Product Editor  
**Estado:** 🔴 No Implementado  
**Prioridad:** 🔥 Crítica  
**Estimación:** 2 semanas  

---

## 🎯 **OBJETIVOS DEL MÓDULO**

Crear un sistema completo de gestión de productos que permita a los administradores:
- ✅ Crear, editar y eliminar productos
- ✅ Gestionar variantes de productos (tamaños, colores, etc.)
- ✅ Administrar inventario y stock
- ✅ Subir y organizar imágenes de productos
- ✅ Configurar precios y promociones
- ✅ Gestionar categorías y etiquetas
- ✅ Import/export masivo de productos

---

## 🏗️ **ARQUITECTURA DEL MÓDULO**

### **Estructura de Archivos**
```
src/app/admin/products/
├── page.tsx                     // Lista de productos con filtros
├── new/page.tsx                 // Crear nuevo producto
├── [id]/
│   ├── page.tsx                 // Vista general del producto
│   ├── edit/page.tsx            // Editar producto
│   ├── variants/page.tsx        // Gestión de variantes
│   ├── inventory/page.tsx       // Gestión de inventario
│   └── images/page.tsx          // Gestión de imágenes
└── components/
    ├── ProductList.tsx          // Tabla de productos
    ├── ProductForm.tsx          // Formulario principal
    ├── ProductImageManager.tsx  // Gestor de imágenes
    ├── ProductVariantManager.tsx // Gestor de variantes
    ├── ProductInventory.tsx     // Control de stock
    ├── ProductPricing.tsx       // Configuración de precios
    └── ProductFilters.tsx       // Filtros avanzados
```

### **APIs del Módulo**
```
src/app/api/admin/products/
├── route.ts                     // GET, POST /api/admin/products
├── [id]/route.ts                // GET, PUT, DELETE /api/admin/products/[id]
├── [id]/variants/route.ts       // Gestión de variantes
├── [id]/images/route.ts         // Gestión de imágenes
├── [id]/inventory/route.ts      // Gestión de inventario
├── bulk/route.ts                // Operaciones masivas
├── import/route.ts              // Importar productos CSV
└── export/route.ts              // Exportar productos CSV
```

---

## 🧩 **COMPONENTES PRINCIPALES**

### **1. ProductList Component**
*Inspirado en Vendure Product List + WooCommerce Product Table*

```typescript
interface ProductListProps {
  filters?: ProductFilters;
  pagination?: PaginationConfig;
  selection?: SelectionConfig;
  actions?: BulkAction[];
}

interface ProductFilters {
  search?: string;
  category?: string[];
  status?: ProductStatus[];
  priceRange?: [number, number];
  stockStatus?: StockStatus[];
  dateRange?: [Date, Date];
}

const ProductList: React.FC<ProductListProps> = ({
  filters,
  pagination,
  selection,
  actions
}) => {
  const { data, loading, error } = useProductList({
    filters,
    pagination
  });

  return (
    <AdminDataTable
      data={data?.products || []}
      columns={productColumns}
      loading={loading}
      error={error}
      pagination={pagination}
      selection={selection}
      bulkActions={actions}
      filters={<ProductFilters />}
    />
  );
};

// Columnas de la tabla (configurables)
const productColumns: ColumnDef<Product>[] = [
  {
    id: 'image',
    header: 'Imagen',
    cell: ({ row }) => (
      <ProductImage 
        src={row.original.featuredImage} 
        alt={row.original.name}
        size="sm"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => (
      <div>
        <Link href={`/admin/products/${row.original.id}`}>
          {row.original.name}
        </Link>
        <div className="text-sm text-gray-500">
          SKU: {row.original.sku}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.category?.name}
      </Badge>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => (
      <PriceDisplay 
        price={row.original.price}
        originalPrice={row.original.originalPrice}
        currency="ARS"
      />
    ),
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => (
      <StockIndicator 
        stock={row.original.stock}
        lowStockThreshold={5}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} />
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <ProductActions product={row.original} />
    ),
    enableSorting: false,
  },
];
```

### **2. ProductForm Component**
*Basado en Vendure Product Detail Form*

```typescript
interface ProductFormProps {
  product?: Product;
  mode: 'create' | 'edit';
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

const productFormSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU es requerido'),
  price: z.number().min(0, 'Precio debe ser positivo'),
  originalPrice: z.number().optional(),
  categoryId: z.string().min(1, 'Categoría es requerida'),
  status: z.enum(['draft', 'published', 'archived']),
  images: z.array(z.string()).optional(),
  variants: z.array(productVariantSchema).optional(),
  inventory: productInventorySchema,
  seo: productSeoSchema.optional(),
});

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  mode,
  onSubmit,
  onCancel
}) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product || getDefaultProductValues(),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AdminPageLayout
          title={mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          breadcrumbs={[
            { label: 'Productos', href: '/admin/products' },
            { label: mode === 'create' ? 'Nuevo' : product?.name || '' }
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {mode === 'create' ? 'Crear' : 'Actualizar'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              <AdminCard title="Información Básica">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Producto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Pintura Sherwin Williams" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: SW-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <RichTextEditor {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AdminCard>

              <AdminCard title="Precios">
                <ProductPricingForm control={form.control} />
              </AdminCard>

              <AdminCard title="Imágenes">
                <ProductImageManager 
                  images={form.watch('images')}
                  onChange={(images) => form.setValue('images', images)}
                />
              </AdminCard>

              <AdminCard title="Variantes">
                <ProductVariantManager 
                  variants={form.watch('variants')}
                  onChange={(variants) => form.setValue('variants', variants)}
                />
              </AdminCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AdminCard title="Estado y Visibilidad">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="archived">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AdminCard>

              <AdminCard title="Categoría">
                <CategorySelector 
                  value={form.watch('categoryId')}
                  onChange={(categoryId) => form.setValue('categoryId', categoryId)}
                />
              </AdminCard>

              <AdminCard title="Inventario">
                <ProductInventoryForm control={form.control} />
              </AdminCard>

              <AdminCard title="SEO">
                <ProductSeoForm control={form.control} />
              </AdminCard>
            </div>
          </div>
        </AdminPageLayout>
      </form>
    </Form>
  );
};
```

### **3. ProductImageManager Component**
*Inspirado en WooCommerce Product Images*

```typescript
interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  acceptedTypes?: string[];
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  maxImages = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadProductImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
    } catch (error) {
      toast.error('Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(images);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    onChange(result);
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Imágenes del Producto ({images.length}/{maxImages})
        </h3>
        <ImageUploadButton
          onUpload={handleUpload}
          disabled={uploading || images.length >= maxImages}
          acceptedTypes={acceptedTypes}
          multiple
        />
      </div>

      <DragDropContext onDragEnd={(result) => {
        if (!result.destination) return;
        handleReorder(result.source.index, result.destination.index);
      }}>
        <Droppable droppableId="product-images" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {images.map((image, index) => (
                <Draggable key={image} draggableId={image} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "relative group aspect-square rounded-lg border-2 border-dashed border-gray-300 overflow-hidden",
                        snapshot.isDragging && "shadow-lg"
                      )}
                    >
                      <img
                        src={image}
                        alt={`Producto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Principal
                        </Badge>
                      )}

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No hay imágenes cargadas</p>
          <p className="text-sm">Arrastra archivos aquí o usa el botón de subir</p>
        </div>
      )}
    </div>
  );
};
```

---

## 🔌 **APIS Y ENDPOINTS**

### **Endpoints Principales**
```typescript
// GET /api/admin/products
interface GetProductsResponse {
  data: Product[];
  meta: {
    count: number;
    total_count: number;
    total_pages: number;
    current_page: number;
  };
  links: {
    self: string;
    next?: string;
    prev?: string;
    first: string;
    last: string;
  };
}

// POST /api/admin/products
interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  status: ProductStatus;
  images?: string[];
  variants?: ProductVariant[];
  inventory: ProductInventory;
  seo?: ProductSeo;
}

// PUT /api/admin/products/[id]
interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// DELETE /api/admin/products/[id]
interface DeleteProductResponse {
  success: boolean;
  message: string;
}
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
```typescript
// src/__tests__/admin/components/ProductList.test.tsx
describe('ProductList Component', () => {
  it('should render products correctly', () => {
    // Test rendering
  });

  it('should handle filtering', () => {
    // Test filters
  });

  it('should handle pagination', () => {
    // Test pagination
  });

  it('should handle bulk actions', () => {
    // Test bulk operations
  });
});
```

### **Integration Tests**
```typescript
// src/__tests__/admin/api/products.test.ts
describe('Products API', () => {
  it('should create product successfully', async () => {
    // Test product creation
  });

  it('should update product correctly', async () => {
    // Test product updates
  });

  it('should handle validation errors', async () => {
    // Test error handling
  });
});
```

### **E2E Tests**
```typescript
// e2e/admin/product-management.spec.ts
test('complete product management flow', async ({ page }) => {
  // Test full workflow
});
```

---

## 📈 **MÉTRICAS DE ÉXITO**

- **Tiempo de creación de producto:** < 2 minutos
- **Tiempo de carga de lista:** < 1 segundo
- **Tasa de errores:** < 1%
- **Satisfacción del usuario:** > 4.5/5

---

*Próxima actualización: Implementación de ProductList component*
