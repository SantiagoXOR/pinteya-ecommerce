// =====================================================
// COMPONENTE: COURIER MANAGER ENTERPRISE
// Descripción: Gestión completa de couriers con configuración
// Basado en: Patrones WooCommerce + shadcn/ui DataTable
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Settings,
  BarChart3,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from '@/lib/optimized-imports'
import { Courier, ShippingService } from '@/types/logistics'
import { useCouriers } from '@/hooks/admin/useShippingQuote'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/core/utils'
import { formatCurrency, formatDate } from '@/lib/utils/consolidated-utils'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const CourierFormSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(255),
  code: z
    .string()
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(10)
    .regex(/^[a-z_]+$/, 'Código debe ser lowercase con underscores'),
  api_endpoint: z.string().url('URL inválida').optional().or(z.literal('')),
  api_key: z.string().optional(),
  supported_services: z
    .array(z.nativeEnum(ShippingService))
    .min(1, 'Debe soportar al menos un servicio'),
  coverage_areas: z.array(z.string()).min(1, 'Debe cubrir al menos un área'),
  base_cost: z.number().min(0, 'Costo base debe ser positivo'),
  cost_per_kg: z.number().min(0, 'Costo por kg debe ser positivo'),
  free_shipping_threshold: z.number().positive().optional().or(z.null()),
  max_weight_kg: z.number().positive().optional().or(z.null()),
  max_dimensions_cm: z
    .string()
    .regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH (ej: 100x80x60)')
    .optional()
    .or(z.literal('')),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  website_url: z.string().url('URL inválida').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type CourierFormData = z.infer<typeof CourierFormSchema>

// =====================================================
// INTERFACES
// =====================================================

interface CourierManagerProps {
  className?: string
}

interface CourierCardProps {
  courier: Courier & { stats?: any }
  onEdit: (courier: Courier) => void
  onToggleStatus: (courier: Courier) => void
  onDelete: (courier: Courier) => void
}

interface CourierStatsProps {
  courier: Courier & { stats?: any }
}

interface CourierFormDialogProps {
  courier?: Courier
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function CourierManager({ className }: CourierManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Hooks
  const {
    data: couriers,
    isLoading,
    refetch,
  } = useCouriers({
    activeOnly: !showInactive,
    includeStats: true,
  })

  // Filtrar couriers
  const filteredCouriers = couriers.filter(
    courier =>
      courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers
  const handleEdit = (courier: Courier) => {
    setSelectedCourier(courier)
  }

  const handleToggleStatus = async (courier: Courier) => {
    try {
      const response = await fetch(`/api/admin/logistics/couriers/${courier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !courier.is_active }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      toast.success(`Courier ${!courier.is_active ? 'activado' : 'desactivado'}`)
      refetch()
    } catch (error) {
      toast.error('Error al actualizar estado del courier')
    }
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courierToDelete, setCourierToDelete] = useState<Courier | null>(null)

  const handleDelete = async (courier: Courier) => {
    setCourierToDelete(courier)
    setDeleteDialogOpen(true)
  }

  const activeCouriers = filteredCouriers.filter(c => c.is_active)
  const inactiveCouriers = filteredCouriers.filter(c => !c.is_active)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Gestión de Couriers</h2>
          <p className='text-muted-foreground'>
            Administra proveedores de envío y su configuración
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={() => refetch()}>
            Actualizar
          </Button>

          <Button className='flex items-center gap-2' onClick={() => setCreateDialogOpen(true)}>
            <Plus className='w-4 h-4' />
            Agregar Courier
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Buscar couriers...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          <span className='text-sm'>Mostrar inactivos</span>
        </div>
      </div>

      {/* Métricas resumen */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Total Couriers</p>
                <p className='text-2xl font-bold'>{couriers.length}</p>
              </div>
              <Truck className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Activos</p>
                <p className='text-2xl font-bold'>{activeCouriers.length}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Cobertura Promedio</p>
                <p className='text-2xl font-bold'>
                  {activeCouriers.length > 0
                    ? Math.round(
                        activeCouriers.reduce((acc, c) => acc + c.coverage_areas.length, 0) /
                          activeCouriers.length
                      )
                    : 0}{' '}
                  provincias
                </p>
              </div>
              <MapPin className='w-8 h-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Costo Promedio</p>
                <p className='text-2xl font-bold'>
                  {activeCouriers.length > 0
                    ? formatCurrency(
                        activeCouriers.reduce((acc, c) => acc + c.base_cost, 0) /
                          activeCouriers.length
                      )
                    : '$0'}
                </p>
              </div>
              <DollarSign className='w-8 h-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <Tabs defaultValue='list' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='list'>Lista de Couriers</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='coverage'>Cobertura</TabsTrigger>
        </TabsList>

        {/* Tab: Lista */}
        <TabsContent value='list' className='space-y-4'>
          {isLoading ? (
            <CourierListSkeleton />
          ) : filteredCouriers.length === 0 ? (
            <EmptyState searchTerm={searchTerm} />
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {filteredCouriers.map(courier => (
                <CourierCard
                  key={courier.id}
                  courier={courier}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value='performance'>
          <Card>
            <CardHeader>
              <CardTitle>Performance de Couriers</CardTitle>
              <CardDescription>Métricas de rendimiento y estadísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Courier</TableHead>
                      <TableHead>Envíos Totales</TableHead>
                      <TableHead>Tasa Entrega</TableHead>
                      <TableHead>Tiempo Promedio</TableHead>
                      <TableHead>Costo Promedio</TableHead>
                      <TableHead>Tendencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCouriers.map(courier => (
                      <TableRow key={courier.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {courier.logo_url && (
                              <img
                                src={courier.logo_url}
                                alt={courier.name}
                                className='w-6 h-6 rounded'
                              />
                            )}
                            <div>
                              <div className='font-medium'>{courier.name}</div>
                              <div className='text-sm text-muted-foreground'>{courier.code}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{courier.stats?.total_shipments || 0}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <span>{courier.stats?.delivery_rate?.toFixed(1) || 0}%</span>
                            {(courier.stats?.delivery_rate || 0) >= 90 ? (
                              <CheckCircle className='w-4 h-4 text-green-500' />
                            ) : (
                              <AlertTriangle className='w-4 h-4 text-yellow-500' />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{courier.stats?.average_delivery_time || 0} días</TableCell>
                        <TableCell>{formatCurrency(courier.stats?.average_cost || 0)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            {Math.random() > 0.5 ? (
                              <TrendingUp className='w-4 h-4 text-green-500' />
                            ) : (
                              <TrendingDown className='w-4 h-4 text-red-500' />
                            )}
                            <span className='text-sm'>{(Math.random() * 20 - 10).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cobertura */}
        <TabsContent value='coverage'>
          <Card>
            <CardHeader>
              <CardTitle>Cobertura Geográfica</CardTitle>
              <CardDescription>Áreas de cobertura por courier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {filteredCouriers.map(courier => (
                  <div key={courier.id} className='p-4 border rounded-lg'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        {courier.logo_url && (
                          <img
                            src={courier.logo_url}
                            alt={courier.name}
                            className='w-6 h-6 rounded'
                          />
                        )}
                        <h4 className='font-semibold'>{courier.name}</h4>
                      </div>
                      <Badge variant={courier.is_active ? 'default' : 'secondary'}>
                        {courier.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      {courier.coverage_areas.map(area => (
                        <Badge key={area} variant='outline' className='text-xs'>
                          {area}
                        </Badge>
                      ))}
                    </div>

                    <div className='mt-3 text-sm text-muted-foreground'>
                      Cobertura: {courier.coverage_areas.length} provincias
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de creación */}
      <CourierFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false)
          refetch()
        }}
      />

      {/* Diálogo de edición */}
      <CourierFormDialog
        courier={selectedCourier || undefined}
        open={!!selectedCourier}
        onOpenChange={(open) => {
          if (!open) setSelectedCourier(null)
        }}
        onSuccess={() => {
          setSelectedCourier(null)
          refetch()
        }}
      />

      {/* Diálogo de eliminación */}
      <DeleteCourierDialog
        courier={courierToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => {
          setCourierToDelete(null)
          refetch()
        }}
      />
    </div>
  )
}

// =====================================================
// COMPONENTE COURIER CARD
// =====================================================

function CourierCard({ courier, onEdit, onToggleStatus, onDelete }: CourierCardProps) {
  return (
    <Card className={cn('transition-all hover:shadow-md', !courier.is_active && 'opacity-60')}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {courier.logo_url && (
              <img
                src={courier.logo_url}
                alt={courier.name}
                className='w-10 h-10 rounded-lg object-contain bg-gray-50'
              />
            )}
            <div>
              <CardTitle className='text-lg'>{courier.name}</CardTitle>
              <CardDescription>{courier.code}</CardDescription>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant={courier.is_active ? 'default' : 'secondary'}>
              {courier.is_active ? 'Activo' : 'Inactivo'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(courier)}>
                  <Edit className='w-4 h-4 mr-2' />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(courier)}>
                  <Settings className='w-4 h-4 mr-2' />
                  {courier.is_active ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(courier)} className='text-red-600'>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Servicios soportados */}
        <div>
          <h5 className='text-sm font-medium mb-2'>Servicios</h5>
          <div className='flex flex-wrap gap-1'>
            {courier.supported_services.map(service => (
              <Badge key={service} variant='outline' className='text-xs'>
                {service === ShippingService.STANDARD && 'Estándar'}
                {service === ShippingService.EXPRESS && 'Express'}
                {service === ShippingService.NEXT_DAY && 'Día Siguiente'}
                {service === ShippingService.SAME_DAY && 'Mismo Día'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Información de costos */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>Costo base:</span>
            <div className='font-medium'>{formatCurrency(courier.base_cost)}</div>
          </div>
          <div>
            <span className='text-muted-foreground'>Por kg:</span>
            <div className='font-medium'>{formatCurrency(courier.cost_per_kg)}</div>
          </div>
        </div>

        {/* Estadísticas si están disponibles */}
        {courier.stats && <CourierStats courier={courier} />}

        {/* Información de contacto */}
        {(courier.contact_phone || courier.contact_email) && (
          <div className='pt-2 border-t text-xs text-muted-foreground'>
            {courier.contact_phone && <div>📞 {courier.contact_phone}</div>}
            {courier.contact_email && <div>✉️ {courier.contact_email}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================
// COMPONENTE COURIER STATS
// =====================================================

function CourierStats({ courier }: CourierStatsProps) {
  if (!courier.stats) {
    return null
  }

  return (
    <div className='grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm'>
      <div>
        <span className='text-muted-foreground'>Envíos:</span>
        <div className='font-medium'>{courier.stats.total_shipments}</div>
      </div>
      <div>
        <span className='text-muted-foreground'>Entregados:</span>
        <div className='font-medium'>{courier.stats.delivered_shipments}</div>
      </div>
      <div>
        <span className='text-muted-foreground'>Tasa entrega:</span>
        <div className='font-medium'>{courier.stats.delivery_rate?.toFixed(1)}%</div>
      </div>
      <div>
        <span className='text-muted-foreground'>Ingresos:</span>
        <div className='font-medium'>{formatCurrency(courier.stats.total_revenue)}</div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function CourierListSkeleton() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {[...Array(4)].map((_, i) => (
        <div key={i} className='h-48 bg-gray-200 rounded-lg animate-pulse' />
      ))}
    </div>
  )
}

function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-12'>
      <Truck className='w-12 h-12 text-muted-foreground mb-4' />
      <h3 className='text-lg font-semibold mb-2'>
        {searchTerm ? 'No se encontraron couriers' : 'No hay couriers configurados'}
      </h3>
      <p className='text-muted-foreground text-center max-w-md'>
        {searchTerm
          ? `No hay couriers que coincidan con "${searchTerm}"`
          : 'Comienza agregando tu primer proveedor de envío'}
      </p>
    </div>
  )
}
