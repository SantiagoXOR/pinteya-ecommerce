// =====================================================
// COMPONENTE: PERFORMANCE CHART ENTERPRISE
// Descripción: Gráficos de performance para logística
// Basado en: Recharts + shadcn/ui
// =====================================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Download
} from 'lucide-react';
import { PerformanceMetric } from '@/types/logistics';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils/format';

// =====================================================
// INTERFACES
// =====================================================

interface PerformanceChartProps {
  data: PerformanceMetric[];
  height?: number;
  showDetails?: boolean;
  className?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// =====================================================
// CONFIGURACIÓN DE COLORES
// =====================================================

const chartColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280'
};

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PerformanceChart({
  data,
  height = 300,
  showDetails = false,
  className
}: PerformanceChartProps) {
  
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Filtrar datos según el rango de tiempo
  const filteredData = data.slice(-parseInt(timeRange));
  
  // Calcular métricas derivadas
  const processedData = filteredData.map(item => ({
    ...item,
    date_formatted: formatDate(item.date, 'short'),
    on_time_rate: item.delivered_count > 0 
      ? (item.on_time_count / item.delivered_count) * 100 
      : 0,
    delivery_rate: item.shipments_count > 0 
      ? (item.delivered_count / item.shipments_count) * 100 
      : 0,
    average_cost_per_shipment: item.shipments_count > 0 
      ? item.total_cost / item.shipments_count 
      : 0
  }));
  
  // Calcular totales y tendencias
  const totals = processedData.reduce((acc, item) => ({
    shipments: acc.shipments + item.shipments_count,
    delivered: acc.delivered + item.delivered_count,
    onTime: acc.onTime + item.on_time_count,
    cost: acc.cost + item.total_cost
  }), { shipments: 0, delivered: 0, onTime: 0, cost: 0 });
  
  const averages = {
    onTimeRate: totals.delivered > 0 ? (totals.onTime / totals.delivered) * 100 : 0,
    deliveryRate: totals.shipments > 0 ? (totals.delivered / totals.shipments) * 100 : 0,
    costPerShipment: totals.shipments > 0 ? totals.cost / totals.shipments : 0
  };
  
  // Calcular tendencia (últimos 7 días vs anteriores)
  const recentData = processedData.slice(-7);
  const previousData = processedData.slice(-14, -7);
  
  const recentAvg = recentData.reduce((acc, item) => acc + item.shipments_count, 0) / recentData.length;
  const previousAvg = previousData.reduce((acc, item) => acc + item.shipments_count, 0) / previousData.length;
  const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Líneas</SelectItem>
              <SelectItem value="area">Área</SelectItem>
              <SelectItem value="bar">Barras</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={trend > 0 ? "default" : "secondary"} className="flex items-center gap-1">
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </Badge>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Métricas resumen */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totals.shipments}</div>
              <p className="text-sm text-muted-foreground">Total Envíos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{averages.deliveryRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Tasa Entrega</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{averages.onTimeRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Puntualidad</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(averages.costPerShipment)}</div>
              <p className="text-sm text-muted-foreground">Costo Promedio</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Gráficos */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shipments">Envíos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costos</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
        </TabsList>
        
        {/* Tab: Envíos */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Volumen de Envíos
              </CardTitle>
              <CardDescription>
                Envíos creados y entregados por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={height}>
                {chartType === 'line' && (
                  <LineChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_formatted" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="shipments_count" 
                      stroke={chartColors.primary} 
                      strokeWidth={2}
                      name="Envíos Creados"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="delivered_count" 
                      stroke={chartColors.secondary} 
                      strokeWidth={2}
                      name="Envíos Entregados"
                    />
                  </LineChart>
                )}
                
                {chartType === 'area' && (
                  <AreaChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_formatted" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="shipments_count" 
                      stackId="1"
                      stroke={chartColors.primary} 
                      fill={chartColors.primary}
                      fillOpacity={0.6}
                      name="Envíos Creados"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="delivered_count" 
                      stackId="2"
                      stroke={chartColors.secondary} 
                      fill={chartColors.secondary}
                      fillOpacity={0.6}
                      name="Envíos Entregados"
                    />
                  </AreaChart>
                )}
                
                {chartType === 'bar' && (
                  <BarChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_formatted" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="shipments_count" 
                      fill={chartColors.primary}
                      name="Envíos Creados"
                    />
                    <Bar 
                      dataKey="delivered_count" 
                      fill={chartColors.secondary}
                      name="Envíos Entregados"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Tasa de entrega y puntualidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={height}>
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_formatted" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<PerformanceTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="delivery_rate" 
                    stroke={chartColors.secondary} 
                    strokeWidth={2}
                    name="Tasa de Entrega (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="on_time_rate" 
                    stroke={chartColors.accent} 
                    strokeWidth={2}
                    name="Puntualidad (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Costos */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Costos</CardTitle>
              <CardDescription>
                Costo total y promedio por envío
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_formatted" />
                  <YAxis />
                  <Tooltip content={<CostTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_cost" 
                    stroke={chartColors.accent} 
                    fill={chartColors.accent}
                    fillOpacity={0.6}
                    name="Costo Total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Distribución */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Estados</CardTitle>
              <CardDescription>
                Proporción de envíos por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Entregados', value: totals.delivered, color: chartColors.secondary },
                      { name: 'En Tránsito', value: totals.shipments - totals.delivered, color: chartColors.primary }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Entregados', value: totals.delivered, color: chartColors.secondary },
                      { name: 'En Tránsito', value: totals.shipments - totals.delivered, color: chartColors.primary }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// COMPONENTES DE TOOLTIP PERSONALIZADOS
// =====================================================

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function PerformanceTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function CostTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
