import { useRef, useEffect, useState, forwardRef, memo, RefObject } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { Node } from './Node';
import { Edge } from './Edge';
import { EdgeControls } from './EdgeControls';
import { CANVAS_BOUNDS, Z_INDEX } from '../../constants';

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
  onNodeDragEnd: () => void;
  onEdgeClick: (edge: NetworkEdge | null) => void;
  maxY: number;
  onUpdateNode?: (nodeId: string, updates: Partial<NetworkNode>) => void;
  onUpdateEdge?: (edgeId: string, updates: Partial<NetworkEdge>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
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
  onDeleteEdge
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
  const gridSize = CANVAS_BOUNDS.GRID_SIZE;

  // Use provided ref or internal ref
  const canvasRef = ref as RefObject<HTMLDivElement> || internalCanvasRef;
  
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
  
  // Handle canvas click - clear selections if clicking on empty space
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the canvas background
    if (e.target === e.currentTarget && !isDragging && !isReadOnly) {
      onNodeClick(null);
      onEdgeClick(null);
    }
  };

  // Handle fit to screen function
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
    
    const contentWidth = contentBounds.maxX - contentBounds.minX + padding * 2;
    const contentHeight = contentBounds.maxY - contentBounds.minY + padding * 2;
    
    // Calculate zoom level to fit content
    const widthRatio = canvasWidth / contentWidth;
    const heightRatio = canvasHeight / contentHeight;
    const newZoom = Math.min(widthRatio, heightRatio, 1.5);
    
    // Calculate pan to center content
    const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
    const centerY = (contentBounds.minY + contentBounds.maxY) / 2;
    
    const panX = (canvasWidth / 2) - (centerX * newZoom);
    const panY = (canvasHeight / 2) - (centerY * newZoom);
    
    setZoomLevel(newZoom);
    setPanOffset({ x: panX, y: panY });
  };

  return (
    <div
      ref={canvasRef as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden bg-gray-50"
      style={{ 
        width: '100%',
        height: `${maxY}px`,
        zIndex: 5,
        cursor: isPanning ? 'grabbing' : 'default'
      }}
      onClick={handleCanvasClick}
    >
      {/* Light Blue Background */}
      <div className="absolute inset-0 bg-blue-50" style={{ zIndex: 1 }}></div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: `${gridSize * zoomLevel}px ${gridSize * zoomLevel}px`,
          backgroundPosition: `${panOffset.x % (gridSize * zoomLevel)}px ${panOffset.y % (gridSize * zoomLevel)}px`,
          zIndex: 2,
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
          zIndex: 10
        }}
      >
        {/* SVG Layer for Edges - Only visual representation */}
        <svg 
          className="absolute inset-0" 
          style={{ zIndex: 10, pointerEvents: 'none' }}
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
              onClick={() => onEdgeClick(edge)}
            />
          ))}

          {/* Edge Creation Preview */}
          {isCreatingEdge && edgeStart && (
            <g>
              <path
                d={`
                  M ${nodes.find(n => n.id === edgeStart)?.x + 32 || 0} ${nodes.find(n => n.id === edgeStart)?.y + 32 || 0}
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

        {/* Nodes Layer */}
        <div className="absolute inset-0" style={{ zIndex: 20 }}>
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isCreatingEdge={isCreatingEdge}
              isReadOnly={isReadOnly}
              onClick={() => onNodeClick(node)}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => {
                setIsDragging(false);
                onNodeDragEnd();
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
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';