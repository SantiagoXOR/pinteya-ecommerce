// =====================================================
// COMPONENTE: CARRIER PERFORMANCE TABLE ENTERPRISE
// Descripción: Tabla de performance de couriers con métricas
// Basado en: shadcn/ui DataTable + Recharts
// =====================================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Download,
  Eye,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { CarrierPerformance } from '@/types/logistics';
import { cn } from '@/lib/core/utils';
import { formatCurrency, formatDate } from '@/lib/utils/consolidated-utils';

// =====================================================
// INTERFACES
// =====================================================

interface CarrierPerformanceTableProps {
  carriers: CarrierPerformance[];
  className?: string;
}

interface PerformanceRowProps {
  carrier: CarrierPerformance;
  rank: number;
  showDetails: boolean;
  onToggleDetails: () => void;
}

// =====================================================
// CONFIGURACIÓN
// =====================================================

const performanceThresholds = {
  excellent: 95,
  good: 85,
  average: 70,
  poor: 50
};

const getPerformanceLevel = (rate: number) => {
  if (rate >= performanceThresholds.excellent) {return 'excellent';}
  if (rate >= performanceThresholds.good) {return 'good';}
  if (rate >= performanceThresholds.average) {return 'average';}
  return 'poor';
};

const performanceConfig = {
  excellent: {
    label: 'Excelente',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Award
  },
  good: {
    label: 'Bueno',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: CheckCircle
  },
  average: {
    label: 'Regular',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  poor: {
    label: 'Deficiente',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertTriangle
  }
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function CarrierPerformanceTable({ carriers, className }: CarrierPerformanceTableProps) {
  const [sortBy, setSortBy] = useState<'on_time_rate' | 'total_shipments' | 'average_cost_per_shipment'>('on_time_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Ordenar carriers
  const sortedCarriers = [...carriers].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'desc') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });
  
  // Calcular estadísticas generales
  const totalShipments = carriers.reduce((acc, c) => acc + c.total_shipments, 0);
  const averageOnTimeRate = carriers.length > 0 
    ? carriers.reduce((acc, c) => acc + c.on_time_rate, 0) / carriers.length 
    : 0;
  const bestPerformer = carriers.reduce((best, current) => 
    current.on_time_rate > best.on_time_rate ? current : best
  );
  const worstPerformer = carriers.reduce((worst, current) => 
    current.on_time_rate < worst.on_time_rate ? current : worst
  );
  
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  const toggleRowExpansion = (carrierId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(carrierId)) {
      newExpanded.delete(carrierId);
    } else {
      newExpanded.add(carrierId);
    }
    setExpandedRows(newExpanded);
  };
  
  if (carriers.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay datos de performance disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Métricas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Envíos
                </p>
                <p className="text-2xl font-bold">{totalShipments.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Puntualidad Promedio
                </p>
                <p className="text-2xl font-bold">{averageOnTimeRate.toFixed(1)}%</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mejor Performer
                </p>
                <p className="text-lg font-bold truncate">{bestPerformer?.carrier_name}</p>
                <p className="text-sm text-green-600">{bestPerformer?.on_time_rate.toFixed(1)}%</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Necesita Mejora
                </p>
                <p className="text-lg font-bold truncate">{worstPerformer?.carrier_name}</p>
                <p className="text-sm text-red-600">{worstPerformer?.on_time_rate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabla principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance por Courier</CardTitle>
              <CardDescription>
                Métricas detalladas de rendimiento y eficiencia
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_time_rate">Puntualidad</SelectItem>
                  <SelectItem value="total_shipments">Total Envíos</SelectItem>
                  <SelectItem value="average_cost_per_shipment">Costo Promedio</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_shipments')}
                  >
                    <div className="flex items-center gap-1">
                      Envíos
                      {sortBy === 'total_shipments' && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Entregados</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('on_time_rate')}
                  >
                    <div className="flex items-center gap-1">
                      Puntualidad
                      {sortBy === 'on_time_rate' && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('average_cost_per_shipment')}
                  >
                    <div className="flex items-center gap-1">
                      Costo Promedio
                      {sortBy === 'average_cost_per_shipment' && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCarriers.map((carrier, index) => (
                  <PerformanceRow
                    key={carrier.carrier_id}
                    carrier={carrier}
                    rank={index + 1}
                    showDetails={expandedRows.has(carrier.carrier_id)}
                    onToggleDetails={() => toggleRowExpansion(carrier.carrier_id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// COMPONENTE PERFORMANCE ROW
// =====================================================

function PerformanceRow({ carrier, rank, showDetails, onToggleDetails }: PerformanceRowProps) {
  const performanceLevel = getPerformanceLevel(carrier.on_time_rate);
  const config = performanceConfig[performanceLevel];
  const Icon = config.icon;
  
  const deliveryRate = carrier.total_shipments > 0 
    ? (carrier.delivered_shipments / carrier.total_shipments) * 100 
    : 0;
  
  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center justify-center">
            {rank <= 3 ? (
              <Badge variant={rank === 1 ? "default" : "secondary"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                {rank}
              </Badge>
            ) : (
              <span className="text-muted-foreground">{rank}</span>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="font-medium">{carrier.carrier_name}</div>
        </TableCell>
        
        <TableCell>
          <div className="font-medium">{carrier.total_shipments.toLocaleString()}</div>
        </TableCell>
        
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium">{carrier.delivered_shipments.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {deliveryRate.toFixed(1)}% del total
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{carrier.on_time_rate.toFixed(1)}%</span>
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            <Progress value={carrier.on_time_rate} className="h-2" />
          </div>
        </TableCell>
        
        <TableCell>
          <div className="font-medium">{formatCurrency(carrier.average_cost_per_shipment)}</div>
        </TableCell>
        
        <TableCell>
          <Badge variant="outline" className={cn("text-xs", config.color, config.bgColor)}>
            {config.label}
          </Badge>
        </TableCell>
        
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDetails}
            className="w-8 h-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Fila expandida con detalles */}
      {showDetails && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/25">
            <div className="p-4 space-y-4">
              <h5 className="font-semibold">Detalles de Performance - {carrier.carrier_name}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-muted-foreground">Métricas de Entrega</h6>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Entregas a tiempo:</span>
                      <span className="font-medium">{carrier.on_time_deliveries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo promedio:</span>
                      <span className="font-medium">{carrier.average_delivery_time} días</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa de entrega:</span>
                      <span className="font-medium">{deliveryRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-muted-foreground">Métricas Financieras</h6>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ingresos totales:</span>
                      <span className="font-medium">{formatCurrency(carrier.total_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costo por envío:</span>
                      <span className="font-medium">{formatCurrency(carrier.average_cost_per_shipment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eficiencia costo:</span>
                      <span className="font-medium">
                        {carrier.total_shipments > 0 
                          ? (carrier.total_cost / carrier.total_shipments).toFixed(2)
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-muted-foreground">Calificación General</h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-5 h-5", config.color)} />
                      <span className={cn("font-medium", config.color)}>{config.label}</span>
                    </div>
                    <Progress value={carrier.on_time_rate} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      Basado en puntualidad y eficiencia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}









