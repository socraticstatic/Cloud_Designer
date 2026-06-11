// Miniature topology preview - nodes and links scaled into a small SVG.
// Used by the welcome screen's Open cards so saved designs are
// recognizable at a glance instead of an empty card body.

import { NetworkNode, NetworkEdge } from '../types';

const TYPE_COLOR: Record<string, string> = {
  destination: '#0078D4',
  network: '#0057B8',
  function: '#C633C6',
  datacenter: '#475569'
};

interface TopologyThumbnailProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  height?: number;
}

export function TopologyThumbnail({ nodes, edges, height = 96 }: TopologyThumbnailProps) {
  if (nodes.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-[11px] text-gray-400">Empty design</div>;
  }

  const pad = 14;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(60, Math.max(...xs) - Math.min(...xs)) + pad * 2;
  const h = Math.max(60, Math.max(...ys) - Math.min(...ys)) + pad * 2;
  const at = (id: string) => nodes.find(n => n.id === id);

  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      style={{ height }}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {edges.map(edge => {
        const a = at(edge.source);
        const b = at(edge.target);
        if (!a || !b) return null;
        return (
          <line
            key={edge.id}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#C3C8CE"
            strokeWidth={Math.max(1.5, w / 300)}
          />
        );
      })}
      {nodes.map(node => (
        <circle
          key={node.id}
          cx={node.x} cy={node.y}
          r={Math.max(5, w / 70)}
          fill={TYPE_COLOR[node.type] ?? '#64748B'}
          stroke="white"
          strokeWidth={Math.max(1.5, w / 400)}
        />
      ))}
    </svg>
  );
}
