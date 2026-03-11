import { useState, useRef, useEffect } from 'react';
import { lazy, Suspense } from 'react';
import { ConnectionConfig } from '../types';
import { Canvas } from './network-designer/Canvas';
import { Toolbar } from './network-designer/Toolbar';
import { StatusBar } from './network-designer/StatusBar';
import { NodeConfigPanel } from './network-designer/NodeConfigPanel';
import { EdgeConfigPanel } from './network-designer/EdgeConfigPanel';
import { AbstractionLevelSelector } from './network-designer/AbstractionLevelSelector';
import { HistoryDrawer } from './network-designer/HistoryDrawer';
import {
  useNetworkHistory,
  useNetworkManager,
  useSelectionManager,
  useEdgeCreator,
  useTemplatesManager
} from '../hooks';
import { getNodeIcon } from '../utils/nodeUtils';
import { DEFAULT_NETWORK_CONFIG } from '../constants';
import { NetworkNode, NetworkEdge } from './types';
import { DefaultNetworkSetup } from './network-designer/DefaultNetworkSetup';

// Lazy load heavy components
const GlobalView = lazy(() => import('./network-designer/global-view/GlobalView').then(module => ({ default: module.GlobalView })));
const CircuitView = lazy(() => import('./network-designer/circuit-view/CircuitView').then(module => ({ default: module.CircuitView })));
const AIRecommendationEngine = lazy(() => import('./network-designer/AIRecommendationEngine').then(module => ({ default: module.AIRecommendationEngine })));
const DesignAssistant = lazy(() => import('./network-designer/DesignAssistant').then(module => ({ default: module.DesignAssistant })));
const NetworkParameters = lazy(() => import('./network-designer/NetworkParameters').then(module => ({ default: module.NetworkParameters })));
const TemplatesManager = lazy(() => import('./network-designer/panels/TemplatesManager').then(module => ({ default: module.TemplatesManager })));
const SaveTemplateModal = lazy(() => import('./network-designer/SaveTemplateModal').then(module => ({ default: module.SaveTemplateModal })));
const NetworkSimulation = lazy(() => import('./network-designer/simulation/NetworkSimulation').then(module => ({ default: module.NetworkSimulation })));

// Lazy load simulation functions
const simulationModule = lazy(() => import('./network-designer/simulation/runSimulation'));

// Loading component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );
}

interface NetworkDesignerProps {
  onComplete: (config: ConnectionConfig) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
}

type AbstractionLevel = 'global' | 'network' | 'circuit';

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  isCustom?: boolean;
}

export function NetworkDesigner({
  onComplete,
  onCancel,
  isReadOnly = false
}: NetworkDesignerProps) {
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Abstraction level state
  const [abstractionLevel, setAbstractionLevel] = useState<AbstractionLevel>('network');
  
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  
  // Network history management
  const { saveToHistory, undo, canUndo } = useNetworkHistory();
  
  // Network state management
  const {
    nodes,
    edges,
    networkScores,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    clearNetwork,
    applyTemplate
  } = useNetworkManager(saveToHistory);
  
  // Selection management
  const {
    selectedNode,
    selectedEdge,
    selectedNodeObject,
    selectedEdgeObject,
    showNodeConfig,
    showEdgeConfig,
    handleNodeSelection,
    handleEdgeSelection,
    clearSelection,
    setShowNodeConfig,
    setShowEdgeConfig
  } = useSelectionManager(nodes, edges);
  
  // Templates management
  const {
    showTemplatesDrawer,
    openTemplatesDrawer,
    closeTemplatesDrawer
  } = useTemplatesManager();

  // History drawer state
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [topologyHistory, setTopologyHistory] = useState<Array<{
    id: string;
    timestamp: number;
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    preview: string;
  }>>([]);

  // Save topology to history whenever nodes or edges change significantly
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timer = setTimeout(() => {
        saveTopologyToHistory();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges]);

  const saveTopologyToHistory = () => {
    if (nodes.length === 0 && edges.length === 0) return;

    const preview = `${nodes.length} nodes, ${edges.length} connections`;
    const newHistoryItem = {
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      preview
    };

    setTopologyHistory(prev => {
      const isDuplicate = prev.some(item =>
        JSON.stringify(item.nodes) === JSON.stringify(nodes) &&
        JSON.stringify(item.edges) === JSON.stringify(edges)
      );

      if (isDuplicate) return prev;

      const newHistory = [newHistoryItem, ...prev];
      return newHistory.slice(0, 3);
    });
  };

  const handleRestoreTopology = (restoredNodes: NetworkNode[], restoredEdges: NetworkEdge[]) => {
    const nodesWithIcons = restoredNodes.map(node => ({
      ...node,
      icon: getNodeIcon(node.type, node.functionType, node.cloudProvider, node.config)
    }));

    setNodes(nodesWithIcons);
    setEdges(restoredEdges);
    saveToHistory(nodesWithIcons, restoredEdges);
  };

  // Edge creation
  const {
    isCreatingEdge,
    edgeStart,
    toggleEdgeCreation,
    handleNodeClickForEdge,
    cancelEdgeCreation
  } = useEdgeCreator(edges, setEdges, (edge) => {
    handleEdgeSelection(edge);
  });
  
  // Check if we need to show the default network setup
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      setShowDefaultSetup(true);
    }
  }, [nodes.length, edges.length]);
  
  // Handle default network setup completion
  const handleDefaultNetworkSetup = (cloudRouterName: string) => {
    // Create default nodes
    const cloudRouter: NetworkNode = {
      id: `node-${Date.now()}-cloud-router`,
      type: 'function',
      functionType: 'Router',
      x: 550,
      y: 350,
      name: cloudRouterName,
      icon: getNodeIcon('function', 'Router', undefined, { routerType: 'cloud' }),
      status: 'inactive',
      config: {
        routerType: 'cloud',
        provider: 'Cloud Provider'
      }
    };
    
    const attCore: NetworkNode = {
      id: `node-${Date.now()}-att-core`,
      type: 'network',
      x: 350,
      y: 350,
      name: 'AT&T Core',
      icon: getNodeIcon('network', undefined, 'at&t core'),
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    };
    
    // Create connection between them
    const connection: NetworkEdge = {
      id: `edge-${Date.now()}-default`,
      source: attCore.id,
      target: cloudRouter.id,
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    };
    
    // Set the default network
    setNodes([attCore, cloudRouter]);
    setEdges([connection]);
    saveToHistory([attCore, cloudRouter], [connection]);
    
    setShowDefaultSetup(false);
    
    window.addToast({
      type: 'success',
      title: 'Default Network Created',
      message: 'Your network has been initialized with a cloud router connected to AT&T Core',
      duration: 3000
    });
  };
  
  // UI state
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [showDefaultSetup, setShowDefaultSetup] = useState(false);
  
  // Simulation data
  const [simulationData, setSimulationData] = useState({
    progress: 0,
    metrics: {
      bandwidth: { current: 0, max: 100 },
      latency: { current: 0, max: 100 },
      packets: { sent: 0, received: 0, errors: 0 }
    },
    phase: 'idle' as 'idle' | 'initializing' | 'running' | 'completed' | 'error' | 'paused',
    networkScores
  });

  // Update simulation network scores when networkScores change
  useEffect(() => {
    setSimulationData(prev => ({
      ...prev,
      networkScores
    }));
  }, [networkScores]);
  
  // Handle node click in canvas
  const handleNodeClick = (node: NetworkNode | null) => {
    if (!node) {
      clearSelection();
      if (isCreatingEdge) {
        cancelEdgeCreation();
      }
      return;
    }
    
    // If we're creating an edge, handle edge creation
    if (isCreatingEdge) {
      const handled = handleNodeClickForEdge(node.id, node.id);
      if (handled) return;
    }
    
    // Otherwise, handle node selection
    handleNodeSelection(node);
  };
  
  // Handle node drag
  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update node position
    setNodes(prev => 
      prev.map(n => n.id === nodeId ? { ...n, x, y: Math.min(y, 800 - 64) } : n)
    );
  };
  
  // Handle node drag end
  const handleNodeDragEnd = () => {
    saveToHistory(nodes, edges);
  };
  
  // Handle running simulation
  const handleRunSimulation = async () => {
    const { runSimulation } = await import('./network-designer/simulation/runSimulation');
    await runSimulation(
      nodes,
      edges,
      setNodes,
      setEdges,
      setSimulationData as any,
      setIsRunningScenario
    );
  };

  // Handle pausing simulation
  const handlePauseSimulation = async () => {
    const { pauseSimulation } = await import('./network-designer/simulation/runSimulation');
    pauseSimulation();
  };

  // Handle resuming simulation
  const handleResumeSimulation = async () => {
    const { resumeSimulation } = await import('./network-designer/simulation/runSimulation');
    resumeSimulation();
  };

  // Handle injecting latency
  const handleInjectLatency = async (amount: number) => {
    const { injectLatency } = await import('./network-designer/simulation/runSimulation');
    injectLatency(amount);
    window.addToast({
      type: 'info',
      title: 'Latency Injection',
      message: `Added ${amount}ms of latency to the network`,
      duration: 3000
    });
  };

  // Handle injecting packet loss
  const handleInjectPacketLoss = async (amount: number) => {
    const { injectPacketLoss } = await import('./network-designer/simulation/runSimulation');
    injectPacketLoss(amount);
    window.addToast({
      type: 'info',
      title: 'Packet Loss Injection',
      message: `Added ${amount}% packet loss to the network`,
      duration: 3000
    });
  };

  // Handle limiting bandwidth
  const handleInjectBandwidthLimit = async (amount: number) => {
    const { injectBandwidthLimit } = await import('./network-designer/simulation/runSimulation');
    injectBandwidthLimit(amount);
    window.addToast({
      type: 'info',
      title: 'Bandwidth Limit',
      message: `Limited bandwidth to ${amount}% of maximum`,
      duration: 3000
    });
  };
  
  // Handle creating connections
  const handleCreateConnections = () => {
    if (!edges.length) {
      window.addToast({
        type: 'error',
        title: 'No Connections',
        message: 'Please create at least one connection first',
        duration: 3000
      });
      return;
    }
    
    // Prepare configuration to return to parent
    const config: ConnectionConfig = {
      provider: 'Custom',
      type: 'Network Designer',
      bandwidth: 'Custom',
      location: 'Custom',
      nodes,
      edges,
    };
    
    onComplete(config);
  };
  
  // Handle saving the current network as a template
  const handleSaveTemplate = () => {
    setShowSaveTemplateModal(true);
  };
  
  // Handle save template submission
  const handleSaveTemplateSubmit = (name: string, description: string) => {
    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      nodes: [...nodes],
      edges: [...edges],
      isCustom: true
    };
    
    setCustomTemplates([...customTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    
    window.addToast({
      type: 'success',
      title: 'Template Saved',
      message: `Your network has been saved as template "${name}"`,
      duration: 3000
    });
  };
  
  // Handle deleting a custom template
  const handleDeleteCustomTemplate = (id: string) => {
    setCustomTemplates(customTemplates.filter(template => template.id !== id));
    
    window.addToast({
      type: 'success',
      title: 'Template Deleted',
      message: 'Custom template has been deleted',
      duration: 3000
    });
  };
  
  // Handle applying pattern from outcome selector
  const handleApplyOutcomePattern = (patternNodes: NetworkNode[], patternEdges: NetworkEdge[]) => {
    // If we already have nodes, position new ones appropriately
    if (nodes.length > 0) {
      // Calculate average position of existing nodes
      const existingXs = nodes.map(n => n.x);
      const existingYs = nodes.map(n => n.y);
      const avgX = existingXs.reduce((sum, x) => sum + x, 0) / existingXs.length;
      const avgY = existingYs.reduce((sum, y) => sum + y, 0) / existingYs.length;
      
      // Map to keep track of old IDs to new IDs
      const idMap = new Map<string, string>();
      
      // Create nodes with new IDs and adjusted positions
      const newNodes = patternNodes.map(node => {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        idMap.set(node.id, newId);
        
        // Position new nodes to the side of existing ones
        const adjustedX = avgX > 400 ? node.x - 200 : node.x + 200;
        
        return {
          ...node,
          id: newId,
          x: adjustedX,
          y: node.y
        };
      });
      
      // Create edges with updated node references
      const newEdges = patternEdges.map(edge => {
        const newSource = idMap.get(edge.source) || edge.source;
        const newTarget = idMap.get(edge.target) || edge.target;
        
        return {
          ...edge,
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          source: newSource,
          target: newTarget
        };
      });
      
      // Add new nodes and edges to existing ones
      setNodes([...nodes, ...newNodes]);
      setEdges([...edges, ...newEdges]);
      saveToHistory([...nodes, ...newNodes], [...edges, ...newEdges]);
    } else {
      // If no existing nodes, just use the pattern nodes and edges
      setNodes(patternNodes);
      setEdges(patternEdges);
      saveToHistory(patternNodes, patternEdges);
    }
    
    window.addToast({
      type: 'success',
      title: 'Pattern Applied',
      message: 'Network pattern has been applied',
      duration: 3000
    });
  };
  
  // Handle parameter change
  const handleParameterChange = (parameter: string, value: number) => {
    setSimulationData(prev => ({
      ...prev,
      networkScores: {
        ...prev.networkScores,
        [parameter]: value
      }
    }));
  };
  
  // Handle zoom to specific node in circuit view
  const handleZoomToNode = (nodeId: string) => {
    handleNodeSelection(nodes.find(n => n.id === nodeId) || null);
    setAbstractionLevel('network');
  };
  
  // Helper to render the current abstraction level view
  const renderAbstractionLevelView = () => {
    switch (abstractionLevel) {
      case 'global':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <GlobalView
              nodes={nodes}
              edges={edges}
              onNodeSelect={handleZoomToNode}
              onZoomIn={(datacenterId) => {
                handleNodeSelection(nodes.find(n => n.id === datacenterId) || null);
                setAbstractionLevel('network');
              }}
            />
          </Suspense>
        );
      case 'network':
        return (
          <Canvas
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            isCreatingEdge={isCreatingEdge}
            edgeStart={edgeStart}
            isReadOnly={isReadOnly}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onEdgeClick={handleEdgeSelection}
            maxY={800}
            ref={canvasRef}
          />
        );
        
      case 'circuit':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CircuitView
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelection}
              onZoomOut={() => setAbstractionLevel('network')}
            />
          </Suspense>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl border-2 border-gray-200 relative">
      {/* Main Content Area */}
      <div className="relative h-[800px]" style={{ zIndex: 1 }}>
        {/* Abstraction Level Selector with History - Highest z-index */}
        {!isReadOnly && (
          <div style={{ zIndex: 100 }}>
            <AbstractionLevelSelector
              currentLevel={abstractionLevel}
              onLevelChange={setAbstractionLevel}
              onHistoryClick={() => setShowHistoryDrawer(true)}
            />
          </div>
        )}

        {/* Status Bar - Only shown in network view */}
        {abstractionLevel === 'network' && (
          <div style={{ zIndex: 90 }}>
            <StatusBar
              nodes={nodes}
              edges={edges}
              canvasRef={canvasRef}
              onRefresh={() => {
                window.addToast({
                  type: 'info',
                  title: 'Refreshing Network',
                  message: 'Updating network status and metrics...',
                  duration: 2000
                });
              }}
            />
          </div>
        )}

        {/* Render the current abstraction level view */}
        {renderAbstractionLevelView()}
        
        {/* Toolbar - Only show in network view with highest z-index */}
        {abstractionLevel === 'network' && !isReadOnly && (
          <div style={{ zIndex: 100, pointerEvents: 'auto' }}>
            <Toolbar
              onAddNode={addNode}
              onToggleEdgeCreation={toggleEdgeCreation}
              isCreatingEdge={isCreatingEdge}
              onCancel={undo}
              hasConnections={edges.length > 0}
              canUndo={canUndo}
              onRunScenario={handleRunSimulation}
              isRunningScenario={isRunningScenario}
              onCreateConnections={handleCreateConnections}
              onSaveTemplate={handleSaveTemplate}
              onClearCanvas={clearNetwork}
              onOpenTemplates={openTemplatesDrawer}
            />
          </div>
        )}
        
        {/* Node Configuration Panel - Only in network view */}
        {abstractionLevel === 'network' && selectedNodeObject && showNodeConfig && !isReadOnly && (
         !(selectedNodeObject.config?.networkType === 'at&t core' || selectedNodeObject.name === 'AT&T Core') && (
            <NodeConfigPanel
              node={selectedNodeObject}
              isVisible={showNodeConfig}
              onClose={() => setShowNodeConfig(false)}
              onUpdate={(updates) => updateNode(selectedNodeObject.id, updates)}
              onDelete={deleteNode}
              containerRef={canvasRef}
            />
          )
        )}
        
        {/* Edge Configuration Panel - Only in network view */}
        {abstractionLevel === 'network' && selectedEdgeObject && showEdgeConfig && !isReadOnly && (
          <EdgeConfigPanel
            edge={selectedEdgeObject}
            nodes={nodes}
            isVisible={showEdgeConfig}
            onClose={() => setShowEdgeConfig(false)}
            onUpdate={(updates) => updateEdge(selectedEdgeObject.id, updates)}
            onDelete={() => deleteEdge(selectedEdgeObject.id)}
            containerRef={canvasRef}
          />
        )}
        
        {/* Simulation Overlay */}
        <Suspense fallback={null}>
          <NetworkSimulation 
            isRunning={isRunningScenario}
            simulationData={simulationData as any}
            onPause={handlePauseSimulation}
            onResume={handleResumeSimulation}
            onInjectLatency={handleInjectLatency}
            onInjectPacketLoss={handleInjectPacketLoss}
            onInjectBandwidthLimit={handleInjectBandwidthLimit}
          />
        </Suspense>
        
        {/* Save Template Modal */}
        <Suspense fallback={null}>
          <SaveTemplateModal
            isOpen={showSaveTemplateModal}
            onClose={() => setShowSaveTemplateModal(false)}
            onSave={handleSaveTemplateSubmit}
          />
        </Suspense>
        
        {/* Default Network Setup Modal */}
        <DefaultNetworkSetup
          isOpen={showDefaultSetup}
          onComplete={handleDefaultNetworkSetup}
          onApplyTemplate={(templateNodes, templateEdges) => {
            setNodes(templateNodes);
            setEdges(templateEdges);
            saveToHistory(templateNodes, templateEdges);
            setShowDefaultSetup(false);
            
            window.addToast({
              type: 'success',
              title: 'Template Applied',
              message: 'Network template has been applied successfully',
              duration: 3000
            });
          }}
        />
      </div>

      {/* Templates Manager */}
      <Suspense fallback={null}>
        <TemplatesManager
          isOpen={showTemplatesDrawer}
          onClose={closeTemplatesDrawer}
          onApplyTemplate={applyTemplate}
          customTemplates={customTemplates}
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
        />
      </Suspense>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={topologyHistory}
        onRestoreTopology={handleRestoreTopology}
      />
    </div>
  );
}