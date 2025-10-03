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

export function CleanLogicalView({
  nodes,
  circuits,
  devicePorts,
  selectedDevice,
  onSelectDevice
}: CleanLogicalViewProps) {
  const cloudNodes = nodes.filter(n => n.type === 'destination');
  const networkNodes = nodes.filter(n => n.type === 'network');
  const functionNodes = nodes.filter(n => n.type === 'function');

  const getDeviceStats = (nodeId: string) => {
    const ports = devicePorts[nodeId] || [];
    const activePorts = ports.filter(p => p.status === 'active').length;
    const connectedCircuits = circuits.filter(c =>
      c.sourcePort.startsWith(nodeId) || c.targetPort.startsWith(nodeId)
    ).length;
    return { totalPorts: ports.length, activePorts, connectedCircuits };
  };

  const renderDeviceCard = (node: NetworkNode) => {
    const IconComponent = getNodeIcon(node.type, node.functionType, node.config?.networkType, node.config);
    const stats = getDeviceStats(node.id);
    const isSelected = selectedDevice === node.id;

    return (
      <button
        key={node.id}
        onClick={() => onSelectDevice(node.id)}
        className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all hover:shadow-md ${
          isSelected
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-blue-300'
        }`}
        type="button"
      >
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${
            node.type === 'destination' ? 'bg-blue-50' :
            node.type === 'network' ? 'bg-green-50' :
            'bg-gray-50'
          }`}>
            <IconComponent className={`h-6 w-6 ${
              node.type === 'destination' ? 'text-blue-600' :
              node.type === 'network' ? 'text-green-600' :
              'text-gray-600'
            }`} />
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900">{node.name}</h4>
              <div className={`w-2 h-2 rounded-full ${
                node.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {node.type === 'function' && node.functionType
                ? node.functionType
                : node.type === 'destination'
                  ? `${node.config?.provider || 'Cloud'} - ${node.config?.region || 'Region'}`
                  : node.type}
            </p>

            {node.type !== 'destination' && (
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                  <span>{stats.activePorts}/{stats.totalPorts} ports</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
                  <span>{stats.connectedCircuits} circuits</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
          </marker>
        </defs>
        {circuits.map((circuit) => {
          const sourceNodeId = circuit.sourcePort.split('-port-')[0];
          const targetNodeId = circuit.targetPort.split('-port-')[0];
          const sourceNode = nodes.find(n => n.id === sourceNodeId);
          const targetNode = nodes.find(n => n.id === targetNodeId);

          if (!sourceNode || !targetNode) return null;

          const sourceIndex = nodes.findIndex(n => n.id === sourceNodeId);
          const targetIndex = nodes.findIndex(n => n.id === targetNodeId);

          const isActive = circuit.status === 'active';

          return (
            <line
              key={circuit.id}
              x1={`${(sourceIndex % 3) * 33 + 16}%`}
              y1={`${Math.floor(sourceIndex / 3) * 250 + 120}px`}
              x2={`${(targetIndex % 3) * 33 + 16}%`}
              y2={`${Math.floor(targetIndex / 3) * 250 + 120}px`}
              stroke={isActive ? '#3b82f6' : '#cbd5e1'}
              strokeWidth="2"
              strokeDasharray={isActive ? '0' : '5,5'}
              markerEnd="url(#arrowhead)"
              opacity={isActive ? 0.6 : 0.3}
            />
          );
        })}
      </svg>

      <div className="relative space-y-8" style={{ zIndex: 1 }}>
        {cloudNodes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Cloud Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cloudNodes.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {networkNodes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Network Devices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networkNodes.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {functionNodes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {functionNodes.map(renderDeviceCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
