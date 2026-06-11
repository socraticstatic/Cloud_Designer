import { useState, useRef, useEffect, memo } from 'react';
import { NetworkNode } from '../types';
import { getNodeColors } from '../../utils/nodeUtils';
import { getBrandWordmark } from '../icons/ProviderIcons';
import { CANVAS_BOUNDS, Z_INDEX } from '../../constants';

export type NodeHighlight = 'error' | 'warning' | 'recommendation' | 'positive';

interface NodeProps {
  node: NetworkNode;
  isSelected: boolean;
  isCreatingEdge: boolean;
  isReadOnly?: boolean;
  highlight?: NodeHighlight | null;
  issueBadge?: 'error' | 'warning' | 'recommendation' | null;
  displayMode?: 'icon' | 'card';
  isMultiSelected?: boolean;
  dimmed?: boolean;
  onAnchorDown?: (e: React.MouseEvent) => void;
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
  issueBadge = null,
  displayMode = 'icon',
  isMultiSelected = false,
  dimmed = false,
  onAnchorDown,
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
  const isConfigured = node.config?.configured === true;
  const needsConfig = !isConfigured && !isReadOnly;

  // Get node colors
  const colors = getNodeColors(node);
  const background = isDragging ? 'bg-gray-50' : colors.background;
  const iconColor = isDragging ? 'text-gray-600' : colors.icon;

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
          absolute flex items-center justify-center node-enter pointer-events-auto
          ${dimmed ? 'opacity-25' : 'opacity-100'}
          ${displayMode === 'card' ? 'h-16 px-3 gap-2.5 bg-white' : `w-16 h-16 ${background}`}
          rounded-lg select-none
          ${isDragging ? '' : 'transition-all duration-200'}
          ${isReadOnly ? 'cursor-default' : isCreatingEdge ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isDragging ? 'shadow-lg scale-105' : 'shadow-sm hover:shadow-md'}
          border-2 ${highlight ? HIGHLIGHT_RING[highlight] : isSelected ? 'border-fw-border-active' : isMultiSelected ? 'border-blue-400 ring-2 ring-blue-300/50' : isCreatingEdge ? 'border-blue-400 border-dashed' : needsConfig ? 'border-orange-400' : 'border-gray-200'}
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
            e.preventDefault(); // no native text-selection during the gesture
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
        {/* Icon */}
        {displayMode === 'card' ? (
          <>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${background}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 pr-1 whitespace-nowrap">
              {/* Card mode has the width for the provider's real wordmark */}
              {(() => {
                const wordmark = getBrandWordmark(node.config?.provider || node.cloudProvider);
                return wordmark
                  ? <img src={wordmark} className="h-3.5 w-auto max-w-[96px] object-contain object-left mb-0.5 pointer-events-none select-none" draggable={false} alt={node.config?.provider || ''} />
                  : null;
              })()}
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
                {node.config?.routerRole && (
                  <span className={`px-1 rounded text-[8px] font-bold tracking-wide ${
                    node.config.routerRole === 'primary' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-100 text-fuchsia-700'
                  }`}>
                    {node.config.routerRole === 'primary' ? 'PRI' : 'SEC'}
                  </span>
                )}
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
                ${isSelected ? 'text-fw-link' : 'text-gray-600'}
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

        {/* Configured check badge - per Figma nodes spec */}
        {isConfigured && displayMode === 'icon' && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white border border-green-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-green-700" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
          </div>
        )}

        {/* Advisor issue badge - finding severity pinned to the node */}
        {issueBadge && !node.config?.routerRole && (
          <div
            className={`absolute -top-2 -left-2 h-4 w-4 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-[9px] font-black leading-none ${
              issueBadge === 'error' ? 'bg-red-600' : issueBadge === 'warning' ? 'bg-orange-500' : 'bg-blue-600'
            }`}
            role="img"
            aria-label={issueBadge === 'error' ? 'Critical finding' : issueBadge === 'warning' ? 'Warning' : 'Recommendation'}
            title={issueBadge === 'error' ? 'Critical finding' : issueBadge === 'warning' ? 'Warning' : 'Recommendation'}
          >
            {issueBadge === 'recommendation' ? 'i' : '!'}
          </div>
        )}

        {/* Primary/secondary router role - NetBond redundancy pairing */}
        {node.config?.routerRole && displayMode === 'icon' && (
          <div className={`absolute -top-1 -left-1 px-1 rounded text-[8px] font-bold tracking-wide ${
            node.config.routerRole === 'primary' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-100 text-fuchsia-700'
          }`}>
            {node.config.routerRole === 'primary' ? 'PRI' : 'SEC'}
          </div>
        )}

        {/* Connect anchors - drag from either side to wire a connection */}
        {!isReadOnly && !isCreatingEdge && showTooltip && onAnchorDown && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-4 h-4 rounded-full bg-white border-2 border-fw-border-active cursor-crosshair hover:scale-125 transition-transform"
              onMouseDown={onAnchorDown}
              title="Drag to connect"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-2.5 w-4 h-4 rounded-full bg-white border-2 border-fw-border-active cursor-crosshair hover:scale-125 transition-transform"
              onMouseDown={onAnchorDown}
              title="Drag to connect"
            />
          </>
        )}

        {/* Region sublabel - per Figma node spec. The Configure action owns
            this slot while the node is unconfigured; both rendering at once
            superimposed two unreadable labels. */}
        {displayMode === 'icon' && !needsConfig && (node.config?.region || node.config?.city) &&
          (node.config?.region || node.config?.city)?.toLowerCase() !== node.name.toLowerCase() && !isEditingName && (
          <div
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[9px] tracking-wider uppercase text-gray-400 pointer-events-none"
          >
            {node.config?.region || node.config?.city}
          </div>
        )}

        {/* Configure link - per Figma unconfigured state */}
        {needsConfig && displayMode === 'icon' && !isEditingName && (
          <button
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-medium text-orange-500 hover:text-orange-600 whitespace-nowrap"
            style={{ marginTop: 2 }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            type="button"
          >
            Configure
          </button>
        )}

        {/* Connection Points */}
        {isCreatingEdge && (
          <>
            <div className="absolute inset-0 rounded-lg border-2 border-blue-500 border-dashed" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
            <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
          </>
        )}

        {/* Hover detail card - per Figma nodes spec */}
        {showTooltip && !isEditingName && !isCreatingEdge && (
          <div
            className="absolute -top-14 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-white border border-gray-200 shadow-lg rounded-lg whitespace-nowrap pointer-events-none z-50 flex items-center gap-2"
          >
            <span className="text-xs font-semibold text-gray-900">{node.name}</span>
            {(node.config?.region || node.config?.city) && (
              <>
                <span className="text-gray-300 text-xs">|</span>
                <span className="text-[11px] text-gray-500">{node.config?.region || node.config?.city}</span>
              </>
            )}
            <span className="text-gray-300 text-xs">|</span>
            <span className={`inline-flex h-1.5 w-1.5 rounded-full ${node.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}`} />
            <span className="text-[11px] text-gray-500">{node.status === 'active' ? 'Active' : 'Inactive'}</span>
            {needsConfig && (
              <span className="text-[11px] font-medium text-orange-500">Not configured</span>
            )}
          </div>
        )}
      </div>

    </>
  );
});