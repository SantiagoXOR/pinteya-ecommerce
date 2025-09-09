// ===================================
// PINTEYA E-COMMERCE - MONITORING EXAMPLE
// Componente de ejemplo para demostrar el sistema de monitoreo
// ===================================

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRenderMonitoring, withRenderMonitoring } from '@/hooks/monitoring/useRenderMonitoring';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  Bug, 
  Clock, 
  MemoryStick, 
  RefreshCw, 
  Zap 
} from 'lucide-react';

// ===================================
// COMPONENTE DE EJEMPLO BÁSICO
// ===================================

const BasicMonitoringExample: React.FC = () => {
  const { toast } = useToast();
  const [counter, setCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Configurar monitoreo
  const { 
    trackError, 
    metrics, 
    isEnabled,
    alerts 
  } = useRenderMonitoring({
    componentName: 'BasicMonitoringExample',
    enabled: true,
    enableToasts: true,
    enableConsoleLogging: true,
    thresholds: {
      slowRenderThreshold: 10, // 10ms para demo
      maxRenderCount: 30, // 30 renders por minuto
      memoryThreshold: 50, // 50MB
      errorThreshold: 3 // 3 errores por minuto
    }
  });

  // Simular operación lenta
  const handleSlowOperation = () => {
    setIsLoading(true);
    
    // Simular trabajo pesado que causa render lento
    const start = performance.now();
    while (performance.now() - start < 50) {
      // Bloquear el hilo principal por 50ms
    }
    
    setCounter(prev => prev + 1);
    setIsLoading(false);
    
    toast({
      title: 'Operación Completada',
      description: 'Se ejecutó una operación que causa render lento'
    });
  };

  // Simular error
  const handleError = () => {
    try {
      // Simular error
      throw new Error('Error simulado para testing del monitoreo');
    } catch (error) {
      trackError(error as Error, {
        action: 'simulate_error',
        context: 'user_triggered'
      });
      
      toast({
        title: 'Error Simulado',
        description: 'Se generó un error para probar el sistema de monitoreo',
        variant: 'destructive'
      });
    }
  };

  // Simular render loop
  const handleRenderLoop = () => {
    // Forzar múltiples re-renders rápidos
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        setCounter(prev => prev + 1);
      }, i * 10);
    }
    
    toast({
      title: 'Render Loop Simulado',
      description: 'Se generaron múltiples renders rápidos'
    });
  };

  // Auto-increment para generar renders constantes
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 0.1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Ejemplo de Monitoreo Básico</span>
          {isEnabled && (
            <Badge variant="outline" className="text-green-600">
              Monitoreando
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Componente de ejemplo para demostrar el sistema de monitoreo de renderizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas del componente */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <RefreshCw className="h-4 w-4 mr-1" />
                Renders
              </p>
              <p className="text-2xl font-bold">{metrics.renderCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Tiempo Promedio
              </p>
              <p className="text-2xl font-bold">
                {metrics.averageRenderTime.toFixed(2)}ms
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Renders Lentos
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {metrics.slowRenders}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <Bug className="h-4 w-4 mr-1" />
                Errores
              </p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.errorCount}
              </p>
            </div>
          </div>
        )}

        {/* Memoria */}
        {metrics?.memoryUsage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <MemoryStick className="h-4 w-4 mr-1" />
                Uso de Memoria
              </span>
              <span>{metrics.memoryUsage.toFixed(2)} MB</span>
            </div>
            <Progress 
              value={Math.min((metrics.memoryUsage / 100) * 100, 100)} 
              className="h-2"
            />
          </div>
        )}

        {/* Alertas activas */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Alertas Activas ({alerts.filter(a => !a.resolved).length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(0, 3).map(alert => (
                <div 
                  key={alert.id} 
                  className={`text-xs p-2 rounded border ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="font-medium">{alert.type}</div>
                  <div className="text-muted-foreground">{alert.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles de prueba */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Controles de Prueba</h4>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleSlowOperation}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              Render Lento
            </Button>
            
            <Button 
              onClick={handleError}
              variant="outline"
              size="sm"
            >
              <Bug className="h-4 w-4 mr-1" />
              Simular Error
            </Button>
            
            <Button 
              onClick={handleRenderLoop}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Render Loop
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Counter:</strong> {counter.toFixed(1)}</p>
            <p><strong>Estado:</strong> {isLoading ? 'Procesando...' : 'Listo'}</p>
            <p><strong>Última actualización:</strong> {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ===================================
// COMPONENTE CON HOC
// ===================================

const SimpleComponent: React.FC<{ title: string }> = ({ title }) => {
  const [count, setCount] = useState(0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Componente envuelto con withRenderMonitoring HOC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-2xl font-bold">{count}</p>
          <Button onClick={() => setCount(c => c + 1)}>
            Incrementar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Envolver con HOC
const MonitoredSimpleComponent = withRenderMonitoring(SimpleComponent, {
  enabled: true,
  enableConsoleLogging: true
});

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const MonitoringExample: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Ejemplos de Sistema de Monitoreo
        </h2>
        <p className="text-muted-foreground">
          Componentes de ejemplo que demuestran las capacidades del sistema de monitoreo de renderizado
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <BasicMonitoringExample />
        <MonitoredSimpleComponent title="Componente con HOC" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Render Lento:</strong> Simula una operación que bloquea el hilo principal</p>
          <p><strong>Simular Error:</strong> Genera un error controlado para probar el tracking</p>
          <p><strong>Render Loop:</strong> Causa múltiples re-renders rápidos</p>
          <p><strong>Auto-increment:</strong> Genera renders constantes cada segundo</p>
          <p className="text-muted-foreground mt-4">
            Abre la consola del navegador para ver los logs detallados del monitoreo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringExample;