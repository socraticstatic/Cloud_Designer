import { useState, useRef, useEffect } from 'react';
import { BrainCircuit as Circuit } from 'lucide-react';
import type { NetworkNode, NetworkEdge } from '../../types';
import { CircuitDetails } from './CircuitDetails';
import { ZoomControls } from '../ZoomControls';
import { PhysicalRackView } from './PhysicalRackView';
import { LogicalView } from './views/LogicalView';
import { PhysicalView } from './views/PhysicalView';
import { EmptyView } from './views/EmptyView';
import { ViewModeSelector } from './components/ViewModeSelector';
import { useDraggablePanel } from './hooks/useDraggablePanel';
import { 
  Port,
  Circuit as CircuitType,
  ViewMode,
  DevicePortsMap
} from './CircuitTypes';

interface CircuitViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: string | null;
  onNodeSelect: (node: NetworkNode | null) => void;
  onZoomOut: () => void;
}

export function CircuitView({ 
  nodes, 
  edges, 
  selectedNode,
  onNodeSelect,
  onZoomOut
}: CircuitViewProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(selectedNode);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'logical' });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the draggable panel hook
  const { panelPositions, startDragging, isDragging } = useDraggablePanel(containerRef);
  
  // Update selected device when selectedNode prop changes
  useEffect(() => {
    if (selectedNode) {
      setSelectedDevice(selectedNode);
    }
  }, [selectedNode]);
  
  // Generate ports for network devices based on connections
  const generatePorts = (nodeId: string): Port[] => {
    const nodeEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const node = nodes.find(n => n.id === nodeId);
    
    if (!node) return [];
    
    // Determine how many ports to generate based on node type
    const basePorts = node.type === 'function' ? 8 : 
                     node.type === 'destination' ? 4 : 6;
    
    // Generate connected ports
    const connectedPorts = nodeEdges.map((edge, index) => {
      const isSource = edge.source === nodeId;
      const connectedTo = isSource ? edge.target : edge.source;
      const portNumber = index % basePorts + 1;
      const slotNumber = Math.floor(index / basePorts) + 1;
      
      // Determine port type based on edge characteristics
      const portType = edge.type.toLowerCase().includes('fiber') || 
                     edge.bandwidth.includes('100') ? 'fiber' : 
                     edge.type.toLowerCase().includes('virtual') ? 'virtual' : 'copper';
      
      // Determine if it's a front or back port
      const position = node.type === 'function' ? 
                      (portType === 'fiber' ? 'back' : 'front') : 
                      'front';
                      
      return {
        id: `${nodeId}-port-${portNumber}-slot-${slotNumber}`,
        name: `Port ${portNumber}/${slotNumber}`,
        type: portType,
        speed: edge.bandwidth,
        status: edge.status as 'active' | 'inactive',
        connectedTo,
        position,
        slot: slotNumber,
        module: portType === 'fiber' ? 'SFP+' : 
               portType === 'virtual' ? 'Virtual' : 'RJ45'
      };
    });
    
    // Add some unused ports to fill out slots
    const totalPorts = Math.max(basePorts * 2, connectedPorts.length + 4);
    const unusedPorts: Port[] = [];
    
    for (let i = connectedPorts.length; i < totalPorts; i++) {
      const portNumber = i % basePorts + 1;
      const slotNumber = Math.floor(i / basePorts) + 1;
      const isFront = i % 2 === 0;
      
      unusedPorts.push({
        id: `${nodeId}-port-unused-${i + 1}`,
        name: `Port ${portNumber}/${slotNumber}`,
        type: isFront ? 'copper' : 'fiber',
        speed: isFront ? '1 Gbps' : '10 Gbps',
        status: 'inactive',
        position: isFront ? 'front' : 'back',
        slot: slotNumber,
        module: isFront ? 'RJ45' : 'SFP+'
      });
    }
    
    return [...connectedPorts, ...unusedPorts];
  };
  
  // Generate circuits between devices
  const generateCircuits = (): CircuitType[] => {
    return edges.map((edge, index) => {
      // Get the source and target nodes
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      // Create port IDs that match the format from generatePorts
      const sourcePortId = `${edge.source}-port-${(index % 8) + 1}-slot-${Math.floor(index / 8) + 1}`;
      const targetPortId = `${edge.target}-port-${(index % 8) + 1}-slot-${Math.floor(index / 8) + 1}`;
      
      // Create a circuit
      return {
        id: `circuit-${edge.id}`,
        sourcePort: sourcePortId,
        targetPort: targetPortId,
        type: edge.type.includes('Fiber') ? 'dark-fiber' : 
              edge.type.includes('MPLS') ? 'mpls' :
              edge.type.includes('Direct') ? 'ethernet' : 'wave',
        capacity: edge.bandwidth,
        status: edge.status as 'active' | 'inactive',
        metrics: edge.status === 'active' ? {
          light: -12.5 - Math.random() * 10,  // dBm
          loss: 0.2 + Math.random() * 0.3,    // dB
          latency: 0.8 + Math.random() * 0.4  // ms
        } : undefined
      };
    }).filter(Boolean) as CircuitType[];
  };

  // Find all nodes connected to the selected device
  const getConnectedNodes = (nodeId: string) => {
    if (!nodeId) return [];
    
    return nodes.filter(node => {
      return edges.some(edge => 
        (edge.source === nodeId && edge.target === node.id) ||
        (edge.target === nodeId && edge.source === node.id)
      );
    });
  };
  
  // Get all devices with their ports
  const devicePorts: DevicePortsMap = {};
  nodes.forEach(node => {
    devicePorts[node.id] = generatePorts(node.id);
  });
  
  const circuits = generateCircuits();
  
  // Find the selected node details
  const selectedNodeData = nodes.find(n => n.id === selectedDevice);
  
  // Find the circuit details if a circuit is selected
  const selectedCircuitData = selectedCircuit 
    ? circuits.find(c => c.id === selectedCircuit) 
    : null;
  
  // Find the port details if a port is selected
  const selectedPortData = selectedPort && selectedDevice
    ? devicePorts[selectedDevice]?.find(p => p.id === selectedPort)
    : null;
  
  const handleDeviceSelect = (deviceId: string) => {
    const node = nodes.find(n => n.id === deviceId);
    if (!node) return;
    
    setSelectedDevice(deviceId);
    onNodeSelect(node);
    setSelectedPort(null);
    setSelectedCircuit(null);
    
    if (viewMode.mode === 'rack') {
      setViewMode({ mode: 'rack', deviceId });
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.2, 0.6));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
  };
  
  // Switch between logical, physical and rack view modes
  const handleViewModeChange = (mode: 'logical' | 'physical' | 'rack') => {
    setViewMode({ mode, deviceId: selectedDevice || undefined });
  };

  return (
    <div className="relative w-full h-full bg-gray-50" ref={containerRef}>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-[60]">
        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />
      </div>
      
      {/* Main content container */}
      <div className="absolute inset-0 overflow-auto">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
              <Circuit className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Network to Visualize</h3>
              <p className="text-gray-600 mb-6">
                Create your network in the Topo View first, then switch to Infra View to see detailed circuit information.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomOut();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                Switch to Topo View
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full" style={{ minHeight: "700px" }}>
            {/* Content layers with proper z-index */}
            <div className="relative w-full h-full" style={{ zIndex: 10 }}>
              {viewMode.mode === 'logical' && (
                <LogicalView
                  nodes={nodes}
                  selectedDevice={selectedNodeData}
                  devicePorts={devicePorts}
                  circuits={circuits}
                  zoomLevel={zoomLevel}
                  selectedPort={selectedPort}
                  selectedCircuit={selectedCircuit}
                  panelPositions={panelPositions}
                  onSelectDevice={handleDeviceSelect}
                  onSelectPort={setSelectedPort}
                  onSelectCircuit={setSelectedCircuit}
                  onStartDragging={startDragging}
                  getConnectedNodes={getConnectedNodes}
                  isDragging={isDragging}
                />
              )}
              
              {viewMode.mode === 'physical' && selectedNodeData && (
                <PhysicalView
                  selectedNode={selectedNodeData}
                  devicePorts={devicePorts}
                  circuits={circuits}
                  nodes={nodes}
                  selectedPort={selectedPort}
                  selectedCircuit={selectedCircuit}
                  panelPositions={panelPositions}
                  onSelectPort={setSelectedPort}
                  onSelectCircuit={setSelectedCircuit}
                  onSelectDevice={handleDeviceSelect}
                  onStartDragging={startDragging}
                  isDragging={isDragging}
                />
              )}
              
              {viewMode.mode === 'physical' && !selectedNodeData && (
                <EmptyView 
                  nodes={nodes}
                  onSelectDevice={handleDeviceSelect}
                  onZoomOut={onZoomOut}
                />
              )}
              
              {viewMode.mode === 'rack' && (
                <div className="relative p-8">
                  <div className="max-w-5xl mx-auto">
                    <PhysicalRackView 
                      nodes={nodes}
                      selectedDeviceId={viewMode.deviceId || null}
                      onSelectDevice={handleDeviceSelect}
                      devicePorts={devicePorts}
                      selectedPort={selectedPort}
                      onSelectPort={setSelectedPort}
                      circuits={circuits}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* View mode selector */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[70]">
        <ViewModeSelector
          currentMode={viewMode}
          onModeChange={handleViewModeChange}
        />
      </div>
      
      {/* Details Panel */}
      {(selectedPortData || selectedCircuitData) && (
        <div className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-[50]">
          <CircuitDetails 
            port={selectedPortData}
            circuit={selectedCircuitData}
            onClose={() => {
              setSelectedPort(null);
              setSelectedCircuit(null);
            }}
          />
        </div>
      )}
    </div>
  );
}