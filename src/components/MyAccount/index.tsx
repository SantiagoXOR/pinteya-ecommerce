"use client";
import React, { useState } from 'react';
import Profile from './Profile';
import PasswordChange from './PasswordChange';
import AddressManager from './AddressManager';
import Breadcrumb from '@/components/Common/Breadcrumb';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, MapPin, ShoppingBag, BarChart3, Package } from "lucide-react";

const MyAccount = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { dashboard, loading: dashboardLoading, error: dashboardError } = useUserDashboard();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Breadcrumb title={"Mi Cuenta"} pages={["Mi Cuenta"]} />

      <section className="overflow-hidden py-20 bg-gray-50">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Navigation */}
            <div className="xl:max-w-[370px] w-full">
              <Card className="border-0 shadow-2 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Mi Cuenta</h3>
                    <Badge variant="outline" size="sm">Panel de usuario</Badge>
                  </div>
                </div>

                <nav className="space-y-2">
                  <Button
                    variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
                    size="md"
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full justify-start gap-3"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>

                  <Button
                    variant={activeTab === 'profile' ? 'primary' : 'ghost'}
                    size="md"
                    onClick={() => setActiveTab('profile')}
                    className="w-full justify-start gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Perfil
                  </Button>

                  <Button
                    variant={activeTab === 'addresses' ? 'primary' : 'ghost'}
                    size="md"
                    onClick={() => setActiveTab('addresses')}
                    className="w-full justify-start gap-3"
                  >
                    <MapPin className="w-4 h-4" />
                    Direcciones
                  </Button>
                </nav>
              </Card>
            </div>

            {/* Content */}
            <div className="xl:max-w-[770px] w-full">
              {activeTab === 'dashboard' && dashboard && (
                <Card className="border-0 shadow-2 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Bienvenido {dashboard.user.name}</h2>
                      <p className="text-gray-600">Resumen de tu actividad</p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-600">Total de Órdenes</h3>
                          <p className="text-3xl font-bold text-primary">{dashboard.statistics.total_orders}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-success" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-600">Total Gastado</h3>
                          <p className="text-3xl font-bold text-success">{formatCurrency(dashboard.statistics.total_spent)}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Órdenes Recientes */}
                  {dashboard.recent_orders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Órdenes Recientes
                      </h3>
                      <div className="space-y-4">
                        {dashboard.recent_orders.map((order) => (
                          <Card key={order.id} className="p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-900">Orden #{order.id}</p>
                                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary">{formatCurrency(parseFloat(order.total))}</p>
                                <Badge variant="outline" size="sm">Ver detalles</Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Profile />
                  <PasswordChange />
                </div>
              )}

              <AddressManager isVisible={activeTab === 'addresses'} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MyAccount;
