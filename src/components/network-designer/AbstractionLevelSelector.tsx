import { Layers, Globe, Network, BrainCircuit as Circuit, FolderClock } from 'lucide-react';

type AbstractionLevel = 'global' | 'network' | 'circuit';

interface AbstractionLevelSelectorProps {
  currentLevel: AbstractionLevel;
  onLevelChange: (level: AbstractionLevel) => void;
  onHistoryClick: () => void;
}

export function AbstractionLevelSelector({
  currentLevel,
  onLevelChange,
  onHistoryClick
}: AbstractionLevelSelectorProps) {
  return (
    <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-lg shadow-sm border border-gray-200 py-3 px-2 flex flex-col items-center space-y-4 z-50">
      <div className="text-xs text-gray-500 font-medium whitespace-nowrap px-2">View Level</div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onLevelChange('global');
        }}
        className={`p-2 rounded-lg transition-all flex flex-col items-center ${
          currentLevel === 'global'
            ? 'bg-blue-50 text-blue-600'
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title="Global View"
        type="button"
      >
        <Globe className="h-5 w-5" />
        <span className="text-xs mt-1">Pano</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onLevelChange('network');
        }}
        className={`p-2 rounded-lg transition-all flex flex-col items-center ${
          currentLevel === 'network'
            ? 'bg-blue-50 text-blue-600'
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title="Network View"
        type="button"
      >
        <Network className="h-5 w-5" />
        <span className="text-xs mt-1">Topo</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onLevelChange('circuit');
        }}
        className={`p-2 rounded-lg transition-all flex flex-col items-center ${
          currentLevel === 'circuit'
            ? 'bg-blue-50 text-blue-600'
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title="Circuit View"
        type="button"
      >
        <Circuit className="h-5 w-5" />
        <span className="text-xs mt-1">Infra</span>
      </button>

      <div className="w-full h-px bg-gray-200 my-1"></div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onHistoryClick();
        }}
        className="p-2 rounded-lg transition-all flex flex-col items-center hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        title="Topology History"
        type="button"
      >
        <FolderClock className="h-5 w-5" />
        <span className="text-xs mt-1">History</span>
      </button>
    </div>
  );
}