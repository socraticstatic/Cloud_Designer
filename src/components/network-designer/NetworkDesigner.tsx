import { useState, useRef, useEffect } from 'react';
import { ConnectionConfig } from './types';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { EdgeConfigPanel } from './EdgeConfigPanel';
import { AIRecommendationEngine } from './AIRecommendationEngine';
import { OutcomeSelector } from './OutcomeSelector';
import { NetworkParameters } from './NetworkParameters';
import { AbstractionLevelSelector } from './AbstractionLevelSelector';
import { GlobalView } from './global-view/GlobalView';
import { CircuitView } from './circuit-view/CircuitView';
import { BottomPanel } from './panels/BottomPanel';
import { TemplatesManager } from './panels/TemplatesManager';
import { SaveTemplateModal } from './SaveTemplateModal';
import { NetworkSimulation } from './simulation/NetworkSimulation';
import { useNetworkHistory } from './hooks/useNetworkHistory';
import { useNetworkManager } from './hooks/useNetworkManager';
import { useSelectionManager } from './hooks/useSelectionManager';
import { useEdgeCreator } from './hooks/useEdgeCreator';
import { useTemplatesManager } from './hooks/useTemplatesManager';
import { 
  runSimulation, 
  pauseSimulation,
  resumeSimulation,
  injectLatency,
  injectPacketLoss,
  injectBandwidthLimit
} from './simulation/simulationUtils';
import { 
  useNetworkHistory, 
  useNetworkManager, 
  useSelectionManager, 
  useEdgeCreator, 
  useTemplatesManager 
} from '../../hooks';
import { getNodeIcon } from '../../utils/nodeUtils';
import { Z_INDEX, DEFAULT_NETWORK_CONFIG } from '../../constants';
import { NetworkNode, NetworkEdge } from './types';
import { DesignAssistant } from './DesignAssistant';

interface NetworkDesignerProps {
  onComplete: (config: ConnectionConfig) => void;
  onCancel: () => void;
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

export function NetworkDesigner({ onComplete, onCancel }: NetworkDesignerProps) {
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
  
  // UI state
  const [viewMode, setViewMode] = useState<'assistant' | 'optimize' | 'advanced'>('assistant');
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  
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
  const handlePauseSimulation = () => {
    pauseSimulation();
  };

  // Handle resuming simulation
  const handleResumeSimulation = () => {
    resumeSimulation();
  };

  // Handle injecting latency
  const handleInjectLatency = (amount: number) => {
    injectLatency(amount);
    window.addToast({
      type: 'info',
      title: 'Latency Injection',
      message: `Added ${amount}ms of latency to the network`,
      duration: 3000
    });
  };

  // Handle injecting packet loss
  const handleInjectPacketLoss = (amount: number) => {
    injectPacketLoss(amount);
    window.addToast({
      type: 'info',
      title: 'Packet Loss Injection',
      message: `Added ${amount}% packet loss to the network`,
      duration: 3000
    });
  };

  // Handle limiting bandwidth
  const handleInjectBandwidthLimit = (amount: number) => {
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
          <GlobalView
            nodes={nodes}
            edges={edges}
            onNodeSelect={handleZoomToNode}
            onZoomIn={(datacenterId) => {
              handleNodeSelection(nodes.find(n => n.id === datacenterId) || null);
              setAbstractionLevel('network');
            }}
          />
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
          <CircuitView
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelection}
            onZoomOut={() => setAbstractionLevel('network')}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl border-2 border-gray-200 relative">
      {/* Main Content Area */}
      <div className="relative h-[800px]" style={{ zIndex: 1 }}>
        {/* Abstraction Level Selector - Highest z-index */}
        <div style={{ zIndex: 100 }}>
          <AbstractionLevelSelector
            currentLevel={abstractionLevel}
            onLevelChange={setAbstractionLevel}
          />
        </div>

        {/* Status Bar - High z-index */}
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

        {/* Render the current abstraction level view */}
        {renderAbstractionLevelView()}
        
        {/* Toolbar - Only show in network view with highest z-index */}
        {abstractionLevel === 'network' && (
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
        {abstractionLevel === 'network' && selectedNodeObject && showNodeConfig && (
          <NodeConfigPanel
            node={selectedNodeObject}
            isVisible={showNodeConfig}
            onClose={() => setShowNodeConfig(false)}
            onUpdate={(updates) => updateNode(selectedNodeObject.id, updates)}
            onDelete={deleteNode}
            containerRef={canvasRef}
          />
        )}
        
        {/* Edge Configuration Panel - Only in network view */}
        {abstractionLevel === 'network' && selectedEdgeObject && showEdgeConfig && (
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
        <NetworkSimulation 
          isRunning={isRunningScenario}
          simulationData={simulationData as any}
          onPause={handlePauseSimulation}
          onResume={handleResumeSimulation}
          onInjectLatency={handleInjectLatency}
          onInjectPacketLoss={handleInjectPacketLoss}
          onInjectBandwidthLimit={handleInjectBandwidthLimit}
        />
        
        {/* Save Template Modal */}
        <SaveTemplateModal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={handleSaveTemplateSubmit}
        />
      </div>

      {/* Bottom Panel - Only in network view */}
      {abstractionLevel === 'network' && (
        <BottomPanel
          viewMode={viewMode}
          setViewMode={setViewMode}
        >
          {viewMode === 'assistant' && (
            <DesignAssistant 
              nodes={nodes}
              edges={edges}
              onApply={handleApplyOutcomePattern}
            />
          )}
          
          {viewMode === 'optimize' && (
            <AIRecommendationEngine 
              nodes={nodes}
              edges={edges}
              onApplyRecommendation={(newNodes, newEdges) => {
                setNodes(newNodes);
                setEdges(newEdges);
                saveToHistory(newNodes, newEdges);
              }}
            />
          )}
          
          {viewMode === 'advanced' && (
            <NetworkParameters
              onParameterChange={handleParameterChange}
            />
          )}
        </BottomPanel>
      )}
      
      {/* Templates Manager */}
      <TemplatesManager
        isOpen={showTemplatesDrawer}
        onClose={closeTemplatesDrawer}
        onApplyTemplate={applyTemplate}
        customTemplates={customTemplates}
        onDeleteCustomTemplate={handleDeleteCustomTemplate}
      />
    </div>
  );
}