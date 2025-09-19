"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MercadoPagoLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon" | "text";
  className?: string;
}

const MercadoPagoLogo: React.FC<MercadoPagoLogoProps> = ({
  size = "md",
  variant = "full",
  className
}) => {
  const sizeClasses = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  if (variant === "text") {
    return (
      <span className={cn(
        "font-bold text-blue-600",
        textSizeClasses[size],
        className
      )}>
        MercadoPago
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <div className={cn(
        "bg-blue-600 rounded-full flex items-center justify-center text-white font-bold",
        size === "sm" ? "w-6 h-6 text-xs" : size === "md" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base",
        className
      )}>
        MP
      </div>
    );
  }

  // Variant "full" - Logo completo
  return (
    <div className={cn(
      "flex items-center gap-2",
      className
    )}>
      <div className={cn(
        "bg-blue-600 rounded-full flex items-center justify-center text-white font-bold",
        size === "sm" ? "w-6 h-6 text-xs" : size === "md" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
      )}>
        MP
      </div>
      <span className={cn(
        "font-bold text-blue-600",
        textSizeClasses[size]
      )}>
        MercadoPago
      </span>
    </div>
  );
};

export default MercadoPagoLogo;









