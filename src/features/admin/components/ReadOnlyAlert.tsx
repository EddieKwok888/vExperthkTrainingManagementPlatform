import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReadOnlyAlertProps {
  moduleKey: string;
  getPermission: (module: string) => string;
}

export function ReadOnlyAlert({ moduleKey, getPermission }: ReadOnlyAlertProps) {
  if (getPermission(moduleKey) === 'view') {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-xs text-amber-800 flex items-start gap-4 shadow-sm font-sans">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse mt-0.5" />
        <div>
          <span className="font-extrabold block text-amber-950 text-sm mb-0.5">👁️ Read-Only Access Mode</span>
          <span className="text-amber-750 leading-relaxed font-semibold">Your current active role profile is set to read-only for this section. Operations such as creating records, editing profiles, and deleting data are restricted in real-time.</span>
        </div>
      </div>
    );
  }
  return null;
}
