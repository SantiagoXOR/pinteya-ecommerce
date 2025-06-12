"use client";
import React, { useState } from 'react';
import Profile from './Profile';
import PasswordChange from './PasswordChange';
import AddressManager from './AddressManager';
import Breadcrumb from '@/components/Common/Breadcrumb';
import { useUserDashboard } from '@/hooks/useUserDashboard';

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

      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col xl:flex-row gap-7.5">
            {/* Navigation */}
            <div className="xl:max-w-[370px] w-full">
              <div className="bg-white shadow-1 rounded-xl p-4 sm:p-8.5">
                <nav>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full text-left p-4 ${activeTab === 'dashboard' ? 'bg-blue text-white' : 'bg-gray-1 text-dark-2'}`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left p-4 ${activeTab === 'profile' ? 'bg-blue text-white' : 'bg-gray-1 text-dark-2'}`}
                  >
                    Perfil
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left p-4 ${activeTab === 'addresses' ? 'bg-blue text-white' : 'bg-gray-1 text-dark-2'}`}
                  >
                    Direcciones
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="xl:max-w-[770px] w-full">
              {activeTab === 'dashboard' && dashboard && (
                <div className="bg-white shadow-1 rounded-xl p-8">
                  <h2 className="text-2xl font-semibold mb-6">Bienvenido {dashboard.user.name}</h2>
                  
                  {/* Estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">Total de Órdenes</h3>
                      <p className="text-2xl font-bold">{dashboard.statistics.total_orders}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">Total Gastado</h3>
                      <p className="text-2xl font-bold">{formatCurrency(dashboard.statistics.total_spent)}</p>
                    </div>
                  </div>

                  {/* Órdenes Recientes */}
                  {dashboard.recent_orders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Órdenes Recientes</h3>
                      <div className="space-y-4">
                        {dashboard.recent_orders.map((order) => (
                          <div key={order.id} className="border p-4 rounded">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">Orden #{order.id}</p>
                                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                              </div>
                              <p className="font-semibold">{formatCurrency(parseFloat(order.total))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
