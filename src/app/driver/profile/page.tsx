/**
 * Página de perfil del driver
 * Información personal, estadísticas y configuración
 */

'use client';


// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Truck, 
  Phone, 
  Mail,
  MapPin,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  Route,
  CheckCircle,
  Star,
  Edit,
  LogOut
} from 'lucide-react';
import { useDriver } from '@/contexts/DriverContext';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/core/utils';

export default function DriverProfilePage() {
  const { state, goOffline } = useDriver();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    // Desconectar al driver antes de cerrar sesión
    goOffline();
    
    // Cerrar sesión
    await signOut({
      callbackUrl: '/driver/login'
    });
  };

  const driver = state.driver;

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Estadísticas simuladas (en producción vendrían de la API)
  const stats = {
    totalDeliveries: 247,
    completedRoutes: 89,
    averageRating: 4.8,
    totalDistance: 1250,
    activeTime: '156h 30m',
    efficiency: 94
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Información del driver */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mi Perfil
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar y nombre */}
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-3">
              {driver.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{driver.name}</h2>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                state.isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-sm text-gray-600">
                {state.isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{driver.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{driver.phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Truck className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                {driver.vehicle_type} - {driver.license_plate}
              </span>
            </div>
            {driver.current_location && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {driver.current_location.lat.toFixed(4)}, {driver.current_location.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Estado del driver */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <Badge className={cn(
                driver.status === 'available' ? 'bg-green-100 text-green-800' :
                driver.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              )}>
                {driver.status === 'available' ? 'Disponible' :
                 driver.status === 'busy' ? 'Ocupado' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del driver */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas
          </CardTitle>
          <CardDescription>
            Resumen de tu desempeño como driver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDeliveries}</div>
              <div className="text-xs text-gray-600">Entregas Totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedRoutes}</div>
              <div className="text-xs text-gray-600">Rutas Completadas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-yellow-600">{stats.averageRating}</span>
              </div>
              <div className="text-xs text-gray-600">Calificación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.efficiency}%</div>
              <div className="text-xs text-gray-600">Eficiencia</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Route className="h-4 w-4 text-gray-400" />
                <span>{stats.totalDistance} km recorridos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{stats.activeTime} activo</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Preferencias de Notificaciones
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <MapPin className="mr-2 h-4 w-4" />
            Configuración de GPS
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Horarios de Trabajo
          </Button>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // Implementar funcionalidad de soporte
            window.open('mailto:soporte@pinteya.com?subject=Soporte Driver', '_blank');
          }}
        >
          <Phone className="mr-2 h-4 w-4" />
          Contactar Soporte
        </Button>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Información de la app */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">
            Pinteya Driver App v1.0.0
          </p>
          <p className="text-xs text-gray-500">
            © 2024 Pinteya E-commerce
          </p>
        </CardContent>
      </Card>
    </div>
  );
}









