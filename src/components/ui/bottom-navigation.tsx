"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tag,
  Package,
  Calculator,
  Menu,
  ShoppingCart,
  User,
  Percent,
  ClipboardList
} from "lucide-react";
import { Home } from "lucide-react";
import { useAppSelector } from "@/redux/store";

const bottomNavigationVariants = cva(
  "fixed bottom-0 left-0 right-0 z-bottom-nav border-t shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-white/95 border-gray-200",
        warm: "bg-orange-50/95 border-orange-100",
        dark: "bg-gray-900/95 border-gray-700",
        primary: "bg-primary/5 border-primary/20",
      },
    },
    defaultVariants: {
      variant: "warm",
    },
  }
);

const bottomNavigationItemVariants = cva(
  "flex flex-col items-center justify-center py-3 px-2 min-h-[68px] transition-all duration-300 relative group",
  {
    variants: {
      active: {
        true: "text-primary-700", // Texto más oscuro para mejor contraste
        false: "text-gray-700 hover:text-gray-900", // Texto más oscuro por defecto
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface BottomNavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

export interface BottomNavigationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bottomNavigationVariants> {
  items?: BottomNavigationItem[];
  showLabels?: boolean;
  maxItems?: number;
}

// Items por defecto para Pinteya E-commerce
const defaultItems: BottomNavigationItem[] = [
  {
    id: "home",
    label: "Inicio",
    href: "/",
    icon: <Home className="w-5 h-5 fill-current" strokeWidth={1.5} />,
  },
  {
    id: "offers",
    label: "Ofertas",
    href: "/shop",
    icon: <Percent className="w-5 h-5" strokeWidth={2} />,
  },
  {
    id: "orders",
    label: "Pedidos",
    href: "/admin",
    icon: <ClipboardList className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    id: "calculator",
    label: "Cotizador",
    href: "/calculator",
    icon: <Calculator className="w-5 h-5" strokeWidth={1.5} />,
  },
  {
    id: "menu",
    label: "Menú",
    href: "/menu",
    icon: <Menu className="w-5 h-5" strokeWidth={2} />,
  },
];

const BottomNavigation = React.forwardRef<HTMLDivElement, BottomNavigationProps>(
  ({ 
    className, 
    variant, 
    items = defaultItems,
    showLabels = true,
    maxItems = 5,
    ...props 
  }, ref) => {
    const pathname = usePathname();
    const cartItems = useAppSelector((state) => state.cartReducer.items);

    // Limitar items al máximo especificado
    const displayItems = items.slice(0, maxItems);

    // Función para determinar si un item está activo
    const isActive = (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      // Evitar que /menu active otros paths y viceversa
      if (href === "/menu") {
        return pathname === "/menu";
      }
      // Para otros paths, verificar que no sea menu y que coincida
      if (pathname === "/menu") {
        return false;
      }
      return pathname.startsWith(href);
    };

    return (
      <nav
        ref={ref}
        className={cn(bottomNavigationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-center justify-around max-w-md mx-auto w-full bottom-nav-container">
          {displayItems.map((item) => {
            const active = isActive(item.href);
            const badge = item.id === "orders" ? cartItems.length : item.badge;
            const showBadge = badge && badge > 0;
            const showDot = !showBadge && item.id === "orders" && cartItems.length === 0;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  bottomNavigationItemVariants({ active }),
                  item.disabled && "opacity-50 pointer-events-none",
                  "flex-1 max-w-[85px] bottom-nav-item",
                  active && "bottom-nav-item-active"
                )}
                aria-label={item.label}
              >
                {/* Contenedor del ícono con fondo circular para estado activo */}
                <div className={cn(
                  "relative flex items-center justify-center transition-all duration-300",
                  active
                    ? "bg-primary/15 rounded-full p-2 mb-1 shadow-sm"
                    : "mb-2 hover:bg-gray-100/50 rounded-full p-2"
                )}>
                  {/* Ícono con tamaño dinámico */}
                  <div className={cn(
                    "transition-all duration-300",
                    active ? "scale-110" : "scale-100"
                  )}>
                    {React.cloneElement(item.icon as React.ReactElement, {
                      className: cn(
                        "transition-all duration-300",
                        active ? "w-6 h-6 text-primary-700" : "w-5 h-5"
                      )
                    })}
                  </div>

                  {/* Badge para notificaciones */}
                  {showBadge && (
                    <span className={cn(
                      "absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm",
                      badge && badge > 0 && "bottom-nav-badge-pulse"
                    )}>
                      {badge && badge > 99 ? "99+" : badge}
                    </span>
                  )}

                  {/* Dot indicator sutil para items sin badge */}
                  {showDot && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary/60 rounded-full" />
                  )}
                </div>

                {/* Label con tipografía mejorada */}
                {showLabels && (
                  <span className={cn(
                    "text-xs leading-tight font-medium transition-all duration-300 bottom-nav-text-shadow",
                    active
                      ? "text-primary-800 font-bold" // Texto más oscuro y bold para mejor contraste
                      : "text-gray-700 group-hover:text-gray-900"
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";

export { BottomNavigation, bottomNavigationVariants };
