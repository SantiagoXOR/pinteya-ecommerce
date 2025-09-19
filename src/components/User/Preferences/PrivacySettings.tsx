'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, UserCheck, Download, Trash2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';

export function PrivacySettings() {
  const {
    preferences,
    isLoading,
    updateSection,
  } = useUserPreferences();

  const privacyPrefs = preferences?.privacy || {
    profileVisibility: 'private',
    activityTracking: true,
    marketingConsent: false,
    dataCollection: true,
    thirdPartySharing: false,
    analyticsOptOut: false,
  };

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateSection('privacy', {
        ...privacyPrefs,
        [key]: value,
      });
      toast.success('Preferencia de privacidad actualizada');
    } catch (error) {
      toast.error('Error al actualizar preferencia');
    }
  };

  const handleDataExport = async () => {
    try {
      toast.info('Preparando exportación de datos...');
      // Aquí iría la lógica para exportar datos
      setTimeout(() => {
        toast.success('Exportación iniciada. Recibirás un email con el enlace de descarga.');
      }, 2000);
    } catch (error) {
      toast.error('Error al exportar datos');
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      try {
        toast.info('Procesando solicitud de eliminación...');
        // Aquí iría la lógica para eliminar cuenta
        setTimeout(() => {
          toast.success('Solicitud de eliminación enviada. Recibirás un email de confirmación.');
        }, 2000);
      } catch (error) {
        toast.error('Error al procesar solicitud');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Configuración de Privacidad
        </h3>
        <p className="text-sm text-gray-600">
          Controla cómo se recopilan, utilizan y comparten tus datos personales.
        </p>
      </div>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Visibilidad del Perfil
          </CardTitle>
          <CardDescription>
            Controla quién puede ver tu información de perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility">Perfil público</Label>
              <p className="text-sm text-gray-600">
                Permitir que otros usuarios vean tu perfil básico
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={privacyPrefs.profileVisibility === 'public'}
              onCheckedChange={(checked) => 
                handleToggle('profileVisibility', checked ? 'public' : 'private')
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Recopilación de Datos
          </CardTitle>
          <CardDescription>
            Configura qué datos pueden ser recopilados para mejorar tu experiencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activity-tracking">Seguimiento de actividad</Label>
              <p className="text-sm text-gray-600">
                Permitir el seguimiento de tu actividad para personalizar la experiencia
              </p>
            </div>
            <Switch
              id="activity-tracking"
              checked={privacyPrefs.activityTracking}
              onCheckedChange={(checked) => handleToggle('activityTracking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-collection">Recopilación de datos de uso</Label>
              <p className="text-sm text-gray-600">
                Permitir la recopilación de datos anónimos para mejorar el servicio
              </p>
            </div>
            <Switch
              id="data-collection"
              checked={privacyPrefs.dataCollection}
              onCheckedChange={(checked) => handleToggle('dataCollection', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-opt-out">Excluir de analytics</Label>
              <p className="text-sm text-gray-600">
                Optar por no participar en análisis de comportamiento
              </p>
            </div>
            <Switch
              id="analytics-opt-out"
              checked={privacyPrefs.analyticsOptOut}
              onCheckedChange={(checked) => handleToggle('analyticsOptOut', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing and Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Marketing y Compartir Datos
          </CardTitle>
          <CardDescription>
            Controla cómo se utilizan tus datos para marketing y si se comparten con terceros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-consent">Consentimiento de marketing</Label>
              <p className="text-sm text-gray-600">
                Permitir el uso de tus datos para campañas de marketing personalizadas
              </p>
            </div>
            <Switch
              id="marketing-consent"
              checked={privacyPrefs.marketingConsent}
              onCheckedChange={(checked) => handleToggle('marketingConsent', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="third-party-sharing">Compartir con terceros</Label>
              <p className="text-sm text-gray-600">
                Permitir compartir datos anónimos con socios comerciales
              </p>
            </div>
            <Switch
              id="third-party-sharing"
              checked={privacyPrefs.thirdPartySharing}
              onCheckedChange={(checked) => handleToggle('thirdPartySharing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Derechos sobre tus Datos
          </CardTitle>
          <CardDescription>
            Ejercer tus derechos sobre los datos personales que tenemos almacenados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Exportar mis datos</h4>
              <p className="text-sm text-gray-600 mb-3">
                Descarga una copia de todos tus datos personales en formato JSON.
              </p>
              <Button variant="outline" onClick={handleDataExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar datos
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Eliminar mi cuenta</h4>
              <p className="text-sm text-gray-600 mb-3">
                Eliminar permanentemente tu cuenta y todos los datos asociados.
                Esta acción no se puede deshacer.
              </p>
              <Button variant="destructive" onClick={handleAccountDeletion}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar cuenta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Compromiso con tu Privacidad
              </h4>
              <p className="text-sm text-blue-800">
                Respetamos tu privacidad y cumplimos con las regulaciones de protección de datos.
                Para más información, consulta nuestra{' '}
                <a href="/privacy" className="underline hover:no-underline">
                  Política de Privacidad
                </a>{' '}
                y nuestros{' '}
                <a href="/terms" className="underline hover:no-underline">
                  Términos de Servicio
                </a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancelar
        </Button>
        <Button onClick={() => toast.success('Configuración guardada')}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}









