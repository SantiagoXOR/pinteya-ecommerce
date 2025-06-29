"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  Truck,
  Clock,
  Star,
  Award,
  Lock,
  CreditCard,
  Phone,
  MapPin,
  Zap,
  MessageCircle
} from "lucide-react";

const trustBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        security: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
        guarantee: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
        shipping: "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100",
        quality: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100",
        support: "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100",
        payment: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        glow: "animate-pulse shadow-lg",
      },
    },
    defaultVariants: {
      variant: "security",
      size: "md",
      animation: "none",
    },
  }
);

export interface TrustBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof trustBadgeVariants> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const TrustBadge = React.forwardRef<HTMLDivElement, TrustBadgeProps>(
  ({ className, variant, size, animation, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(trustBadgeVariants({ variant, size, animation }), className)}
      {...props}
    >
      {icon}
      {children}
    </div>
  )
);
TrustBadge.displayName = "TrustBadge";

// Badges especializados para e-commerce de pinturería

interface SecurePurchaseBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  text?: string;
}

const SecurePurchaseBadge = React.forwardRef<HTMLDivElement, SecurePurchaseBadgeProps>(
  ({ text = "Compra Protegida", className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="security"
      icon={<ShieldCheck className="w-4 h-4" />}
      className={cn("", className)}
      {...props}
    >
      {text}
    </TrustBadge>
  )
);
SecurePurchaseBadge.displayName = "SecurePurchaseBadge";

interface MoneyBackBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  days?: number;
}

const MoneyBackBadge = React.forwardRef<HTMLDivElement, MoneyBackBadgeProps>(
  ({ days = 30, className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="guarantee"
      icon={<Shield className="w-4 h-4" />}
      className={cn("", className)}
      {...props}
    >
      {days} días de garantía
    </TrustBadge>
  )
);
MoneyBackBadge.displayName = "MoneyBackBadge";

interface FastShippingBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  hours?: number;
  text?: string;
}

const FastShippingBadge = React.forwardRef<HTMLDivElement, FastShippingBadgeProps>(
  ({ hours = 24, text, className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="shipping"
      icon={<Truck className="w-4 h-4" />}
      className={cn("", className)}
      {...props}
    >
      {text || `Envío en ${hours}hs`}
    </TrustBadge>
  )
);
FastShippingBadge.displayName = "FastShippingBadge";

interface QualityBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  text?: string;
  rating?: number;
}

const QualityBadge = React.forwardRef<HTMLDivElement, QualityBadgeProps>(
  ({ text = "Calidad Premium", rating, className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="quality"
      icon={rating ? <Star className="w-4 h-4 fill-current" /> : <Award className="w-4 h-4" />}
      className={cn("", className)}
      {...props}
    >
      {rating ? `${rating}★ ${text}` : text}
    </TrustBadge>
  )
);
QualityBadge.displayName = "QualityBadge";

interface SupportBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  type?: 'phone' | 'chat' | 'email';
  hours?: string;
}

const SupportBadge = React.forwardRef<HTMLDivElement, SupportBadgeProps>(
  ({ type = 'phone', hours = '24/7', className, ...props }, ref) => {
    const getIcon = () => {
      switch (type) {
        case 'phone': return <Phone className="w-4 h-4" />;
        case 'chat': return <MessageCircle className="w-4 h-4" />;
        case 'email': return <Clock className="w-4 h-4" />;
        default: return <Phone className="w-4 h-4" />;
      }
    };

    const getText = () => {
      switch (type) {
        case 'phone': return `Soporte ${hours}`;
        case 'chat': return `Chat en vivo`;
        case 'email': return `Respuesta ${hours}`;
        default: return `Soporte ${hours}`;
      }
    };

    return (
      <TrustBadge
        ref={ref}
        variant="support"
        icon={getIcon()}
        className={cn("", className)}
        {...props}
      >
        {getText()}
      </TrustBadge>
    );
  }
);
SupportBadge.displayName = "SupportBadge";

interface PaymentSecurityBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  provider?: 'mercadopago' | 'ssl' | 'secure';
}

const PaymentSecurityBadge = React.forwardRef<HTMLDivElement, PaymentSecurityBadgeProps>(
  ({ provider = 'mercadopago', className, ...props }, ref) => {
    const getContent = () => {
      switch (provider) {
        case 'mercadopago':
          return {
            icon: <CreditCard className="w-4 h-4" />,
            text: "MercadoPago Seguro"
          };
        case 'ssl':
          return {
            icon: <Lock className="w-4 h-4" />,
            text: "SSL Certificado"
          };
        case 'secure':
          return {
            icon: <ShieldCheck className="w-4 h-4" />,
            text: "Pago 100% Seguro"
          };
        default:
          return {
            icon: <CreditCard className="w-4 h-4" />,
            text: "Pago Seguro"
          };
      }
    };

    const { icon, text } = getContent();

    return (
      <TrustBadge
        ref={ref}
        variant="payment"
        icon={icon}
        className={cn("", className)}
        {...props}
      >
        {text}
      </TrustBadge>
    );
  }
);
PaymentSecurityBadge.displayName = "PaymentSecurityBadge";

interface LocalBusinessBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  city?: string;
  years?: number;
}

const LocalBusinessBadge = React.forwardRef<HTMLDivElement, LocalBusinessBadgeProps>(
  ({ city = "Córdoba", years = 15, className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="quality"
      icon={<MapPin className="w-4 h-4" />}
      className={cn("", className)}
      {...props}
    >
      {years} años en {city}
    </TrustBadge>
  )
);
LocalBusinessBadge.displayName = "LocalBusinessBadge";

interface InstantDeliveryBadgeProps extends Omit<TrustBadgeProps, 'children' | 'icon'> {
  text?: string;
}

const InstantDeliveryBadge = React.forwardRef<HTMLDivElement, InstantDeliveryBadgeProps>(
  ({ text = "Entrega Inmediata", className, ...props }, ref) => (
    <TrustBadge
      ref={ref}
      variant="shipping"
      icon={<Zap className="w-4 h-4" />}
      animation="glow"
      className={cn("", className)}
      {...props}
    >
      {text}
    </TrustBadge>
  )
);
InstantDeliveryBadge.displayName = "InstantDeliveryBadge";

// Componente combinado para mostrar múltiples badges de confianza
interface TrustBadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  badges?: ('secure' | 'guarantee' | 'shipping' | 'quality' | 'support' | 'payment' | 'local' | 'instant')[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
}

const TrustBadgeGroup = React.forwardRef<HTMLDivElement, TrustBadgeGroupProps>(
  ({ 
    badges = ['secure', 'guarantee', 'shipping'], 
    layout = 'horizontal', 
    size = 'md',
    className, 
    ...props 
  }, ref) => {
    const layoutClasses = {
      horizontal: "flex flex-wrap gap-2",
      vertical: "flex flex-col gap-2",
      grid: "grid grid-cols-2 md:grid-cols-3 gap-2"
    };

    const renderBadge = (badge: string) => {
      const commonProps = { size };
      
      switch (badge) {
        case 'secure':
          return <SecurePurchaseBadge key={badge} {...commonProps} />;
        case 'guarantee':
          return <MoneyBackBadge key={badge} {...commonProps} />;
        case 'shipping':
          return <FastShippingBadge key={badge} {...commonProps} />;
        case 'quality':
          return <QualityBadge key={badge} {...commonProps} />;
        case 'support':
          return <SupportBadge key={badge} {...commonProps} />;
        case 'payment':
          return <PaymentSecurityBadge key={badge} {...commonProps} />;
        case 'local':
          return <LocalBusinessBadge key={badge} {...commonProps} />;
        case 'instant':
          return <InstantDeliveryBadge key={badge} {...commonProps} />;
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(layoutClasses[layout], className)}
        {...props}
      >
        {badges.map(renderBadge)}
      </div>
    );
  }
);
TrustBadgeGroup.displayName = "TrustBadgeGroup";

export {
  TrustBadge,
  SecurePurchaseBadge,
  MoneyBackBadge,
  FastShippingBadge,
  QualityBadge,
  SupportBadge,
  PaymentSecurityBadge,
  LocalBusinessBadge,
  InstantDeliveryBadge,
  TrustBadgeGroup,
  trustBadgeVariants,
};
