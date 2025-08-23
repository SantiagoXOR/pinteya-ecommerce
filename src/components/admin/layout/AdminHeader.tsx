'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function AdminHeader({ 
  title, 
  breadcrumbs, 
  actions, 
  onMenuToggle,
  isSidebarOpen = true 
}: AdminHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Toggle */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            data-testid="breadcrumbs"
            className="hidden sm:flex items-center space-x-2 text-sm"
          >
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <span className="text-gray-400">/</span>
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Page Title */}
        {title && (
          <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Actions */}
        {actions && (
          <div className="hidden sm:flex items-center space-x-2">
            {actions}
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  Notificaciones
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Nueva orden recibida
                      </p>
                      <p className="text-xs text-gray-500">
                        Hace 5 minutos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Producto actualizado
                      </p>
                      <p className="text-xs text-gray-500">
                        Hace 1 hora
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="text-sm text-blaze-orange-600 hover:text-blaze-orange-700 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center">
          <UserMenuButton />
        </div>
      </div>

      {/* Mobile Actions */}
      {actions && (
        <div className="sm:hidden fixed bottom-4 right-4 z-50">
          {actions}
        </div>
      )}
    </header>
  );
}

// Componente UserMenuButton para NextAuth.js
function UserMenuButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blaze-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
