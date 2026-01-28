// ===================================
// PINTEYA E-COMMERCE - DESIGN SYSTEM EXPORTS
// ===================================

// Componentes base
export { Button, buttonVariants } from './button'
export { Input } from './input'
// export { Label } from './label' // Archivo no existe
export { Textarea } from './textarea'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
export { Checkbox } from './checkbox'
export { RadioGroup, RadioGroupItem } from './radio-group'
// export { Switch } from './switch' // Archivo no existe
// export { Slider } from './slider' // Archivo no existe

// Layout y contenedores
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ProductCard as ProductCardBase, // Componente base interno
} from './card'
export { Separator } from './separator'
// export { ScrollArea } from './scroll-area' // Archivo no existe
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
// export {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger
// } from './sheet' // Archivo no existe

// Feedback y estado
export { Badge, badgeVariants } from './badge'
export { Progress } from './progress'
export { Skeleton } from './skeleton'
export { Spinner, SpinnerOverlay } from './spinner'
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
export { useToast, toast } from './use-toast'

// Navegación
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './navigation-menu'
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

// Overlays y modales
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
export { Popover, PopoverContent, PopoverTrigger } from './popover'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
export { ConfirmModal } from './modal'

// Formularios avanzados
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './form'
export { Calendar } from './calendar'
export { DatePicker, DateRangePicker } from './date-picker'

// Componentes E-commerce del Design System
export { PriceDisplay } from './price-display'
export { StockIndicator } from './stock-indicator'
export { ShippingInfo } from './shipping-info'
export { ShippingIcon } from './ShippingIcon'

// ProductCard - Interfaz// Componentes especializados de e-commerce
export { EnhancedProductCard } from './product-card-enhanced'
export { CommercialProductCard } from './product-card-commercial'
export { CommercialProductCard as ProductCard } from './product-card-commercial' // Alias principal - versión final
export type { CommercialProductCardProps as ProductCardProps } from './product-card-commercial'

// WhatsApp QR Component
export { WhatsAppQR } from './whatsapp-qr'

// Componentes Avanzados E-commerce (Fase 3)
export { CartSummary, type CartItem } from './cart-summary'
export { CheckoutFlow, type CheckoutStep } from './checkout-flow'
export { ProductComparison, type ComparisonProduct } from './product-comparison'
export { WishlistCard, type WishlistItem } from './wishlist-card'

// Hooks del Design System
export { useDesignSystemConfig } from '../hooks/useDesignSystemConfig'

// Utilidades
export { cn } from '../../lib/utils'

// Tipos comunes
export * from './types'

// Re-exports de Radix UI para casos avanzados
// export * from '@radix-ui/react-icons' // TODO: Verificar si es necesario
