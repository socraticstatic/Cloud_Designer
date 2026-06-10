import { useState } from 'react';
import type { NetworkNode, NetworkEdge } from '../../types';

// Import components
import { ActionButtons } from './components/ActionButtons';
import { EmptyState } from './components/EmptyState';
import { InstructionsOverlay } from './components/InstructionsOverlay';
import { SelectedLocationDetails } from './components/SelectedLocationDetails';
import { PanelOverlay } from './components/PanelOverlay';
import { LeafletMap } from './components/LeafletMap';

interface GlobalViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeSelect: (nodeId: string) => void;
  onZoomIn: (datacenterId: string) => void;
}

export function GlobalView({ nodes, edges, onNodeSelect, onZoomIn }: GlobalViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'none' | 'metrics' | 'performance'>('none');

  const handleNodeSelect = (nodeId: string) => {
    setSelectedLocation(nodeId);
    onNodeSelect(nodeId);
  };

  const togglePanel = (panelType: 'metrics' | 'performance') => {
    if ((panelType === 'metrics' && activePanel === 'metrics') ||
        (panelType === 'performance' && activePanel === 'performance')) {
      setActivePanel('none');
    } else {
      setActivePanel(panelType);
    }
  };

  const nodesWithGeoData = nodes.filter(node =>
    node.config?.latitude !== undefined && node.config?.longitude !== undefined
  );
  const hasGeoData = nodesWithGeoData.length > 0;

  return (
    <div
      className="relative h-[800px] overflow-hidden rounded-lg"
      style={{
        backgroundColor: '#f8fafc',
        zIndex: 1,
      }}
    >
      {/* Leaflet Map */}
      {hasGeoData ? (
        <LeafletMap
          nodes={nodes}
          edges={edges}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedLocation}
        />
      ) : (
        <EmptyState onZoomOut={(id) => { if (id) onZoomIn(id); }} hasNodes={nodes.length > 0} />
      )}

      {/* Action Buttons */}
      <ActionButtons
        activePanel={activePanel}
        togglePanel={togglePanel}
        nodesLength={nodes.length}
      />

      {/* Selected Location Details */}
      <SelectedLocationDetails
        selectedLocation={selectedLocation}
        nodes={nodes}
        onZoomIn={onZoomIn}
      />

      {/* Instructions Overlay */}
      <InstructionsOverlay
        selectedLocation={selectedLocation}
        locationsLength={nodes.length}
        activePanel={activePanel}
      />

      {/* Panel Overlay */}
      <PanelOverlay
        activePanel={activePanel}
        nodes={nodes}
        edges={edges}
        onClose={() => setActivePanel('none')}
      />
    </div>
  );
}