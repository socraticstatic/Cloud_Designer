import { NetworkNode, NetworkEdge } from '../types';
import { useRef, useEffect, useState, memo } from 'react';
import { Settings } from 'lucide-react';

interface EdgeProps {
  edge: NetworkEdge;
  nodes: NetworkNode[];
  isSelected: boolean;
  onClick: () => void;
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

  // Calculate the midpoint for edge controls
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const getEdgeColor = () => {
    if (isSelected) return '#3b82f6';
    if (edge.status === 'active') return '#6b7280';
    return '#d1d5db';
  };

  const getArrowColor = () => {
    if (isSelected) return '#3b82f6';
    if (edge.status === 'active') return '#6b7280';
    return '#d1d5db';
  };

  return (
    <>
      {/* Only render the SVG line - no controls */}
      <path
        d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        stroke={getEdgeColor()}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        strokeDasharray={edge.type === 'AVPN' || edge.type === 'VPN' ? '5,5' : undefined}
        style={{ pointerEvents: 'none' }}
      />

      {/* Arrow at the end */}
      <polygon
        points={`${targetX - 15},${targetY - 5} ${targetX - 5},${targetY} ${targetX - 15},${targetY + 5}`}
        fill={getArrowColor()}
        transform={`rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI}, ${targetX}, ${targetY})`}
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
});