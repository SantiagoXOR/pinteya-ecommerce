'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function RefreshSessionPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const refreshSession = async () => {
    setIsRefreshing(true);
    setResult(null);

    try {
      console.log('🔄 Refrescando sesión de Clerk...');

      // Forzar refresh del token
      const token = await getToken({ template: 'default' });
      console.log('✅ Token refrescado:', !!token);

      // Recargar datos del usuario
      await user?.reload();
      console.log('✅ Usuario recargado');

      // Verificar metadata actualizada
      const metadata = user?.publicMetadata;
      console.log('📋 Metadata actual:', metadata);

      // Probar acceso a API admin
      const response = await fetch('/api/admin/products-simple?limit=5');
      const apiResult = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: '¡Sesión refrescada exitosamente! El rol admin ya está funcionando.',
          details: {
            metadata,
            apiAccess: true,
            productsCount: apiResult.data?.total || 0
          }
        });
      } else {
        setResult({
          success: false,
          message: 'Sesión refrescada pero aún hay problemas de acceso.',
          details: {
            metadata,
            apiAccess: false,
            error: apiResult.error
          }
        });
      }

    } catch (error) {
      console.error('❌ Error refrescando sesión:', error);
      setResult({
        success: false,
        message: 'Error al refrescar la sesión',
        details: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const forceReload = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Refrescar Sesión Admin
          </h1>
          <p className="text-gray-600">
            Actualiza tu sesión para aplicar los cambios de rol admin
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Estado de la Sesión
            </CardTitle>
            <CardDescription>
              Información actual de tu sesión y metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Usuario ID:</strong>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
              <div>
                <strong>Email:</strong>
                <p>{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div>
                <strong>Rol Actual:</strong>
                <p className="font-mono">
                  {user?.publicMetadata?.role as string || 'undefined'}
                </p>
              </div>
              <div>
                <strong>Metadata:</strong>
                <pre className="text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(user?.publicMetadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={refreshSession}
                disabled={isRefreshing}
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refrescando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refrescar Sesión
                  </>
                )}
              </Button>

              <Button
                onClick={forceReload}
                variant="outline"
                disabled={isRefreshing}
              >
                Recargar Página
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription className="text-sm">
                  <strong>{result.message}</strong>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium">
                        Ver detalles
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Si el problema persiste después del refresh, intenta:
          </p>
          <div className="space-y-2 text-sm">
            <p>1. Cerrar sesión y volver a iniciar sesión</p>
            <p>2. Limpiar cookies del navegador</p>
            <p>3. Usar una ventana de incógnito</p>
          </div>
        </div>
      </div>
    </div>
  );
}









