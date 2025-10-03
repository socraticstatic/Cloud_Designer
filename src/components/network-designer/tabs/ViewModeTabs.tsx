import { Target, Sparkles, Cable } from 'lucide-react';

type ViewMode = 'outcomes' | 'ai-recommendations' | 'cross-connects';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex">
        <button
          onClick={() => onChange('outcomes')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'outcomes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Target className="h-4 w-4 inline-block mr-2" />
          Business Outcomes
        </button>
        <button
          onClick={() => onChange('ai-recommendations')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'ai-recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles className="h-4 w-4 inline-block mr-2" />
          AI Recommendations
        </button>
        <button
          onClick={() => onChange('cross-connects')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'cross-connects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Cable className="h-4 w-4 inline-block mr-2" />
          Cross-Connects
        </button>
      </div>
    </div>
  );
}