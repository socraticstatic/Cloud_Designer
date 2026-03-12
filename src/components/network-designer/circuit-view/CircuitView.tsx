import { useState, useEffect } from 'react';
import { BrainCircuit as CircuitIcon } from 'lucide-react';
import type { NetworkNode, NetworkEdge } from '../../types';
import { Breadcrumb } from './components/Breadcrumb';
import { RightDetailPanel } from './components/RightDetailPanel';
import { ViewModeSelector } from './components/ViewModeSelector';
import { CleanLogicalView } from './views/CleanLogicalView';
import { PhysicalRackView } from './PhysicalRackView';
import {
  Port,
  Circuit as CircuitType,
  DevicePortsMap,
  ViewMode
} from './CircuitTypes';
import { CANVAS_SAFE_AREA } from '../../../constants';

interface CircuitViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: string | null;
  onNodeSelect: (node: NetworkNode | null) => void;
  onZoomOut: () => void;
}

// ─── Circuit table for "Circuits" view mode ──────────────────────────────────
function CircuitsTable({
  circuits,
  nodes,
}: {
  circuits: CircuitType[];
  nodes: NetworkNode[];
}) {
  const getNodeName = (portId: string) => {
    const nodeId = portId.split('-port-')[0];
    return nodes.find(n => n.id === nodeId)?.name || nodeId;
  };

  const typeLabel = (t: string) =>
    t === 'dark-fiber' ? 'Dark Fiber' :
    t === 'wave' ? 'Wavelength' :
    t === 'ethernet' ? 'Ethernet' : 'MPLS';

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">All Circuits</h3>
          <span className="text-sm text-gray-500">
            {circuits.filter(c => c.status === 'active').length} active / {circuits.length} total
          </span>
        </div>

        {circuits.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No circuits. Add nodes and connections in Topo View first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Source', 'Destination', 'Type', 'Capacity', 'Status', 'Latency', 'Loss', 'Optical'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {circuits.map(circuit => (
                  <tr key={circuit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getNodeName(circuit.sourcePort)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {getNodeName(circuit.targetPort)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{typeLabel(circuit.type)}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{circuit.capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        circuit.status === 'active' ? 'bg-green-100 text-green-700' :
                        circuit.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          circuit.status === 'active' ? 'bg-green-500' :
                          circuit.status === 'degraded' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                        {circuit.status === 'active' ? 'Active' :
                         circuit.status === 'degraded' ? 'Degraded' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {circuit.metrics ? (
                        <span className={`font-mono text-xs ${
                          circuit.metrics.latency > 2 ? 'text-amber-600' : 'text-gray-700'
                        }`}>
                          {circuit.metrics.latency.toFixed(1)}ms
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {circuit.metrics ? (
                        <span className={`font-mono text-xs ${
                          circuit.metrics.loss > 1 ? 'text-red-600' :
                          circuit.metrics.loss > 0.5 ? 'text-amber-600' : 'text-gray-700'
                        }`}>
                          {circuit.metrics.loss.toFixed(2)}dB
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {circuit.metrics ? (
                        <span className={`font-mono text-xs ${
                          circuit.metrics.light < -20 ? 'text-red-600' :
                          circuit.metrics.light < -15 ? 'text-amber-600' : 'text-gray-700'
                        }`}>
                          {circuit.metrics.light.toFixed(1)}dBm
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main CircuitView ─────────────────────────────────────────────────────────
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
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'logical' });

  useEffect(() => {
    if (selectedNode) setSelectedDevice(selectedNode);
  }, [selectedNode]);

  // Generate ports for network devices based on connections
  const generatePorts = (nodeId: string): Port[] => {
    const nodeEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    const basePorts = node.type === 'function' ? 8 : node.type === 'destination' ? 4 : 6;

    const connectedPorts = nodeEdges.map((edge, index) => {
      const isSource = edge.source === nodeId;
      const connectedTo = isSource ? edge.target : edge.source;
      const portNumber = index % basePorts + 1;
      const slotNumber = Math.floor(index / basePorts) + 1;
      const portType =
        edge.type.toLowerCase().includes('fiber') || edge.bandwidth.includes('100') ? 'fiber' :
        edge.type.toLowerCase().includes('virtual') ? 'virtual' : 'copper';
      const position = node.type === 'function' ? (portType === 'fiber' ? 'back' : 'front') : 'front';

      return {
        id: `${nodeId}-port-${portNumber}-slot-${slotNumber}`,
        name: `Port ${portNumber}/${slotNumber}`,
        type: portType,
        speed: edge.bandwidth,
        status: edge.status as 'active' | 'inactive',
        connectedTo,
        position,
        slot: slotNumber,
        module: portType === 'fiber' ? 'SFP+' : portType === 'virtual' ? 'Virtual' : 'RJ45'
      } as Port;
    });

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

  const generateCircuits = (): CircuitType[] => {
    return edges.map((edge, index) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;

      const sourcePortId = `${edge.source}-port-${(index % 8) + 1}-slot-${Math.floor(index / 8) + 1}`;
      const targetPortId = `${edge.target}-port-${(index % 8) + 1}-slot-${Math.floor(index / 8) + 1}`;

      return {
        id: `circuit-${edge.id}`,
        sourcePort: sourcePortId,
        targetPort: targetPortId,
        type:
          edge.type.includes('Fiber') ? 'dark-fiber' :
          edge.type.includes('MPLS') ? 'mpls' :
          edge.type.includes('Direct') ? 'ethernet' : 'wave',
        capacity: edge.bandwidth,
        status: edge.status as 'active' | 'inactive',
        metrics: edge.status === 'active' ? (() => {
          const v = (edge.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100;
          const bwGbps = parseFloat(edge.bandwidth) || 1;
          const lightBase = bwGbps >= 100 ? -11 : bwGbps >= 10 ? -13 : -15;
          const latBase =
            edge.type.includes('MPLS') ? 1.2 :
            edge.type.includes('Direct') ? 0.6 : 0.9;
          return {
            light: lightBase - v * 4,
            loss: 0.18 + v * 0.28,
            latency: edge.metrics?.latency ? edge.metrics.latency / 1000 : latBase + v * 0.3
          };
        })() : undefined
      } as CircuitType;
    }).filter(Boolean) as CircuitType[];
  };

  const devicePorts: DevicePortsMap = {};
  nodes.forEach(node => { devicePorts[node.id] = generatePorts(node.id); });
  const circuits = generateCircuits();

  const selectedNodeData = nodes.find(n => n.id === selectedDevice) ?? null;
  const selectedCircuitData = selectedCircuit ? circuits.find(c => c.id === selectedCircuit) ?? null : null;
  const selectedPortData =
    selectedPort && selectedDevice
      ? devicePorts[selectedDevice]?.find(p => p.id === selectedPort) ?? null
      : null;

  const handleDeviceSelect = (deviceId: string) => {
    const node = nodes.find(n => n.id === deviceId);
    if (!node) return;
    setSelectedDevice(deviceId);
    onNodeSelect(node);
    setSelectedPort(null);
    setSelectedCircuit(null);
  };

  const handlePortSelect = (portId: string | null) => {
    setSelectedPort(portId);
    setSelectedCircuit(null);
  };

  const handleNavigate = (level: 'rack' | 'device' | 'port') => {
    if (level === 'rack') {
      setSelectedDevice(null);
      setSelectedPort(null);
      setSelectedCircuit(null);
      onNodeSelect(null);
    } else if (level === 'device') {
      setSelectedPort(null);
      setSelectedCircuit(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedDevice(null);
    setSelectedPort(null);
    setSelectedCircuit(null);
    onNodeSelect(null);
  };

  const hasDetail = !!(selectedDevice || selectedPort || selectedCircuit);

  return (
    <div className="flex flex-col w-full h-full bg-gray-50" style={{ paddingLeft: CANVAS_SAFE_AREA.LEFT }}>
      {/* Top bar: breadcrumb */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <Breadcrumb
          selectedDevice={selectedDevice}
          selectedPort={selectedPort}
          selectedCircuit={selectedCircuit}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Content row: main + drawer */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Main content */}
        <div className="flex-1 overflow-auto relative">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                <CircuitIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Network to Visualize</h3>
                <p className="text-gray-600 mb-6">
                  Create your network in the Topo View first, then switch to Infra View to see detailed hardware information.
                </p>
                <button
                  onClick={onZoomOut}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  Switch to Topo View
                </button>
              </div>
            </div>
          ) : viewMode.mode === 'rack' ? (
            <PhysicalRackView
              nodes={nodes}
              selectedDeviceId={selectedDevice}
              onSelectDevice={handleDeviceSelect}
              devicePorts={devicePorts}
              selectedPort={selectedPort}
              onSelectPort={handlePortSelect}
              circuits={circuits}
            />
          ) : viewMode.mode === 'physical' ? (
            <CircuitsTable circuits={circuits} nodes={nodes} />
          ) : (
            <CleanLogicalView
              nodes={nodes}
              circuits={circuits}
              devicePorts={devicePorts}
              selectedDevice={selectedDevice}
              onSelectDevice={handleDeviceSelect}
            />
          )}

          {/* View mode selector - scoped inside main content */}
          {nodes.length > 0 && (
            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={(mode) => setViewMode({ mode })}
            />
          )}
        </div>

        {/* Right detail drawer - slides over content */}
        <div
          className="absolute top-0 right-0 h-full w-96 transition-transform duration-300 ease-in-out shadow-xl"
          style={{
            transform: hasDetail ? 'translateX(0)' : 'translateX(100%)',
            zIndex: 30,
          }}
        >
          <RightDetailPanel
            selectedDevice={selectedNodeData}
            selectedPort={selectedPortData}
            selectedCircuit={selectedCircuitData}
            devicePorts={devicePorts}
            circuits={circuits}
            nodes={nodes}
            onClose={handleCloseDetail}
            onSelectDevice={handleDeviceSelect}
            onSelectPort={handlePortSelect}
          />
        </div>
      </div>
    </div>
  );
}
