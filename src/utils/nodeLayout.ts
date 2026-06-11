// Overlap-free, in-bounds node placement. Nodes may pass over each other
// mid-drag, but they never REST overlapping, off-canvas, or under the
// floating chrome: drops, restores, imports, and fixes all run through here.

import { NetworkNode } from '../types';

// Node card is 64px plus its label zone; keep at least this much daylight
export const MIN_GAP_X = 100;
export const MIN_GAP_Y = 110;

export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Resting area inside the canvas: clear of the status bar (top), the
// floating toolbar (bottom), the left rail, and the right zoom rail.
export function restingBounds(canvasWidth: number, canvasHeight: number): LayoutBounds {
  return {
    minX: 90,
    minY: 70,
    maxX: Math.max(200, canvasWidth - 150),
    maxY: Math.max(200, canvasHeight - 180)
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function clampToBounds(x: number, y: number, b: LayoutBounds): { x: number; y: number } {
  return { x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY) };
}

const collidesWith = (others: NetworkNode[], px: number, py: number) =>
  others.some(n => Math.abs(n.x - px) < MIN_GAP_X && Math.abs(n.y - py) < MIN_GAP_Y);

// Nearest clear in-bounds position via expanding ring search
export function nearestClearSpot(
  x: number,
  y: number,
  others: NetworkNode[],
  bounds: LayoutBounds
): { x: number; y: number } {
  const start = clampToBounds(x, y, bounds);
  if (!collidesWith(others, start.x, start.y)) return start;
  for (let radius = 60; radius <= 900; radius += 30) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const p = clampToBounds(
        start.x + Math.cos(angle) * radius,
        start.y + Math.sin(angle) * radius,
        bounds
      );
      if (!collidesWith(others, p.x, p.y)) return p;
    }
  }
  return start;
}

// Re-place one node (after a drop) so it rests clear and in-bounds
export function resolveNodeOverlap(nodeId: string, nodes: NetworkNode[], bounds: LayoutBounds): NetworkNode[] {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return nodes;
  const others = nodes.filter(n => n.id !== nodeId);
  const spot = nearestClearSpot(node.x, node.y, others, bounds);
  if (spot.x === node.x && spot.y === node.y) return nodes;
  return nodes.map(n => (n.id === nodeId ? { ...n, x: spot.x, y: spot.y } : n));
}

// Normalize a whole topology (restore/import): keep earlier nodes pinned
// where possible, clamp everything in-bounds, slide overlaps clear.
// Returns the same array when nothing moved so callers detect changes cheaply.
export function resolveAllOverlaps(nodes: NetworkNode[], bounds: LayoutBounds): NetworkNode[] {
  const placed: NetworkNode[] = [];
  let changed = false;
  nodes.forEach(node => {
    const spot = nearestClearSpot(node.x, node.y, placed, bounds);
    if (spot.x !== node.x || spot.y !== node.y) {
      changed = true;
      placed.push({ ...node, x: spot.x, y: spot.y });
    } else {
      placed.push(node);
    }
  });
  return changed ? placed : nodes;
}
