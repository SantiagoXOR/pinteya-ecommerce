"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Phone, MapPin, ChevronDown, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useGeolocation } from "@/hooks/useGeolocation";

const TopBar = () => {
  const {
    detectedZone,
    isLoading,
    error,
    permissionStatus,
    requestLocation,
    selectZone,
    deliveryZones
  } = useGeolocation();

  // Zona actual: detectada automáticamente o Córdoba Capital por defecto
  const currentZone = detectedZone || deliveryZones.find(zone => zone.id === "cordoba-capital");

  return (
    <div className="bg-blaze-orange text-white border-b border-blaze-orange-600 hidden lg:block topbar-slide relative z-topbar">
      <div className="max-w-[1170px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Información de contacto - Izquierda */}
          <div className="flex items-center gap-6">
            {/* Teléfono clickeable - NÚMERO CORREGIDO */}
            <Link
              href="tel:+5493513411796"
              className="flex items-center gap-2 hover:text-accent-200 transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">
                (351) 341-1796
              </span>
            </Link>

            {/* Separador */}
            <span className="w-px h-4 bg-accent-500"></span>

            {/* Asesoramiento 24/7 */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-fun-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Asesoramiento 24/7</span>
            </div>

            {/* Separador */}
            <span className="w-px h-4 bg-accent-500"></span>

            {/* Indicador de ubicación mejorado */}
            {detectedZone && (
              <div className="flex items-center gap-2 max-w-48 overflow-hidden">
                <MapPin className="w-4 h-4 text-fun-green-400 flex-shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-sm font-medium whitespace-nowrap animate-marquee">
                    Ubicación detectada: {detectedZone.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zona de entrega con geolocalización - Derecha */}
          <div className="flex items-center gap-4">

            {/* Selector de zona de entrega con geolocalización */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-accent-200 hover:bg-accent-700 gap-2 px-3 py-1"
                  aria-expanded="false"
                  aria-haspopup="menu"
                  data-testid="delivery-zone-selector"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    Envíos a {currentZone?.name || 'Seleccionar zona'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" data-testid="delivery-zone-dropdown">
                {/* Opción de geolocalización */}
                {permissionStatus !== 'granted' && !detectedZone && (
                  <>
                    <DropdownMenuItem
                      onClick={requestLocation}
                      className="flex items-center gap-2 py-3 text-primary-600 hover:text-primary-700"
                    >
                      <Navigation className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Detectar mi ubicación</span>
                        <span className="text-xs text-gray-500">
                          Para mostrar la zona más cercana
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Estado de geolocalización */}
                {detectedZone && (
                  <>
                    <div className="px-3 py-2 bg-fun-green-50 border-l-2 border-fun-green-400">
                      <div className="flex items-center gap-2 text-fun-green-700">
                        <Navigation className="w-3 h-3" />
                        <span className="text-xs font-medium">Ubicación detectada</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Error de geolocalización */}
                {error && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500">
                      {error}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Lista de zonas */}
                {deliveryZones.map((zone) => (
                  <DropdownMenuItem
                    key={zone.id}
                    onClick={() => selectZone(zone.id)}
                    className={`flex items-center justify-between py-2 ${
                      currentZone?.id === zone.id ? 'bg-accent-50' : ''
                    }`}
                    data-testid={`zone-${zone.id}`}
                  >
                    <span className={`font-medium ${
                      currentZone?.id === zone.id ? 'text-accent-600' : ''
                    }`}>
                      {zone.name}
                    </span>
                    {zone.available ? (
                      <span className="text-xs text-fun-green-600 font-medium">
                        Disponible
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Próximamente
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
