/**
 * Mapeo de iconos: lucide-react → @tabler/icons-react
 * 
 * Este archivo contiene el mapeo completo de iconos de lucide-react a Tabler Icons
 * para facilitar la migración y referencia.
 * 
 * Uso: Este archivo es solo para referencia. Los iconos se importan desde
 * @/lib/optimized-imports que ya contiene los aliases correctos.
 */

export const iconMapping: Record<string, string> = {
  // Navegación básica
  Search: 'IconSearch',
  ShoppingCart: 'IconShoppingCart',
  Heart: 'IconHeart',
  User: 'IconUser',
  Menu: 'IconMenu2',
  X: 'IconX',
  ChevronDown: 'IconChevronDown',
  ChevronUp: 'IconChevronUp',
  ChevronLeft: 'IconChevronLeft',
  ChevronRight: 'IconChevronRight',
  ArrowLeft: 'IconArrowLeft',
  ArrowRight: 'IconArrowRight',
  Home: 'IconHome',

  // UI y acciones
  Plus: 'IconPlus',
  Minus: 'IconMinus',
  Check: 'IconCheck',
  Star: 'IconStar',
  Eye: 'IconEye',
  Loader2: 'IconLoader2',
  AlertCircle: 'IconAlertCircle',
  CheckCircle: 'IconCircleCheck',
  Circle: 'IconCircle',

  // E-commerce específicos
  ShoppingBag: 'IconShoppingBag',
  Package: 'IconPackage',
  Truck: 'IconTruck',
  CreditCard: 'IconCreditCard',
  DollarSign: 'IconCurrencyDollar',
  Gift: 'IconGift',
  Trophy: 'IconTrophy',
  TrendingUp: 'IconTrendingUp',

  // Información y contacto
  MapPin: 'IconMapPin',
  Phone: 'IconPhone',
  Mail: 'IconMail',
  MessageCircle: 'IconMessageCircle',

  // Acciones de producto
  Trash2: 'IconTrash',
  ZoomIn: 'IconZoomIn',
  Filter: 'IconFilter',
  Calendar: 'IconCalendar',

  // Seguridad y confianza
  Shield: 'IconShield',

  // Herramientas (para productos de pintura)
  Palette: 'IconPalette',
  Sparkles: 'IconSparkles',
  Brush: 'IconBrush',
  Wrench: 'IconWrench',

  // Otros iconos utilizados
  Clock: 'IconClock',
  Users: 'IconUsers',
  Zap: 'IconBolt',

  // Iconos adicionales encontrados en el proyecto
  LogIn: 'IconLogin',
  LayoutDashboard: 'IconDashboard',
  BarChart3: 'IconChartBar',
  Settings: 'IconSettings',
  Database: 'IconDatabase',
  Bell: 'IconBell',
  Activity: 'IconActivity',
  Navigation: 'IconNavigation',
  AlertTriangle: 'IconAlertTriangle',
  RefreshCw: 'IconRefresh',
  Info: 'IconInfoCircle',
  ExternalLink: 'IconExternalLink',
  TestTube: 'IconTestPipe',
  Box: 'IconBox',
  Layers: 'IconLayers',
  Ruler: 'IconRuler',
  Maximize: 'IconMaximize',
  Hash: 'IconHash',
}

/**
 * Función helper para obtener el nombre del icono de Tabler
 * a partir del nombre de lucide-react
 */
export function getTablerIconName(lucideIconName: string): string {
  return iconMapping[lucideIconName] || lucideIconName
}

/**
 * Lista de iconos que no tienen equivalente directo en Tabler
 * (debe verificarse manualmente)
 */
export const unmappedIcons: string[] = [
  // Agregar aquí iconos que no se encuentren en Tabler
]

