/**
 * Página del Dashboard Enterprise Completo
 * Integra todos los sistemas de optimización y monitoreo
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EnterpriseMonitoringDashboard from '@/components/Dashboard/EnterpriseMonitoringDashboard';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Server,
  TestTube,
  Bell,
  BarChart3,
  TrendingUp,
  Eye,
  Lock
} from 'lucide-react';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface SystemStatus {
  name: string;
  status: 'initializing' | 'running' | 'error' | 'stopped';
  version: string;
  startTime?: string;
  error?: string;
  metrics?: any;
}

interface InitializationResult {
  success: boolean;
  systems: SystemStatus[];
  totalTime: number;
  errors: string[];
  warnings: string[];
}

interface AlertInfo {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: string;
}

// =====================================================
// COMPONENTES
// =====================================================

const SystemStatusCard: React.FC<{ system: SystemStatus }> = ({ system }) => {
  const getStatusColor = () => {
    switch (system.status) {
      case 'running': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'initializing': return 'text-yellow-600 bg-yellow-50';
      case 'stopped': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (system.status) {
      case 'running': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'initializing': return <Clock className="w-4 h-4" />;
      case 'stopped': return <Server className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (system.status) {
      case 'running': return 'Funcionando';
      case 'error': return 'Error';
      case 'initializing': return 'Inicializando';
      case 'stopped': return 'Detenido';
      default: return 'Desconocido';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{system.name}</h3>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs font-medium">{getStatusText()}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Versión:</span>
            <span className="font-medium">{system.version}</span>
          </div>
          
          {system.startTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Inicio:</span>
              <span className="font-medium">{new Date(system.startTime).toLocaleTimeString()}</span>
            </div>
          )}
          
          {system.error && (
            <div className="mt-2">
              <span className="text-red-600 text-xs">{system.error}</span>
            </div>
          )}
          
          {system.metrics && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {Object.keys(system.metrics).length} métricas disponibles
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AlertCard: React.FC<{ alert: AlertInfo }> = ({ alert }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = () => {
    switch (alert.status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
          <div className="flex space-x-1">
            <Badge className={getSeverityColor()}>{alert.severity}</Badge>
            <Badge className={getStatusColor()}>{alert.status}</Badge>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          <div>Categoría: {alert.category}</div>
          <div>Activada: {new Date(alert.triggeredAt).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function EnterpriseMonitoringPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar estado inicial
  useEffect(() => {
    loadSystemStatus();
    loadAlerts();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/initialize-enterprise');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.data.systems || []);
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // Simular carga de alertas - en producción vendría de la API
      const mockAlerts: AlertInfo[] = [
        {
          id: '1',
          title: 'Alto uso de memoria detectado',
          severity: 'high',
          category: 'capacity',
          status: 'active',
          triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Tasa de cache hit baja',
          severity: 'medium',
          category: 'performance',
          status: 'acknowledged',
          triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const initializeEnterpriseSystems = async () => {
    setIsInitializing(true);
    setInitResult(null);

    try {
      const response = await fetch('/api/admin/system/initialize-enterprise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setInitResult(data.data);
      
      if (data.success) {
        await loadSystemStatus();
      }
    } catch (error) {
      console.error('Error initializing systems:', error);
      setInitResult({
        success: false,
        systems: [],
        totalTime: 0,
        errors: ['Error de conexión al inicializar sistemas'],
        warnings: []
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const runSystemTests = async () => {
    try {
      // Simular ejecución de tests
      console.log('Running system tests...');
      // En producción, esto haría una llamada a la API de tests
    } catch (error) {
      console.error('Error running tests:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-600">Cargando dashboard enterprise...</span>
        </div>
      </div>
    );
  }

  const runningSystems = systemStatus.filter(s => s.status === 'running').length;
  const totalSystems = systemStatus.length;
  const healthScore = totalSystems > 0 ? (runningSystems / totalSystems) * 100 : 0;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Enterprise</h1>
          <p className="text-gray-600">
            Sistema completo de optimización y monitoreo enterprise
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={runSystemTests} 
            variant="outline" 
            size="sm"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Ejecutar Tests
          </Button>
          <Button 
            onClick={initializeEnterpriseSystems} 
            disabled={isInitializing}
            size="sm"
          >
            {isInitializing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isInitializing ? 'Inicializando...' : 'Inicializar Sistemas'}
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salud del Sistema</p>
                <p className="text-2xl font-bold text-gray-900">{healthScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{runningSystems}/{totalSystems} sistemas</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{activeAlerts}</p>
                <p className="text-xs text-gray-500">de {alerts.length} totales</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sistemas Activos</p>
                <p className="text-2xl font-bold text-gray-900">{runningSystems}</p>
                <p className="text-xs text-gray-500">funcionando correctamente</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Actualización</p>
                <p className="text-2xl font-bold text-gray-900">{new Date().toLocaleTimeString()}</p>
                <p className="text-xs text-gray-500">tiempo real</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado de inicialización */}
      {initResult && (
        <Alert className={initResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className="flex items-center">
            {initResult.success ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className="ml-2">
              <strong>
                {initResult.success ? 'Inicialización Exitosa' : 'Inicialización con Errores'}
              </strong>
              <div className="mt-1 text-sm">
                {initResult.success ? (
                  `${initResult.systems.length} sistemas inicializados en ${initResult.totalTime}ms`
                ) : (
                  `${initResult.errors.length} errores encontrados`
                )}
              </div>
              {initResult.errors.length > 0 && (
                <div className="mt-2">
                  <ul className="text-xs space-y-1">
                    {initResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {initResult.warnings.length > 0 && (
                <div className="mt-2">
                  <ul className="text-xs space-y-1">
                    {initResult.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-600">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado de sistemas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-600" />
                  Estado de Sistemas Enterprise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemStatus.map((system, index) => (
                    <SystemStatusCard key={index} system={system} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertas recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-red-600" />
                  Alertas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay alertas activas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Sistemas */}
        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemStatus.map((system, index) => (
              <SystemStatusCard key={index} system={system} />
            ))}
          </div>
        </TabsContent>

        {/* Tab Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </TabsContent>

        {/* Tab Monitoreo */}
        <TabsContent value="monitoring" className="space-y-6">
          <EnterpriseMonitoringDashboard />
        </TabsContent>

        {/* Tab Testing */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="w-5 h-5 mr-2 text-green-600" />
                Testing Automatizado Enterprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Testing Automatizado</h3>
                <p className="text-gray-600 mb-4">
                  Tests continuos de seguridad, performance e integración ejecutándose en segundo plano
                </p>
                <Button onClick={runSystemTests}>
                  <Play className="w-4 h-4 mr-2" />
                  Ejecutar Suite Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
