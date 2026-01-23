/**
 * ⚡ PERFORMANCE: Wrapper centralizado para lazy loading de Recharts
 * 
 * Este módulo exporta todos los componentes de Recharts con lazy loading consistente.
 * Esto asegura que Recharts solo se cargue cuando sea necesario (async), reduciendo
 * el tamaño del bundle inicial.
 * 
 * Uso:
 * ```tsx
 * import { BarChart, Bar, XAxis, YAxis } from '@/lib/recharts-lazy'
 * ```
 * 
 * Todos los componentes tienen:
 * - ssr: false (Recharts requiere DOM)
 * - Loading states consistentes
 * - Error boundaries (manejados por Next.js dynamic)
 */

import dynamic from 'next/dynamic'

// Componente de loading común para todos los gráficos
const ChartLoading = () => (
  <div className='flex items-center justify-center h-full min-h-[200px]'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
      <p className='text-sm text-muted-foreground'>Cargando gráfico...</p>
    </div>
  </div>
)

// ⚡ IMPORTANTE: Next.js requiere que las opciones de dynamic() sean objetos literales
// No podemos usar una constante compartida, cada dynamic() debe tener su propio objeto literal

// ===================================
// COMPONENTES DE GRÁFICOS
// ===================================

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const RadarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.RadarChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ScatterChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ScatterChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ComposedChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ComposedChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const FunnelChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.FunnelChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Treemap = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Treemap })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Sankey = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Sankey })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// ===================================
// COMPONENTES DE ELEMENTOS DE GRÁFICOS
// ===================================

export const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Area = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Cell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Radar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Radar })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Scatter = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Scatter })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Funnel = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Funnel })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Label = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Label })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const LabelList = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LabelList })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// ===================================
// COMPONENTES DE EJES Y GRID
// ===================================

export const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ZAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ZAxis })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const PolarGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarGrid })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const PolarAngleAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarAngleAxis })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarRadiusAxis })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// ===================================
// COMPONENTES DE INTERACCIÓN
// ===================================

export const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Legend = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Legend })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const Brush = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Brush })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ReferenceLine = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ReferenceLine })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ReferenceDot = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ReferenceDot })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ReferenceArea = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ReferenceArea })),
  { ssr: false, loading: () => <ChartLoading /> }
)

export const ErrorBar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ErrorBar })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// ===================================
// COMPONENTES DE CONTENEDOR
// ===================================

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// ===================================
// TIPOS (re-export para TypeScript)
// ===================================

// Re-exportar tipos comunes de Recharts si es necesario
// Nota: Los tipos se pueden importar directamente desde 'recharts' sin afectar el bundle
export type {
  // Tipos de datos comunes
  TooltipProps,
  LegendProps,
  // Tipos de componentes
  BarProps,
  LineProps,
  AreaProps,
  PieProps,
  // Tipos de contenedores
  ResponsiveContainerProps,
} from 'recharts'
