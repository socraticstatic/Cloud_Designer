// Overlap-free node placement. Nodes may pass over each other mid-drag,
// but they never REST overlapping: drops, restores, and imports all run
// through these helpers.

import { NetworkNode } from '../types';

// Node card is 64px plus its label zone; keep at least this much daylight
export const MIN_GAP_X = 100;
export const MIN_GAP_Y = 110;

const collidesWith = (others: NetworkNode[], px: number, py: number) =>
  others.some(n => Math.abs(n.x - px) < MIN_GAP_X && Math.abs(n.y - py) < MIN_GAP_Y);

// Nearest clear position via expanding ring search around the desired spot
export function nearestClearSpot(
  x: number,
  y: number,
  others: NetworkNode[],
  maxY: number
): { x: number; y: number } {
  if (!collidesWith(others, x, y)) return { x, y };
  for (let radius = 60; radius <= 600; radius += 30) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const px = Math.max(10, x + Math.cos(angle) * radius);
      const py = Math.max(10, Math.min(maxY, y + Math.sin(angle) * radius));
      if (!collidesWith(others, px, py)) return { x: px, y: py };
    }
  }
  return { x: x + 160, y };
}

// Re-place one node (after a drop) so it doesn't rest on any other
export function resolveNodeOverlap(nodeId: string, nodes: NetworkNode[], maxY: number): NetworkNode[] {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return nodes;
  const others = nodes.filter(n => n.id !== nodeId);
  const spot = nearestClearSpot(node.x, node.y, others, maxY);
  if (spot.x === node.x && spot.y === node.y) return nodes;
  return nodes.map(n => (n.id === nodeId ? { ...n, x: spot.x, y: spot.y } : n));
}

// Normalize a whole topology (restore/import): keep earlier nodes pinned,
// slide each later node off anything it overlaps. Returns the same array
// when nothing needed to move so callers can cheaply detect changes.
export function resolveAllOverlaps(nodes: NetworkNode[], maxY: number): NetworkNode[] {
  const placed: NetworkNode[] = [];
  let changed = false;
  nodes.forEach(node => {
    const spot = nearestClearSpot(node.x, node.y, placed, maxY);
    if (spot.x !== node.x || spot.y !== node.y) {
      changed = true;
      placed.push({ ...node, x: spot.x, y: spot.y });
    } else {
      placed.push(node);
    }
  });
  return changed ? placed : nodes;
}
