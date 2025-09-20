'use client';


// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';
import React from 'react';
import { PreferencesPage } from '@/components/User/Preferences/PreferencesPage';

export default function UserPreferencesPage() {
  return <PreferencesPage />;
}









