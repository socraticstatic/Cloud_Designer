// Site-aware auto-layout for imported/discovered topologies.
//
// Column-by-type layout interleaved members of different sites, so the
// location-group bounding boxes overlapped into nonsense. This lays out
// BY SITE: each city gets its own cluster region (members stacked in
// short columns, ordered network > function > datacenter > destination),
// clusters flow left-to-right with enough margin that group containers
// (28px padding + chip) can never intersect. Solo nodes (no city) form a
// trailing pseudo-cluster; they draw no container.

import { NetworkNode } from '../types';
import { LayoutBounds, MIN_GAP_X, MIN_GAP_Y } from './nodeLayout';

const TYPE_ORDER: Record<NetworkNode['type'], number> = {
  network: 0,
  function: 1,
  datacenter: 2,
  destination: 3
};

// Horizontal/vertical pitch between members inside a cluster
const PITCH_X = MIN_GAP_X + 20; // 170
const PITCH_Y = MIN_GAP_Y + 15; // 170
// Daylight between neighboring clusters - covers both containers'
// 28px padding plus visible separation
const CLUSTER_GAP = 130;

export function layoutBySites(nodes: NetworkNode[], bounds: LayoutBounds): NetworkNode[] {
  if (nodes.length === 0) return nodes;

  // Group by site; solos last
  const sites = new Map<string, NetworkNode[]>();
  nodes.forEach(n => {
    const key = n.config?.city || '';
    if (!sites.has(key)) sites.set(key, []);
    sites.get(key)!.push(n);
  });
  const ordered = [...sites.entries()].sort((a, b) => {
    if (a[0] === '') return 1;
    if (b[0] === '') return -1;
    return b[1].length - a[1].length;
  });

  const maxRows = Math.max(1, Math.floor((bounds.maxY - bounds.minY) / PITCH_Y) + 1);
  const placed = new Map<string, { x: number; y: number }>();

  let cursorX = bounds.minX;
  let cursorY = bounds.minY;
  let bandHeight = 0;

  ordered.forEach(([, members]) => {
    const sorted = [...members].sort((a, b) =>
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name));
    const rows = Math.min(maxRows, Math.max(1, Math.ceil(Math.sqrt(sorted.length))));
    const cols = Math.ceil(sorted.length / rows);
    const clusterW = (cols - 1) * PITCH_X;
    const clusterH = (Math.min(rows, sorted.length) - 1) * PITCH_Y;

    // Wrap to the next band when this cluster would overflow the right edge
    if (cursorX + clusterW > bounds.maxX && cursorX > bounds.minX) {
      cursorX = bounds.minX;
      // band advance must clear the member gap (PITCH_Y) AND leave
      // daylight between the two bands' group containers
      cursorY = Math.min(cursorY + bandHeight + PITCH_Y + 30, bounds.maxY);
      bandHeight = 0;
    }

    sorted.forEach((node, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      placed.set(node.id, {
        x: Math.min(cursorX + col * PITCH_X, bounds.maxX),
        y: Math.min(cursorY + row * PITCH_Y, bounds.maxY)
      });
    });

    cursorX += clusterW + CLUSTER_GAP + PITCH_X;
    bandHeight = Math.max(bandHeight, clusterH);
  });

  return nodes.map(n => {
    const p = placed.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}
