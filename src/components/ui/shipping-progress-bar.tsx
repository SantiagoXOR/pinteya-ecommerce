"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ShippingProgressBarProps {
  currentAmount: number;
  targetAmount?: number;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact" | "detailed";
}

const ShippingProgressBar: React.FC<ShippingProgressBarProps> = ({
  currentAmount,
  targetAmount = 15000,
  className,
  showIcon = true,
  variant = "default"
}) => {
  const progress = Math.min((currentAmount / targetAmount) * 100, 100);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const hasReachedTarget = currentAmount >= targetAmount;

  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return (
    <div className={cn(
      "bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200",
      isCompact ? "p-3" : "p-4",
      className
    )}>
      {/* Header centrado con icono grande */}
      <div className="text-center mb-4">
        {showIcon && (
          <div className="flex justify-center mb-3">
            <Image
              src="/images/icons/icon-envio.svg"
              alt="Envío"
              width={isCompact ? 120 : 140}
              height={isCompact ? 120 : 140}
              className="w-auto h-auto"
            />
          </div>
        )}

        <div>
          {hasReachedTarget ? (
            <p className={cn(
              "text-green-700 font-bold",
              isCompact ? "text-base" : "text-lg"
            )}>
              ¡Felicitaciones! Tienes envío gratis
            </p>
          ) : (
            <p className={cn(
              "text-gray-700 font-semibold",
              isCompact ? "text-base" : "text-lg"
            )}>
              Te faltan ${remainingAmount.toLocaleString()} para envío gratis
            </p>
          )}
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        isCompact ? "h-2" : "h-3"
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            hasReachedTarget 
              ? "bg-gradient-to-r from-green-500 to-green-600" 
              : "bg-gradient-to-r from-yellow-400 to-orange-500"
          )}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Labels de progreso */}
      <div className={cn(
        "flex justify-between text-gray-600 mt-2",
        isCompact ? "text-2xs" : "text-xs"
      )}>
        <span>$0</span>
        <span className="font-semibold">${targetAmount.toLocaleString()}</span>
      </div>

      {/* Información detallada (solo en variant detailed) */}
      {isDetailed && (
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Progreso actual:</span>
            <span className="font-semibold text-gray-900">
              ${currentAmount.toLocaleString()} ({progress.toFixed(1)}%)
            </span>
          </div>
          
          {!hasReachedTarget && (
            <div className="mt-2 p-2 bg-yellow-100 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 Agrega ${remainingAmount.toLocaleString()} más para obtener envío gratis
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingProgressBar;









