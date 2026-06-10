import { NetworkNode, NetworkEdge } from '../types';
import { memo } from 'react';

export type EdgeHighlight = 'error' | 'warning' | 'recommendation' | 'positive';

interface EdgeProps {
  edge: NetworkEdge;
  nodes: NetworkNode[];
  isSelected: boolean;
  highlight?: EdgeHighlight | null;
  onClick: () => void;
}

// Figma state legend line colors
const HIGHLIGHT_COLOR: Record<EdgeHighlight, string> = {
  error: '#C70032',
  warning: '#EA712F',
  recommendation: '#0057B8',
  positive: '#2D7E24'
};

// Memoize the Edge component for better performance
export const Edge = memo(function Edge({
  edge,
  nodes,
  isSelected,
  highlight = null,
  onClick
}: EdgeProps) {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate points
  const sourceX = sourceNode.x + 32;
  const sourceY = sourceNode.y + 32;
  const targetX = targetNode.x + 32;
  const targetY = targetNode.y + 32;

  // Line state per the Figma legend: active green, inactive gray,
  // advisor highlights override with their severity color.
  const getEdgeColor = () => {
    if (highlight) return HIGHLIGHT_COLOR[highlight];
    if (isSelected) return '#3b82f6';
    if (edge.status === 'active') return '#2D7E24';
    return '#d1d5db';
  };

  return (
    <>
      {/* Edge line - gentle bezier per Figma concept frames */}
      <path
        d={`M ${sourceX} ${sourceY} C ${sourceX + (targetX - sourceX) / 2} ${sourceY}, ${sourceX + (targetX - sourceX) / 2} ${targetY}, ${targetX} ${targetY}`}
        stroke={getEdgeColor()}
        strokeWidth={highlight ? 3 : isSelected ? 3 : 2}
        fill="none"
        strokeDasharray={edge.status !== 'active' && !edge.config?.configured ? '5,5' : edge.type === 'VPN' ? '5,5' : undefined}
        style={{ pointerEvents: 'none' }}
      />

    </>
  );
});