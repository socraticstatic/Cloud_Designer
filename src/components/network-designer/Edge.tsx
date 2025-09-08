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

  // Calculate bandwidth utilization color
  const getBandwidthColor = () => {
    const utilization = edge.metrics?.bandwidthUtilization || 0;
    if (utilization > 90) return '#ef4444'; // red-500
    if (utilization > 70) return '#f59e0b'; // amber-500
    return '#10b981'; // green-500
  };

  return (
    <>
      {/* Only render the SVG line - no controls */}
      <path
        d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        stroke={isSelected ? '#3b82f6' : edge.status === 'active' ? getBandwidthColor() : '#d1d5db'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        strokeDasharray={edge.type === 'AVPN' || edge.type === 'VPN' ? '5,5' : undefined}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Arrow at the end */}
      <polygon
        points={`${targetX - 15},${targetY - 5} ${targetX - 5},${targetY} ${targetX - 15},${targetY + 5}`}
        fill={isSelected ? '#3b82f6' : edge.status === 'active' ? getBandwidthColor() : '#9ca3af'}
        transform={`rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI}, ${targetX}, ${targetY})`}
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
});