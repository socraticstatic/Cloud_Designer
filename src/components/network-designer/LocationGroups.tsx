// Location group containers - interactive site/metro objects, not decoration.
// A group represents a physical location shared by its member nodes:
//   - drag the chip to move every member node together
//   - click the chip to rename the site, recolor, or ungroup
//   - membership is the node's config.city (drop a node inside a group to adopt it)
// Visual language per the SDCI Figma frames: colored city chip + dashed tinted container.

import { useMemo, useState, useRef } from 'react';
import { Check, Palette, Ungroup, X } from 'lucide-react';
import { NetworkNode } from '../types';
import { CANVAS_BOUNDS, Z_INDEX } from '../../constants';

export interface LocationGroup {
  city: string;
  memberIds: string[];
  paletteIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const GROUP_PALETTES = [
  { chip: 'bg-purple-600', fill: 'rgba(147, 51, 234, 0.06)', border: 'rgba(147, 51, 234, 0.25)' },
  { chip: 'bg-green-600', fill: 'rgba(22, 163, 74, 0.06)', border: 'rgba(22, 163, 74, 0.25)' },
  { chip: 'bg-cobalt-600', fill: 'rgba(0, 87, 184, 0.05)', border: 'rgba(0, 87, 184, 0.25)' },
  { chip: 'bg-orange-500', fill: 'rgba(234, 113, 47, 0.06)', border: 'rgba(234, 113, 47, 0.25)' }
];

const PADDING = 28;
const NODE_SIZE = CANVAS_BOUNDS.NODE_SIZE;

// Shared so drop-to-adopt in the designer uses identical geometry
export function computeLocationGroups(nodes: NetworkNode[], colorOverrides: Record<string, number> = {}): LocationGroup[] {
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
      return {
        city,
        memberIds: members.map(n => n.id),
        paletteIndex: colorOverrides[city] ?? i % GROUP_PALETTES.length,
        x: Math.min(...xs) - PADDING,
        y: Math.min(...ys) - PADDING,
        width: Math.max(...xs) - Math.min(...xs) + NODE_SIZE + PADDING * 2,
        height: Math.max(...ys) - Math.min(...ys) + NODE_SIZE + PADDING * 2 + 24
      };
    });
}

interface LocationGroupsProps {
  nodes: NetworkNode[];
  zoomLevel?: number;
  isReadOnly?: boolean;
  colorOverrides?: Record<string, number>;
  onMoveGroup?: (memberIds: string[], dx: number, dy: number) => void;
  onMoveGroupEnd?: () => void;
  onRenameGroup?: (oldCity: string, newCity: string) => void;
  onUngroup?: (city: string) => void;
  onRecolorGroup?: (city: string, paletteIndex: number) => void;
}

export function LocationGroups({
  nodes,
  zoomLevel = 1,
  isReadOnly = false,
  colorOverrides = {},
  onMoveGroup,
  onMoveGroupEnd,
  onRenameGroup,
  onUngroup,
  onRecolorGroup
}: LocationGroupsProps) {
  const groups = useMemo(() => computeLocationGroups(nodes, colorOverrides), [nodes, colorOverrides]);
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const draggedRef = useRef(false);
  // Drag listeners outlive their starting render - read callbacks via refs
  const moveRef = useRef(onMoveGroup);
  moveRef.current = onMoveGroup;
  const moveEndRef = useRef(onMoveGroupEnd);
  moveEndRef.current = onMoveGroupEnd;

  if (groups.length === 0) return null;

  const startGroupDrag = (group: LocationGroup, e: React.MouseEvent) => {
    if (isReadOnly || !onMoveGroup) return;
    e.preventDefault();
    e.stopPropagation();
    draggedRef.current = false;
    let lastX = e.clientX;
    let lastY = e.clientY;

    const handleMove = (me: MouseEvent) => {
      const dx = (me.clientX - lastX) / zoomLevel;
      const dy = (me.clientY - lastY) / zoomLevel;
      if (Math.abs(me.clientX - lastX) > 2 || Math.abs(me.clientY - lastY) > 2) {
        draggedRef.current = true;
        moveRef.current?.(group.memberIds, dx, dy);
        lastX = me.clientX;
        lastY = me.clientY;
      }
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      if (draggedRef.current) moveEndRef.current?.();
      else {
        // plain click opens the editor
        setEditingCity(group.city);
        setDraftName(group.city);
      }
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const commitRename = (group: LocationGroup) => {
    const next = draftName.trim();
    if (next && next !== group.city) onRenameGroup?.(group.city, next);
    setEditingCity(null);
  };

  return (
    <>
      {/* Containers - behind edges and nodes */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.CANVAS_CONTENT }}>
        {groups.map(group => {
          const palette = GROUP_PALETTES[group.paletteIndex % GROUP_PALETTES.length];
          return (
            <div
              key={group.city}
              className="absolute rounded-2xl"
              style={{
                transform: `translate(${group.x}px, ${group.y}px)`,
                width: group.width,
                height: group.height,
                backgroundColor: palette.fill,
                border: `1.5px dashed ${palette.border}`
              }}
            />
          );
        })}
      </div>

      {/* Chips + editors - above nodes so they stay interactive */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.NODES + 10 }}>
      {groups.map(group => {
        const palette = GROUP_PALETTES[group.paletteIndex % GROUP_PALETTES.length];
        const isEditing = editingCity === group.city;
        return (
          <div key={group.city}>
            {/* City chip - drag to move the site, click to edit */}
            <div
              className={`absolute px-2 py-0.5 rounded text-[10px] font-medium text-white pointer-events-auto select-none ${palette.chip} ${
                isReadOnly ? '' : 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-white/60'
              }`}
              style={{ transform: `translate(${group.x + 4}px, ${group.y - 18}px)`, zIndex: Z_INDEX.NODES + 1 }}
              onMouseDown={(e) => startGroupDrag(group, e)}
              title={isReadOnly ? group.city : 'Drag to move site - click to edit'}
            >
              {group.city}
            </div>

            {/* Group editor popover */}
            {isEditing && !isReadOnly && (
              <div
                className="absolute pointer-events-auto bg-white rounded-xl shadow-lg border border-fw-border-secondary p-2 w-52"
                style={{ transform: `translate(${group.x + 4}px, ${group.y + 6}px)`, zIndex: Z_INDEX.NODES + 2 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(group);
                      if (e.key === 'Escape') setEditingCity(null);
                    }}
                    className="flex-1 min-w-0 px-2 py-1 text-xs border border-fw-border-secondary rounded-lg"
                    aria-label="Site name"
                  />
                  <button
                    onClick={() => commitRename(group)}
                    className="p-1.5 rounded-lg text-fw-success hover:bg-fw-success-bg"
                    title="Rename site"
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingCity(null)}
                    className="p-1.5 rounded-lg text-fw-bodyLight hover:bg-fw-wash"
                    title="Close"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-fw-border-secondary">
                  <button
                    onClick={() => onRecolorGroup?.(group.city, (group.paletteIndex + 1) % GROUP_PALETTES.length)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-fw-body hover:bg-fw-wash"
                    title="Cycle color"
                    type="button"
                  >
                    <Palette className="h-3.5 w-3.5" />
                    Color
                  </button>
                  <button
                    onClick={() => { onUngroup?.(group.city); setEditingCity(null); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-fw-error hover:bg-fw-error-bg"
                    title="Ungroup - nodes keep their positions"
                    type="button"
                  >
                    <Ungroup className="h-3.5 w-3.5" />
                    Ungroup
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
