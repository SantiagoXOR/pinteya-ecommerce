// ===================================
// OPTIMIZED IMPORTS CONFIGURATION
// ===================================
// Configuración centralizada para optimizar tree-shaking
// y reducir el bundle size del proyecto Pinteya e-commerce

/**
 * Configuración de imports optimizados para librerías pesadas
 * Esto ayuda a Next.js a hacer mejor tree-shaking
 */

import React from 'react'

// ===================================
// TABLER ICONS - OPTIMIZED
// ===================================
// Migrado de lucide-react a @tabler/icons-react
// Tabler Icons ofrece mejor compatibilidad, más iconos (4964+) y mejor mantenimiento
// Los iconos se re-exportan con los nombres originales de lucide-react para compatibilidad

// Iconos utilizados en el proyecto (basado en análisis de código)
import {
  // Navegación básica
  IconSearch,
  IconShoppingCart,
  IconHeart,
  IconUser,
  IconMenu2,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
  IconArrowRight,
  IconHome,

  // UI y acciones
  IconPlus,
  IconMinus,
  IconCheck,
  IconStar,
  IconEye,
  IconLoader2,
  IconAlertCircle,
  IconCircleCheck,
  IconCircle,
  IconBackspace,

  // E-commerce específicos
  IconShoppingBag,
  IconShoppingCartPlus,
  IconPackage,
  IconTruck,
  IconCreditCard,
  IconCurrencyDollar,
  IconGift,
  IconTrophy,
  IconTrendingUp,

  // Información y contacto
  IconMapPin,
  IconPhone,
  IconMail,
  IconMessageCircle,
  IconBrandWhatsapp,

  // Acciones de producto
  IconTrash,
  IconZoomIn,
  IconFilter,
  IconCalendar,

  // Seguridad y confianza
  IconShield,

  // Herramientas (para productos de pintura)
  IconPalette,
  IconSparkles,
  IconBrush,
  IconTool,

  // Otros iconos utilizados
  IconClock,
  IconUsers,
  IconBolt,

  // Iconos adicionales encontrados en el proyecto
  IconLogin,
  IconDashboard,
  IconChartBar,
  IconSettings,
  IconDatabase,
  IconBell,
  IconActivity,
  IconNavigation,
  IconAlertTriangle,
  IconRefresh,
  IconInfoCircle,
  IconExternalLink,
  IconTestPipe,
  IconBox,
  IconStack,
  IconRuler,
  IconMaximize,
  IconHash,
  IconDeviceDesktop,
  IconFileText,
  IconDownload,
  IconPlayerPause,
  IconPlayerPlay,
  IconBug,
  IconTag,
  IconCamera,
  IconHelp,
  IconPercentage,
  
  // Iconos faltantes detectados en build
  IconBuilding,
  // IconBuilding2 no existe, usar IconBuilding
  IconTarget,
  IconAward,
  IconEdit,
  IconGauge,
  IconGitBranch,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconTrendingDown,
  IconCircleX,
  IconServer,
  // IconShieldAlert no existe, usar IconShield con IconAlertTriangle
  // IconMousePointer no existe, usar IconCursorText como alternativa
  IconCursorText,
  IconWorld,
  IconBulb,
  IconUpload,
  IconLink,
  // IconStore no existe, usar IconShoppingBag
  IconCalculator,
  IconPaint,
  IconReceipt,
  IconKey,
  IconEyeOff,
  IconDeviceMobile,
  IconDeviceTablet,
  IconRoute,
  IconList,
  IconMap,
  IconDeviceFloppy,
  // IconMessageSquare no existe, usar IconMessageCircle
  IconRotateClockwise2,
  // IconPackageCheck no existe, usar IconPackage con IconCheck
  IconShieldCheck,
  // IconCircleCheck2 no existe, usar IconCircleCheck
  IconLogout,
  IconCode,
  // IconDotsHorizontal no existe, usar IconDots
  IconDots,
  IconArchive,
  IconCopy,
  IconAdjustmentsHorizontal,
  IconHistory,
  IconPrinter,
  IconFolderOpen,
  IconFolder,
  IconPhoto,
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown,
  IconShare,
  IconPlayerPlayFilled,
  IconHeadphones,
  IconCpu,
  IconLock,
  IconNetwork,
  IconDeviceDesktopAnalytics,
  // IconBrandTabler no existe, usar IconBrandTabler o alternativa
  IconSend,
  IconLayoutGrid,
  IconArrowsVertical,
  IconWallet,
  IconCash,
} from '@tabler/icons-react'

// Re-exportar con nombres compatibles (aliases para facilitar migración)
// Esto permite que los componentes existentes sigan funcionando sin cambios
export {
  // Navegación básica
  IconSearch as Search,
  IconShoppingCart as ShoppingCart,
  IconHeart as Heart,
  IconUser as User,
  IconMenu2 as Menu,
  IconX as X,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconArrowLeft as ArrowLeft,
  IconArrowRight as ArrowRight,
  IconHome as Home,

  // UI y acciones
  IconPlus as Plus,
  IconMinus as Minus,
  IconCheck as Check,
  IconStar as Star,
  IconEye as Eye,
  IconLoader2 as Loader2,
  IconAlertCircle as AlertCircle,
  IconCircleCheck as CheckCircle,
  IconCircle as Circle,
  IconBackspace as Backspace,
  IconArrowRight as Enter,

  // E-commerce específicos
  IconShoppingBag as ShoppingBag,
  IconShoppingCartPlus as ShoppingCartPlus,
  IconPackage as Package,
  IconTruck as Truck,
  IconCreditCard as CreditCard,
  IconCurrencyDollar as DollarSign,
  IconGift as Gift,
  IconTrophy as Trophy,
  IconTrendingUp as TrendingUp,

  // Información y contacto
  IconMapPin as MapPin,
  IconPhone as Phone,
  IconMail as Mail,
  IconMessageCircle as MessageCircle,
  IconBrandWhatsapp as BrandWhatsapp,

  // Acciones de producto
  IconTrash as Trash2,
  IconZoomIn as ZoomIn,
  IconFilter as Filter,
  IconCalendar as Calendar,

  // Seguridad y confianza
  IconShield as Shield,

  // Herramientas (para productos de pintura)
  IconPalette as Palette,
  IconSparkles as Sparkles,
  IconBrush as Brush,
  IconTool as Wrench,

  // Otros iconos utilizados
  IconClock as Clock,
  IconUsers as Users,
  IconBolt as Zap,

  // Iconos adicionales
  IconLogin as LogIn,
  IconDashboard as LayoutDashboard,
  IconChartBar as BarChart3,
  IconSettings as Settings,
  IconDatabase as Database,
  IconBell as Bell,
  IconActivity as Activity,
  IconNavigation as Navigation,
  IconAlertTriangle as AlertTriangle,
  IconRefresh as RefreshCw,
  IconInfoCircle as Info,
  IconExternalLink as ExternalLink,
  IconTestPipe as TestTube,
  IconBox as Box,
  IconStack as Layers,
  IconRuler as Ruler,
  IconMaximize as Maximize,
  IconHash as Hash,
  IconDeviceDesktop as Monitor,
  IconFileText as FileText,
  IconDownload as Download,
  IconPlayerPause as Pause,
  IconPlayerPlay as Play,
  IconBug as Bug,
  IconTag as Tag,
  IconCamera as Camera,
  IconHelp as HelpCircle,
  IconPercentage as Percent,
  
  // Iconos faltantes - mapeo a nombres de lucide-react
  IconBuilding as Building,
  IconBuilding as Building2, // Building2 no existe, usar Building
  IconTarget as Target,
  IconAward as Award,
  IconEdit as Edit,
  IconGauge as Gauge,
  IconGitBranch as GitBranch,
  IconUserCheck as UserCheck,
  IconUserPlus as UserPlus,
  IconUserX as UserX,
  IconTrendingDown as TrendingDown,
  IconCircleX as XCircle,
  IconServer as Server,
  IconShield as ShieldAlert, // ShieldAlert no existe, usar Shield
  IconCursorText as MousePointer, // MousePointer no existe, usar CursorText
  IconWorld as Globe,
  IconBulb as Lightbulb,
  IconUpload as Upload,
  IconLink as Link,
  IconShoppingBag as Store, // Store no existe, usar ShoppingBag
  IconCalculator as Calculator,
  IconPaint as Paintbrush,
  IconReceipt as Receipt,
  IconKey as Key,
  IconEyeOff as EyeOff,
  IconDeviceMobile as Smartphone,
  IconDeviceTablet as Tablet,
  IconRoute as Route,
  IconList as List,
  IconMap as Map,
  IconDeviceFloppy as Save,
  IconMessageCircle as MessageSquare, // MessageSquare no existe, usar MessageCircle
  IconRotateClockwise2 as RotateCcw,
  IconPackage as PackageCheck, // PackageCheck no existe, usar Package
  IconShieldCheck as ShieldCheck,
  IconCircleCheck as CheckCircle2, // CheckCircle2 no existe, usar CircleCheck
  IconLogout as LogOut,
  IconCode as Code,
  IconDots as MoreHorizontal, // DotsHorizontal no existe, usar Dots
  IconArchive as Archive,
  IconCopy as Copy,
  IconAdjustmentsHorizontal as SlidersHorizontal,
  IconHistory as History,
  IconPrinter as Printer,
  IconFolderOpen as FolderOpen,
  IconFolder as Folder,
  IconPhoto as ImageIcon,
  IconPhoto as Image, // Alias para compatibilidad con imports que usan 'Image as ImageIcon'
  IconArrowsSort as ArrowUpDown,
  IconArrowUp as ArrowUp,
  IconArrowDown as ArrowDown,
  IconShare as Share2,
  IconPlayerPlayFilled as PlayCircle,
  IconHeadphones as Headphones,
  IconCpu as Cpu,
  IconLock as Lock,
  IconNetwork as Network,
  IconDeviceDesktopAnalytics as HardDrive,
  IconDatabase as MemoryStick, // BrandTabler no existe, usar Database como alternativa
  IconSend as Send,
  IconLayoutGrid as Grid,
  IconArrowsVertical as Scroll,
  IconWallet as Wallet,
  IconCash as Banknote,
}

// ===================================
// DATE-FNS OPTIMIZED IMPORTS
// ===================================
// Solo importamos las funciones que realmente necesitamos

export {
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  isAfter,
  isBefore,
  isEqual,
  isValid,
  parseISO,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDay,
  getMonth,
  getYear,
  setDay,
  setMonth,
  setYear,
  addMonths,
  subMonths,
  addYears,
  subYears,
  formatISO,
  toDate,
} from 'date-fns'

// Locale específico para Argentina
export { es } from 'date-fns/locale'

// ===================================
// FRAMER MOTION OPTIMIZED
// ===================================
// Importamos solo los componentes que necesitamos
// Usar LazyMotion + domAnimation para reducir bundle size en ~50KB

export {
  // LazyMotion debe usarse como wrapper principal
  LazyMotion,
  domAnimation, // Feature set reducido para animaciones DOM comunes
  m, // Componente m en lugar de motion cuando usamos LazyMotion
  
  // Componentes básicos
  AnimatePresence,
  
  // Hooks - solo los esenciales
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  useScroll,
  useAnimationControls,
  
  // motion solo para casos legacy (preferir 'm' con LazyMotion)
  motion,
} from 'framer-motion'

// ===================================
// RADIX UI OPTIMIZED EXPORTS
// ===================================
// Re-exportamos solo los componentes que usamos

// Dialog
export {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose,
} from '@radix-ui/react-dialog'

// Dropdown Menu
export {
  Root as DropdownMenuRoot,
  Trigger as DropdownMenuTrigger,
  Portal as DropdownMenuPortal,
  Content as DropdownMenuContent,
  Item as DropdownMenuItem,
  CheckboxItem as DropdownMenuCheckboxItem,
  RadioGroup as DropdownMenuRadioGroup,
  RadioItem as DropdownMenuRadioItem,
  ItemIndicator as DropdownMenuItemIndicator,
  Separator as DropdownMenuSeparator,
  Label as DropdownMenuLabel,
  Sub as DropdownMenuSub,
  SubTrigger as DropdownMenuSubTrigger,
  SubContent as DropdownMenuSubContent,
} from '@radix-ui/react-dropdown-menu'

// Select
export {
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Value as SelectValue,
  Icon as SelectIcon,
  Portal as SelectPortal,
  Content as SelectContent,
  Viewport as SelectViewport,
  Item as SelectItem,
  ItemText as SelectItemText,
  ItemIndicator as SelectItemIndicator,
  ScrollUpButton as SelectScrollUpButton,
  ScrollDownButton as SelectScrollDownButton,
  Group as SelectGroup,
  Label as SelectLabel,
  Separator as SelectSeparator,
} from '@radix-ui/react-select'

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Helper para importar dinámicamente componentes pesados
 * Útil para lazy loading de componentes que no se usan inmediatamente
 */
export const lazyImport = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn)
}

/**
 * Helper para crear imports condicionales
 * Solo carga el módulo si se cumple una condición
 */
export const conditionalImport = async <T>(
  condition: boolean,
  importFn: () => Promise<T>
): Promise<T | null> => {
  if (condition) {
    return await importFn()
  }
  return null
}

/**
 * Helper para precargar módulos críticos
 * Útil para componentes que sabemos que se van a usar pronto
 */
export const preloadModule = (importFn: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Solo precargar en el cliente
    setTimeout(() => {
      importFn().catch(() => {
        // Silenciar errores de precarga
      })
    }, 100)
  }
}
