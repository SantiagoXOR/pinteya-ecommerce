# 🧩 Arquitectura de Componentes - Panel Administrativo

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Patrón:** Atomic Design + Enterprise Patterns  

---

## 📋 **PRINCIPIOS DE DISEÑO**

### **1. Atomic Design**
```
Atoms (Átomos)
├── Button, Input, Badge, Icon
├── Loading, Error, Empty states
└── Typography, Colors, Spacing

Molecules (Moléculas)
├── SearchInput, FilterDropdown
├── StatusBadge, ActionButton
└── FormField, DataCell

Organisms (Organismos)
├── DataTable, FormSection
├── Dashboard, Navigation
└── Modal, Sidebar

Templates (Plantillas)
├── AdminLayout, FormLayout
├── ListLayout, DetailLayout
└── DashboardLayout

Pages (Páginas)
├── ProductsPage, OrdersPage
├── LogisticsPage, SettingsPage
└── DashboardPage
```

### **2. Patrones Enterprise**
- **Composition over Inheritance**
- **Single Responsibility Principle**
- **Dependency Injection**
- **Error Boundaries**
- **Lazy Loading**
- **Memoization**

---

## 🏗️ **ESTRUCTURA DE COMPONENTES**

### **Layout Base**
```typescript
// src/components/admin/layout/AdminLayout.tsx

interface AdminLayoutProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ 
  title, 
  breadcrumbs, 
  actions, 
  children, 
  className 
}: AdminLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <AdminHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <AdminPageHeader 
            title={title}
            breadcrumbs={breadcrumbs}
            actions={actions}
          />
          
          {/* Content */}
          <div className="mt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Uso
<AdminLayout
  title="Gestión de Productos"
  breadcrumbs={[
    { label: 'Dashboard', href: '/admin' },
    { label: 'Productos', href: '/admin/products' }
  ]}
  actions={
    <Button onClick={handleCreate}>
      Crear Producto
    </Button>
  }
>
  <ProductList />
</AdminLayout>
```

### **Data Table Pattern**
```typescript
// src/components/admin/common/AdminDataTable.tsx

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string;
  pagination?: PaginationConfig;
  filters?: FilterConfig;
  actions?: ActionConfig;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  className?: string;
}

export function AdminDataTable<T>({
  data,
  columns,
  loading,
  error,
  pagination,
  filters,
  actions,
  selectable,
  onRowClick,
  onSelectionChange,
  className
}: AdminDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>();

  // Error Boundary
  if (error) {
    return <AdminError message={error} onRetry={() => window.location.reload()} />;
  }

  // Loading State
  if (loading) {
    return <AdminTableSkeleton columns={columns.length} rows={10} />;
  }

  // Empty State
  if (!data.length) {
    return <AdminEmptyState message="No hay datos disponibles" />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {filters && (
        <AdminTableFilters
          config={filters}
          onFiltersChange={filters.onChange}
        />
      )}

      {/* Actions */}
      {actions && selectedRows.length > 0 && (
        <AdminTableActions
          config={actions}
          selectedCount={selectedRows.length}
          onAction={(action) => actions.onAction(action, selectedRows)}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <AdminTableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={setSortConfig}
            selectable={selectable}
            selectedCount={selectedRows.length}
            totalCount={data.length}
            onSelectAll={(selected) => {
              setSelectedRows(selected ? data : []);
              onSelectionChange?.(selected ? data : []);
            }}
          />
          <AdminTableBody
            data={data}
            columns={columns}
            selectedRows={selectedRows}
            selectable={selectable}
            onRowClick={onRowClick}
            onRowSelect={(row, selected) => {
              const newSelection = selected
                ? [...selectedRows, row]
                : selectedRows.filter(r => r !== row);
              setSelectedRows(newSelection);
              onSelectionChange?.(newSelection);
            }}
          />
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <AdminTablePagination
          config={pagination}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
```

### **Form Pattern**
```typescript
// src/components/admin/common/AdminForm.tsx

interface AdminFormProps<T> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  children: (form: UseFormReturn<T>) => React.ReactNode;
  className?: string;
}

export function AdminForm<T>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  children,
  className
}: AdminFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      toast.success('Guardado exitosamente');
    } catch (error) {
      toast.error('Error al guardar');
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        {children(form)}
        
        <AdminFormActions
          onCancel={onCancel}
          loading={loading}
          canSubmit={form.formState.isValid}
        />
      </form>
    </Form>
  );
}

// Uso
<AdminForm
  schema={ProductSchema}
  defaultValues={product}
  onSubmit={handleSave}
  onCancel={() => router.back()}
  loading={isSaving}
>
  {(form) => (
    <>
      <AdminFormField
        form={form}
        name="name"
        label="Nombre del Producto"
        placeholder="Ingrese el nombre"
        required
      />
      
      <AdminFormField
        form={form}
        name="description"
        label="Descripción"
        type="textarea"
        rows={4}
      />
      
      <AdminFormField
        form={form}
        name="price"
        label="Precio"
        type="number"
        prefix="$"
        required
      />
    </>
  )}
</AdminForm>
```

### **Modal Pattern**
```typescript
// src/components/admin/common/AdminModal.tsx

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className
}: AdminModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md",
        {
          "max-w-sm": size === 'sm',
          "max-w-md": size === 'md',
          "max-w-lg": size === 'lg',
          "max-w-4xl": size === 'xl',
          "max-w-full h-full": size === 'full'
        },
        className
      )}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Uso
<AdminModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  title="Crear Nuevo Producto"
  description="Complete la información del producto"
  size="lg"
  footer={
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleCreate} loading={isCreating}>
        Crear Producto
      </Button>
    </div>
  }
>
  <ProductForm onSubmit={handleCreateProduct} />
</AdminModal>
```

---

## 🎨 **COMPONENTES ESPECÍFICOS**

### **Dashboard Components**
```typescript
// src/components/admin/dashboard/AdminStatsCard.tsx

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
    period: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
  onClick?: () => void;
}

export function AdminStatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  loading,
  onClick
}: AdminStatsCardProps) {
  if (loading) {
    return <AdminStatsCardSkeleton />;
  }

  return (
    <AdminCard 
      className={cn(
        "p-6 cursor-pointer hover:shadow-md transition-shadow",
        onClick && "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={cn(
              "text-sm mt-1",
              {
                "text-green-600": change.type === 'positive',
                "text-red-600": change.type === 'negative',
                "text-gray-600": change.type === 'neutral'
              }
            )}>
              {change.type === 'positive' && '+'}
              {change.value}% {change.period}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            {
              "bg-blue-100": color === 'blue',
              "bg-green-100": color === 'green',
              "bg-yellow-100": color === 'yellow',
              "bg-red-100": color === 'red',
              "bg-purple-100": color === 'purple'
            }
          )}>
            <Icon className={cn(
              "w-6 h-6",
              {
                "text-blue-600": color === 'blue',
                "text-green-600": color === 'green',
                "text-yellow-600": color === 'yellow',
                "text-red-600": color === 'red',
                "text-purple-600": color === 'purple'
              }
            )} />
          </div>
        )}
      </div>
    </AdminCard>
  );
}
```

---

## 🔄 **HOOKS PERSONALIZADOS**

### **Data Fetching Hook**
```typescript
// src/hooks/admin/useAdminData.ts

interface UseAdminDataOptions<T> {
  endpoint: string;
  params?: Record<string, any>;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAdminData<T>(options: UseAdminDataOptions<T>) {
  const { endpoint, params, enabled = true, refetchInterval, onSuccess, onError } = options;

  return useQuery({
    queryKey: [endpoint, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params);
      const response = await fetch(`${endpoint}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
      const result = await response.json();
      return result.data;
    },
    enabled,
    refetchInterval,
    onSuccess,
    onError
  });
}

// Uso
const { data: products, isLoading, error, refetch } = useAdminData<Product[]>({
  endpoint: '/api/admin/products',
  params: { page: 1, limit: 10, search: searchTerm },
  refetchInterval: 30000 // 30 segundos
});
```

---

## 📊 **TESTING PATTERNS**

### **Component Testing**
```typescript
// src/components/admin/__tests__/AdminDataTable.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDataTable } from '../common/AdminDataTable';

const mockData = [
  { id: 1, name: 'Producto 1', price: 100 },
  { id: 2, name: 'Producto 2', price: 200 }
];

const mockColumns = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'price', header: 'Precio' }
];

describe('AdminDataTable', () => {
  it('should render data correctly', () => {
    render(
      <AdminDataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('Producto 1')).toBeInTheDocument();
    expect(screen.getByText('Producto 2')).toBeInTheDocument();
  });

  it('should handle row selection', async () => {
    const onSelectionChange = jest.fn();
    
    render(
      <AdminDataTable
        data={mockData}
        columns={mockColumns}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[1]; // First row checkbox
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith([mockData[0]]);
    });
  });

  it('should show loading state', () => {
    render(
      <AdminDataTable
        data={[]}
        columns={mockColumns}
        loading
      />
    );

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <AdminDataTable
        data={[]}
        columns={mockColumns}
        error="Error al cargar datos"
      />
    );

    expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
  });
});
```

---

## 🔗 **PRÓXIMOS DOCUMENTOS**

- [Esquemas de Base de Datos](./DATABASE_SCHEMA.md)
- [Guías de Seguridad](./SECURITY_GUIDELINES.md)
- [Estrategia de Testing](../testing/TESTING_STRATEGY.md)

---

**Estado:** ✅ Completado  
**Próxima actualización:** Al agregar nuevos patrones de componentes



