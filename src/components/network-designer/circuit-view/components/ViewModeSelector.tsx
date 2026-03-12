import React from 'react';
import { BrainCircuit as Circuit, Table2, Server } from 'lucide-react';
import { ViewMode } from '../CircuitTypes';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: 'logical' | 'physical' | 'rack') => void;
}

const MODES = [
  { mode: 'logical' as const, label: 'Topology', Icon: Circuit },
  { mode: 'physical' as const, label: 'Circuits', Icon: Table2 },
  { mode: 'rack' as const, label: 'Rack', Icon: Server },
];

export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex space-x-1">
      {MODES.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          onClick={(e) => {
            e.stopPropagation();
            onModeChange(mode);
          }}
          className={`px-3 py-1.5 text-sm font-medium flex items-center rounded-md transition-colors ${
            currentMode.mode === mode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          type="button"
        >
          <Icon className="h-4 w-4 mr-1.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
