import { useState, useRef, useEffect, memo } from 'react';
import { NetworkNode } from '../types';
import { getNodeColors } from '../../utils/nodeUtils';
import { CANVAS_BOUNDS, Z_INDEX } from '../../constants';

interface NodeProps {
  node: NetworkNode;
  isSelected: boolean;
  isCreatingEdge: boolean;
  isReadOnly?: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrag: (x: number, y: number) => void;
  onNameChange?: (newName: string) => void;
  zoomLevel?: number;
}

// Memoize the Node component for better performance
export const Node = memo(function Node({
  node,
  isSelected,
  isCreatingEdge,
  isReadOnly = false,
  onClick,
  onDragStart,
  onDragEnd,
  onDrag,
  onNameChange,
  zoomLevel = 1
}: NodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nodeName, setNodeName] = useState(node.name);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Track node position
  const [position, setPosition] = useState({ x: node.x, y: node.y });

  // Update position when node coordinates change
  useEffect(() => {
    setPosition({ x: node.x, y: node.y });
  }, [node.x, node.y]);

  // Handle drag events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (nodeRef.current) {
        const rect = nodeRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          // Calculate position accounting for zoom level
          const x = (e.clientX - rect.left) / zoomLevel - dragOffset.x;
          const y = (e.clientY - rect.top) / zoomLevel - dragOffset.y;

          // Check if we've moved more than 5 pixels (threshold to detect drag)
          const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
          const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
          if (deltaX > 5 || deltaY > 5) {
            setHasDragged(true);
          }

          onDrag(x, y);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();

      // Reset hasDragged after a short delay to allow click handler to check it
      setTimeout(() => setHasDragged(false), 50);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag, onDragEnd, zoomLevel]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const Icon = node.icon;

  // Get node colors
  const colors = getNodeColors(node);
  const background = isSelected ? 'bg-blue-50' : isDragging ? 'bg-gray-50' : colors.background;
  const iconColor = isSelected ? 'text-blue-500' : isDragging ? 'text-gray-600' : colors.icon;

  const handleNameSubmit = () => {
    if (nodeName.trim() && onNameChange) {
      onNameChange(nodeName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setNodeName(node.name);
      setIsEditingName(false);
    }
  };

  return (
    <>
      <div
        ref={nodeRef}
        className={`
          absolute w-16 h-16 flex items-center justify-center
          rounded-lg transition-all duration-200
          ${background}
          ${isReadOnly ? 'cursor-default' : isCreatingEdge ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isDragging ? 'shadow-lg scale-105' : 'shadow-sm hover:shadow-md'}
          border-2 ${isSelected ? 'border-blue-500' : isCreatingEdge ? 'border-blue-400 border-dashed' : 'border-gray-200'}
        `}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          zIndex: Z_INDEX.NODES
        }}
        onMouseEnter={() => !isReadOnly && !isDragging && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          if (isCreatingEdge && !isReadOnly) {
            e.stopPropagation();
            onClick();
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!isReadOnly && !isCreatingEdge) {
            onClick();
            setShowTooltip(false);
          }
        }}
        onMouseDown={(e) => {
          if (!isCreatingEdge && nodeRef.current && !isReadOnly) {
            e.stopPropagation();
            setShowTooltip(false);
            const rect = nodeRef.current.getBoundingClientRect();

            // Store initial mouse position for drag detection
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            setHasDragged(false);

            setDragOffset({
              x: (e.clientX - rect.left) / zoomLevel,
              y: (e.clientY - rect.top) / zoomLevel
            });
            setIsDragging(true);
            onDragStart();
          }
        }}
      >
        {/* Background Glow Effect */}
        {isSelected && (
          <div className="absolute inset-0 rounded-lg blur-sm opacity-20 bg-blue-400" />
        )}

        {/* Icon */}
        <Icon className={`
          h-8 w-8 transition-all duration-200
          ${iconColor}
          ${isDragging ? 'scale-90' : 'scale-100'}
        `} />
        
        {/* Node Label */}
        <div 
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          style={{ fontSize: `${Math.max(12, 12 / zoomLevel)}px` }}
        >
          {isEditingName ? (
            <input
              key={node.id}
              ref={nameInputRef}
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              className="px-1 py-0.5 text-xs font-medium bg-white border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                minWidth: '100px',
                fontSize: `${Math.max(12, 12 / zoomLevel)}px`
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span 
              className={`
                text-xs font-medium transition-all duration-200
                ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                hover:text-blue-600 cursor-text
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (!isReadOnly) {
                  setIsEditingName(true);
                }
              }}
              style={{ fontSize: `${Math.max(12, 12 / zoomLevel)}px` }}
            >
              {node.name}
            </span>
          )}
        </div>

        {/* Status Indicator */}
        {!isReadOnly && (
          <div className="absolute -top-1 -right-1">
            <div className={`w-3 h-3 rounded-full ${colors.status}`} />
          </div>
        )}

        {/* Connection Points */}
        {isCreatingEdge && (
          <>
            <div className="absolute inset-0 rounded-lg border-2 border-blue-500 border-dashed" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
            <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
          </>
        )}

        {/* Tooltip */}
        {showTooltip && !isEditingName && !isCreatingEdge && node.name !== 'AT&T Core' && (
          <div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-lg"
            style={{ fontSize: `${Math.max(11, 11 / zoomLevel)}px` }}
          >
            Double-click to configure
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

    </>
  );
});