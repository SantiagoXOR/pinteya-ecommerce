'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CreditCard,
  Calendar,
  Users,
  ShoppingCart,
  Target
} from 'lucide-react';

/**
 * Interfaz para datos de reportes de MercadoPago
 */
interface ReportsData {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  conversionRate: number;
  topPaymentMethods: Array<{
    method: string;
    percentage: number;
    amount: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    amount: number;
    transactions: number;
  }>;
  dateRange: {
    from: string;
    to: string;
  };
}

/**
 * Props para el componente MercadoPagoReportsDashboard
 */
interface MercadoPagoReportsDashboardProps {
  /** Datos de reportes opcionales - si no se proporcionan, se usan datos mock */
  data?: ReportsData;
  /** Rango de fechas para filtrar */
  dateRange?: { from: Date; to: Date };
  /** Filtros adicionales */
  filters?: Record<string, any>;
  /** Callback para actualizar datos */
  onDataUpdate?: (filters: any) => void;
}

/**
 * Dashboard para reportes y analytics de transacciones MercadoPago
 * Muestra volumen de ventas, métodos de pago, conversiones y métricas clave
 */
const MercadoPagoReportsDashboard: React.FC<MercadoPagoReportsDashboardProps> = ({
  data,
  dateRange,
  filters,
  onDataUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [currentData, setCurrentData] = useState<ReportsData>(
    data || {
      totalSales: 125430.50,
      totalTransactions: 342,
      averageOrderValue: 366.75,
      conversionRate: 3.2,
      topPaymentMethods: [
        { method: 'Tarjeta de Crédito', percentage: 45.2, amount: 56694.63 },
        { method: 'Tarjeta de Débito', percentage: 28.7, amount: 35998.52 },
        { method: 'Transferencia', percentage: 15.1, amount: 18940.07 },
        { method: 'Efectivo', percentage: 11.0, amount: 13797.28 }
      ],
      salesByPeriod: [
        { period: 'Lun', amount: 15230.50, transactions: 42 },
        { period: 'Mar', amount: 18940.25, transactions: 51 },
        { period: 'Mié', amount: 22150.75, transactions: 63 },
        { period: 'Jue', amount: 19875.30, transactions: 55 },
        { period: 'Vie', amount: 25680.40, transactions: 71 },
        { period: 'Sáb', amount: 12890.15, transactions: 35 },
        { period: 'Dom', amount: 10663.15, transactions: 25 }
      ],
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    }
  );

  useEffect(() => {
    if (data) {
      setCurrentData(data);
    }
  }, [data]);

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    setIsLoading(true);
    
    try {
      if (onDataUpdate) {
        await onDataUpdate({ period, ...filters });
      }
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error updating data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros de período */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Reportes de MercadoPago</h3>
          <p className="text-sm text-gray-600">
            Período: {new Date(currentData.dateRange.from).toLocaleDateString('es-AR')} - {new Date(currentData.dateRange.to).toLocaleDateString('es-AR')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              disabled={isLoading}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {period === '7d' && 'Últimos 7 días'}
              {period === '30d' && 'Últimos 30 días'}
              {period === '90d' && 'Últimos 90 días'}
              {period === '1y' && 'Último año'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas totales */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentData.totalSales)}
                </p>
                <p className="text-xs text-gray-500">+12.5% vs período anterior</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Transacciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-blue-600">{currentData.totalTransactions}</p>
                <p className="text-xs text-gray-500">+8.3% vs período anterior</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Valor promedio de orden */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AOV</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(currentData.averageOrderValue)}
                </p>
                <p className="text-xs text-gray-500">+3.7% vs período anterior</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Tasa de conversión */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversión</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatPercentage(currentData.conversionRate)}
                </p>
                <p className="text-xs text-gray-500">+0.8% vs período anterior</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Ventas por Día</span>
            </CardTitle>
            <CardDescription>
              Distribución de ventas en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentData.salesByPeriod.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-8">{item.period}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.amount / Math.max(...currentData.salesByPeriod.map(s => s.amount))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-500">{item.transactions} transacciones</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métodos de pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Métodos de Pago</span>
            </CardTitle>
            <CardDescription>
              Distribución por tipo de método de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentData.topPaymentMethods.map((method, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{method.method}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatPercentage(method.percentage)}</span>
                      <p className="text-xs text-gray-500">{formatCurrency(method.amount)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Insights y Recomendaciones</CardTitle>
          <CardDescription>
            Análisis automático basado en los datos de MercadoPago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Tendencias Positivas
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Incremento del 12.5% en ventas totales</li>
                <li>• Mejora en la tasa de conversión (+0.8%)</li>
                <li>• Crecimiento en el valor promedio de orden</li>
                <li>• Mayor adopción de pagos digitales</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                Oportunidades de Mejora
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Optimizar checkout para móviles</li>
                <li>• Promover métodos de pago con menor comisión</li>
                <li>• Implementar descuentos por volumen</li>
                <li>• Mejorar tiempo de procesamiento</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoPagoReportsDashboard;
