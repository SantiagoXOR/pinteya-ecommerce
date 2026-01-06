'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  selectedMethod?: 'cash' | 'mercadopago';
  onMethodChange: (method: 'cash' | 'mercadopago') => void;
}

export default function PaymentMethodSelector({ selectedMethod = 'cash', onMethodChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      
      <div className="grid gap-3">
        {/* Pago al recibir el producto - Card más compacta */}
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 hover:shadow-md border-2",
            selectedMethod === 'cash' 
              ? 'border-orange-500 ring-2 ring-orange-200 shadow-md' 
              : 'border-gray-200 hover:border-orange-300'
          )}
          onClick={() => onMethodChange('cash')}
        >
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-t-lg py-2 px-3 text-white relative overflow-hidden">
              {/* Patrón de fondo sutil */}
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:15px_15px]"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold leading-none mb-1">
                      ¡<span className="text-yellow-300">Pagás</span> al recibir tu <span className="text-yellow-300">pedido</span>!
                    </h4>
                    <div className="text-xs font-medium text-white/90">
                      QR, efectivo, <span className="text-yellow-300">tarjetas</span>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedMethod === 'cash' && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Imagen pequeña integrada */}
                  <div className="ml-2 flex-shrink-0 translate-y-0.5">
                    <Image
                      src="/images/checkout/pagoalrecibir.png"
                      alt="Pago al recibir el producto"
                      width={60}
                      height={42}
                      className="object-contain drop-shadow-lg"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="py-1 px-2 bg-gray-50">
              <p className="text-xs text-gray-600 text-center font-medium">
                <span className="text-yellow-600">Comodidad</span> y seguridad en tu puerta.
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
                  <Image
                    src="/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg"
                    alt="MercadoPago"
                    width={70}
                    height={35}
                    className="object-contain"
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