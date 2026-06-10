import React from 'react';
import { Settings } from 'lucide-react';
import { NetworkEdge, NetworkNode } from '../types';
import { Z_INDEX } from '../../constants';

interface EdgeControlsProps {
  edges: NetworkEdge[];
  nodes: NetworkNode[];
  selectedEdge: string | null;
  isReadOnly?: boolean;
  onEdgeClick: (edge: NetworkEdge) => void;
}

export function EdgeControls({ edges, nodes, selectedEdge, isReadOnly = false, onEdgeClick }: EdgeControlsProps) {
  // Helper to find node by id
  const getNode = (id: string) => nodes.find(n => n.id === id);
  
  // Calculate bandwidth utilization color
  const getBandwidthColor = (edge: NetworkEdge) => {
    const utilization = edge.metrics?.bandwidthUtilization || 0;
    if (utilization > 90) return '#ef4444'; // red-500
    if (utilization > 70) return '#f59e0b'; // amber-500
    return '#10b981'; // green-500
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {edges.map(edge => {
        const sourceNode = getNode(edge.source);
        const targetNode = getNode(edge.target);
        
        if (!sourceNode || !targetNode) return null;
        
        // Skip rendering gear for AT&T Core connections
        if (sourceNode?.config?.networkType === 'at&t core' || 
            targetNode?.config?.networkType === 'at&t core' ||
            sourceNode?.name === 'AT&T Core' || 
            targetNode?.name === 'AT&T Core') {
          return null;
        }
        
        // Place the control along the edge at the first point clear of any
        // node card, so pills never hide behind or sit on top of nodes.
        const sourceX = sourceNode.x + 32;
        const sourceY = sourceNode.y + 32;
        const targetX = targetNode.x + 32;
        const targetY = targetNode.y + 32;
        const collides = (px: number, py: number) =>
          nodes.some(n =>
            px > n.x - 28 && px < n.x + 92 &&
            py > n.y - 28 && py < n.y + 116
          );
        const T_CANDIDATES = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
        let midX = (sourceX + targetX) / 2;
        let midY = (sourceY + targetY) / 2;
        for (const t of T_CANDIDATES) {
          const px = sourceX + (targetX - sourceX) * t;
          const py = sourceY + (targetY - sourceY) * t;
          if (!collides(px, py)) {
            midX = px;
            midY = py;
            break;
          }
        }
        
        const isSelected = selectedEdge === edge.id;
        
        return (
          <div key={edge.id} style={{ pointerEvents: 'none' }}>
            {/* Large clickable control point */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-md flex items-center justify-center cursor-pointer"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: '40px',
                height: '40px',
                backgroundColor: isSelected ? '#00388F' : 'white',
                border: `1.5px solid ${isSelected ? '#00388F' : '#E3E5E8'}`,
                zIndex: isSelected ? Z_INDEX.EDGE_CONTROLS + 1 : Z_INDEX.EDGE_CONTROLS,
                pointerEvents: isReadOnly ? 'none' : 'auto', // Disable clicking in read-only mode
                transition: 'all 0.2s ease'
              }}
              title={`${edge.type} \u00b7 ${edge.bandwidth}${edge.metrics?.latency ? ` \u00b7 ${edge.metrics.latency}` : ''}`}
              onClick={(e) => {
                if (!isReadOnly) {
                  e.stopPropagation();
                  onEdgeClick(edge);
                }
              }}
            >
              <Settings
                size={18}
                color={isSelected ? 'white' : '#6b7280'}
              />
            </div>
            
            {/* Status indicator */}
            <div
              className="absolute rounded-full shadow-sm border-2 border-white"
              style={{
                left: `${midX + 20}px`,
                top: `${midY - 20}px`,
                width: '16px',
                height: '16px',
                backgroundColor: edge.status === 'active' ? getBandwidthColor(edge) : '#9ca3af',
                zIndex: Z_INDEX.EDGE_CONTROLS,
                pointerEvents: 'none'
              }}
            />
          </div>
        );
      })}
    </div>
  );
}