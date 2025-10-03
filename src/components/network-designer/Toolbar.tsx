import { Server, Cloud, Network, Plus, Undo, Play, Check, Save, Trash2, Shield, Activity, PanelRight, Menu, Database, Globe, Lock, Feather as Ethernet, Wifi, LayoutGrid as Layout, Router, Share2 } from 'lucide-react';
import { NetworkNode } from '../types';
import { useState, useEffect, useRef } from 'react';
import { 
  CLOUD_PROVIDERS, 
  DATACENTER_PROVIDERS, 
  FUNCTION_TYPES, 
  NETWORK_TYPES 
} from '../../constants';

interface ToolbarProps {
  onAddNode: (type: NetworkNode['type'], functionType?: string, networkType?: string, provider?: string) => void;
  onToggleEdgeCreation: () => void;
  isCreatingEdge: boolean;
  onCancel: () => void;
  hasConnections: boolean;
  canUndo: boolean;
  onRunScenario?: () => void;
  isRunningScenario?: boolean;
  onCreateConnections?: () => void;
  onSaveTemplate?: () => void;
  onClearCanvas?: () => void;
  onOpenTemplates?: () => void;
}

export function Toolbar({
  onAddNode,
  onToggleEdgeCreation,
  isCreatingEdge,
  onCancel,
  hasConnections,
  canUndo,
  onRunScenario,
  isRunningScenario = false,
  onCreateConnections,
  onSaveTemplate,
  onClearCanvas,
  onOpenTemplates
}: ToolbarProps) {
  // State to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Menu items with icons
  const functionTypesWithIcons = FUNCTION_TYPES.map(type => ({
    ...type,
    icon: type.id === 'SDWAN' ? PanelRight :
          type.id === 'Firewall' ? Shield :
          type.id === 'VNF' ? Activity :
          type.id === 'VNAT' ? Menu : Activity
  }));

  const networkTypesWithIcons = NETWORK_TYPES.map(type => ({
    ...type,
    icon: type.id === 'Internet' ? Network :
          type.id === 'VPN' ? Lock :
          type.id === 'Ethernet' ? Ethernet :
          type.id === 'IoT' ? Wifi :
          type.id === 'AT&T Core' ? Globe : Network
  }));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Handle toggling dropdown visibility
  const toggleDropdown = (dropdown: string) => {
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
  };
  
  // Handle node selection and close dropdown
  const handleNodeSelect = (type: NetworkNode['type'], functionType?: string, networkType?: string, provider?: string) => {
    onAddNode(type, functionType, networkType, provider);
    setOpenDropdown(null);
  };
  
  return (
    <div 
      ref={toolbarRef} 
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex items-center space-x-1 min-w-max" 
      style={{ zIndex: 100 }}
    >
      {/* Choose Button - Added before Function */}
      <button
        onClick={onOpenTemplates}
        className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors"
        title="Choose Template"
        type="button"
      >
        <Layout className="h-5 w-5" />
        <span className="text-sm">Choose</span>
      </button>
      
      {/* Small separator line */}
      <div className="h-8 w-px bg-gray-200"></div>
      
      {/* Cloud Router Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNodeSelect('function', 'Cloud Router');
        }}
        className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors whitespace-nowrap"
        title="Add Cloud Router"
        type="button"
      >
        <Share2 className="h-5 w-5" />
        <span className="text-sm">Cloud Router</span>
      </button>
      
      {/* Small separator line */}
      <div className="h-8 w-px bg-gray-200"></div>
      
      {/* Node Tools */}
      <div className="flex items-center space-x-1">
        {/* Function nodes dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('function')}
            className={`px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors ${openDropdown === 'function' ? 'bg-gray-50' : ''}`}
            title="Add Function"
            type="button"
          >
            <Server className="h-5 w-5" />
            <span className="text-sm">Function</span>
          </button>
          
          {openDropdown === 'function' && (
            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {functionTypesWithIcons.map(type => (
                <button
                  key={type.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeSelect('function', type.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <type.icon className="h-4 w-4 mr-2" />
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Cloud providers dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('cloud')}
            className={`px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors ${openDropdown === 'cloud' ? 'bg-gray-50' : ''}`}
            title="Add Cloud Provider"
            type="button"
          >
            <Cloud className="h-5 w-5" />
            <span className="text-sm">Cloud</span>
          </button>
          
          {openDropdown === 'cloud' && (
            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {CLOUD_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeSelect('destination', undefined, undefined, provider.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  {provider.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Datacenter providers dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('datacenter')}
            className={`px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors ${openDropdown === 'datacenter' ? 'bg-gray-50' : ''}`}
            title="Add Datacenter"
            type="button"
          >
            <Database className="h-5 w-5" />
            <span className="text-sm">Datacenter</span>
          </button>
          
          {openDropdown === 'datacenter' && (
            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {DATACENTER_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeSelect('datacenter', undefined, undefined, provider.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {provider.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Network types dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('network')}
            className={`px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors ${openDropdown === 'network' ? 'bg-gray-50' : ''}`}
            title="Add Network Device"
            type="button"
          >
            <Network className="h-5 w-5" />
            <span className="text-sm">Network</span>
          </button>
          
          {openDropdown === 'network' && (
            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {networkTypesWithIcons.map(type => (
                <button
                  key={type.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeSelect('network', undefined, type.id.toLowerCase());
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <type.icon className="h-4 w-4 mr-2" />
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Small separator line */}
      <div className="h-8 w-px bg-gray-200"></div>
      {/* Connection Tool */}
      <div className="relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdgeCreation();
          }}
          className={`p-2 rounded-lg ${
            isCreatingEdge
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          } transition-colors`}
          title="Add Connection"
          type="button"
        >
          <Plus className="h-5 w-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Click on the nodes you wish to connect. Toggle when you're done.
        </div>
      </div>

      {/* Scenario Runner */}
      {onRunScenario && (
        <>
          {/* Small separator line */}
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!(!hasConnections || isRunningScenario)) {
                  onRunScenario();
                }
              }}
              disabled={!hasConnections || isRunningScenario}
              className={`
                p-2 rounded-lg transition-colors
                ${!hasConnections
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isRunningScenario
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title="Run Scenario"
              type="button"
            >
              <Play className={`h-5 w-5 ${isRunningScenario ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Run scenario
            </div>
          </div>
        </>
      )}

      {/* Save Template */}
      {onSaveTemplate && (
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasConnections && onSaveTemplate) {
                  onSaveTemplate();
                }
              }}
              disabled={!hasConnections}
              className={`
                p-2 rounded-lg transition-colors
                ${!hasConnections
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title="Save Template"
              type="button"
            >
              <Save className="h-5 w-5" />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Save as template
            </div>
          </div>
      )}

      {/* History Controls */}
      <>
        {/* Small separator line */}
        <div className="h-8 w-px bg-gray-200"></div>
        
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canUndo) {
                onCancel();
              }
            }}
            disabled={!canUndo}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo"
            type="button"
          >
            <Undo className="h-5 w-5" />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Undo
          </div>
        </div>
      </>

      {/* Clear Canvas */}
      {onClearCanvas && (
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasConnections && onClearCanvas) {
                  onClearCanvas();
                }
              }}
              disabled={!hasConnections}
              className={`
                p-2 rounded-lg transition-colors
                ${!hasConnections
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title="Clear Canvas"
              type="button"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Clear canvas
            </div>
          </div>
      )}

      {/* Create Connections */}
      {onCreateConnections && (
        <>
          {/* Small separator line */}
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasConnections && onCreateConnections) {
                  onCreateConnections();
                }
              }}
              disabled={!hasConnections}
              className={`
                p-2 rounded-lg transition-colors
                ${!hasConnections
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title="Create Connections"
              type="button"
            >
              <Check className="h-5 w-5" />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Create connections
            </div>
          </div>
        </>
      )}
    </div>
  );
}