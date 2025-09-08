import { Sparkles, BarChart3, Settings } from 'lucide-react';

type ViewMode = 'assistant' | 'optimize' | 'advanced';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex">
        <button 
          onClick={() => onChange('assistant')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'assistant' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles className="h-4 w-4 inline-block mr-2" />
          Design Assistant
        </button>
        <button 
          onClick={() => onChange('optimize')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'optimize' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="h-4 w-4 inline-block mr-2" />
          Network Analysis
        </button>
        <button 
          onClick={() => onChange('advanced')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'advanced' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="h-4 w-4 inline-block mr-2" />
          Advanced Settings
        </button>
      </div>
    </div>
  );
}