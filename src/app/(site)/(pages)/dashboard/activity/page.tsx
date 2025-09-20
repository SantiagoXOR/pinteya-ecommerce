'use client';


// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';
import React from 'react';
import { ActivityPage } from '@/components/User/Activity/ActivityPage';

export default function UserActivityPage() {
  return <ActivityPage />;
}









