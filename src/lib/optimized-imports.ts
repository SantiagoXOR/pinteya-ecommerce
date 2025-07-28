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
// En lugar de importar todos los iconos, importamos solo los que necesitamos

// Iconos de navegación y UI básica
export {
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
  MapPin,
  Phone,
  Mail,
  Star,
  StarHalf,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Clock,
  Calendar,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Share2,
  Copy,
  Download,
  Upload,
  Edit,
  Trash2,
  Settings,
  HelpCircle,
  ExternalLink,
  Zap,
  Package,
  Truck,
  Shield,
  Award,
  Gift,
  Percent,
  Tag,
  CreditCard,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Building,
  Store,
  Warehouse,
  Factory,
  Paintbrush,
  Hammer,
  Wrench,
  Screwdriver,
  Drill,
  Ruler,
  Palette,
  Brush,
  Spray,
  Droplets,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Wind,
  Thermometer,
  Gauge,
  Timer,
  Stopwatch,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Maximize,
  Minimize,
  FullScreen,
  Compress,
  Expand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Grab,
  Hand,
  MousePointer,
  TouchPad,
  Keyboard,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  WifiOff,
  Bluetooth,
  Usb,
  Cable,
  Plug,
  Battery,
  BatteryLow,
  Power,
  PowerOff,
  Refresh,
  RefreshCw,
  RotateCcw as Undo,
  RotateCw as Redo,
  Save,
  FileText,
  File,
  Folder,
  FolderOpen,
  Archive,
  Paperclip,
  Link,
  Unlink,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Shield as Security,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  XCircle,
  MinusCircle,
  PlusCircle,
  HelpCircle as Help,
  MessageCircle,
  MessageSquare,
  Send,
  Reply,
  Forward,
  Bookmark,
  BookmarkPlus,
  Flag,
  Pin,
  PinOff,
  Paperclip as Attach,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Scan,
  QrCode,
  Barcode,
  Hash,
  AtSign,
  Globe,
  Navigation,
  Compass,
  Map,
  Route,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ship,
  Anchor,
  Fuel,
  ParkingCircle,
  Traffic,
  Construction,
  Cone,
  Barrier,
  RoadSign,
  Signpost,
  Milestone,
  Target,
  Focus,
  Crosshair,
  Scope,
  Radar,
  Satellite,
  Radio,
  Antenna,
  Signal,
  Rss,
  Podcast,
  Headset,
  Gamepad2,
  Joystick,
  Dices,
  Puzzle,
  Trophy,
  Medal,
  Crown,
  Gem,
  Diamond,
  Coins,
  Banknote,
  Receipt,
  Calculator,
  Abacus,
  Scale,
  Balance,
  Weight,
  Ruler as Measure,
  Triangle,
  Square as Rectangle,
  Circle,
  Pentagon,
  Hexagon,
  Octagon,
  Shapes,
  Box,
  Package2,
  Container,
  Layers,
  Stack,
  Group,
  Ungroup,
  Combine,
  Separate,
  Merge,
  Split,
  Divide,
  Multiply,
  Subtract,
  Add,
  Equals,
  NotEqual,
  LessThan,
  GreaterThan,
  LessEqual,
  GreaterEqual,
  Percent as Percentage,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Lambda,
  Omega,
  Phi,
  Psi,
  Chi,
  Theta,
  Mu,
  Nu,
  Xi,
  Rho,
  Tau,
  Upsilon,
  Zeta,
  Eta,
  Iota,
  Kappa
} from 'lucide-react';

// ===================================
// DATE-FNS OPTIMIZED IMPORTS
// ===================================
// Solo importamos las funciones que realmente necesitamos

export {
  format,
  formatDistance,
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
