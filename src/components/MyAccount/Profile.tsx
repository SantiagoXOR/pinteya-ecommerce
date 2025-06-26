import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormMessage } from '@/components/ui/form';
import { User, Save } from 'lucide-react';

const Profile = () => {
  const { updateProfile } = useUserProfile();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
    };
    await updateProfile(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Información Personal
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField>
              <Input
                type="text"
                name="firstName"
                id="firstName"
                label="Nombre"
                placeholder="Juan"
                required
              />
            </FormField>

            <FormField>
              <Input
                type="text"
                name="lastName"
                id="lastName"
                label="Apellido"
                placeholder="Pérez"
                required
              />
            </FormField>
          </div>

          <FormField>
            <label htmlFor="countryName" className="block text-sm font-medium text-gray-700 mb-2">
              País / Región <span className="text-red-500">*</span>
            </label>
            <Select name="countryName">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="argentina">Argentina</SelectItem>
                <SelectItem value="chile">Chile</SelectItem>
                <SelectItem value="uruguay">Uruguay</SelectItem>
                <SelectItem value="brasil">Brasil</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Profile;
