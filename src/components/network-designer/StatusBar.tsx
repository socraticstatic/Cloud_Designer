import { Activity, Shield, RefreshCw, Network } from 'lucide-react';
import { NetworkNode, NetworkEdge } from '../types';
import { ExportButton } from './components/ExportButton';
import { calculateTotalBandwidth } from '../../utils/calculations';

interface StatusBarProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onRefresh: () => void;
  canvasRef?: React.RefObject<HTMLElement>;
}

export function StatusBar({ nodes, edges, onRefresh, canvasRef }: StatusBarProps) {
  // Calculate active elements
  const activeNodes = nodes.filter(node => node.status === 'active').length;
  const activeEdges = edges.filter(edge => edge.status === 'active').length;
  
  // Calculate bandwidth total
  const bandwidthTotal = calculateTotalBandwidth(edges);
  
  return (
    <div 
      className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm border border-gray-200 py-2 px-3 flex items-center space-x-6 whitespace-nowrap"
      style={{ zIndex: 20, minWidth: '700px' }}
    >
      {/* Total Bandwidth */}
      <div className="flex items-center">
        <Network className="h-4 w-4 text-blue-500 mr-1 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900">{bandwidthTotal}</span>
      </div>

      {/* Nodes Info */}
      <div className="flex items-center">
        <Activity className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
        <span className="text-sm text-gray-600">{nodes.length} Nodes</span>
      </div>
      
      {/* Connections Info */}
      <div className="flex items-center">
        <Shield className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
        <span className="text-sm text-gray-600">{edges.length} Connections</span>
      </div>

      {/* Active Info */}
      <div className="flex items-center">
        <span className="inline-flex h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
        <span className="text-sm text-gray-600">{activeNodes} Active Nodes</span>
      </div>
      
      <div className="flex items-center">
        <span className="inline-flex h-2 w-2 bg-blue-500 rounded-full mr-1.5"></span>
        <span className="text-sm text-gray-600">{activeEdges} Active Connections</span>
      </div>
      
      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      
      {/* Export Button */}
      {canvasRef && (
        <div className="flex items-center">
          {/* Small separator line */}
          <div className="h-6 w-px bg-gray-200 mr-3"></div>
          <ExportButton 
            nodes={nodes}
            edges={edges}
            canvasRef={canvasRef}
          />
        </div>
      )}
    </div>
  );
}