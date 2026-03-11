import { Cable } from 'lucide-react';

type ViewMode = 'cross-connects';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center">
        <button
          onClick={() => onChange('cross-connects')}
          className={`py-3 px-6 text-sm font-medium transition-colors ${
            viewMode === 'cross-connects'
              ? 'text-slate-600 border-b-2 border-slate-600 bg-slate-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <Cable className="h-4 w-4 mr-2" />
            <span>Cross-Connects</span>
          </div>
        </button>
      </div>
    </div>
  );
}