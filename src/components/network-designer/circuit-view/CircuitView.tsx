import { useState, useEffect, useMemo } from 'react';
import { BrainCircuit as CircuitIcon, ArrowLeft, Search, X, Sparkles } from 'lucide-react';
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
  // Advisor findings per node - devices carrying findings get severity marks
  issueBadges?: Record<string, 'error' | 'warning' | 'recommendation'>;
  // Infra owns its whole frame - these drive its self-contained top bar so
  // it needs none of the canvas-editing chrome
  onBack?: () => void;
  designName?: string;
  designStatus?: 'draft' | 'saved';
  openIssueCount?: number;
  onOpenAdvisor?: () => void;
  // When the advisor floats as an overlay (narrow viewports) it covers the
  // right edge - reserve that width so the top-bar controls stay clickable
  advisorOccludesRight?: boolean;
}

// ─── Circuit table for "Circuits" view mode ──────────────────────────────────
function CircuitsTable({
  circuits,
  nodes,
  onSelectCircuit,
  selectedCircuit,
}: {
  circuits: CircuitType[];
  nodes: NetworkNode[];
  onSelectCircuit: (id: string) => void;
  selectedCircuit: string | null;
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
                  <tr
                    key={circuit.id}
                    onClick={() => onSelectCircuit(circuit.id)}
                    className={`cursor-pointer transition-colors ${selectedCircuit === circuit.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
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
                          circuit.metrics.latency > 15 ? 'text-amber-600' : 'text-gray-700'
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
  onZoomOut,
  issueBadges = {},
  onBack,
  designName,
  designStatus,
  openIssueCount = 0,
  onOpenAdvisor,
  advisorOccludesRight = false
}: CircuitViewProps) {
  // Space the advisor overlay steals from the right edge on narrow viewports
  const reserveRight = advisorOccludesRight ? 'calc(min(400px, 92vw) + 0.75rem)' : undefined;
  const [selectedDevice, setSelectedDevice] = useState<string | null>(selectedNode);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'rack' });
  const [filterQuery, setFilterQuery] = useState('');

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
        // Map the logical connection type to a physical circuit class. Cloud
        // on-ramps (Direct Connect, ExpressRoute, Interconnect, FastConnect)
        // and Ethernet ride ethernet; MPLS/AVPN ride MPLS; fiber is dark
        // fiber; only genuinely optical/unknown links fall back to wavelength.
        type:
          edge.type.includes('Fiber') ? 'dark-fiber' :
          (edge.type.includes('MPLS') || edge.type.includes('AVPN')) ? 'mpls' :
          (edge.type.includes('Direct') || edge.type.includes('Express') ||
           edge.type.includes('Interconnect') || edge.type.includes('FastConnect') ||
           edge.type.includes('Ethernet') || edge.type.includes('SD-WAN') ||
           edge.type.includes('VPN') || edge.type.includes('Internet')) ? 'ethernet' : 'wave',
        capacity: edge.bandwidth,
        status: edge.status as 'active' | 'inactive',
        metrics: edge.status === 'active' ? (() => {
          const v = (edge.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100;
          const bwGbps = parseFloat(edge.bandwidth) || 1;
          const lightBase = bwGbps >= 100 ? -11 : bwGbps >= 10 ? -13 : -15;
          const latBase =
            edge.type.includes('MPLS') ? 1.2 :
            edge.type.includes('Direct') ? 0.6 : 0.9;
          // Latency comes from the shared edge telemetry so Topo, Pano,
          // and Infra all report the same number for the same link.
          // Optical light/loss are physical-layer detail unique to this view.
          const sharedLatency = parseFloat(String(edge.metrics?.latency ?? ''));
          return {
            light: lightBase - v * 4,
            loss: 0.18 + v * 0.28,
            latency: !isNaN(sharedLatency) ? sharedLatency : latBase + v * 0.3
          };
        })() : undefined
      } as CircuitType;
    }).filter(Boolean) as CircuitType[];
  };

  const devicePorts: DevicePortsMap = {};
  nodes.forEach(node => { devicePorts[node.id] = generatePorts(node.id); });
  const circuits = generateCircuits();

  // Device filter narrows the lists/table only - the health strip always
  // reports the full inventory so the summary never lies
  const q = filterQuery.trim().toLowerCase();
  const nameOf = (id: string) => nodes.find(n => n.id === id)?.name ?? id;
  const filteredNodes = q ? nodes.filter(n => n.name.toLowerCase().includes(q)) : nodes;
  const filteredCircuits = q
    ? circuits.filter(c => {
        const s = nameOf(c.sourcePort.split('-port-')[0]).toLowerCase();
        const t = nameOf(c.targetPort.split('-port-')[0]).toLowerCase();
        return s.includes(q) || t.includes(q);
      })
    : circuits;

  // Whole-inventory health for the top strip (independent of the filter)
  const health = useMemo(() => {
    const allPorts = Object.values(devicePorts).flat();
    return {
      devices: nodes.length,
      activeDevices: nodes.filter(n => n.status === 'active' || (devicePorts[n.id] || []).some(p => p.status === 'active')).length,
      ports: allPorts.length,
      activePorts: allPorts.filter(p => p.status === 'active').length,
      circuits: circuits.length,
      activeCircuits: circuits.filter(c => c.status === 'active').length,
      errorPorts: allPorts.filter(p => p.status === 'error').length,
    };
  }, [nodes, devicePorts, circuits]);

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
      {/* Dedicated Infra top bar - Infra owns its whole frame, so it carries
          its own Back + identity + view switch + advisor instead of borrowing
          the canvas-editing chrome (which is hidden here). */}
      <div
        className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-3 transition-[padding] duration-300"
        style={{ paddingRight: reserveRight }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-fw-link hover:text-fw-linkHover transition-colors flex-shrink-0"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <span className="text-sm font-semibold text-gray-900 truncate">{designName ?? 'Infrastructure'}</span>
          {designStatus && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 flex-shrink-0">
              {designStatus}
            </span>
          )}
        </div>
        {hasDetail && (
          <div className="hidden lg:flex items-center min-w-0">
            <Breadcrumb
              selectedDevice={selectedDevice}
              selectedPort={selectedPort}
              selectedCircuit={selectedCircuit}
              onNavigate={handleNavigate}
              rootLabel={viewMode.mode === 'physical' ? 'Circuits' : viewMode.mode === 'logical' ? 'Topology' : 'Rack View'}
            />
          </div>
        )}

        <div className="flex-1" />

        {nodes.length > 0 && (
          <>
            {/* Device filter - the canvas node filter is gone here, so Infra
                gets its own way to narrow a big inventory */}
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 flex-shrink-0 focus-within:ring-2 focus-within:ring-blue-500">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter devices"
                aria-label="Filter devices"
                className="w-32 text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400 py-1"
              />
              {filterQuery && (
                <button onClick={() => setFilterQuery('')} type="button" aria-label="Clear filter" className="p-1 -mr-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={(mode) => setViewMode({ mode })}
              inline
            />

            {onOpenAdvisor && (
              <button
                onClick={onOpenAdvisor}
                className="relative flex-shrink-0 p-2 rounded-lg text-fw-link hover:bg-fw-accent transition-colors"
                title="Network Advisor"
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                {openIssueCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-fw-error text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {openIssueCount}
                  </span>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Health strip - whole-inventory summary, visible across every sub-view */}
      {nodes.length > 0 && (
        <div
          className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 grid grid-cols-4 gap-3 transition-[padding] duration-300"
          style={{ paddingRight: reserveRight }}
        >
          {[
            { label: 'Devices', value: health.devices, sub: `${health.activeDevices} active`, color: 'text-gray-900' },
            { label: 'Total Ports', value: health.ports, sub: `${health.activePorts} active`, color: 'text-blue-600' },
            { label: 'Circuits', value: health.circuits, sub: `${health.activeCircuits} active`, color: 'text-emerald-600' },
            { label: 'Errors', value: health.errorPorts, sub: health.errorPorts > 0 ? 'Needs attention' : 'All clear', color: health.errorPorts > 0 ? 'text-red-600' : 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-500">{stat.label}</p>
              <p className={`text-lg font-semibold leading-tight ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content row: main + drawer. overflow-hidden so the off-canvas
          detail drawer (translateX 100%) can't create a phantom page-wide
          horizontal scrollbar. */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto relative pb-6">
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
          ) : filteredNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No devices match "{filterQuery}"</p>
                <button
                  onClick={() => setFilterQuery('')}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                  type="button"
                >
                  Clear filter
                </button>
              </div>
            </div>
          ) : viewMode.mode === 'rack' ? (
            <PhysicalRackView
              nodes={filteredNodes}
              selectedDeviceId={selectedDevice}
              onSelectDevice={handleDeviceSelect}
              devicePorts={devicePorts}
              selectedPort={selectedPort}
              onSelectPort={handlePortSelect}
              circuits={circuits}
              issueBadges={issueBadges}
            />
          ) : viewMode.mode === 'physical' ? (
            <CircuitsTable
              circuits={filteredCircuits}
              nodes={nodes}
              selectedCircuit={selectedCircuit}
              onSelectCircuit={(id) => { setSelectedCircuit(id); setSelectedDevice(null); setSelectedPort(null); }}
            />
          ) : (
            <CleanLogicalView
              nodes={filteredNodes}
              circuits={filteredCircuits}
              devicePorts={devicePorts}
              selectedDevice={selectedDevice}
              onSelectDevice={handleDeviceSelect}
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
