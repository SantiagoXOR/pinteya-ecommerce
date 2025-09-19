/**
 * Dashboard de información de ruta para navegación GPS
 * Muestra métricas en tiempo real, velocidad, distancia, tiempo y alertas de tráfico
 */

'use client';

import React from 'react';
import { Clock, Navigation, MapPin, AlertTriangle, Route, Gauge, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/core/utils';

interface RouteInfo {
  totalDistance: string;
  totalDuration: string;
  remainingDistance: string;
  remainingDuration: string;
  averageSpeed: number;
  currentSpeed: number;
  elapsedTime: number;
  eta: Date | null;
  trafficDelay: number;
}

interface RouteInfoDashboardProps {
  routeInfo: RouteInfo;
  isNavigating: boolean;
  showTrafficLayer: boolean;
  onToggleTrafficLayer: () => void;
  className?: string;
}

export function RouteInfoDashboard({
  routeInfo,
  isNavigating,
  showTrafficLayer,
  onToggleTrafficLayer,
  className
}: RouteInfoDashboardProps) {
  if (!isNavigating) return null;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeedColor = (speed: number): string => {
    if (speed === 0) return 'text-gray-500';
    if (speed < 30) return 'text-red-600';
    if (speed < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg p-4 border border-gray-200",
      className
    )}>
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Velocidad Actual */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Gauge className={cn("w-4 h-4 mr-1", getSpeedColor(routeInfo.currentSpeed))} />
            <span className={cn("text-lg font-bold", getSpeedColor(routeInfo.currentSpeed))}>
              {routeInfo.currentSpeed}
            </span>
            <span className="text-sm text-gray-600 ml-1">km/h</span>
          </div>
          <div className="text-xs text-gray-600">Velocidad</div>
        </div>

        {/* Distancia Restante */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MapPin className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {routeInfo.remainingDistance}
            </span>
          </div>
          <div className="text-xs text-gray-600">Distancia</div>
        </div>

        {/* Tiempo Restante */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-orange-600 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {routeInfo.remainingDuration}
            </span>
          </div>
          <div className="text-xs text-gray-600">Tiempo</div>
        </div>

        {/* ETA */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Navigation className="w-4 h-4 text-purple-600 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {routeInfo.eta ? routeInfo.eta.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : '--:--'}
            </span>
          </div>
          <div className="text-xs text-gray-600">ETA</div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="border-t border-gray-200 pt-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-gray-600">
              Promedio: <span className="font-medium">{routeInfo.averageSpeed} km/h</span>
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-gray-600">
              Transcurrido: <span className="font-medium">{formatTime(routeInfo.elapsedTime)}</span>
            </span>
          </div>
        </div>

        {/* Información de ruta total */}
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Route className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-gray-600">
              Total: <span className="font-medium">{routeInfo.totalDistance}</span>
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-gray-600">
              Duración: <span className="font-medium">{routeInfo.totalDuration}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de tráfico */}
      {routeInfo.trafficDelay > 5 && (
        <div className="mt-3 flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <div className="text-center">
            <div className="text-sm font-medium text-yellow-800">
              Demora por tráfico
            </div>
            <div className="text-lg font-bold text-yellow-900">
              +{routeInfo.trafficDelay} minutos
            </div>
          </div>
        </div>
      )}

      {/* Control de Traffic Layer */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={onToggleTrafficLayer}
          className={cn(
            "w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "flex items-center justify-center space-x-2",
            showTrafficLayer
              ? "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <Route className="w-4 h-4" />
          <span>
            {showTrafficLayer ? 'Ocultar' : 'Mostrar'} Información de Tráfico
          </span>
        </button>
      </div>

      {/* Indicador de estado de navegación */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Navegación GPS Activa</span>
        </div>
      </div>
    </div>
  );
}









