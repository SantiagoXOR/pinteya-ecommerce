'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// Importación robusta de iconos según mejores prácticas de Lucide React
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Home,
  Database,
  CreditCard,
  Search,
  Bell
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    title: 'Productos',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Órdenes',
    href: '/admin/orders',
    icon: ShoppingCart,
    badge: 'Beta',
  },
  {
    title: 'Clientes',
    href: '/admin/customers',
    icon: Users,
    badge: 'Beta',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'MercadoPago',
    href: '/admin/mercadopago',
    icon: CreditCard,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    badge: 'Beta',
  },
  {
    title: 'Diagnósticos',
    href: '/admin/diagnostics',
    icon: Database,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      data-testid="admin-sidebar"
      className={cn(
        "flex flex-col w-64 bg-white border-r border-gray-200 h-full",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blaze-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {sidebarItems.map((item) => {
          if (!item || !item.icon) return null;

          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blaze-orange-50 text-blaze-orange-700 border border-blaze-orange-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <div className="flex items-center space-x-3">
                {item.icon && (
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-blaze-orange-600" : "text-gray-500"
                  )} />
                )}
                <span>{item.title}</span>
              </div>
              
              {item.badge && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <Bell className="w-4 h-4" />
          <span>Notificaciones</span>
        </div>
      </div>
    </div>
  );
}
