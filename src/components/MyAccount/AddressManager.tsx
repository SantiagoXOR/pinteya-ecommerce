"use client";

import React, { useState } from 'react';
import { useUserAddresses, UserAddress, CreateAddressData } from '@/hooks/useUserAddresses';

interface AddressManagerProps {
  isVisible: boolean;
}

const AddressManager: React.FC<AddressManagerProps> = ({ isVisible }) => {
  const { addresses, loading, error, createAddress, updateAddress, deleteAddress } = useUserAddresses();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [formData, setFormData] = useState<CreateAddressData>({
    name: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Argentina',
    is_default: false,
  });

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Argentina',
      is_default: false,
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    if (editingAddress) {
      success = await updateAddress(editingAddress.id, formData);
    } else {
      success = await createAddress(formData);
    }

    if (success) {
      resetForm();
    }
  };

  // Manejar edición
  const handleEdit = (address: UserAddress) => {
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      await deleteAddress(id);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="xl:max-w-[770px] w-full bg-white rounded-xl shadow-1 py-9.5 px-4 sm:px-7.5 xl:px-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-dark">Gestionar Direcciones</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-tahiti-gold-500 text-white px-4 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
        >
          Agregar Dirección
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tahiti-gold-500"></div>
          <span className="ml-3 text-gray-600">Cargando direcciones...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error}</p>
        </div>
      ) : (
        <>
          {/* Formulario para agregar/editar dirección */}
          {showForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-dark mb-4">
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la dirección
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                      placeholder="Casa, Trabajo, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                      placeholder="1234"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                    placeholder="Av. Corrientes 1234"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                      placeholder="Buenos Aires"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia/Estado
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                      placeholder="CABA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tahiti-gold-500"
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Brasil">Brasil</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="h-4 w-4 text-tahiti-gold-600 focus:ring-tahiti-gold-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                    Establecer como dirección por defecto
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-tahiti-gold-500 text-white px-6 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
                  >
                    {editingAddress ? 'Actualizar' : 'Guardar'} Dirección
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de direcciones */}
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-dark">{address.name}</h4>
                    {address.is_default && (
                      <span className="bg-tahiti-gold-100 text-tahiti-gold-800 text-xs px-2 py-1 rounded">
                        Por defecto
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {address.street}<br />
                    {address.city}{address.state && `, ${address.state}`}<br />
                    {address.postal_code}, {address.country}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-tahiti-gold-600 hover:text-tahiti-gold-700 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes direcciones guardadas</h3>
                <p className="text-gray-600 mb-4">
                  Agrega una dirección para facilitar tus compras futuras.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-block bg-tahiti-gold-500 text-white px-6 py-2 rounded-md hover:bg-tahiti-gold-600 transition-colors"
                >
                  Agregar Primera Dirección
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressManager;
