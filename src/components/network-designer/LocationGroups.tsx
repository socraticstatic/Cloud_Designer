// Location group containers - per the SDCI Figma "Network Designer" frames:
// nodes sharing a city are wrapped in a tinted dotted container with a
// colored city chip at the top-left (e.g. purple "Ashburn", green "New York").

import { useMemo } from 'react';
import { NetworkNode } from '../types';
import { CANVAS_BOUNDS } from '../../constants';

interface LocationGroupsProps {
  nodes: NetworkNode[];
}

const GROUP_PALETTES = [
  { chip: 'bg-purple-600', fill: 'rgba(147, 51, 234, 0.06)', border: 'rgba(147, 51, 234, 0.25)' },
  { chip: 'bg-green-600', fill: 'rgba(22, 163, 74, 0.06)', border: 'rgba(22, 163, 74, 0.25)' },
  { chip: 'bg-cobalt-600', fill: 'rgba(0, 87, 184, 0.05)', border: 'rgba(0, 87, 184, 0.25)' },
  { chip: 'bg-orange-500', fill: 'rgba(234, 113, 47, 0.06)', border: 'rgba(234, 113, 47, 0.25)' }
];

const PADDING = 28;
const NODE_SIZE = CANVAS_BOUNDS.NODE_SIZE;

export function LocationGroups({ nodes }: LocationGroupsProps) {
  const groups = useMemo(() => {
    const byCity = new Map<string, NetworkNode[]>();
    nodes.forEach(node => {
      const city = node.config?.city;
      if (!city) return;
      if (!byCity.has(city)) byCity.set(city, []);
      byCity.get(city)!.push(node);
    });

    return [...byCity.entries()]
      .filter(([, members]) => members.length >= 2)
      .map(([city, members], i) => {
        const xs = members.map(n => n.x);
        const ys = members.map(n => n.y);
        const box = {
          x: Math.min(...xs) - PADDING,
          y: Math.min(...ys) - PADDING,
          width: Math.max(...xs) - Math.min(...xs) + NODE_SIZE + PADDING * 2,
          height: Math.max(...ys) - Math.min(...ys) + NODE_SIZE + PADDING * 2 + 24
        };
        // A bounding box that swallows a node from another city reads as
        // false membership - skip drawing that container.
        const containsForeign = nodes.some(n =>
          n.config?.city !== city &&
          n.x + NODE_SIZE > box.x && n.x < box.x + box.width &&
          n.y + NODE_SIZE > box.y && n.y < box.y + box.height
        );
        if (containsForeign) return null;
        return { city, palette: GROUP_PALETTES[i % GROUP_PALETTES.length], ...box };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [nodes]);

  if (groups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {groups.map(group => (
        <div key={group.city}>
          <div
            className="absolute rounded-2xl"
            style={{
              transform: `translate(${group.x}px, ${group.y}px)`,
              width: group.width,
              height: group.height,
              backgroundColor: group.palette.fill,
              border: `1.5px dashed ${group.palette.border}`
            }}
          />
          <div
            className={`absolute px-2 py-0.5 rounded text-[10px] font-medium text-white ${group.palette.chip}`}
            style={{ transform: `translate(${group.x + 4}px, ${group.y - 18}px)` }}
          >
            {group.city}
          </div>
        </div>
      ))}
    </div>
  );
}
