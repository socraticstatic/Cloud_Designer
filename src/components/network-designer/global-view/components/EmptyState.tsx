import { Globe, MapPin } from 'lucide-react';

interface EmptyStateProps {
  onZoomOut: (id?: string) => void;
  hasNodes: boolean;
}

export function EmptyState({ onZoomOut, hasNodes }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 40 }}>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center max-w-md">
        {hasNodes ? (
          <MapPin className="h-12 w-12 mx-auto text-amber-400 mb-4" />
        ) : (
          <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasNodes ? 'No Location Data' : 'No Network to Visualize'}
        </h3>
        <p className="text-gray-600 mb-4">
          {hasNodes
            ? 'Your nodes exist but none have geographic coordinates. Open each node in Topo View, go to the Connectivity tab, and set a Region and Location.'
            : 'Create your network in Topo View first, then switch to Pano View to see a global map.'}
        </p>
        <button
          onClick={() => onZoomOut('')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          type="button"
        >
          Switch to Topo View
        </button>
      </div>
    </div>
  );
}