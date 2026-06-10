import { useState, useRef, useEffect, memo } from 'react';
import { NetworkNode } from '../types';
import { getNodeColors } from '../../utils/nodeUtils';
import { CANVAS_BOUNDS, Z_INDEX } from '../../constants';

export type NodeHighlight = 'error' | 'warning' | 'recommendation' | 'positive';

interface NodeProps {
  node: NetworkNode;
  isSelected: boolean;
  isCreatingEdge: boolean;
  isReadOnly?: boolean;
  highlight?: NodeHighlight | null;
  displayMode?: 'icon' | 'card';
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrag: (x: number, y: number) => void;
  onNameChange?: (newName: string) => void;
  zoomLevel?: number;
}

// Advisor highlight ring colors follow the Figma state legend
const HIGHLIGHT_RING: Record<NodeHighlight, string> = {
  error: 'ring-4 ring-red-600/40 border-red-600',
  warning: 'ring-4 ring-orange-500/40 border-orange-500',
  recommendation: 'ring-4 ring-blue-600/40 border-blue-600',
  positive: 'ring-4 ring-green-600/40 border-green-600'
};

// Memoize the Node component for better performance
export const Node = memo(function Node({
  node,
  isSelected,
  isCreatingEdge,
  isReadOnly = false,
  highlight = null,
  displayMode = 'icon',
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

  // Drag is handled inline in onMouseDown to avoid triggering drag visuals on double-click

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
          absolute flex items-center justify-center
          ${displayMode === 'card' ? 'h-16 px-3 gap-2.5 bg-white' : `w-16 h-16 ${background}`}
          rounded-lg transition-all duration-200 select-none
          ${isReadOnly ? 'cursor-default' : isCreatingEdge ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isDragging ? 'shadow-lg scale-105' : 'shadow-sm hover:shadow-md'}
          border-2 ${highlight ? HIGHLIGHT_RING[highlight] : isSelected ? 'border-blue-500' : isCreatingEdge ? 'border-blue-400 border-dashed' : 'border-gray-200'}
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
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            setHasDragged(false);

            const offset = {
              x: (e.clientX - rect.left) / zoomLevel,
              y: (e.clientY - rect.top) / zoomLevel
            };

            // Only enter drag state after 5px movement — prevents drag visuals on double-click
            let dragStarted = false;

            const handleMouseMove = (me: MouseEvent) => {
              const deltaX = Math.abs(me.clientX - dragStartPos.current.x);
              const deltaY = Math.abs(me.clientY - dragStartPos.current.y);
              if (deltaX > 5 || deltaY > 5) {
                if (!dragStarted) {
                  dragStarted = true;
                  setIsDragging(true);
                  onDragStart();
                }
                setHasDragged(true);
                const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
                if (parentRect) {
                  onDrag(
                    (me.clientX - parentRect.left) / zoomLevel - offset.x,
                    (me.clientY - parentRect.top) / zoomLevel - offset.y
                  );
                }
              }
            };

            const handleMouseUp = () => {
              if (dragStarted) {
                setIsDragging(false);
                onDragEnd();
              }
              setTimeout(() => setHasDragged(false), 50);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }
        }}
      >
        {/* Background Glow Effect */}
        {isSelected && (
          <div className="absolute inset-0 rounded-lg blur-sm opacity-20 bg-blue-400" />
        )}

        {/* Icon */}
        {displayMode === 'card' ? (
          <>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${background}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 pr-1 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900 leading-tight">{node.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 leading-tight mt-0.5">
                {(node.config?.region || node.config?.city) && (
                  <>
                    <span>{node.config?.region || node.config?.city}</span>
                    <span className="text-gray-300">|</span>
                  </>
                )}
                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${node.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}`} />
                <span>{node.status === 'active' ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </>
        ) : (
        <Icon className={`
          h-8 w-8 transition-all duration-200
          ${iconColor}
          ${isDragging ? 'scale-90' : 'scale-100'}
        `} />
        )}

        {/* Node Label */}
        {displayMode === 'icon' && (
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
                hover:text-blue-600 cursor-pointer
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
        )}

        {/* Status Indicator */}
        {!isReadOnly && (
          <div className="absolute -top-1 -right-1">
            <div className={`w-3 h-3 rounded-full ${colors.status}`} />
          </div>
        )}

        {/* Region sublabel - per Figma node spec */}
        {displayMode === 'icon' && (node.config?.region || node.config?.city) && !isEditingName && (
          <div
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[9px] tracking-wider uppercase text-gray-400 pointer-events-none"
          >
            {node.config?.region || node.config?.city}
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