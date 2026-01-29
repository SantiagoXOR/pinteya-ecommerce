'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTenantSafe } from '@/contexts/TenantContext';
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets';
import { MercadoPagoLogo } from '@/components/ui/MercadoPagoLogo';

interface PaymentMethodSelectorProps {
  selectedMethod?: 'cash' | 'mercadopago';
  onMethodChange: (method: 'cash' | 'mercadopago') => void;
}

export default function PaymentMethodSelector({ selectedMethod = 'cash', onMethodChange }: PaymentMethodSelectorProps) {
  // ⚡ MULTITENANT: Obtener colores del tenant
  const tenant = useTenantSafe();
  const primaryColor = tenant?.primaryColor || '#ea5a17'; // Naranja por defecto
  const accentColor = tenant?.accentColor || '#ffd549'; // Amarillo por defecto
  
  // Convertir color hex a RGB para usar en Tailwind con opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 234, g: 90, b: 23 }; // Fallback naranja
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const accentRgb = hexToRgb(accentColor);
  
  // Generar clases dinámicas con colores del tenant
  const primaryColorStyle = {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
    '--tw-ring-color': `${primaryColor}80`, // 50% opacity para ring
  } as React.CSSProperties;
  
  const primaryColorLighter = `rgb(${Math.min(primaryRgb.r + 30, 255)}, ${Math.min(primaryRgb.g + 30, 255)}, ${Math.min(primaryRgb.b + 30, 255)})`;
  const primaryColorDarker = `rgb(${Math.max(primaryRgb.r - 30, 0)}, ${Math.max(primaryRgb.g - 30, 0)}, ${Math.max(primaryRgb.b - 30, 0)})`;
  
  return (
    <div className="space-y-4">
      
      <div className="grid gap-3">
        {/* Pago al recibir el producto - Card más compacta */}
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 hover:shadow-md border-2",
            selectedMethod === 'cash' 
              ? 'shadow-md' 
              : 'border-gray-200'
          )}
          style={selectedMethod === 'cash' ? {
            borderColor: primaryColor,
            '--tw-ring-color': `${primaryColor}33`,
          } as React.CSSProperties & { '--tw-ring-color': string } : undefined}
          onClick={() => onMethodChange('cash')}
        >
          <CardContent className="p-0">
            <div 
              className="rounded-t-lg py-2 px-3 text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${primaryColorDarker}, ${primaryColor}, ${primaryColorLighter})`,
              }}
            >
              {/* Patrón de fondo sutil */}
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:15px_15px]"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold leading-none mb-1">
                      ¡<span style={{ color: accentColor }}>Pagás</span> al recibir tu <span style={{ color: accentColor }}>pedido</span>!
                    </h4>
                    <div className="text-xs font-medium text-white/90">
                      QR, efectivo, <span style={{ color: accentColor }}>tarjetas</span>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedMethod === 'cash' && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                    </div>
                  )}
                  
                  {/* Imagen pequeña integrada (por tenant) */}
                  <div className="ml-2 flex-shrink-0 translate-y-0.5">
                    <Image
                      src={tenant ? getTenantAssetPath(tenant, 'pagoalrecibir.png', `/tenants/${tenant.slug}/pagoalrecibir.png`) : '/images/checkout/pagoalrecibir.png'}
                      alt="Pago al recibir el producto"
                      width={60}
                      height={42}
                      className="object-contain drop-shadow-lg"
                      priority
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        if (t.src !== '/images/checkout/pagoalrecibir.png') t.src = '/images/checkout/pagoalrecibir.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="py-1 px-2 bg-gray-50">
              <p className="text-xs text-gray-600 text-center font-medium">
                <span style={{ color: primaryColor }}>Comodidad</span> y seguridad en tu puerta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mercado Pago - Card más compacta */}
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 hover:shadow-md border-2",
            selectedMethod === 'mercadopago' 
              ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
              : 'border-gray-200 hover:border-blue-300'
          )}
          onClick={() => onMethodChange('mercadopago')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center">
                  <MercadoPagoLogo
                    color={accentColor}
                    width={70}
                    alt="Mercado Pago"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 mb-1">Mercado Pago</h4>
                  <p className="text-sm text-gray-600">Pagá online en cuotas. Tarjetas de crédito, débito o dinero en cuenta.</p>
                </div>
              </div>
              
              {/* Selection indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ml-2",
                selectedMethod === 'mercadopago' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              )}>
                {selectedMethod === 'mercadopago' && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}