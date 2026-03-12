import { useState } from 'react';
import { Network, ArrowRight, Activity, Zap, Server } from 'lucide-react';
import { NetworkNode } from '../../../types';
import { Circuit, Port } from '../CircuitTypes';
import { getNodeIcon } from '../../../../utils/nodeUtils';

interface CleanLogicalViewProps {
  nodes: NetworkNode[];
  circuits: Circuit[];
  devicePorts: Record<string, Port[]>;
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
}

// Node abbreviations for SVG topology circles
function getNodeAbbrev(node: NetworkNode): string {
  if (node.type === 'destination') return 'CLD';
  if (node.type === 'network') return 'NET';
  if (node.functionType) return node.functionType.substring(0, 3).toUpperCase();
  return 'SRV';
}

function getNodeColors(node: NetworkNode): { fill: string; stroke: string; text: string } {
  if (node.type === 'destination') return { fill: '#dbeafe', stroke: '#3b82f6', text: '#1d4ed8' };
  if (node.type === 'network') return { fill: '#dcfce7', stroke: '#22c55e', text: '#15803d' };
  if (node.functionType === 'Router') return { fill: '#ede9fe', stroke: '#8b5cf6', text: '#6d28d9' };
  if (node.functionType === 'Firewall') return { fill: '#fee2e2', stroke: '#ef4444', text: '#b91c1c' };
  if (node.functionType === 'SDWAN') return { fill: '#dbeafe', stroke: '#3b82f6', text: '#1d4ed8' };
  return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#475569' };
}

// Tier-based layout for topology diagram
function computeLayout(nodes: NetworkNode[]): Record<string, { x: number; y: number }> {
  const cloud = nodes.filter(n => n.type === 'destination');
  const fn = nodes.filter(n => n.type === 'function');
  const net = nodes.filter(n => n.type === 'network');
  const allGroups = [cloud, fn, net].filter(g => g.length > 0);
  const tierCount = allGroups.length;

  const positions: Record<string, { x: number; y: number }> = {};
  const W = Math.max(800, nodes.length * 100);
  const yTiers =
    tierCount === 1 ? [160] :
    tierCount === 2 ? [90, 240] :
    [60, 165, 265];

  allGroups.forEach((group, tierIdx) => {
    const y = yTiers[tierIdx];
    const step = W / (group.length + 1);
    group.forEach((node, i) => {
      positions[node.id] = { x: step * (i + 1), y };
    });
  });

  return positions;
}

interface TopologyDiagramProps {
  nodes: NetworkNode[];
  circuits: Circuit[];
  selectedDevice: string | null;
  hoveredDevice: string | null;
  onSelectDevice: (id: string) => void;
  setHoveredDevice: (id: string | null) => void;
}

function TopologyDiagram({
  nodes, circuits, selectedDevice, hoveredDevice, onSelectDevice, setHoveredDevice
}: TopologyDiagramProps) {
  const positions = computeLayout(nodes);
  const W = Math.max(800, nodes.length * 100);

  // Deduplicate lines per node pair
  const seenPairs = new Set<string>();
  const uniqueLines = circuits.filter(c => {
    const srcId = c.sourcePort.split('-port-')[0];
    const tgtId = c.targetPort.split('-port-')[0];
    if (srcId === tgtId) return false;
    const key = [srcId, tgtId].sort().join(':');
    if (seenPairs.has(key)) return false;
    seenPairs.add(key);
    return true;
  });

  return (
    <svg
      viewBox={`0 0 ${W} 320`}
      className="w-full"
      style={{ height: '320px' }}
    >
      {/* Connection lines */}
      {uniqueLines.map(c => {
        const srcId = c.sourcePort.split('-port-')[0];
        const tgtId = c.targetPort.split('-port-')[0];
        const sp = positions[srcId];
        const tp = positions[tgtId];
        if (!sp || !tp) return null;

        const isSelected = selectedDevice === srcId || selectedDevice === tgtId;
        const isHov = hoveredDevice === srcId || hoveredDevice === tgtId;
        const isActive = c.status === 'active';
        const midY = (sp.y + tp.y) / 2;
        const d = `M${sp.x},${sp.y} C${sp.x},${midY} ${tp.x},${midY} ${tp.x},${tp.y}`;

        return (
          <g key={c.id}>
            {/* Glow for highlighted active lines */}
            {(isSelected || isHov) && isActive && (
              <path d={d} stroke="#10b981" strokeWidth={10} strokeOpacity={0.12} fill="none" />
            )}
            <path
              d={d}
              stroke={isSelected ? '#3b82f6' : isActive ? '#10b981' : '#64748b'}
              strokeWidth={isSelected ? 3 : isActive ? 2 : 1.5}
              strokeOpacity={isSelected ? 1 : isActive ? 0.9 : 0.55}
              fill="none"
              strokeDasharray={!isActive ? '6,4' : undefined}
            />
          </g>
        );
      })}

      {/* Node circles */}
      {nodes.map(node => {
        const pos = positions[node.id];
        if (!pos) return null;

        const isSelected = selectedDevice === node.id;
        const isHov = hoveredDevice === node.id;
        const isActive = node.status === 'active';
        const colors = getNodeColors(node);
        const abbrev = getNodeAbbrev(node);
        const label = node.name.length > 14 ? node.name.substring(0, 13) + '…' : node.name;

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectDevice(node.id)}
            onMouseEnter={() => setHoveredDevice(node.id)}
            onMouseLeave={() => setHoveredDevice(null)}
          >
            {/* Selection pulse ring */}
            {isSelected && (
              <circle r={36} fill={colors.stroke} fillOpacity={0.1} stroke={colors.stroke} strokeWidth={2} strokeOpacity={0.4} />
            )}
            {/* Hover ring */}
            {isHov && !isSelected && (
              <circle r={31} fill={colors.stroke} fillOpacity={0.07} />
            )}
            {/* Main circle */}
            <circle
              r={26}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.7}
            />
            {/* Type abbreviation */}
            <text
              y={4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={colors.text}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {abbrev}
            </text>
            {/* Status dot */}
            <circle
              cx={20}
              cy={-20}
              r={7}
              fill={isActive ? '#22c55e' : '#9ca3af'}
              stroke="white"
              strokeWidth={2}
            />
            {/* Node label */}
            <text
              y={42}
              textAnchor="middle"
              fontSize={11}
              fill={isSelected ? '#111827' : '#374151'}
              fontWeight={isSelected ? 600 : 400}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CleanLogicalView({
  nodes,
  circuits,
  devicePorts,
  selectedDevice,
  onSelectDevice
}: CleanLogicalViewProps) {
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);

  // Aggregate stats
  const allPorts = Object.values(devicePorts).flat();
  const totalPorts = allPorts.length;
  const activePorts = allPorts.filter(p => p.status === 'active').length;
  const activeCircuits = circuits.filter(c => c.status === 'active').length;
  const activeNodes = nodes.filter(n => n.status === 'active').length;
  const healthScore = nodes.length > 0
    ? Math.round(
        (activeNodes / nodes.length * 0.4 +
         (circuits.length > 0 ? activeCircuits / circuits.length : 1) * 0.4 +
         (totalPorts > 0 ? activePorts / totalPorts : 1) * 0.2) * 100
      )
    : 0;

  const cloudNodes = nodes.filter(n => n.type === 'destination');
  const functionNodes = nodes.filter(n => n.type === 'function');
  const networkNodes = nodes.filter(n => n.type === 'network');

  const getDeviceStats = (nodeId: string) => {
    const ports = devicePorts[nodeId] || [];
    const active = ports.filter(p => p.status === 'active').length;
    const connectedCircuits = circuits.filter(c =>
      c.sourcePort.startsWith(nodeId) || c.targetPort.startsWith(nodeId)
    );
    const activeConns = connectedCircuits.filter(c => c.status === 'active').length;
    return {
      totalPorts: ports.length,
      activePorts: active,
      totalCircuits: connectedCircuits.length,
      activeCircuits: activeConns,
      utilization: ports.length > 0 ? active / ports.length : 0,
    };
  };

  const getConnectedIds = (nodeId: string): string[] => {
    const connected = new Set<string>();
    circuits.forEach(c => {
      const src = c.sourcePort.split('-port-')[0];
      const tgt = c.targetPort.split('-port-')[0];
      if (src === nodeId) connected.add(tgt);
      if (tgt === nodeId) connected.add(src);
    });
    return Array.from(connected);
  };

  const isConnected = (nodeId: string, otherId: string) =>
    getConnectedIds(nodeId).includes(otherId);

  const getCircuitsBetween = (a: string, b: string) =>
    circuits.filter(c => {
      const src = c.sourcePort.split('-port-')[0];
      const tgt = c.targetPort.split('-port-')[0];
      return (src === a && tgt === b) || (src === b && tgt === a);
    });

  const renderDeviceCard = (node: NetworkNode) => {
    const IconComponent = getNodeIcon(node.type, node.functionType, node.config?.networkType, node.config);
    const stats = getDeviceStats(node.id);
    const isSelected = selectedDevice === node.id;
    const isHighlighted =
      (selectedDevice != null && isConnected(node.id, selectedDevice)) ||
      (hoveredDevice != null && isConnected(node.id, hoveredDevice));

    const iconBg =
      node.type === 'destination' ? 'bg-blue-50' :
      node.type === 'network' ? 'bg-green-50' :
      node.functionType === 'Firewall' ? 'bg-red-50' :
      node.functionType === 'Router' ? 'bg-purple-50' :
      'bg-gray-50';

    const iconColor =
      node.type === 'destination' ? 'text-blue-600' :
      node.type === 'network' ? 'text-green-600' :
      node.functionType === 'Firewall' ? 'text-red-600' :
      node.functionType === 'Router' ? 'text-purple-600' :
      'text-gray-600';

    const borderClass =
      isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' :
      isHighlighted ? 'border-blue-300 shadow-md' :
      'border-gray-200 hover:border-gray-300';

    const statusBarColor = node.status === 'active' ? 'bg-green-500' : 'bg-gray-300';

    return (
      <button
        key={node.id}
        onClick={() => onSelectDevice(node.id)}
        onMouseEnter={() => setHoveredDevice(node.id)}
        onMouseLeave={() => setHoveredDevice(null)}
        className={`relative bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md text-left overflow-hidden ${borderClass}`}
        type="button"
      >
        {/* Left-edge status bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusBarColor}`} />

        <div className="pl-4 pr-4 py-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconBg}`}>
              <IconComponent className={`h-5 w-5 ${iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-semibold text-gray-900 text-sm truncate pr-2">{node.name}</h4>
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${
                  node.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {node.status === 'active' ? 'Up' : 'Down'}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {node.type === 'function' && node.functionType
                  ? node.functionType
                  : node.type === 'destination'
                    ? `${node.config?.provider || 'Cloud'} · ${node.config?.region || 'Region'}`
                    : node.type}
              </p>

              {node.type !== 'destination' ? (
                <>
                  {/* Port utilization bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Ports</span>
                      <span className="font-medium text-gray-600">{stats.activePorts}/{stats.totalPorts}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.round(stats.utilization * 100)}%` }}
                      />
                    </div>
                  </div>

                  {stats.totalCircuits > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Circuits</span>
                      <span className={`text-xs font-medium ${
                        stats.activeCircuits > 0 ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {stats.activeCircuits}/{stats.totalCircuits} active
                      </span>
                    </div>
                  )}
                </>
              ) : (
                stats.totalCircuits > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Connections</span>
                    <span className={`text-xs font-medium ${
                      stats.activeCircuits > 0 ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {stats.activeCircuits}/{stats.totalCircuits} active
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </button>
    );
  };

  // Connections panel for selected device
  const selectedNodeData = nodes.find(n => n.id === selectedDevice);
  const connectedIds = selectedDevice ? getConnectedIds(selectedDevice) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-x-6 gap-y-2 px-8 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Server className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold">{activeNodes}</span>
            <span className="text-gray-400">/{nodes.length}</span>
            <span className="ml-1 text-gray-500">devices up</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold">{activeCircuits}</span>
            <span className="text-gray-400">/{circuits.length}</span>
            <span className="ml-1 text-gray-500">circuits active</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold">{activePorts}</span>
            <span className="text-gray-400">/{totalPorts}</span>
            <span className="ml-1 text-gray-500">ports active</span>
          </span>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Zap className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Health</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            healthScore >= 80 ? 'bg-green-100 text-green-700' :
            healthScore >= 50 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {healthScore}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Topology diagram */}
        <div className="px-8 pt-6 pb-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Network Topology
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <TopologyDiagram
              nodes={nodes}
              circuits={circuits}
              selectedDevice={selectedDevice}
              hoveredDevice={hoveredDevice}
              onSelectDevice={onSelectDevice}
              setHoveredDevice={setHoveredDevice}
            />
          </div>
        </div>

        {/* Device card sections */}
        <div className="p-8 space-y-6">
          {cloudNodes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Cloud Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cloudNodes.map(renderDeviceCard)}
              </div>
            </div>
          )}

          {functionNodes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Functions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {functionNodes.map(renderDeviceCard)}
              </div>
            </div>
          )}

          {networkNodes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Network Devices
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {networkNodes.map(renderDeviceCard)}
              </div>
            </div>
          )}

          {/* Selected device connections */}
          {selectedNodeData && connectedIds.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center mb-4">
                <Network className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Connections from {selectedNodeData.name}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {connectedIds.map(connectedId => {
                  const connectedNode = nodes.find(n => n.id === connectedId);
                  if (!connectedNode) return null;
                  const conns = getCircuitsBetween(selectedDevice!, connectedId);
                  const activeConns = conns.filter(c => c.status === 'active').length;
                  const avgLatency = conns
                    .filter(c => c.metrics?.latency != null)
                    .reduce((sum, c, _i, arr) => sum + (c.metrics!.latency / arr.length), 0);

                  return (
                    <button
                      key={connectedId}
                      onClick={() => onSelectDevice(connectedId)}
                      onMouseEnter={() => setHoveredDevice(connectedId)}
                      onMouseLeave={() => setHoveredDevice(null)}
                      className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-blue-100 text-left"
                      type="button"
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{connectedNode.name}</div>
                          <div className="text-xs text-gray-500">
                            {conns.length > 0 && conns[0].capacity}
                            {avgLatency > 0 && ` · ${avgLatency.toFixed(1)}ms`}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        activeConns > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {activeConns}/{conns.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
