import { Target, Sparkles, Cable, ArrowRight } from 'lucide-react';

type ViewMode = 'outcomes' | 'ai-recommendations' | 'cross-connects';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  const isAIMode = viewMode === 'outcomes' || viewMode === 'ai-recommendations';

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center">
        <div className="flex items-center flex-1 border-r border-gray-200">
          <button
            onClick={() => onChange('outcomes')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              viewMode === 'outcomes'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Target className="h-4 w-4 mr-2" />
              <span>Business Outcomes</span>
            </div>
          </button>

          <ArrowRight className={`h-4 w-4 mx-2 ${isAIMode ? 'text-blue-400' : 'text-gray-300'}`} />

          <button
            onClick={() => onChange('ai-recommendations')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              viewMode === 'ai-recommendations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>AI Recommendations</span>
            </div>
          </button>
        </div>

        <button
          onClick={() => onChange('cross-connects')}
          className={`py-3 px-6 text-sm font-medium transition-colors ${
            viewMode === 'cross-connects'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
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