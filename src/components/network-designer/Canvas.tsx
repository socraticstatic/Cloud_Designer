import { useRef, useEffect, useState, forwardRef, memo, RefObject } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { Node } from './Node';
import { Edge } from './Edge';
import { EdgeControls } from './EdgeControls';
import { LocationGroups } from './LocationGroups';
import { CANVAS_BOUNDS, Z_INDEX, CANVAS_SAFE_AREA } from '../../constants';

interface CanvasProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: string | null;
  selectedEdge: string | null;
  isCreatingEdge: boolean;
  edgeStart: string | null;
  isReadOnly?: boolean;
  onNodeClick: (node: NetworkNode | null) => void;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onNodeDragEnd: (nodeId?: string) => void;
  onEdgeClick: (edge: NetworkEdge | null) => void;
  maxY: number;
  onUpdateNode?: (nodeId: string, updates: Partial<NetworkNode>) => void;
  onUpdateEdge?: (edgeId: string, updates: Partial<NetworkEdge>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  highlightedNodes?: Record<string, 'error' | 'warning' | 'recommendation' | 'positive'>;
  highlightedEdges?: Record<string, 'error' | 'warning' | 'recommendation' | 'positive'>;
  displayMode?: 'icon' | 'card';
  groupColorOverrides?: Record<string, number>;
  multiSelectedIds?: string[];
  onMarqueeSelect?: (ids: string[]) => void;
  dimmedNodeIds?: string[];
  onConnectNodes?: (sourceId: string, targetId: string) => void;
  onMoveGroup?: (memberIds: string[], dx: number, dy: number) => void;
  onMoveGroupEnd?: () => void;
  onRenameGroup?: (oldCity: string, newCity: string) => void;
  onUngroup?: (city: string) => void;
  onRecolorGroup?: (city: string, paletteIndex: number) => void;
  // Advisor fix preview: proposed additions ghost-rendered until applied
  ghostNodes?: NetworkNode[];
  ghostEdges?: NetworkEdge[];
  changedEdgeIds?: string[];
  // Advisor finding badges drawn on affected nodes while the panel is open
  issueBadges?: Record<string, 'error' | 'warning' | 'recommendation'>;
  // Bump to request a fit-to-screen (e.g. after the advisor dock resizes the canvas)
  fitSignal?: number;
}

// Memoized Edge renderer for better performance
const MemoizedEdge = memo(Edge);

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  isCreatingEdge,
  edgeStart,
  isReadOnly = false,
  onNodeClick,
  onNodeDrag,
  onNodeDragEnd,
  onEdgeClick,
  maxY,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  highlightedNodes = {},
  highlightedEdges = {},
  displayMode = 'icon',
  groupColorOverrides = {},
  multiSelectedIds = [],
  onMarqueeSelect,
  dimmedNodeIds = [],
  onConnectNodes,
  onMoveGroup,
  onMoveGroupEnd,
  onRenameGroup,
  onUngroup,
  onRecolorGroup,
  ghostNodes = [],
  ghostEdges = [],
  changedEdgeIds = [],
  issueBadges = {},
  fitSignal = 0
}, ref) => {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [snapToGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contentBounds, setContentBounds] = useState({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectPos, setConnectPos] = useState({ x: 0, y: 0 });
  const gridSize = CANVAS_BOUNDS.GRID_SIZE;

  // Use provided ref or internal ref
  const canvasRef = ref as RefObject<HTMLDivElement> || internalCanvasRef;

  // Gesture listeners (marquee, drag-to-connect) outlive the render they
  // started in - they must read nodes through a ref, never the closure.
  // Same stale-closure disease that caused the node-drag runaway.
  const nodesGestureRef = useRef(nodes);
  nodesGestureRef.current = nodes;
  
  // Track mouse position for edge creation preview
  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (canvasRef && 'current' in canvasRef && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calculate position accounting for pan offset and zoom
        const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
        const y = Math.min((event.clientY - rect.top - panOffset.y) / zoomLevel, maxY - 32);
        
        // Snap to grid if enabled
        setMousePosition({
          x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
          y: snapToGrid ? Math.round(y / gridSize) * gridSize : y
        });
      }
    }

    if (isCreatingEdge && edgeStart) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isCreatingEdge, edgeStart, maxY, snapToGrid, gridSize, canvasRef, panOffset, zoomLevel]);

  // Track content boundaries
  useEffect(() => {
    if (nodes.length === 0) {
      setContentBounds({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
      return;
    }

    const nodeXs = nodes.map(n => n.x);
    const nodeYs = nodes.map(n => n.y);
    
    setContentBounds({
      minX: Math.min(...nodeXs) - 100,
      minY: Math.min(...nodeYs) - 100,
      maxX: Math.max(...nodeXs) + 100,
      maxY: Math.max(...nodeYs) + 100
    });
  }, [nodes]);
  
  // Handle middle-mouse/spacebar panning
  useEffect(() => {
    if (!canvasRef || !('current' in canvasRef) || !canvasRef.current) return;
    
    const element = canvasRef.current;
    
    // Middle mouse button panning
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt+Left click
        e.preventDefault();
        setIsPanning(true);
        setStartPanPosition({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt+Left click
        setIsPanning(false);
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const newPanX = e.clientX - startPanPosition.x;
        const newPanY = e.clientY - startPanPosition.y;
        setPanOffset({ x: newPanX, y: newPanY });
        
        // Change cursor during panning
        document.body.style.cursor = 'grabbing';
      }
    };
    
    // Spacebar panning
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPanning) {
        e.preventDefault();
        setIsPanning(true);
        const mouseEvent = new MouseEvent('mousemove');
        setStartPanPosition({ 
          x: mouseEvent.clientX - panOffset.x, 
          y: mouseEvent.clientY - panOffset.y 
        });
        document.body.style.cursor = 'grab';
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
        document.body.style.cursor = 'auto';
      }
    };
    
    // Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY) * 0.1;
        
        // Calculate mouse position relative to the canvas
        const rect = element.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
        const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
        
        // Calculate new zoom level
        const newZoomLevel = Math.max(0.5, Math.min(zoomLevel + delta, 2));
        
        // Calculate new pan offset to zoom towards/away from mouse position
        if (newZoomLevel !== zoomLevel) {
          const newPanX = e.clientX - mouseX * newZoomLevel;
          const newPanY = e.clientY - mouseY * newZoomLevel;
          setPanOffset({ x: newPanX, y: newPanY });
          setZoomLevel(newZoomLevel);
        }
      }
    };
    
    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    element.addEventListener('wheel', handleWheel, { passive: false });
    
    // Clean up
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      element.removeEventListener('wheel', handleWheel);
      document.body.style.cursor = 'auto';
    };
  }, [canvasRef, isPanning, startPanPosition, panOffset, zoomLevel]);
  
  // Convert a client point into canvas (content) coordinates
  const toCanvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - panOffset.x) / zoomLevel,
      y: (clientY - rect.top - panOffset.y) / zoomLevel
    };
  };

  // Marquee selection: drag on empty canvas sweeps a selection rectangle
  const handleMarqueeStart = (e: React.MouseEvent) => {
    // start only on empty canvas: not on a node, chip, control, or button
    const el = e.target as HTMLElement;
    const onInteractive = el.closest('.pointer-events-auto, button, input, .edge-control');
    if (onInteractive || isReadOnly || isCreatingEdge || e.button !== 0 || e.altKey) return;
    e.preventDefault(); // marquee must not smear native text selection
    const start = toCanvasPoint(e.clientX, e.clientY);
    setMarquee({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });

    const handleMove = (me: MouseEvent) => {
      const point = toCanvasPoint(me.clientX, me.clientY);
      setMarquee(prev => prev ? { ...prev, x2: point.x, y2: point.y } : prev);
    };
    const handleUp = (me: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const end = toCanvasPoint(me.clientX, me.clientY);
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY2 = Math.max(start.y, end.y);
      if (maxX - minX > 8 || maxY2 - minY > 8) {
        const hit = nodesGestureRef.current
          .filter(n => n.x + 32 > minX && n.x + 32 < maxX && n.y + 32 > minY && n.y + 32 < maxY2)
          .map(n => n.id);
        onMarqueeSelect?.(hit);
      } else {
        onMarqueeSelect?.([]);
      }
      setMarquee(null);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Drag-to-connect: anchor mousedown on a node starts a live connector
  const handleAnchorDown = (nodeId: string, e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setConnectFrom(nodeId);
    setConnectPos(toCanvasPoint(e.clientX, e.clientY));

    const handleMove = (me: MouseEvent) => setConnectPos(toCanvasPoint(me.clientX, me.clientY));
    const handleUp = (me: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const point = toCanvasPoint(me.clientX, me.clientY);
      const target = nodes.find(n =>
        n.id !== nodeId && Math.hypot(n.x + 32 - point.x, n.y + 32 - point.y) < 56
      );
      if (target) onConnectNodes?.(nodeId, target.id);
      setConnectFrom(null);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Handle canvas click - clear selections if clicking on empty space
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the canvas background
    if (e.target === e.currentTarget && !isDragging && !isReadOnly) {
      onNodeClick(null);
      onEdgeClick(null);
    }
  };

  // Handle fit to screen function
  // Auto-fit when the viewport changes shape (advisor dock open/close).
  // Wait out the 300ms width transition so clientWidth is final.
  const handleFitToScreenRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (fitSignal === 0) return;
    const timer = setTimeout(() => handleFitToScreenRef.current(), 350);
    return () => clearTimeout(timer);
  }, [fitSignal]);

  const handleFitToScreen = () => {
    if (nodes.length === 0) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    // Calculate bounding box of all nodes
    const padding = 50;
    const canvasWidth = canvasRef.current?.clientWidth || 800;
    const canvasHeight = canvasRef.current?.clientHeight || 600;

    // Available area after accounting for chrome overlays
    const safeWidth = canvasWidth - CANVAS_SAFE_AREA.LEFT - CANVAS_SAFE_AREA.RIGHT;
    const safeHeight = canvasHeight - CANVAS_SAFE_AREA.TOP - CANVAS_SAFE_AREA.BOTTOM;
    const safeCenterX = CANVAS_SAFE_AREA.LEFT + safeWidth / 2;
    const safeCenterY = CANVAS_SAFE_AREA.TOP + safeHeight / 2;

    const contentWidth = contentBounds.maxX - contentBounds.minX + padding * 2;
    const contentHeight = contentBounds.maxY - contentBounds.minY + padding * 2;

    // Calculate zoom level to fit content within safe area
    const widthRatio = safeWidth / contentWidth;
    const heightRatio = safeHeight / contentHeight;
    const newZoom = Math.min(widthRatio, heightRatio, 1.5);

    // Calculate pan to center content within the safe area
    const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
    const centerY = (contentBounds.minY + contentBounds.maxY) / 2;

    const panX = safeCenterX - (centerX * newZoom);
    const panY = safeCenterY - (centerY * newZoom);
    
    setZoomLevel(newZoom);
    setPanOffset({ x: panX, y: panY });
  };
  handleFitToScreenRef.current = handleFitToScreen;

  return (
    <div
      ref={canvasRef as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden bg-gray-50"
      style={{ 
        width: '100%',
        height: `${maxY}px`,
        zIndex: Z_INDEX.CANVAS_CONTENT,
        cursor: isPanning ? 'grabbing' : 'default'
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMarqueeStart}
    >
      {/* Canvas wash background - per Figma concept frames */}
      <div className="absolute inset-0 bg-fw-wash" style={{ zIndex: Z_INDEX.BACKGROUND }}></div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: `${gridSize * zoomLevel}px ${gridSize * zoomLevel}px`,
          backgroundPosition: `${panOffset.x % (gridSize * zoomLevel)}px ${panOffset.y % (gridSize * zoomLevel)}px`,
          zIndex: Z_INDEX.GRID,
          opacity: 0.6
        }}
      />

      {/* Zoomable and Pannable Content Container */}
      <div
        className="absolute"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          zIndex: Z_INDEX.EDGES
        }}
      >
        {/* Location group containers - interactive site objects */}
        <LocationGroups
          nodes={nodes}
          zoomLevel={zoomLevel}
          isReadOnly={isReadOnly}
          colorOverrides={groupColorOverrides}
          onMoveGroup={onMoveGroup}
          onMoveGroupEnd={onMoveGroupEnd}
          onRenameGroup={onRenameGroup}
          onUngroup={onUngroup}
          onRecolorGroup={onRecolorGroup}
        />

        {/* SVG Layer for Edges - Only visual representation */}
        <svg 
          className="absolute inset-0" 
          style={{ zIndex: Z_INDEX.EDGES, pointerEvents: 'none' }}
          width="100%"
          height="100%"
        >
          {/* Existing Edges */}
          {edges.map(edge => (
            <MemoizedEdge
              key={edge.id}
              edge={edge}
              nodes={nodes}
              isSelected={selectedEdge === edge.id}
              highlight={highlightedEdges[edge.id] ?? null}
              onClick={() => onEdgeClick(edge)}
            />
          ))}

          {/* Advisor fix preview: ghost edges + changed-edge pulses */}
          {(ghostEdges.length > 0 || changedEdgeIds.length > 0) && (() => {
            const allNodes = [...nodes, ...ghostNodes];
            const at = (id: string) => allNodes.find(n => n.id === id);
            return (
              <g className="ghost-pulse">
                {ghostEdges.map(edge => {
                  const src = at(edge.source);
                  const tgt = at(edge.target);
                  if (!src || !tgt) return null;
                  return (
                    <path
                      key={`ghost-${edge.id}`}
                      d={`M ${src.x + 32} ${src.y + 32} L ${tgt.x + 32} ${tgt.y + 32}`}
                      stroke="#2D7E24"
                      strokeWidth={2.5}
                      strokeDasharray="7,5"
                      fill="none"
                    />
                  );
                })}
                {changedEdgeIds.map(id => {
                  const edge = edges.find(e => e.id === id);
                  const src = edge && at(edge.source);
                  const tgt = edge && at(edge.target);
                  if (!src || !tgt) return null;
                  return (
                    <path
                      key={`changed-${id}`}
                      d={`M ${src.x + 32} ${src.y + 32} L ${tgt.x + 32} ${tgt.y + 32}`}
                      stroke="#2D7E24"
                      strokeWidth={5}
                      strokeOpacity={0.35}
                      strokeLinecap="round"
                      fill="none"
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Drag-to-connect live preview */}
          {connectFrom && (() => {
            const src = nodes.find(n => n.id === connectFrom);
            if (!src) return null;
            return (
              <path
                d={`M ${src.x + 32} ${src.y + 32} L ${connectPos.x} ${connectPos.y}`}
                stroke="#0057B8"
                strokeWidth={2}
                strokeDasharray="5,5"
                fill="none"
              />
            );
          })()}

          {/* Marquee selection rectangle */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(0, 87, 184, 0.08)"
              stroke="#0057B8"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {/* Edge Creation Preview */}
          {isCreatingEdge && edgeStart && (
            <g>
              <path
                d={`
                  M ${(nodes.find(n => n.id === edgeStart)?.x ?? 0) + 32} ${(nodes.find(n => n.id === edgeStart)?.y ?? 0) + 32}
                  L ${mousePosition.x} ${mousePosition.y}
                `}
                className="stroke-blue-500 stroke-2 fill-none"
                style={{ strokeDasharray: '5,5' }}
              />
              {nodes.map(node => {
                if (node.id !== edgeStart) {
                  const distance = Math.hypot(
                    (node.x + 32) - mousePosition.x,
                    (node.y + 32) - mousePosition.y
                  );
                  const isValidTarget = distance < 50;
                  return isValidTarget ? (
                    <circle
                      key={`highlight-${node.id}`}
                      cx={node.x + 32}
                      cy={node.y + 32}
                      r="24"
                      className="fill-blue-100 stroke-blue-500 stroke-2"
                      style={{ opacity: 0.5 }}
                    />
                  ) : null;
                }
                return null;
              })}
            </g>
          )}
        </svg>

        {/* Separate layer for HTML-based edge controls */}
        <EdgeControls 
          edges={edges} 
          nodes={nodes} 
          selectedEdge={selectedEdge} 
          isReadOnly={isReadOnly}
          onEdgeClick={(edge) => onEdgeClick(edge)} 
        />

        {/* Nodes Layer - transparent to events so group chips beneath stay clickable */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.NODES }}>
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isCreatingEdge={isCreatingEdge}
              isReadOnly={isReadOnly}
              highlight={highlightedNodes[node.id] ?? null}
              issueBadge={issueBadges[node.id] ?? null}
              displayMode={displayMode}
              isMultiSelected={multiSelectedIds.includes(node.id)}
              dimmed={dimmedNodeIds.includes(node.id)}
              onAnchorDown={(e) => handleAnchorDown(node.id, e)}
              onClick={() => onNodeClick(node)}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => {
                setIsDragging(false);
                onNodeDragEnd(node.id);
              }}
              onDrag={(x, y) => {
                // Ensure we have valid numbers
                const validX = typeof x === 'number' ? x : 0;
                const validY = typeof y === 'number' ? y : 0;
                
                // Apply bounds to keep nodes within the canvas
                const boundedX = Math.max(0, Math.min(validX, (canvasRef.current?.clientWidth || 0) / zoomLevel - 64));
                const boundedY = Math.max(0, Math.min(validY, maxY - 64));
                
                // Snap to grid if enabled
                const snappedX = snapToGrid ? Math.round(boundedX / gridSize) * gridSize : boundedX;
                const snappedY = snapToGrid ? Math.round(boundedY / gridSize) * gridSize : boundedY;
                
                // Ensure we're always passing valid numbers
                onNodeDrag(
                  node.id, 
                  isNaN(snappedX) ? 0 : snappedX, 
                  isNaN(snappedY) ? 0 : snappedY
                );
              }}
              onNameChange={
                onUpdateNode
                  ? (newName) => onUpdateNode(node.id, { name: newName })
                  : undefined
              }
              zoomLevel={zoomLevel}
            />
          ))}
        </div>

        {/* Ghost nodes - the advisor's proposed additions, dashed green */}
        {ghostNodes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none ghost-pulse" style={{ zIndex: Z_INDEX.NODES + 1 }}>
            {ghostNodes.map(node => (
              <div
                key={`ghost-${node.id}`}
                className="absolute flex flex-col items-center"
                style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: 64 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-green-50/80 border-2 border-dashed border-green-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="mt-1 text-[11px] font-medium text-green-700 whitespace-nowrap bg-white/80 px-1.5 rounded">
                  {node.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls + fit (right rail, Figma parity with Pano) */}
      {!isReadOnly && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1" style={{ zIndex: Z_INDEX.CHROME }}>
          <button
            onClick={() => setZoomLevel(z => Math.min(2, +(z + 0.2).toFixed(2)))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-sm font-semibold leading-none"
            title="Zoom in" type="button"
          >+</button>
          <button
            onClick={() => setZoomLevel(z => Math.max(0.5, +(z - 0.2).toFixed(2)))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-sm font-semibold leading-none"
            title="Zoom out" type="button"
          >&minus;</button>
          <div className="h-px bg-gray-200 mx-1" />
          <button
            onClick={handleFitToScreen}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-[10px] font-medium leading-none"
            title="Fit to screen" type="button"
          >FIT</button>
          <div className="text-[10px] text-gray-400 text-center tabular-nums pb-0.5">{Math.round(zoomLevel * 100)}%</div>
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';