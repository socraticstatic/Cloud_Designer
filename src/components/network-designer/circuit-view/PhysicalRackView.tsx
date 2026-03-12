import { useState, useEffect } from 'react';
import { Server, Router, Database, Globe, Cable, BrainCircuit as Circuit,
         Layers, Shield, Network, ChevronDown, ChevronRight } from 'lucide-react';
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

function getDeviceAccent(node: NetworkNode): string {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return 'bg-purple-500';
    if (node.functionType === 'Firewall') return 'bg-red-500';
    if (node.functionType === 'SDWAN') return 'bg-blue-500';
    if (node.functionType === 'VNF') return 'bg-green-500';
    return 'bg-gray-500';
  }
  if (node.type === 'network') return 'bg-emerald-500';
  if (node.type === 'destination') return 'bg-sky-500';
  return 'bg-gray-500';
}

function getDeviceAccentText(node: NetworkNode): string {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return 'text-purple-600';
    if (node.functionType === 'Firewall') return 'text-red-600';
    if (node.functionType === 'SDWAN') return 'text-blue-600';
    if (node.functionType === 'VNF') return 'text-green-600';
    return 'text-gray-600';
  }
  if (node.type === 'network') return 'text-emerald-600';
  if (node.type === 'destination') return 'text-sky-600';
  return 'text-gray-600';
}

function getDeviceAccentBg(node: NetworkNode): string {
  if (node.type === 'function') {
    if (node.functionType === 'Router') return 'bg-purple-50';
    if (node.functionType === 'Firewall') return 'bg-red-50';
    if (node.functionType === 'SDWAN') return 'bg-blue-50';
    if (node.functionType === 'VNF') return 'bg-green-50';
    return 'bg-gray-50';
  }
  if (node.type === 'network') return 'bg-emerald-50';
  if (node.type === 'destination') return 'bg-sky-50';
  return 'bg-gray-50';
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
  if (node.type === 'network') return node.config?.networkType?.toUpperCase() || 'Network';
  if (node.type === 'destination') return node.config?.provider || 'Cloud';
  return 'Device';
}

function getPortStatusColor(status: string): string {
  if (status === 'active') return 'bg-green-500';
  if (status === 'error') return 'bg-red-500';
  return 'bg-gray-300';
}

function getPortTypeColor(type: string, status: string): string {
  if (status !== 'active') return 'bg-gray-200 border-gray-300';
  if (type === 'fiber') return 'bg-blue-100 border-blue-400';
  if (type === 'virtual') return 'bg-purple-100 border-purple-400';
  return 'bg-green-100 border-green-400';
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
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedDeviceId) {
      setExpandedDevices(prev => new Set([...prev, selectedDeviceId]));
    }
  }, [selectedDeviceId]);

  const toggleExpand = (id: string) => {
    setExpandedDevices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Summary stats
  const allPorts = Object.values(devicePorts).flat();
  const activePorts = allPorts.filter(p => p.status === 'active').length;
  const errorPorts = allPorts.filter(p => p.status === 'error').length;
  const activeDevices = nodes.filter(n => n.status === 'active' || (devicePorts[n.id] || []).some(p => p.status === 'active')).length;

  return (
    <div className="p-6 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Devices', value: nodes.length, sub: `${activeDevices} active`, color: 'text-gray-900' },
          { label: 'Total Ports', value: allPorts.length, sub: `${activePorts} active`, color: 'text-blue-600' },
          { label: 'Circuits', value: circuits.length, sub: `${circuits.filter(c => c.status === 'active').length} active`, color: 'text-emerald-600' },
          { label: 'Errors', value: errorPorts, sub: errorPorts > 0 ? 'Needs attention' : 'All clear', color: errorPorts > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Device cards */}
      <div className="space-y-2">
        {nodes.map(node => {
          const ports = devicePorts[node.id] || [];
          const nodeActivePorts = ports.filter(p => p.status === 'active').length;
          const isExpanded = expandedDevices.has(node.id);
          const isSelected = node.id === selectedDeviceId;
          const IconComponent = getDeviceIcon(node);

          return (
            <div
              key={node.id}
              className={`bg-white rounded-lg border transition-all ${
                isSelected ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Device header */}
              <button
                onClick={() => {
                  onSelectDevice(node.id);
                  toggleExpand(node.id);
                }}
                className="w-full flex items-center px-4 py-3 text-left"
                type="button"
              >
                {/* Accent bar */}
                <div className={`w-1 h-10 rounded-full ${getDeviceAccent(node)} mr-3 flex-shrink-0`} />

                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg ${getDeviceAccentBg(node)} flex items-center justify-center mr-3 flex-shrink-0`}>
                  <IconComponent className={`h-5 w-5 ${getDeviceAccentText(node)}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
                    <span className={`ml-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      node.status === 'active' || nodeActivePorts > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  <span className="text-xs text-gray-500">{getDeviceLabel(node)}</span>
                </div>

                {/* Port count */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-mono text-gray-700">{nodeActivePorts}/{ports.length}</span>
                    <span className="text-xs text-gray-400 ml-1">ports</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded port grid */}
              {isExpanded && ports.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {ports.map(port => (
                      <button
                        key={port.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPort(port.id === selectedPort ? null : port.id);
                        }}
                        title={`${port.name} - ${port.type} ${port.speed} (${port.status})`}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-all ${
                          port.id === selectedPort
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : `${getPortTypeColor(port.type, port.status)} hover:shadow-sm`
                        }`}
                        type="button"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getPortStatusColor(port.status)}`} />
                        <span className="font-mono">{port.name}</span>
                        <span className="text-gray-400">{port.speed}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected port detail inline */}
                  {selectedPort && ports.some(p => p.id === selectedPort) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {ports.filter(p => p.id === selectedPort).map(port => (
                        <div key={port.id}>
                          <div className="flex items-center gap-2 mb-2">
                            <Cable className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-700">Port Details</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-gray-400">Interface</span><br/><span className="font-medium">{port.name}</span></div>
                            <div><span className="text-gray-400">Type</span><br/><span className="font-medium capitalize">{port.type}</span></div>
                            <div><span className="text-gray-400">Speed</span><br/><span className="font-medium">{port.speed}</span></div>
                            <div><span className="text-gray-400">Module</span><br/><span className="font-medium">{port.module || 'Standard'}</span></div>
                            <div><span className="text-gray-400">Position</span><br/><span className="font-medium">{port.position === 'back' ? 'Rear' : 'Front'} Slot {port.slot || 1}</span></div>
                            <div>
                              <span className="text-gray-400">Status</span><br/>
                              <span className={`font-medium ${port.status === 'active' ? 'text-green-600' : port.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                                {port.status === 'active' ? 'Active' : port.status === 'error' ? 'Error' : 'Inactive'}
                              </span>
                            </div>
                          </div>

                          {/* Connected circuit */}
                          {port.connectedTo && (() => {
                            const relatedCircuits = circuits.filter(c =>
                              c.sourcePort === port.id || c.targetPort === port.id
                            );
                            if (relatedCircuits.length === 0) return null;
                            return (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Circuit className="h-3 w-3 text-blue-500" />
                                  <span className="text-xs font-semibold text-gray-600">Circuit</span>
                                </div>
                                {relatedCircuits.map(c => (
                                  <div key={c.id} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700">{c.type} - {c.capacity}</span>
                                    {c.metrics && (
                                      <span className="text-blue-600 font-mono">
                                        {c.metrics.latency.toFixed(1)}ms - {c.metrics.loss.toFixed(2)}dB
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 px-1">
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-400 mr-1.5" /><span>Copper</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400 mr-1.5" /><span>Fiber</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-purple-100 border border-purple-400 mr-1.5" /><span>Virtual</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-red-500 mr-1.5" /><span>Error</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-sm bg-gray-300 mr-1.5" /><span>Inactive</span></div>
      </div>
    </div>
  );
}
