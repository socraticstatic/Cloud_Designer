import { Layers, Globe, Network, BrainCircuit as Circuit, FolderClock } from 'lucide-react';
import { Z_INDEX } from '../../constants';

type AbstractionLevel = 'global' | 'network' | 'circuit';

interface AbstractionLevelSelectorProps {
  currentLevel: AbstractionLevel;
  onLevelChange: (level: AbstractionLevel) => void;
  onHistoryClick: () => void;
  hideHistory?: boolean;
}

export function AbstractionLevelSelector({
  currentLevel,
  onLevelChange,
  onHistoryClick,
  hideHistory = false
}: AbstractionLevelSelectorProps) {
  return (
    <div className="absolute top-1/2 left-4 transform -translate-y-1/2 flex flex-col space-y-4" style={{ zIndex: Z_INDEX.CHROME }}>
      {/* View Level Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-2 px-1.5 flex flex-col items-center space-y-1">

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLevelChange('global');
          }}
          className={`p-2 rounded-lg transition-all flex flex-col items-center ${
            currentLevel === 'global'
              ? 'text-fw-link'
              : 'text-fw-bodyLight hover:bg-fw-wash hover:text-fw-body'
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
              ? 'text-fw-link'
              : 'text-fw-bodyLight hover:bg-fw-wash hover:text-fw-body'
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
              ? 'text-fw-link'
              : 'text-fw-bodyLight hover:bg-fw-wash hover:text-fw-body'
          }`}
          title="Circuit View"
          type="button"
        >
          <Circuit className="h-5 w-5" />
          <span className="text-xs mt-1">Infra</span>
        </button>
      </div>

      {/* History Button - Separated */}
      {!hideHistory && <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-1.5 px-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistoryClick();
          }}
          className="p-2 rounded-lg transition-all flex flex-col items-center text-fw-bodyLight hover:bg-fw-wash hover:text-fw-body w-full"
          title="Topology History"
          type="button"
        >
          <FolderClock className="h-5 w-5" />
          <span className="text-xs mt-1">History</span>
        </button>
      </div>}
    </div>
  );
}