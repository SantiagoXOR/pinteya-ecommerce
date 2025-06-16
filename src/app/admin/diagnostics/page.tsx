"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DiagnosticTool {
  id: string;
  name: string;
  description: string;
  path: string;
  category: 'environment' | 'authentication' | 'database' | 'payments' | 'security';
  status: 'active' | 'deprecated' | 'development';
  lastUpdated: string;
  icon: string;
}

const diagnosticTools: DiagnosticTool[] = [
  {
    id: 'env-vars',
    name: 'Variables de Entorno',
    description: 'Verificar configuración de variables de entorno públicas y privadas',
    path: '/test-env',
    category: 'environment',
    status: 'active',
    lastUpdated: '2024-12-16',
    icon: '🔍'
  },
  {
    id: 'clerk-debug',
    name: 'Debug Clerk',
    description: 'Diagnóstico completo de autenticación con Clerk',
    path: '/debug-clerk',
    category: 'authentication',
    status: 'active',
    lastUpdated: '2024-12-16',
    icon: '🔐'
  },
  {
    id: 'clerk-test',
    name: 'Test Clerk Components',
    description: 'Probar componentes de autenticación de Clerk',
    path: '/test-clerk',
    category: 'authentication',
    status: 'active',
    lastUpdated: '2024-12-16',
    icon: '🧪'
  },
  {
    id: 'env-api',
    name: 'API Variables Entorno',
    description: 'API para verificar configuración del servidor',
    path: '/api/debug/env?debug=pinteya2024',
    category: 'environment',
    status: 'active',
    lastUpdated: '2024-12-16',
    icon: '🔧'
  }
];

export default function DiagnosticsPage() {
  const [mounted, setMounted] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    // Verificar si ya tiene acceso guardado
    const savedAccess = localStorage.getItem('diagnostics_access');
    if (savedAccess === 'granted') {
      setAccessGranted(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Contraseña simple para desarrollo (en producción usar algo más seguro)
    if (password === 'pinteya2024' || password === 'admin') {
      setAccessGranted(true);
      localStorage.setItem('diagnostics_access', 'granted');
    } else {
      alert('❌ Contraseña incorrecta');
    }
  };

  const categories = [
    { id: 'all', name: 'Todas', icon: '📋' },
    { id: 'environment', name: 'Entorno', icon: '🌐' },
    { id: 'authentication', name: 'Autenticación', icon: '🔐' },
    { id: 'database', name: 'Base de Datos', icon: '🗄️' },
    { id: 'payments', name: 'Pagos', icon: '💳' },
    { id: 'security', name: 'Seguridad', icon: '🛡️' }
  ];

  const filteredTools = selectedCategory === 'all' 
    ? diagnosticTools 
    : diagnosticTools.filter(tool => tool.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      case 'development': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environment': return 'bg-blue-100 text-blue-800';
      case 'authentication': return 'bg-purple-100 text-purple-800';
      case 'database': return 'bg-green-100 text-green-800';
      case 'payments': return 'bg-yellow-100 text-yellow-800';
      case 'security': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🔒 Acceso Restringido</h1>
            <p className="text-gray-600">Panel de Diagnósticos - Pinteya E-commerce</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña de Acceso
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                placeholder="Ingresa la contraseña"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-tahiti-gold-500 text-white py-2 px-4 rounded-md hover:bg-tahiti-gold-600 transition-colors"
            >
              Acceder
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-tahiti-gold-600 hover:text-tahiti-gold-700"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Panel de Diagnósticos</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Pinteya E-commerce v1.0
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('diagnostics_access');
                setAccessGranted(false);
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        
        <p className="text-gray-600">
          Herramientas de diagnóstico y debugging para el sistema de e-commerce.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-tahiti-gold-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{tool.icon}</div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tool.status)}`}>
                  {tool.status}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tool.category)}`}>
                  {tool.category}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Actualizado: {tool.lastUpdated}
              </span>
              <Link
                href={tool.path}
                target={tool.path.startsWith('/api') ? '_blank' : '_self'}
                className="bg-tahiti-gold-500 text-white px-4 py-2 rounded text-sm hover:bg-tahiti-gold-600 transition-colors"
              >
                {tool.path.startsWith('/api') ? 'Ver API' : 'Abrir'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>Panel de Diagnósticos - Pinteya E-commerce</p>
          <p>Desarrollado para debugging y mantenimiento del sistema</p>
        </div>
      </div>
    </div>
  );
}
