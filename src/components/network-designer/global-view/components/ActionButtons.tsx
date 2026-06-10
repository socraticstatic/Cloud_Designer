// Bottom-center action pill - per the SDCI Figma Pano frame:
// one white pill, "Regional Performance | Business Insights" with divider.
import { LayoutGrid, Sparkles } from 'lucide-react';

interface ActionButtonsProps {
  activePanel: 'none' | 'metrics' | 'performance';
  togglePanel: (panelType: 'metrics' | 'performance') => void;
  nodesLength: number;
}

export function ActionButtons({
  activePanel,
  togglePanel,
  nodesLength
}: ActionButtonsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-md border border-gray-200 flex items-center overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePanel('performance');
        }}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          activePanel === 'performance'
            ? 'bg-fw-ctaGhost text-fw-link'
            : 'text-fw-body hover:bg-fw-wash'
        } disabled:text-fw-disabled`}
        disabled={nodesLength === 0}
      >
        <LayoutGrid className="h-4 w-4" />
        Regional Performance
      </button>
      <div className="h-6 w-px bg-gray-200" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePanel('metrics');
        }}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          activePanel === 'metrics'
            ? 'bg-fw-ctaGhost text-fw-link'
            : 'text-fw-body hover:bg-fw-wash'
        } disabled:text-fw-disabled`}
        disabled={nodesLength === 0}
      >
        <Sparkles className="h-4 w-4" />
        Business Insights
      </button>
    </div>
  );
}
