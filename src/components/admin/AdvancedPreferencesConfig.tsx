'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  CreditCard,
  Webhook
} from 'lucide-react';

/**
 * Interfaz para configuración avanzada de MercadoPago
 */
interface AdvancedConfig {
  webhooks: {
    enabled: boolean;
    url: string;
    events: string[];
    retryAttempts: number;
    timeout: number;
  };
  paymentMethods: {
    creditCard: boolean;
    debitCard: boolean;
    bankTransfer: boolean;
    cash: boolean;
    excludedMethods: string[];
  };
  timeouts: {
    paymentTimeout: number;
    sessionTimeout: number;
    webhookTimeout: number;
  };
  retryLogic: {
    enabled: boolean;
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  security: {
    requireSignature: boolean;
    ipWhitelist: string[];
    rateLimitPerMinute: number;
  };
}

/**
 * Props para el componente AdvancedPreferencesConfig
 */
interface AdvancedPreferencesConfigProps {
  /** Configuración actual opcional */
  currentConfig?: AdvancedConfig;
  /** Callback para guardar configuración */
  onSave?: (config: AdvancedConfig) => Promise<void>;
  /** Callback para resetear configuración */
  onReset?: () => void;
}

/**
 * Formulario para configuración avanzada de preferencias MercadoPago
 * Incluye webhooks, timeouts, retry logic y métodos de pago habilitados
 */
const AdvancedPreferencesConfig: React.FC<AdvancedPreferencesConfigProps> = ({
  currentConfig,
  onSave,
  onReset
}) => {
  const [config, setConfig] = useState<AdvancedConfig>(
    currentConfig || {
      webhooks: {
        enabled: true,
        url: 'https://pinteya-ecommerce.vercel.app/api/webhooks/mercadopago',
        events: ['payment', 'merchant_order'],
        retryAttempts: 3,
        timeout: 30000
      },
      paymentMethods: {
        creditCard: true,
        debitCard: true,
        bankTransfer: true,
        cash: false,
        excludedMethods: ['ticket']
      },
      timeouts: {
        paymentTimeout: 1800,
        sessionTimeout: 3600,
        webhookTimeout: 30
      },
      retryLogic: {
        enabled: true,
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      security: {
        requireSignature: true,
        ipWhitelist: [],
        rateLimitPerMinute: 100
      }
    }
  );

  const [isLoading, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar URL de webhook
    if (config.webhooks.enabled && !config.webhooks.url) {
      newErrors.webhookUrl = 'URL de webhook es requerida';
    }

    // Validar timeouts
    if (config.timeouts.paymentTimeout < 300) {
      newErrors.paymentTimeout = 'Timeout mínimo: 300 segundos';
    }

    // Validar retry logic
    if (config.retryLogic.maxAttempts < 1 || config.retryLogic.maxAttempts > 10) {
      newErrors.maxAttempts = 'Intentos debe estar entre 1 y 10';
    }

    // Validar rate limit
    if (config.security.rateLimitPerMinute < 1) {
      newErrors.rateLimit = 'Rate limit debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    setSaving(true);
    try {
      if (onSave) {
        await onSave(config);
      }
      setHasChanges(false);
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving config:', error);
      setErrors({ general: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setHasChanges(false);
    setErrors({});
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuración Avanzada</h3>
          <p className="text-sm text-gray-600">
            Configuraciones técnicas de MercadoPago para optimización
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={isLoading || !hasChanges}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Resetear</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Errores generales */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      {/* Cambios pendientes */}
      {hasChanges && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-700 text-sm">Tienes cambios sin guardar</span>
        </div>
      )}

      {/* Configuración de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Configuración de Webhooks</span>
            <Badge variant={config.webhooks.enabled ? 'default' : 'secondary'}>
              {config.webhooks.enabled ? 'Habilitado' : 'Deshabilitado'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configuración de notificaciones automáticas de MercadoPago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="webhooks-enabled"
              checked={config.webhooks.enabled}
              onChange={(e) => updateConfig('webhooks.enabled', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="webhooks-enabled" className="text-sm font-medium">
              Habilitar webhooks
            </label>
          </div>

          {config.webhooks.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">URL de Webhook</label>
                <input
                  type="url"
                  value={config.webhooks.url}
                  onChange={(e) => updateConfig('webhooks.url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://tu-dominio.com/api/webhooks/mercadopago"
                />
                {errors.webhookUrl && (
                  <p className="text-red-600 text-xs mt-1">{errors.webhookUrl}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Intentos de Retry</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.webhooks.retryAttempts}
                    onChange={(e) => updateConfig('webhooks.retryAttempts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    min="5000"
                    max="60000"
                    step="1000"
                    value={config.webhooks.timeout}
                    onChange={(e) => updateConfig('webhooks.timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Métodos de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Métodos de Pago</span>
          </CardTitle>
          <CardDescription>
            Configurar qué métodos de pago están disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Métodos Habilitados</h4>
              
              {[
                { key: 'creditCard', label: 'Tarjeta de Crédito' },
                { key: 'debitCard', label: 'Tarjeta de Débito' },
                { key: 'bankTransfer', label: 'Transferencia Bancaria' },
                { key: 'cash', label: 'Efectivo' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`payment-${key}`}
                    checked={config.paymentMethods[key as keyof typeof config.paymentMethods] as boolean}
                    onChange={(e) => updateConfig(`paymentMethods.${key}`, e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor={`payment-${key}`} className="text-sm">
                    {label}
                  </label>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-2">Métodos Excluidos</h4>
              <p className="text-xs text-gray-600 mb-2">
                IDs de métodos específicos a excluir (separados por coma)
              </p>
              <textarea
                value={config.paymentMethods.excludedMethods.join(', ')}
                onChange={(e) => updateConfig('paymentMethods.excludedMethods', 
                  e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="ticket, account_money"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeouts y Retry Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Timeouts</span>
            </CardTitle>
            <CardDescription>
              Configuración de tiempos límite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Timeout de Pago (segundos)
              </label>
              <input
                type="number"
                min="300"
                max="7200"
                value={config.timeouts.paymentTimeout}
                onChange={(e) => updateConfig('timeouts.paymentTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.paymentTimeout && (
                <p className="text-red-600 text-xs mt-1">{errors.paymentTimeout}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Timeout de Sesión (segundos)
              </label>
              <input
                type="number"
                min="600"
                max="14400"
                value={config.timeouts.sessionTimeout}
                onChange={(e) => updateConfig('timeouts.sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Seguridad</span>
            </CardTitle>
            <CardDescription>
              Configuraciones de seguridad avanzadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require-signature"
                checked={config.security.requireSignature}
                onChange={(e) => updateConfig('security.requireSignature', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="require-signature" className="text-sm">
                Requerir validación de firma
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Rate Limit (requests/minuto)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.security.rateLimitPerMinute}
                onChange={(e) => updateConfig('security.rateLimitPerMinute', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.rateLimit && (
                <p className="text-red-600 text-xs mt-1">{errors.rateLimit}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de la Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Webhooks configurados</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Rate limiting activo</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Retry logic habilitado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedPreferencesConfig;
