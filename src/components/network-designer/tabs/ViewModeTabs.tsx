import { Target, Sparkles, Cable, ArrowRight } from 'lucide-react';

type ViewMode = 'outcomes' | 'ai-recommendations' | 'cross-connects';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeTabs({ viewMode, onChange }: ViewModeTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center relative">
        <button
          onClick={() => onChange('outcomes')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
            viewMode === 'outcomes'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`p-1.5 rounded-lg mr-2 ${viewMode === 'outcomes' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Target className="h-4 w-4" />
            </div>
            <span>Business Outcomes</span>
          </div>
          {viewMode === 'outcomes' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-600 to-transparent"></div>
            </div>
          )}
        </button>

        <div className="flex items-center justify-center px-2">
          <ArrowRight className="h-5 w-5 text-blue-400 animate-pulse" />
        </div>

        <button
          onClick={() => onChange('ai-recommendations')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
            viewMode === 'ai-recommendations'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`p-1.5 rounded-lg mr-2 ${viewMode === 'ai-recommendations' ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span>AI Recommendations</span>
          </div>
          {viewMode === 'ai-recommendations' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0.5 h-4 bg-gradient-to-b from-purple-600 to-transparent"></div>
            </div>
          )}
        </button>

        <div className="flex items-center justify-center px-2">
          <ArrowRight className="h-5 w-5 text-gray-300" />
        </div>

        <button
          onClick={() => onChange('cross-connects')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
            viewMode === 'cross-connects'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <div className={`p-1.5 rounded-lg mr-2 ${viewMode === 'cross-connects' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Cable className="h-4 w-4" />
            </div>
            <span>Cross-Connects</span>
          </div>
          {viewMode === 'cross-connects' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0.5 h-4 bg-gradient-to-b from-green-600 to-transparent"></div>
            </div>
          )}
        </button>
      </div>

      <div className="relative h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
}