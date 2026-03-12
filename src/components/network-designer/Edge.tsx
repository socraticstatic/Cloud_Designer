import { NetworkNode, NetworkEdge } from '../types';
import { memo } from 'react';
import { EDGE_TYPE_COLORS } from '../../constants';

interface EdgeProps {
  edge: NetworkEdge;
  nodes: NetworkNode[];
  isSelected: boolean;
  onClick: () => void;
}

// Abbreviate bandwidth for compact display: "10 Gbps" -> "10G"
function abbreviateBandwidth(bw?: string): string {
  if (!bw) return '';
  return bw.replace(/\s*Gbps/i, 'G').replace(/\s*Mbps/i, 'M');
}

// Memoize the Edge component for better performance
export const Edge = memo(function Edge({
  edge,
  nodes,
  isSelected,
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

  // Calculate the midpoint for edge label
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Service-aware color from EDGE_TYPE_COLORS, with fallback
  const serviceColor = EDGE_TYPE_COLORS[edge.type] || '#9ca3af';

  const getEdgeColor = () => {
    if (isSelected) return '#3b82f6';
    if (edge.status === 'active') return serviceColor;
    return '#d1d5db';
  };

  const getArrowColor = () => {
    if (isSelected) return '#3b82f6';
    if (edge.status === 'active') return serviceColor;
    return '#d1d5db';
  };

  // Build label text: "MPLS 10G" or "Direct Connect 10G"
  const labelType = edge.type || '';
  const labelBw = abbreviateBandwidth(edge.bandwidth);
  const label = labelBw ? `${labelType} ${labelBw}` : labelType;

  // Calculate label rotation to keep text readable (not upside down)
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI;
  const labelAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;

  // Offset label slightly above the line
  const offsetDist = 10;
  const perpAngle = (Math.atan2(targetY - sourceY, targetX - sourceX)) - Math.PI / 2;
  const labelX = midX + Math.cos(perpAngle) * offsetDist;
  const labelY = midY + Math.sin(perpAngle) * offsetDist;

  return (
    <>
      {/* Edge line */}
      <path
        d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        stroke={getEdgeColor()}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        strokeDasharray={edge.type === 'VPN' ? '5,5' : undefined}
        style={{ pointerEvents: 'none' }}
      />

      {/* Arrow at the end */}
      <polygon
        points={`${targetX - 15},${targetY - 5} ${targetX - 5},${targetY} ${targetX - 15},${targetY + 5}`}
        fill={getArrowColor()}
        transform={`rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI}, ${targetX}, ${targetY})`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Service label at midpoint */}
      {label && (
        <g transform={`translate(${labelX}, ${labelY}) rotate(${labelAngle})`}>
          <rect
            x={-label.length * 3.2}
            y={-8}
            width={label.length * 6.4}
            height={14}
            rx={3}
            fill="white"
            fillOpacity={0.9}
            stroke={isSelected ? '#3b82f6' : serviceColor}
            strokeWidth={0.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            fill={isSelected ? '#3b82f6' : '#374151'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
});