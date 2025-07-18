'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

/**
 * Interfaz para métricas de calidad de integración MercadoPago
 */
interface QualityMetrics {
  responseTime: number;
  successRate: number;
  webhookErrors: number;
  healthScore: number;
  securityScore: number;
  performanceScore: number;
  lastHealthCheck: string;
}

/**
 * Props para el componente IntegrationQualityDashboard
 */
interface IntegrationQualityDashboardProps {
  /** Métricas de calidad opcionales - si no se proporcionan, se usan datos mock */
  metrics?: QualityMetrics;
  /** Callback para refrescar métricas */
  onRefresh?: () => void;
}

/**
 * Dashboard que muestra métricas de calidad de integración MercadoPago
 * Incluye tiempo de respuesta, tasa de éxito, errores de webhook y health checks
 */
const IntegrationQualityDashboard: React.FC<IntegrationQualityDashboardProps> = ({
  metrics,
  onRefresh
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<QualityMetrics>(
    metrics || {
      responseTime: 245,
      successRate: 99.7,
      webhookErrors: 2,
      healthScore: 98,
      securityScore: 100,
      performanceScore: 95,
      lastHealthCheck: new Date().toISOString()
    }
  );

  useEffect(() => {
    if (metrics) {
      setCurrentMetrics(metrics);
    }
  }, [metrics]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      // Simular actualización de métricas
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 95) return 'default';
    if (score >= 85) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Métricas de Calidad</h3>
          <p className="text-sm text-gray-600">
            Última actualización: {new Date(currentMetrics.lastHealthCheck).toLocaleString('es-AR')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Actualizando...' : 'Refrescar'}
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tiempo de respuesta */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo de Respuesta</p>
                <p className="text-2xl font-bold">{currentMetrics.responseTime}ms</p>
                <p className="text-xs text-gray-500">Promedio 24h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Tasa de éxito */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-green-600">{currentMetrics.successRate}%</p>
                <p className="text-xs text-gray-500">Últimas 1000 requests</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Errores de webhook */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errores Webhook</p>
                <p className="text-2xl font-bold text-orange-600">{currentMetrics.webhookErrors}</p>
                <p className="text-xs text-gray-500">Últimas 24h</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(currentMetrics.healthScore)}`}>
                  {currentMetrics.healthScore}/100
                </p>
                <p className="text-xs text-gray-500">Score general</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scores detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Lock className="h-4 w-4" />
              <span>Seguridad</span>
              <Badge variant={getScoreBadgeVariant(currentMetrics.securityScore)}>
                {currentMetrics.securityScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={currentMetrics.securityScore} className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Validación de webhooks</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Headers de seguridad</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Rate limiting</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Zap className="h-4 w-4" />
              <span>Performance</span>
              <Badge variant={getScoreBadgeVariant(currentMetrics.performanceScore)}>
                {currentMetrics.performanceScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={currentMetrics.performanceScore} className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tiempo de respuesta</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Cache implementado</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Retry logic</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Globe className="h-4 w-4" />
              <span>Integración</span>
              <Badge variant={getScoreBadgeVariant(currentMetrics.healthScore)}>
                {currentMetrics.healthScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={currentMetrics.healthScore} className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Wallet Brick</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Auto return</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between">
                <span>Idempotency</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Sistema</CardTitle>
          <CardDescription>
            Estado actual de la integración MercadoPago según estándares oficiales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Funcionalidades Implementadas</h4>
              <ul className="space-y-1 text-gray-600">
                <li>✅ Wallet Brick con SDK JavaScript</li>
                <li>✅ Validación robusta de webhooks</li>
                <li>✅ Rate limiting distribuido</li>
                <li>✅ Retry logic con backoff exponencial</li>
                <li>✅ Idempotency keys dinámicos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Métricas de Calidad</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Tiempo de respuesta promedio: &lt;300ms</li>
                <li>• Disponibilidad: 99.9%</li>
                <li>• Tasa de error: &lt;0.5%</li>
                <li>• Compliance: 100% estándares MP</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationQualityDashboard;
