import { useState, useEffect } from 'react';
import { Server, Router, Database, Globe, Cable, BrainCircuit as Circuit,
         Layers, Shield, Network } from 'lucide-react';
import { NetworkNode } from '../../types';

interface Port {
  id: string;
  name: string;
  type: 'fiber' | 'copper' | 'virtual';
  speed: string;
  status: 'active' | 'inactive' | 'error';
  connectedTo?: string;
  position?: 'front' | 'back';
  slot?: number;
  module?: string;
}

interface CircuitDef {
  id: string;
  sourcePort: string;
  targetPort: string;
  type: 'dark-fiber' | 'wave' | 'ethernet' | 'mpls';
  capacity: string;
  status: 'active' | 'inactive' | 'degraded';
  metrics?: { light: number; loss: number; latency: number };
}

interface PhysicalRackViewProps {
  nodes: NetworkNode[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  devicePorts: Record<string, Port[]>;
  selectedPort: string | null;
  onSelectPort: (portId: string | null) => void;
  circuits: CircuitDef[];
}

function getDeviceColor(node: NetworkNode): string {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return '#3b0764';
    if (node.functionType === 'Firewall') return '#7f1d1d';
    if (node.functionType === 'SDWAN') return '#1e3a5f';
    if (node.functionType === 'VNF') return '#1a3a2a';
    return '#1e293b';
  }
  if (node.type === 'network') return '#064e3b';
  return '#1e293b';
}

function getDeviceAccent(node: NetworkNode): string {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return '#a855f7';
    if (node.functionType === 'Firewall') return '#ef4444';
    if (node.functionType === 'SDWAN') return '#3b82f6';
    if (node.functionType === 'VNF') return '#22c55e';
    return '#94a3b8';
  }
  if (node.type === 'network') return '#10b981';
  return '#64748b';
}

function getDeviceIcon(node: NetworkNode) {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return Router;
    if (node.functionType === 'Firewall') return Shield;
    if (node.functionType === 'SDWAN') return Network;
    return Server;
  }
  if (node.type === 'network') return Network;
  if (node.type === 'destination') return Globe;
  return Server;
}

function getDeviceLabel(node: NetworkNode): string {
  if (node.type === 'function' && node.functionType) return node.functionType;
  if (node.type === 'network') return 'Network Device';
  if (node.type === 'destination') return node.config?.provider || 'Cloud';
  return 'Device';
}

export function PhysicalRackView({
  nodes,
  selectedDeviceId,
  onSelectDevice,
  devicePorts,
  selectedPort,
  onSelectPort,
  circuits,
}: PhysicalRackViewProps) {
  const [rackView, setRackView] = useState<'front' | 'back'>('front');
  const [highlightedDevice, setHighlightedDevice] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDeviceId) setHighlightedDevice(selectedDeviceId);
  }, [selectedDeviceId]);

  // Assign rack unit positions
  const deviceRackPositions = new Map<string, number>();
  let currentRU = 1;

  const placeGroup = (filter: (n: NetworkNode) => boolean, ruSize: number) => {
    nodes.filter(filter).forEach(node => {
      deviceRackPositions.set(node.id, currentRU);
      currentRU += ruSize;
    });
  };

  placeGroup(n => n.type === 'function' && n.functionType === 'Router', 2);
  placeGroup(n => n.type === 'function' && n.functionType === 'Firewall', 1);
  placeGroup(n => n.type === 'function' && (n.functionType === 'SDWAN' || n.functionType === 'VNF'), 1);
  placeGroup(n => n.type === 'network', 1);
  placeGroup(n => n.type === 'function' && !['Router', 'Firewall', 'SDWAN', 'VNF'].includes(n.functionType || ''), 1);

  const rackUnits = Math.max(42, currentRU + 2);
  const rackableNodes = nodes.filter(n => n.type !== 'destination');
  const cloudNodes = nodes.filter(n => n.type === 'destination');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-5 py-3 flex items-center justify-between">
        <h2 className="text-white text-base font-semibold flex items-center">
          <Layers className="h-4 w-4 mr-2 text-gray-400" />
          Data Center Rack View
        </h2>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-700 rounded-md flex p-0.5">
            {(['front', 'back'] as const).map(side => (
              <button
                key={side}
                onClick={() => setRackView(side)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  rackView === side
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                type="button"
              >
                {side === 'front' ? 'Front Panel' : 'Rear Panel'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-gray-100 to-gray-200">
        {/* Cloud endpoints above rack */}
        {cloudNodes.length > 0 && (
          <div className="mb-8 flex flex-col items-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Cloud Endpoints
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {cloudNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => onSelectDevice(node.id)}
                  onMouseEnter={() => setHighlightedDevice(node.id)}
                  onMouseLeave={() => setHighlightedDevice(selectedDeviceId)}
                  className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all ${
                    node.id === selectedDeviceId
                      ? 'bg-blue-100 border-2 border-blue-400 shadow-md'
                      : node.id === highlightedDevice
                        ? 'bg-blue-50 border border-blue-300 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                  }`}
                  type="button"
                >
                  <Globe className="h-7 w-7 text-blue-500 mb-1.5" />
                  <span className="text-sm font-medium text-gray-900">{node.name}</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {node.config?.provider || 'Cloud'} · {node.config?.region || 'Unknown'}
                  </span>
                  <div className="mt-1.5 flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      node.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {node.status === 'active' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="w-px h-8 bg-dashed bg-gray-400 mt-2 border-l-2 border-dashed border-gray-400" />
          </div>
        )}

        {/* Rack chassis */}
        <div className="max-w-4xl mx-auto bg-gray-700 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          {/* Rack top rail */}
          <div className="bg-gray-800 text-white px-4 py-2.5 flex justify-between items-center border-b border-gray-900">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold">Enterprise Server Rack</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400">42U</span>
              <span className={`flex items-center text-xs font-medium ${
                rackableNodes.some(n => n.status === 'active') ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  rackableNodes.some(n => n.status === 'active') ? 'bg-green-400' : 'bg-gray-500'
                }`} />
                {rackableNodes.filter(n => n.status === 'active').length}/{rackableNodes.length} online
              </span>
            </div>
          </div>

          {/* Rack body */}
          <div className="flex">
            {/* RU numbers */}
            <div className="w-8 bg-gray-900 text-gray-500 py-1 flex flex-col flex-shrink-0">
              {Array.from({ length: rackUnits }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 flex items-center justify-center text-[10px] font-mono"
                >
                  {rackUnits - i}
                </div>
              ))}
            </div>

            {/* Device area */}
            <div className="flex-1 relative" style={{ height: `${rackUnits * 40}px` }}>
              {/* Grid lines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, rgba(75,85,99,0.25) 1px, transparent 1px)',
                  backgroundSize: '100% 40px',
                }}
              />

              {/* Device rows */}
              {rackableNodes.map(node => {
                const rackPos = deviceRackPositions.get(node.id) || 0;
                if (rackPos === 0) return null;
                const isRouter = node.functionType === 'Router';
                const deviceHeightRU = isRouter ? 2 : 1;
                const topPx = (rackPos - 1) * 40;
                const heightPx = deviceHeightRU * 40;

                const nodePorts = devicePorts[node.id] || [];
                const displayPorts = rackView === 'front'
                  ? nodePorts.filter(p => p.position !== 'back')
                  : nodePorts.filter(p => p.position === 'back');
                const visiblePorts = displayPorts.slice(0, 24);

                const activePorts = nodePorts.filter(p => p.status === 'active').length;
                const isSelected = node.id === selectedDeviceId;
                const isHov = node.id === highlightedDevice;
                const isActive = node.status === 'active' || nodePorts.some(p => p.status === 'active');
                const accent = getDeviceAccent(node);
                const IconComponent = getDeviceIcon(node);

                return (
                  <div
                    key={node.id}
                    className={`absolute left-0 right-0 border-l-4 transition-all ${
                      isSelected ? 'z-20 shadow-lg' : isHov ? 'z-10' : 'z-0'
                    }`}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      backgroundColor: getDeviceColor(node),
                      borderLeftColor: accent,
                      borderTop: isSelected ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.05)',
                      borderBottom: isSelected ? `2px solid ${accent}` : '1px solid rgba(0,0,0,0.3)',
                      borderRight: isSelected ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <button
                      onClick={() => onSelectDevice(node.id)}
                      onMouseEnter={() => setHighlightedDevice(node.id)}
                      onMouseLeave={() => setHighlightedDevice(selectedDeviceId)}
                      className="w-full h-full focus:outline-none"
                      type="button"
                    >
                      <div className="h-full flex items-center px-3 space-x-3">
                        {/* Device identity */}
                        <div className="flex items-center space-x-2 flex-shrink-0 min-w-0" style={{ width: '160px' }}>
                          <IconComponent className="h-5 w-5 flex-shrink-0" style={{ color: accent }} />
                          <div className="text-left min-w-0">
                            <div className="text-sm font-semibold text-gray-100 truncate">{node.name}</div>
                            <div className="text-xs" style={{ color: `${accent}99` }}>{getDeviceLabel(node)}</div>
                          </div>
                        </div>

                        {/* Port mini-display */}
                        <div className="flex-1 flex items-center px-2">
                          <div className="flex flex-wrap gap-0.5">
                            {visiblePorts.map(port => (
                              <button
                                key={port.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPort(port.id === selectedPort ? null : port.id);
                                }}
                                title={`${port.name} · ${port.type} · ${port.speed} · ${port.status}`}
                                className={`relative flex-shrink-0 rounded-sm transition-all ${
                                  port.id === selectedPort
                                    ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent z-10'
                                    : 'hover:ring-1 hover:ring-white'
                                }`}
                                style={{
                                  width: '12px',
                                  height: heightPx > 40 ? '14px' : '10px',
                                  backgroundColor:
                                    port.status === 'active'
                                      ? port.type === 'fiber' ? '#60a5fa'
                                        : port.type === 'virtual' ? '#a78bfa'
                                        : '#4ade80'
                                      : port.status === 'error' ? '#f87171'
                                      : '#374151',
                                  borderBottom: `2px solid ${
                                    port.status === 'active'
                                      ? port.type === 'fiber' ? '#93c5fd'
                                        : port.type === 'virtual' ? '#c4b5fd'
                                        : '#86efac'
                                      : '#1f2937'
                                  }`,
                                }}
                                type="button"
                              />
                            ))}
                            {displayPorts.length > 24 && (
                              <span className="text-[9px] text-gray-500 flex items-center pl-1">
                                +{displayPorts.length - 24}
                              </span>
                            )}
                            {displayPorts.length === 0 && (
                              <span className="text-[10px] text-gray-600 italic">
                                {rackView === 'back' ? 'No rear ports' : 'No ports'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status + port count */}
                        <div className="flex-shrink-0 flex flex-col items-end space-y-1 pr-1" style={{ width: '60px' }}>
                          <div className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'
                          }`}>
                            {activePorts}/{nodePorts.length}
                          </div>
                          <div className="flex space-x-0.5">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  i === 0 ? 'bg-green-400' :
                                  i === 1 ? (isActive ? 'bg-amber-400' : 'bg-gray-600') :
                                  'bg-blue-400'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}

              {/* Empty rack units at bottom */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="absolute left-0 right-0 border border-gray-600 bg-gray-800"
                  style={{
                    top: `${(rackUnits - i - 1) * 40}px`,
                    height: '40px',
                  }}
                >
                  <div className="h-full flex items-center px-4">
                    <div className="w-full border border-dashed border-gray-700 h-4 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Right rail: power + management */}
            <div className="w-10 bg-gray-900 flex flex-col items-center py-3 flex-shrink-0">
              <div className="flex flex-col items-center space-y-1 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center">
                  <div className="w-1.5 h-3.5 bg-green-200 rounded-sm" />
                </div>
                <div className="text-[9px] text-gray-500 font-mono">PWR</div>
              </div>
              <div className="flex flex-col items-center mt-auto">
                <div className="w-6 h-6 bg-blue-900 rounded flex items-center justify-center mb-1">
                  <div className="w-4 h-1.5 bg-blue-300 rounded-sm" />
                </div>
                <div className="text-[9px] text-gray-500 font-mono">MGMT</div>
              </div>
            </div>
          </div>

          {/* Rack bottom rail */}
          <div className="h-4 bg-gray-900" />
        </div>
      </div>

      {/* Selected port details */}
      {selectedPort && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
            <Cable className="h-4 w-4 mr-2 text-blue-600" />
            Port Details
          </h3>
          {Object.values(devicePorts).flat().filter(p => p.id === selectedPort).map(port => (
            <div key={port.id} className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {[
                { label: 'Interface', value: port.name },
                { label: 'Type', value: port.type.charAt(0).toUpperCase() + port.type.slice(1) },
                { label: 'Speed', value: port.speed },
                { label: 'Module', value: port.module || 'Standard' },
                { label: 'Location', value: `Slot ${port.slot || 1}, ${port.position === 'front' ? 'Front' : 'Back'}` },
                {
                  label: 'Status',
                  value: port.status === 'active' ? 'Active' : port.status === 'error' ? 'Error' : 'Inactive',
                  color: port.status === 'active' ? 'text-green-700' : port.status === 'error' ? 'text-red-700' : 'text-gray-600',
                },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-lg p-2.5 shadow-sm">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className={`text-sm font-medium ${item.color || 'text-gray-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Connected circuit info for selected port */}
          {Object.values(devicePorts).flat().filter(p => p.id === selectedPort && p.connectedTo).map(port => {
            const relatedCircuits = circuits.filter(c =>
              c.sourcePort === port.id || c.targetPort === port.id
            );
            if (relatedCircuits.length === 0) return null;
            return (
              <div key="circuits" className="mt-3 bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                  <Circuit className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Connected Circuit
                </p>
                {relatedCircuits.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{c.type} · {c.capacity}</span>
                    {c.metrics && (
                      <span className="text-xs text-blue-600 font-mono">
                        {c.metrics.latency.toFixed(1)}ms · {c.metrics.loss.toFixed(2)}dB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-green-400 mr-1.5" />
          <span>Copper Active</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-blue-400 mr-1.5" />
          <span>Fiber Active</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-purple-400 mr-1.5" />
          <span>Virtual Active</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-red-400 mr-1.5" />
          <span>Error</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-gray-600 mr-1.5" />
          <span>Inactive</span>
        </div>
      </div>
    </div>
  );
}
