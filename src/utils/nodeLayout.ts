// Overlap-free, in-bounds node placement. Nodes may pass over each other
// mid-drag, but they never REST overlapping, off-canvas, or under the
// floating chrome: drops, restores, imports, and fixes all run through here.

import { NetworkNode } from '../types';

// Minimum daylight between resting nodes. This covers the full visual
// envelope, not just the 64px card: name labels extend ~36px below and
// can run ~150px wide, and a site chip rides ~46px above a group's
// topmost node. Nothing a node carries may touch a neighbor's envelope.
export const MIN_GAP_X = 150;
export const MIN_GAP_Y = 155;

export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Resting area inside the canvas: clear of the chrome PLUS the decoration
// a node can carry. A location-group chip renders ~46px above the group's
// topmost node and the dashed container pads 28px on every side, so the
// margins account for the full visual envelope, not just the 64px card:
//   top:    status bar / back bar / filter (~125px) + chip clearance
//   bottom: floating toolbar (~96px) + card + label + container padding
//   left:   view rail column; right: zoom rail
export interface CanvasView {
  zoom: number;
  panX: number;
  panY: number;
}

// The chrome margins are SCREEN pixels; node coordinates are LOGICAL.
// screen = logical * zoom + pan, so a screen margin M maps to the logical
// constraint (M - pan) / zoom. Clamping with zoom-1 math built invisible
// walls inside the visible canvas at fitted zooms and yanked nodes
// sideways on grab.
export function restingBounds(
  canvasWidth: number,
  canvasHeight: number,
  view: CanvasView = { zoom: 1, panX: 0, panY: 0 }
): LayoutBounds {
  const { zoom, panX, panY } = view;
  const minX = (140 - panX) / zoom;
  const minY = (175 - panY) / zoom;
  const maxX = (canvasWidth - 160 - panX) / zoom;
  const maxY = (canvasHeight - 220 - panY) / zoom;
  return {
    minX,
    minY,
    maxX: Math.max(minX + 200, maxX),
    maxY: Math.max(minY + 200, maxY)
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
