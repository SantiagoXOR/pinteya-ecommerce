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
  ProductCard as ProductCardBase // Componente base interno
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
export { 
  Badge, 
  DiscountBadge, 
  ShippingBadge, 
  StockBadge, 
  NewBadge, 
  OfferBadge 
} from './badge'
// export { Progress } from './progress' // TODO: Crear componente Progress
// export { Skeleton } from './skeleton' // Archivo no existe
// export { Spinner } from './spinner' // TODO: Crear componente Spinner
// export {
//   Toast,
//   ToastAction,
//   ToastClose,
//   ToastDescription,
//   ToastProvider,
//   ToastTitle,
//   ToastViewport
// } from './toast' // TODO: Crear componente Toast
// export { useToast, toast } from './use-toast' // TODO: Crear hook useToast

// Navegación
// export {
//   NavigationMenu,
//   NavigationMenuContent,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger
// } from './navigation-menu' // TODO: Crear componente NavigationMenu
export { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './breadcrumb'

// Overlays y modales
export { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
  AlertDialogTrigger 
} from './alert-dialog'
// export {
//   Popover,
//   PopoverContent,
//   PopoverTrigger
// } from './popover' // TODO: Crear componente Popover
// export {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger
// } from './tooltip' // TODO: Crear componente Tooltip
export { ConfirmModal } from './modal'

// Formularios avanzados
export {
  Form,
  FormSection,
  FormRow,
  FormField,
  FormActions,
  FormMessage
} from './form'
// export { Calendar } from './calendar' // TODO: Crear componente Calendar
// export {
//   Popover as DatePicker,
//   PopoverContent as DatePickerContent,
//   PopoverTrigger as DatePickerTrigger
// } from './popover' // TODO: Crear componente DatePicker

// Componentes E-commerce del Design System
export { PriceDisplay } from './price-display'
export { StockIndicator } from './stock-indicator'
export { ShippingInfo } from './shipping-info'

// ProductCard - Interfaz consolidada
export { EnhancedProductCard } from './product-card-enhanced'
export { EnhancedProductCard as ProductCard } from './product-card-enhanced' // Alias principal
export type { EnhancedProductCardProps as ProductCardProps } from './product-card-enhanced'

// Componentes Avanzados E-commerce (Fase 3)
export { CartSummary, type CartItem } from './cart-summary'
export { CheckoutFlow, type CheckoutStep } from './checkout-flow'
export { ProductComparison, type ComparisonProduct } from './product-comparison'
export { WishlistCard, type WishlistItem } from './wishlist-card'

// Hooks del Design System
// export { useDesignSystemConfig } from '../hooks/useDesignSystemConfig' // TODO: Crear hook useDesignSystemConfig

// Utilidades
export { cn } from '../../lib/utils'

// Tipos comunes
// export type {
//   ButtonProps,
//   InputProps,
//   CardProps,
//   BadgeProps
// } from './types' // TODO: Crear archivo types.ts

// Re-exports de Radix UI para casos avanzados
// export * from '@radix-ui/react-icons' // TODO: Verificar si es necesario
