'use client';

import React from 'react';
import { ActivityLog } from './ActivityLog';

export function ActivityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Historial de Actividad</h1>
        <p className="text-gray-600">
          Revisa tu historial de actividad y acciones en la plataforma.
        </p>
      </div>

      {/* Activity Log */}
      <ActivityLog />
    </div>
  );
}









