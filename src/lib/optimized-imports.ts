// ===================================
// OPTIMIZED IMPORTS CONFIGURATION
// ===================================
// Configuración centralizada para optimizar tree-shaking
// y reducir el bundle size del proyecto Pinteya e-commerce

/**
 * Configuración de imports optimizados para librerías pesadas
 * Esto ayuda a Next.js a hacer mejor tree-shaking
 */

// ===================================
// LUCIDE REACT ICONS - OPTIMIZED
// ===================================
// Solo importamos los iconos que realmente se usan en el proyecto
// Esto reduce significativamente el bundle size y mejora el rendimiento

// Iconos utilizados en el proyecto (basado en análisis de código)
export {
  // Navegación básica
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Home,
  
  // UI y acciones
  Plus,
  Minus,
  Check,
  Star,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Circle,
  
  // E-commerce específicos
  ShoppingBag,
  Package,
  Truck,
  CreditCard,
  DollarSign,
  Gift,
  Trophy,
  TrendingUp,
  
  // Información y contacto
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  
  // Acciones de producto
  Trash2,
  ZoomIn,
  Filter,
  Calendar,
  
  // Seguridad y confianza
  Shield,
  
  // Herramientas (para productos de pintura)
  Palette,
  Sparkles,
  Brush,
  Wrench,
  
  // Otros iconos utilizados
  Clock,
  Users,
  Zap
} from 'lucide-react';

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
  toDate
} from 'date-fns';

// Locale específico para Argentina
export { es } from 'date-fns/locale';

// ===================================
// FRAMER MOTION OPTIMIZED
// ===================================
// Importamos solo los componentes que necesitamos

export {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  useScroll,
  useDragControls,
  useAnimationControls,
  LazyMotion,
  domAnimation,
  m
} from 'framer-motion';

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
  Close as DialogClose
} from '@radix-ui/react-dialog';

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
  SubContent as DropdownMenuSubContent
} from '@radix-ui/react-dropdown-menu';

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
  Separator as SelectSeparator
} from '@radix-ui/react-select';

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
  return React.lazy(importFn);
};

/**
 * Helper para crear imports condicionales
 * Solo carga el módulo si se cumple una condición
 */
export const conditionalImport = async <T>(
  condition: boolean,
  importFn: () => Promise<T>
): Promise<T | null> => {
  if (condition) {
    return await importFn();
  }
  return null;
};

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
      });
    }, 100);
  }
};
