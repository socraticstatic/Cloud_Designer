import { useState, useMemo } from 'react';
import { Activity, Shield, RefreshCw, Network, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { NetworkNode, NetworkEdge } from '../types';
import { ExportButton } from './components/ExportButton';
import { calculateTotalBandwidth } from '../../utils/calculations';
import { validateTopology, ValidationIssue } from '../../engine/validationEngine';
import { Z_INDEX } from '../../constants';

interface StatusBarProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onRefresh: () => void;
  canvasRef?: React.RefObject<HTMLElement>;
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
}

export function StatusBar({ nodes, edges, onRefresh, canvasRef, onSelectNode, onSelectEdge }: StatusBarProps) {
  const [showValidation, setShowValidation] = useState(false);

  // Calculate active elements
  const activeNodes = nodes.filter(node => node.status === 'active').length;
  const activeEdges = edges.filter(edge => edge.status === 'active').length;

  // Calculate bandwidth total
  const bandwidthTotal = calculateTotalBandwidth(edges);

  // Run validation
  const issues = useMemo(() => validateTopology(nodes, edges), [nodes, edges]);
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  const getValidationIcon = () => {
    if (errors.length > 0) return <XCircle className="h-4 w-4 text-red-500" />;
    if (warnings.length > 0) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getValidationLabel = () => {
    if (errors.length > 0) return `${errors.length} error${errors.length > 1 ? 's' : ''}`;
    if (warnings.length > 0) return `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
    return 'Valid';
  };

  const handleIssueClick = (issue: ValidationIssue) => {
    if (issue.nodeId && onSelectNode) onSelectNode(issue.nodeId);
    else if (issue.edgeId && onSelectEdge) onSelectEdge(issue.edgeId);
  };

  const severityIcon = (severity: string) => {
    if (severity === 'error') return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    if (severity === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />;
    return <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
  };

  return (
    <>
      <div
        className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm border border-gray-200 py-2 px-3 flex items-center space-x-6 whitespace-nowrap"
        style={{ zIndex: Z_INDEX.CHROME, minWidth: '700px' }}
      >
        {/* Validation Indicator */}
        {nodes.length > 0 && (
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-1 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
          >
            {getValidationIcon()}
            <span className="text-sm text-gray-600">{getValidationLabel()}</span>
          </button>
        )}

        {/* Separator */}
        {nodes.length > 0 && <div className="h-4 w-px bg-gray-200"></div>}

        {/* Total Bandwidth */}
        <div className="flex items-center">
          <Network className="h-4 w-4 text-blue-500 mr-1 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900">{bandwidthTotal}</span>
        </div>

        {/* Nodes Info */}
        <div className="flex items-center">
          <Activity className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
          <span className="text-sm text-gray-600">{nodes.length} Nodes</span>
        </div>

        {/* Connections Info */}
        <div className="flex items-center">
          <Shield className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
          <span className="text-sm text-gray-600">{edges.length} Connections</span>
        </div>

        {/* Active Info */}
        <div className="flex items-center">
          <span className="inline-flex h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
          <span className="text-sm text-gray-600">{activeNodes} Active Nodes</span>
        </div>

        <div className="flex items-center">
          <span className="inline-flex h-2 w-2 bg-blue-500 rounded-full mr-1.5"></span>
          <span className="text-sm text-gray-600">{activeEdges} Active Connections</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Export Button */}
        {canvasRef && (
          <div className="flex items-center">
            <div className="h-6 w-px bg-gray-200 mr-3"></div>
            <ExportButton
              nodes={nodes}
              edges={edges}
              canvasRef={canvasRef}
            />
          </div>
        )}
      </div>

      {/* Validation Panel Dropdown */}
      {showValidation && issues.length > 0 && (
        <div
          className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 w-96 max-h-64 overflow-y-auto"
          style={{ zIndex: Z_INDEX.FLOATING_PANEL }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Design Validation</span>
            <button onClick={() => setShowValidation(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {issues.map(issue => (
              <button
                key={issue.id}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                onClick={() => handleIssueClick(issue)}
              >
                {severityIcon(issue.severity)}
                <span className="text-xs text-gray-700 leading-tight">{issue.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}