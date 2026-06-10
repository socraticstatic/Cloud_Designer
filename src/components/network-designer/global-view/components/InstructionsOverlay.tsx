import React from 'react';
import { Globe } from 'lucide-react';

interface InstructionsOverlayProps {
  selectedLocation: string | null;
  locationsLength: number;
  activePanel: 'none' | 'metrics' | 'performance';
}

export function InstructionsOverlay({ 
  selectedLocation, 
  locationsLength, 
  activePanel 
}: InstructionsOverlayProps) {
  if (selectedLocation || locationsLength === 0 || activePanel !== 'none') {
    return null;
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-sm border border-gray-200 px-4 py-2" style={{ zIndex: 40 }}>
      <p className="text-sm text-fw-bodyLight flex items-center whitespace-nowrap">
        <Globe className="h-4 w-4 mr-2 text-fw-link" />
        Click on a location or region marker to see details
      </p>
    </div>
  );
}